import { apiHandler, apiSuccess } from '@/lib/api';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';
import { getDatabase } from '@/lib/mongodb';

const DEFAULT_SAMPLE_LIMIT = 50;
const MAX_SAMPLE_LIMIT = 200;
const STALE_METADATA_MS = 24 * 60 * 60 * 1000;

const NON_EMPTY_STRING_QUERY = { $exists: true, $nin: [null, ''] };

const hasImageQuery = {
    $or: [
        { 'metadata.image': NON_EMPTY_STRING_QUERY },
        { 'metadata.imageOriginal': NON_EMPTY_STRING_QUERY },
        { 'metadata.images.thumb': NON_EMPTY_STRING_QUERY },
        { 'metadata.images.small': NON_EMPTY_STRING_QUERY },
        { 'metadata.images.card': NON_EMPTY_STRING_QUERY },
        { 'metadata.images.detail': NON_EMPTY_STRING_QUERY },
        { 'metadata.images.original': NON_EMPTY_STRING_QUERY },
    ],
};

const goodNameQuery = {
    'metadata.name': {
        $exists: true,
        $type: 'string',
        $nin: ['', 'Unknown', 'unknown', 'Unknown NFT', 'unknown nft'],
        $not: /^0x[a-f0-9]{40}$/i,
    },
};

const badNameQuery = {
    $or: [
        { 'metadata.name': { $exists: false } },
        { 'metadata.name': null },
        { 'metadata.name': '' },
        { 'metadata.name': /^unknown( nft)?$/i },
        { 'metadata.name': /^0x[a-f0-9]{40}$/i },
    ],
};

const badImageQuery = {
    $nor: [hasImageQuery],
};

const unhealthyQuery = {
    $or: [badNameQuery, badImageQuery],
};

function parseLimit(value: string | null): number {
    const parsed = Number.parseInt(value || '', 10);
    if (!Number.isFinite(parsed)) return DEFAULT_SAMPLE_LIMIT;
    return Math.max(1, Math.min(MAX_SAMPLE_LIMIT, parsed));
}

export const GET = apiHandler(async (request) => {
    const db = await getDatabase();
    const collection = db.collection('nft_metadata');

    const searchParams = request.nextUrl.searchParams;
    const sampleLimit = parseLimit(searchParams.get('limit'));
    const onlyUnlisted = searchParams.get('onlyUnlisted') === 'true';

    const staleCutoffIso = new Date(Date.now() - STALE_METADATA_MS).toISOString();

    const baseQuery = onlyUnlisted
        ? {
            contractAddress: {
                $nin: await db.collection('marketplace_items').distinct('contractAddress', { isListed: true })
            }
        }
        : {};

    const [
        total,
        healthy,
        unhealthy,
        missingName,
        missingImage,
        staleMetadata,
        sample,
    ] = await Promise.all([
        collection.countDocuments(baseQuery),
        collection.countDocuments({
            $and: [
                baseQuery,
                goodNameQuery,
                hasImageQuery,
            ],
        }),
        collection.countDocuments({
            $and: [
                baseQuery,
                unhealthyQuery,
            ],
        }),
        collection.countDocuments({
            $and: [
                baseQuery,
                badNameQuery,
            ],
        }),
        collection.countDocuments({
            $and: [
                baseQuery,
                badImageQuery,
            ],
        }),
        collection.countDocuments({
            $and: [
                baseQuery,
                {
                    $or: [
                        { lastMetadataUpdate: { $exists: false } },
                        { lastMetadataUpdate: null },
                        { lastMetadataUpdate: { $lt: staleCutoffIso } },
                    ],
                },
            ],
        }),
        collection.aggregate([
            {
                $match: {
                    $and: [baseQuery, unhealthyQuery],
                },
            },
            {
                $lookup: {
                    from: 'marketplace_items',
                    let: { contractAddr: '$contractAddress', tokenId: '$tokenId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$contractAddress', '$$contractAddr'] },
                                        { $eq: ['$tokenId', '$$tokenId'] },
                                        { $eq: ['$isListed', true] },
                                    ],
                                },
                            },
                        },
                        { $project: { _id: 0, isListed: 1, listingId: 1 } },
                        { $limit: 1 },
                    ],
                    as: 'listingMatch',
                },
            },
            {
                $addFields: {
                    isListed: { $gt: [{ $size: '$listingMatch' }, 0] },
                },
            },
            {
                $project: {
                    _id: 0,
                    contractAddress: 1,
                    tokenId: 1,
                    name: '$metadata.name',
                    image: '$metadata.image',
                    imageOriginal: '$metadata.imageOriginal',
                    images: '$metadata.images',
                    tokenURI: '$contract.tokenURI',
                    lastMetadataUpdate: 1,
                    isListed: 1,
                },
            },
            { $sort: { isListed: -1, lastMetadataUpdate: 1 } },
            { $limit: sampleLimit },
        ]).toArray(),
    ]);

    const enrichedSample = sample.map((item: any) => {
        const reasons: string[] = [];
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        const hasName = !!name && !/^unknown( nft)?$/i.test(name) && !/^0x[a-f0-9]{40}$/i.test(name);

        const hasImage = Boolean(
            (typeof item?.image === 'string' && item.image.trim())
            || (typeof item?.imageOriginal === 'string' && item.imageOriginal.trim())
            || (typeof item?.images?.thumb === 'string' && item.images.thumb.trim())
            || (typeof item?.images?.small === 'string' && item.images.small.trim())
            || (typeof item?.images?.card === 'string' && item.images.card.trim())
            || (typeof item?.images?.detail === 'string' && item.images.detail.trim())
            || (typeof item?.images?.original === 'string' && item.images.original.trim())
        );

        if (!hasName) reasons.push('missing-or-placeholder-name');
        if (!hasImage) reasons.push('missing-image');
        if (!item?.tokenURI) reasons.push('missing-tokenURI');

        const lastUpdate = item?.lastMetadataUpdate ? Date.parse(item.lastMetadataUpdate) : Number.NaN;
        if (!Number.isFinite(lastUpdate) || Date.now() - lastUpdate > STALE_METADATA_MS) {
            reasons.push('stale-or-missing-lastMetadataUpdate');
        }

        return {
            ...item,
            reasons,
        };
    });

    const unlistedInSample = enrichedSample.filter((item: any) => !item.isListed).length;

    return apiSuccess({
        summary: {
            total,
            healthy,
            unhealthy,
            missingName,
            missingImage,
            staleMetadata,
            unhealthyRatio: total > 0 ? Number((unhealthy / total).toFixed(4)) : 0,
            onlyUnlisted,
            sampleLimit,
            staleThresholdHours: 24,
            sampledUnhealthy: enrichedSample.length,
            sampledUnlisted: unlistedInSample,
        },
        sample: enrichedSample,
    });
}, {
    admin: true,
    rateLimit: RATE_LIMIT_CONFIG.LENIENT,
});

import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getRedisHealthStatus } from '@/lib/redis/client';
import { apiHandler, apiSuccess } from '@/lib/api';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { getSSEHealthStatus } from '@/services/sse/broadcast';
import { devLog } from '@/utils';
import '@/lib/dev-services-auto-start';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';
import { promises as fs } from 'fs';
import path from 'path';

const IMAGE_VARIANTS = {
    thumb: 128,
    small: 220,
    card: 560,
    detail: 1400,
} as const;

const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
const CACHE_SCHEMA_VERSION = 'v6';
const CACHE_FORMATS = ['webp', 'avif', 'png', 'jpeg', 'gif', 'svg'] as const;

const clampVariantWidth = (value: number): number => Math.max(128, Math.min(2048, value));

const extractExpectedCacheKeyFromVariantUrl = (value: unknown, expectedWidth: number): string | null => {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const parsed = new URL(value, 'http://localhost');
        const marker = '/api/nft/image/';
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex === -1) return null;

        const rawHash = parsed.pathname.slice(markerIndex + marker.length);
        if (!rawHash) return null;

        const widthParam = Number.parseInt(parsed.searchParams.get('w') || '', 10);
        const width = Number.isFinite(widthParam) ? clampVariantWidth(widthParam) : undefined;
        if (width !== expectedWidth) return null;

        const decodedHash = decodeURIComponent(rawHash);
        return encodeURIComponent(`${decodedHash}|w=${expectedWidth}`);
    } catch {
        return null;
    }
};

const extractSafeCacheKeyFromFileName = (fileName: string): string | null => {
    const formatPattern = CACHE_FORMATS.join('|');
    const match = fileName.match(new RegExp(`^(.*)\\.${CACHE_SCHEMA_VERSION}\\.(${formatPattern})$`));
    if (!match || !match[1]) return null;
    return match[1];
};

/**
 * GET /api/admin/system/health
 * Get system health status
 */
async function handler(req: NextRequest) {
    const db = await getDatabase();
    const nftMetadataCollection = db.collection('nft_metadata');

    // 1. Database Health & Latency
    const dbStart = Date.now();
    await db.collection('marketplace_items').findOne({});
    const dbLatency = Date.now() - dbStart;

    // 2. Last Sync Check - Check sync_status collection if it exists, fallback to marketplace activity
    let minutesSinceLastSync = 9999;
    let lastSyncAt: Date | null = null;

    // Try to get from sync_status collection (if implemented)
    const syncStatus = await db.collection('sync_status')
        .findOne({ service: 'marketplace_events' });

    if (syncStatus && syncStatus.lastSyncAt) {
        lastSyncAt = new Date(syncStatus.lastSyncAt);
        minutesSinceLastSync = Math.floor((Date.now() - lastSyncAt.getTime()) / 60000);
    } else {
        // Fallback: Check last marketplace activity
        const lastActivity = await db.collection('marketplace_items')
            .find({})
            .sort({ updatedAt: -1 })
            .limit(1)
            .toArray();

        if (lastActivity.length > 0 && lastActivity[0]) {
            lastSyncAt = new Date(lastActivity[0].updatedAt);
            minutesSinceLastSync = Math.floor((Date.now() - lastSyncAt.getTime()) / 60000);
        }
    }

    let subgraphStatus: 'synced' | 'delayed' | 'stale' | 'no_activity' = 'synced';

    // If using sync_status, use tighter thresholds
    if (syncStatus) {
        if (minutesSinceLastSync > 15) {
            subgraphStatus = 'stale';
        } else if (minutesSinceLastSync > 5) {
            subgraphStatus = 'delayed';
        }
    } else {
        // If using marketplace activity, be more lenient
        if (minutesSinceLastSync > 1440) { // 24 hours
            subgraphStatus = 'stale';
        } else if (minutesSinceLastSync > 120) { // 2 hours
            subgraphStatus = 'delayed';
        } else {
            subgraphStatus = 'no_activity'; // No recent marketplace activity, but system might be healthy
        }
    }

    // 3. Contract Owner Check
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
    const diamondAddress = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS as `0x${string}`;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    let ownerStatus: { isOwner: boolean; currentOwner: string; network: string } | null = null;

    if (diamondAddress && rpcUrl) {
        try {
            const chain = chainId === 1 ? mainnet : sepolia;
            const publicClient = createPublicClient({
                chain,
                transport: http(rpcUrl)
            });

            const owner = await publicClient.readContract({
                address: diamondAddress,
                abi: [
                    {
                        name: 'owner',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [],
                        outputs: [{ type: 'address' }]
                    }
                ],
                functionName: 'owner'
            });

            ownerStatus = {
                isOwner: true, // We can't check against current user here, frontend will handle it
                currentOwner: owner as string,
                network: chain.name
            };
        } catch (error) {
            devLog.error('[Health Check] Contract owner check failed:', error);
        }
    }

    // 4. NFT Sync Service Status (check if background job ran recently)
    const syncServiceStatus = await db.collection('marketplace_items')
        .countDocuments({
            updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // last 10 minutes
        });

    const isSyncActive = syncServiceStatus > 0;

    // 5. Pending/Cancelled Stats (already in dashboard, but include for completeness)
    const [pendingCount, cancelledCount, staleCount] = await Promise.all([
        db.collection('marketplace_items').countDocuments({ status: 'pending' }),
        db.collection('marketplace_items').countDocuments({ status: 'cancelled' }),
        db.collection('marketplace_items').countDocuments({
            status: 'listed',
            createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
    ]);

    const [redisHealth, sseHealth] = await Promise.all([
        getRedisHealthStatus(),
        Promise.resolve(getSSEHealthStatus())
    ]);

    // 6. Image enrichment coverage
    const missingImageFieldsQuery = {
        $or: [
            { 'metadata.images.thumb': { $exists: false } },
            { 'metadata.images.small': { $exists: false } },
            { 'metadata.images.card': { $exists: false } },
            { 'metadata.images.detail': { $exists: false } },
            { 'metadata.imageMeta.width': { $exists: false } },
            { 'metadata.imageMeta.height': { $exists: false } },
            { 'metadata.imageMeta.mimeType': { $exists: false } },
            { 'metadata.blurDataURL': { $exists: false } },
            { 'metadata.blurDataURL': null },
        ],
    };

    const [
        totalNftMetadataDocs,
        docsWithImageSource,
        missingImageFieldsCount,
        blurPlaceholderCount,
        docsWithThumbVariant,
        docsWithSmallVariant,
        docsWithCardVariant,
        docsWithDetailVariant,
        docsWithThumbCorrectWidth,
        docsWithSmallCorrectWidth,
        docsWithCardCorrectWidth,
        docsWithDetailCorrectWidth,
        docsWithAllVariants,
        docsWithAllCorrectVariantWidths,
        missingImageSample,
    ] = await Promise.all([
        nftMetadataCollection.countDocuments({}),
        nftMetadataCollection.countDocuments({
            $or: [
                { 'metadata.image': { $exists: true, $nin: [null, ''] } },
                { 'metadata.imageOriginal': { $exists: true, $nin: [null, ''] } },
            ],
        }),
        nftMetadataCollection.countDocuments(missingImageFieldsQuery),
        nftMetadataCollection.countDocuments({
            'metadata.blurDataURL': { $regex: '^data:image/svg\\+xml;base64,', $options: 'i' },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.thumb': { $exists: true, $nin: [null, ''] },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.small': { $exists: true, $nin: [null, ''] },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.card': { $exists: true, $nin: [null, ''] },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.detail': { $exists: true, $nin: [null, ''] },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.thumb': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.thumb}([&#]|$)` },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.small': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.small}([&#]|$)` },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.card': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.card}([&#]|$)` },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.detail': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.detail}([&#]|$)` },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.thumb': { $exists: true, $nin: [null, ''] },
            'metadata.images.small': { $exists: true, $nin: [null, ''] },
            'metadata.images.card': { $exists: true, $nin: [null, ''] },
            'metadata.images.detail': { $exists: true, $nin: [null, ''] },
        }),
        nftMetadataCollection.countDocuments({
            'metadata.images.thumb': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.thumb}([&#]|$)` },
            'metadata.images.small': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.small}([&#]|$)` },
            'metadata.images.card': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.card}([&#]|$)` },
            'metadata.images.detail': { $regex: `(^|[?&])w=${IMAGE_VARIANTS.detail}([&#]|$)` },
        }),
        nftMetadataCollection
            .find(missingImageFieldsQuery, {
                projection: {
                    contractAddress: 1,
                    tokenId: 1,
                    'metadata.image': 1,
                    'metadata.imageOriginal': 1,
                    'metadata.images': 1,
                    'metadata.imageMeta': 1,
                    'metadata.blurDataURL': 1,
                },
            })
            .limit(10)
            .toArray(),
    ]);

    const enrichedDocs = Math.max(0, docsWithImageSource - missingImageFieldsCount);
    const enrichmentCoverage = docsWithImageSource > 0
        ? Number(((enrichedDocs / docsWithImageSource) * 100).toFixed(2))
        : 100;

    // 7. Physical disk cache coverage (actual files in /public/cached-nft-images)
    const variantUrlDocs = await nftMetadataCollection.find(
        {
            $or: [
                { 'metadata.images.thumb': { $exists: true, $nin: [null, ''] } },
                { 'metadata.images.small': { $exists: true, $nin: [null, ''] } },
                { 'metadata.images.card': { $exists: true, $nin: [null, ''] } },
                { 'metadata.images.detail': { $exists: true, $nin: [null, ''] } },
            ],
        },
        {
            projection: {
                'metadata.images.thumb': 1,
                'metadata.images.small': 1,
                'metadata.images.card': 1,
                'metadata.images.detail': 1,
            },
        }
    ).toArray();

    const expectedKeysByVariant = {
        thumb: new Set<string>(),
        small: new Set<string>(),
        card: new Set<string>(),
        detail: new Set<string>(),
    };

    for (const doc of variantUrlDocs) {
        const thumbKey = extractExpectedCacheKeyFromVariantUrl(doc?.metadata?.images?.thumb, IMAGE_VARIANTS.thumb);
        if (thumbKey) expectedKeysByVariant.thumb.add(thumbKey);

        const smallKey = extractExpectedCacheKeyFromVariantUrl(doc?.metadata?.images?.small, IMAGE_VARIANTS.small);
        if (smallKey) expectedKeysByVariant.small.add(smallKey);

        const cardKey = extractExpectedCacheKeyFromVariantUrl(doc?.metadata?.images?.card, IMAGE_VARIANTS.card);
        if (cardKey) expectedKeysByVariant.card.add(cardKey);

        const detailKey = extractExpectedCacheKeyFromVariantUrl(doc?.metadata?.images?.detail, IMAGE_VARIANTS.detail);
        if (detailKey) expectedKeysByVariant.detail.add(detailKey);
    }

    let cacheFiles: string[] = [];
    try {
        cacheFiles = await fs.readdir(CACHE_DIR);
    } catch {
        cacheFiles = [];
    }

    const cachedSafeKeys = new Set<string>();
    for (const fileName of cacheFiles) {
        if (fileName === '.cache-metadata.json') continue;
        const safeKey = extractSafeCacheKeyFromFileName(fileName);
        if (safeKey) cachedSafeKeys.add(safeKey);
    }

    const getDiskVariantCoverage = (variant: keyof typeof IMAGE_VARIANTS) => {
        const expectedKeys = expectedKeysByVariant[variant];
        let presentOnDiskCount = 0;

        expectedKeys.forEach((key) => {
            if (cachedSafeKeys.has(key)) {
                presentOnDiskCount += 1;
            }
        });

        const expectedCount = expectedKeys.size;
        const missingOnDiskCount = Math.max(0, expectedCount - presentOnDiskCount);
        const coverage = expectedCount > 0
            ? Number(((presentOnDiskCount / expectedCount) * 100).toFixed(2))
            : 100;

        return {
            expectedCount,
            presentOnDiskCount,
            missingOnDiskCount,
            coverage,
        };
    };

    const diskThumb = getDiskVariantCoverage('thumb');
    const diskSmall = getDiskVariantCoverage('small');
    const diskCard = getDiskVariantCoverage('card');
    const diskDetail = getDiskVariantCoverage('detail');

    const diskExpectedTotal = diskThumb.expectedCount + diskSmall.expectedCount + diskCard.expectedCount + diskDetail.expectedCount;
    const diskPresentTotal = diskThumb.presentOnDiskCount + diskSmall.presentOnDiskCount + diskCard.presentOnDiskCount + diskDetail.presentOnDiskCount;
    const diskCoverage = diskExpectedTotal > 0
        ? Number(((diskPresentTotal / diskExpectedTotal) * 100).toFixed(2))
        : 100;

    return apiSuccess({
        database: {
            status: 'online',
            latency: dbLatency
        },
        subgraph: {
            status: subgraphStatus,
            minutesSinceLastSync,
            lastSyncAt
        },
        contract: ownerStatus,
        syncService: {
            status: isSyncActive ? 'active' : 'idle',
            recentUpdates: syncServiceStatus
        },
        marketplace: {
            pending: pendingCount,
            cancelled: cancelledCount,
            stale: staleCount
        },
        infrastructure: {
            redis: redisHealth,
            sse: sseHealth,
            process: {
                pid: process.pid,
                uptimeSec: Math.floor(process.uptime())
            },
            timestamp: Date.now()
        },
        images: {
            totalNftMetadataDocs,
            docsWithImageSource,
            enrichedDocs,
            missingImageFieldsCount,
            enrichmentCoverage,
            blurPlaceholderCount,
            status: missingImageFieldsCount === 0 ? 'healthy' : 'backfill-needed',
            variantCoverage: {
                docsWithAllVariants,
                docsWithAllCorrectVariantWidths,
                variants: {
                    thumb: {
                        expectedWidth: IMAGE_VARIANTS.thumb,
                        presentCount: docsWithThumbVariant,
                        correctWidthCount: docsWithThumbCorrectWidth,
                    },
                    small: {
                        expectedWidth: IMAGE_VARIANTS.small,
                        presentCount: docsWithSmallVariant,
                        correctWidthCount: docsWithSmallCorrectWidth,
                    },
                    card: {
                        expectedWidth: IMAGE_VARIANTS.card,
                        presentCount: docsWithCardVariant,
                        correctWidthCount: docsWithCardCorrectWidth,
                    },
                    detail: {
                        expectedWidth: IMAGE_VARIANTS.detail,
                        presentCount: docsWithDetailVariant,
                        correctWidthCount: docsWithDetailCorrectWidth,
                    },
                },
            },
            diskCacheCoverage: {
                cacheDirectory: 'public/cached-nft-images',
                totalCachedFiles: cachedSafeKeys.size,
                expectedVariantFilesTotal: diskExpectedTotal,
                presentVariantFilesTotal: diskPresentTotal,
                coverage: diskCoverage,
                status: diskCoverage === 100 ? 'warm' : 'partial',
                variants: {
                    thumb: {
                        expectedWidth: IMAGE_VARIANTS.thumb,
                        ...diskThumb,
                    },
                    small: {
                        expectedWidth: IMAGE_VARIANTS.small,
                        ...diskSmall,
                    },
                    card: {
                        expectedWidth: IMAGE_VARIANTS.card,
                        ...diskCard,
                    },
                    detail: {
                        expectedWidth: IMAGE_VARIANTS.detail,
                        ...diskDetail,
                    },
                },
                note: 'Disk cache is request-driven. Missing files can still be valid if variants were not requested yet.',
            },
            sampleMissing: missingImageSample.map((doc: any) => ({
                contractAddress: doc.contractAddress,
                tokenId: doc.tokenId,
                image: doc.metadata?.image || null,
                imageOriginal: doc.metadata?.imageOriginal || null,
                hasVariants: Boolean(
                    doc.metadata?.images?.thumb &&
                    doc.metadata?.images?.small &&
                    doc.metadata?.images?.card &&
                    doc.metadata?.images?.detail
                ),
                hasCorrectVariantWidths: Boolean(
                    typeof doc.metadata?.images?.thumb === 'string' && doc.metadata.images.thumb.includes(`w=${IMAGE_VARIANTS.thumb}`) &&
                    typeof doc.metadata?.images?.small === 'string' && doc.metadata.images.small.includes(`w=${IMAGE_VARIANTS.small}`) &&
                    typeof doc.metadata?.images?.card === 'string' && doc.metadata.images.card.includes(`w=${IMAGE_VARIANTS.card}`) &&
                    typeof doc.metadata?.images?.detail === 'string' && doc.metadata.images.detail.includes(`w=${IMAGE_VARIANTS.detail}`)
                ),
                hasMeta: Boolean(
                    typeof doc.metadata?.imageMeta?.width === 'number' &&
                    typeof doc.metadata?.imageMeta?.height === 'number' &&
                    typeof doc.metadata?.imageMeta?.mimeType === 'string'
                ),
                hasBlur: Boolean(doc.metadata?.blurDataURL),
            }))
        }
    });
}

export const GET = apiHandler(handler, {
    admin: true,
    rateLimit: RATE_LIMIT_CONFIG.LENIENT
});

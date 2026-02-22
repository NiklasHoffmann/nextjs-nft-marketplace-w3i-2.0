import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiHandler } from '@/lib/api';
import { apiSuccess } from '@/lib/api';

// GET /api/nft/insights - Read-only access to NFT insights
// For admin CUD operations, use /api/nft/admin/insights
export const GET = apiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const contractAddress = searchParams.get('contractAddress');
    const tokenId = searchParams.get('tokenId');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',');
    const createdBy = searchParams.get('createdBy');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const collection = await getCollection('admin_nft_insights');

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build filter object
    const filter: any = {};

    if (contractAddress) {
        filter.contractAddress = { $regex: `^${escapeRegex(contractAddress)}$`, $options: 'i' };
    }

    // Important: tokenId can be empty string for collection-wide insights
    // We need to check if tokenId parameter exists (not just if it's truthy)
    if (tokenId !== null && tokenId !== undefined) {
        filter.tokenId = tokenId; // Can be "" for collection-wide or "123" for specific NFT
    }

    if (category) {
        filter.category = category;
    }

    if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
    }

    if (createdBy) {
        filter.createdBy = createdBy.toLowerCase();
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query
    const results = await collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

    // Check if there are more results
    const totalCount = await collection.countDocuments(filter);
    const hasMore = skip + results.length < totalCount;

    return apiSuccess({
        data: results,
        dataCount: results.length,
        totalCount,
        hasMore,
        pagination: {
            skip,
            limit,
            sortBy,
            sortOrder: sortOrder === 1 ? 'asc' : 'desc'
        }
    });
});

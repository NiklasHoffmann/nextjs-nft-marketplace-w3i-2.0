import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';

// GET /api/insights/collection - Read-only access to Collection insights
// For admin CUD operations, use /api/nft/admin/insights/collections
export const GET = apiHandler(async (request: NextRequest) => {
    // Extract query parameters
    const contractAddress = getQueryParam(request, 'contractAddress');
    const category = getQueryParam(request, 'category');
    const tags = getQueryParam(request, 'tags')?.split(',');
    const createdBy = getQueryParam(request, 'createdBy');
    const limit = parseInt(getQueryParam(request, 'limit') || '20');
    const skip = parseInt(getQueryParam(request, 'skip') || '0');
    const sortBy = getQueryParam(request, 'sortBy') || 'updatedAt';
    const sortOrder = getQueryParam(request, 'sortOrder') === 'asc' ? 1 : -1;

    const collection = await getCollection('admin_collection_insights');

    // Build filter object
    const filter: any = {};

    if (contractAddress) {
        filter.contractAddress = contractAddress.toLowerCase();
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

import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// GET /api/insights/collection - Read-only access to Collection insights
// For admin CUD operations, use /api/nft/admin/insights/collections
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        console.log('🔍 GET /api/insights/collection called with params:', searchParams.toString());

        // Extract query parameters
        const contractAddress = searchParams.get('contractAddress');
        const category = searchParams.get('category');
        const tags = searchParams.get('tags')?.split(',');
        const createdBy = searchParams.get('createdBy');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

        console.log('📋 Parsed parameters:', {
            contractAddress,
            category,
            tags,
            createdBy,
            limit,
            skip,
            sortBy,
            sortOrder
        });

        const collection = await getCollection('admin_collection_insights');
        console.log('📊 Got collection:', !!collection);

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

        console.log('🔍 Final filter:', filter);

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

        console.log(`📄 Query results count: ${results.length}`);
        console.log('🔍 Sample result:', results.length > 0 ? results[0] : 'No results');

        // Check if there are more results
        const totalCount = await collection.countDocuments(filter);
        const hasMore = skip + results.length < totalCount;

        const response = {
            success: true,
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
        };

        console.log('✅ Returning response:', { success: true, dataCount: results.length, hasMore });
        return NextResponse.json(response);

    } catch (error) {
        console.error('GET /api/insights/collection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch collection insights' },
            { status: 500 }
        );
    }
}
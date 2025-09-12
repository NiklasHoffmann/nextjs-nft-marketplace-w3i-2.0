import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
    NFTInsights,
    CreateNFTInsightsRequest,
    UpdateNFTInsightsRequest,
    NFTInsightsResponse
} from '@/types/insights';
import { ObjectId } from 'mongodb';
import { hasInsightsAdminAccess, isInsightsReadOnlyMode, logInsightsAccess } from '@/utils/insights-access';

// GET /api/insights/nft - Get NFT insights with optional filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');
        const category = searchParams.get('category');
        const tags = searchParams.get('tags')?.split(',');
        const isWatchlisted = searchParams.get('isWatchlisted') === 'true';
        const isFavorite = searchParams.get('isFavorite') === 'true';
        const createdBy = searchParams.get('createdBy');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

        const collection = await getCollection('nft_insights');

        // Build filter object
        const filter: any = {};

        if (contractAddress) {
            filter.contractAddress = contractAddress.toLowerCase();
        }

        if (tokenId) {
            filter.tokenId = tokenId;
        }

        if (category) {
            filter.category = category;
        }

        if (tags && tags.length > 0) {
            filter.tags = { $in: tags };
        }

        if (typeof isWatchlisted === 'boolean') {
            filter.isWatchlisted = isWatchlisted;
        }

        if (typeof isFavorite === 'boolean') {
            filter.isFavorite = isFavorite;
        }

        if (createdBy) {
            filter.createdBy = createdBy.toLowerCase();
        }

        // Optimize queries with proper indexing strategy
        // Get total count for pagination (only if skip > 0 or we need exact count)
        let totalCount = 0;
        let hasMore = false;
        
        if (skip === 0) {
            // For first page, fetch limit + 1 to check if more results exist
            const results = await collection
                .find(filter)
                .sort({ [sortBy]: sortOrder })
                .limit(limit + 1)
                .toArray();
                
            hasMore = results.length > limit;
            const finalResults = hasMore ? results.slice(0, limit) : results;
            
            const response: NFTInsightsResponse = {
                success: true,
                data: finalResults as NFTInsights[],
                count: finalResults.length,
                page: 1,
                totalPages: hasMore ? -1 : 1, // -1 indicates unknown total pages for performance
                hasMore
            };

            return NextResponse.json(response);
        } else {
            // For subsequent pages, we need both count and results
            const [results, count] = await Promise.all([
                collection
                    .find(filter)
                    .sort({ [sortBy]: sortOrder })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                collection.countDocuments(filter)
            ]);
            
            totalCount = count;
            hasMore = (skip + limit) < totalCount;
            
            const response: NFTInsightsResponse = {
                success: true,
                data: results as NFTInsights[],
                count: results.length,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(totalCount / limit),
                hasMore
            };

            return NextResponse.json(response);
        }

    } catch (error) {
        console.error('GET /api/insights/nft error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch NFT insights' },
            { status: 500 }
        );
    }
}

// POST /api/insights/nft - Create new NFT insights
export async function POST(request: NextRequest) {
    try {
        const body: CreateNFTInsightsRequest = await request.json();

        // Validate required fields
        if (!body.contractAddress || !body.tokenId) {
            return NextResponse.json(
                { success: false, error: 'contractAddress and tokenId are required' },
                { status: 400 }
            );
        }

        // Check access permissions
        const walletAddress = body.createdBy;

        if (isInsightsReadOnlyMode()) {
            logInsightsAccess(walletAddress, 'create', `${body.contractAddress}:${body.tokenId}`, false);
            return NextResponse.json(
                { success: false, error: 'Insights editing is currently disabled for maintenance' },
                { status: 403 }
            );
        }

        if (!hasInsightsAdminAccess(walletAddress)) {
            logInsightsAccess(walletAddress, 'create', `${body.contractAddress}:${body.tokenId}`, false);
            return NextResponse.json(
                { success: false, error: 'You do not have permission to create insights. Contact an administrator for access.' },
                { status: 403 }
            );
        }

        // Log successful access
        logInsightsAccess(walletAddress, 'create', `${body.contractAddress}:${body.tokenId}`, true);

        const collection = await getCollection('nft_insights');

        // Check if insights already exist for this NFT
        const existing = await collection.findOne({
            contractAddress: body.contractAddress.toLowerCase(),
            tokenId: body.tokenId
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Insights already exist for this NFT' },
                { status: 409 }
            );
        }

        // Create new insights document
        const now = new Date();
        const newInsights: Omit<NFTInsights, '_id'> = {
            contractAddress: body.contractAddress.toLowerCase(),
            tokenId: body.tokenId,
            chainId: body.chainId,
            title: body.title,
            description: body.description,
            customName: body.customName,
            category: body.category,
            tags: body.tags || [],
            rarity: body.rarity,
            quality: body.quality,
            personalRating: body.personalRating,
            purchasePrice: body.purchasePrice,
            purchaseDate: body.purchaseDate,
            targetSellPrice: body.targetSellPrice,
            marketAnalysis: body.marketAnalysis,
            collectionInsights: body.collectionInsights,
            technicalMetrics: body.technicalMetrics,
            isWatchlisted: body.isWatchlisted || false,
            isFavorite: body.isFavorite || false,
            isForSale: body.isForSale || false,
            isPrivate: body.isPrivate || false,
            strategy: body.strategy,
            investmentGoal: body.investmentGoal,
            riskLevel: body.riskLevel,
            socialMetrics: body.socialMetrics,
            customFields: body.customFields,
            createdAt: now,
            updatedAt: now,
            createdBy: body.createdBy?.toLowerCase(),
            updatedBy: body.createdBy?.toLowerCase(),
            viewCount: 0,
            shareCount: 0
        };

        const result = await collection.insertOne(newInsights);

        const response: NFTInsightsResponse = {
            success: true,
            data: { ...newInsights, _id: result.insertedId } as NFTInsights
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.error('POST /api/insights/nft error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create NFT insights' },
            { status: 500 }
        );
    }
}

// PUT /api/insights/nft - Update existing NFT insights
export async function PUT(request: NextRequest) {
    try {
        const body: UpdateNFTInsightsRequest = await request.json();

        if (!body._id) {
            return NextResponse.json(
                { success: false, error: '_id is required for updates' },
                { status: 400 }
            );
        }

        // Check access permissions
        const walletAddress = body.updatedBy;

        if (isInsightsReadOnlyMode()) {
            logInsightsAccess(walletAddress, 'edit', `id:${body._id}`, false);
            return NextResponse.json(
                { success: false, error: 'Insights editing is currently disabled for maintenance' },
                { status: 403 }
            );
        }

        if (!hasInsightsAdminAccess(walletAddress)) {
            logInsightsAccess(walletAddress, 'edit', `id:${body._id}`, false);
            return NextResponse.json(
                { success: false, error: 'You do not have permission to edit insights. Contact an administrator for access.' },
                { status: 403 }
            );
        }

        // Log successful access
        logInsightsAccess(walletAddress, 'edit', `id:${body._id}`, true);

        const collection = await getCollection('nft_insights');

        // Prepare update document
        const updateDoc: any = {
            ...body,
            updatedAt: new Date()
        };

        // Remove _id from update document
        delete updateDoc._id;

        const result = await collection.updateOne(
            { _id: new ObjectId(body._id.toString()) },
            { $set: updateDoc }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'NFT insights not found' },
                { status: 404 }
            );
        }

        // Get updated document
        const updated = await collection.findOne(
            { _id: new ObjectId(body._id.toString()) }
        );

        const response: NFTInsightsResponse = {
            success: true,
            data: updated as NFTInsights
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('PUT /api/insights/nft error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update NFT insights' },
            { status: 500 }
        );
    }
}

// DELETE /api/insights/nft - Delete NFT insights
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const walletAddress = searchParams.get('walletAddress'); // Add wallet address for permission check

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'id parameter is required' },
                { status: 400 }
            );
        }

        // Check access permissions
        if (isInsightsReadOnlyMode()) {
            logInsightsAccess(walletAddress || undefined, 'delete', `id:${id}`, false);
            return NextResponse.json(
                { success: false, error: 'Insights editing is currently disabled for maintenance' },
                { status: 403 }
            );
        }

        if (!hasInsightsAdminAccess(walletAddress || undefined)) {
            logInsightsAccess(walletAddress || undefined, 'delete', `id:${id}`, false);
            return NextResponse.json(
                { success: false, error: 'You do not have permission to delete insights. Contact an administrator for access.' },
                { status: 403 }
            );
        }

        // Log successful access
        logInsightsAccess(walletAddress || undefined, 'delete', `id:${id}`, true);

        const collection = await getCollection('nft_insights');

        const result = await collection.deleteOne(
            { _id: new ObjectId(id) }
        );

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'NFT insights not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('DELETE /api/insights/nft error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete NFT insights' },
            { status: 500 }
        );
    }
}
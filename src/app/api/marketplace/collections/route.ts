/**
 * Marketplace Collections API (v2)
 * 
 * Server-side collection aggregation using MongoDB
 * 
 * GET /api/marketplace/collections
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - minFloorPrice: string (ETH)
 * - maxFloorPrice: string (ETH)
 * - minListedCount: number
 * - sortBy: floorPrice|totalListed|totalValue|name
 * - sortOrder: asc|desc
 */

import { NextRequest } from 'next/server';
import { getEnrichedNFTsCollection } from '@/lib/mongodb';
import { formatEther } from 'viem';
import { apiHandler } from '@/lib/api';
import { apiSuccess } from '@/lib/api';
import { devLog } from '@/utils';

export const GET = apiHandler(async (request: NextRequest) => {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Parse filters
    const minFloorPrice = searchParams.get('minFloorPrice');
    const maxFloorPrice = searchParams.get('maxFloorPrice');
    const minListedCount = searchParams.get('minListedCount');

    // Parse sorting
    const sortBy = searchParams.get('sortBy') || 'totalListed';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const collection = await getEnrichedNFTsCollection();

    // MongoDB Aggregation Pipeline
    const pipeline: any[] = [
        // Stage 1: Match only listed items
        {
            $match: {
                'marketplace.isListed': true,
                'marketplace.price': { $ne: null }
            }
        },

        // Stage 2: Group by collection (contractAddress)
        {
            $group: {
                _id: '$contractAddress',

                // Basic Info (take first)
                name: { $first: '$contract.contractName' },
                symbol: { $first: '$contract.contractSymbol' },
                totalSupply: { $first: '$contract.totalSupply' },

                // Listed Items
                listedCount: { $sum: 1 },
                listedItems: { $push: '$$ROOT' },

                // Financial Stats
                prices: { $push: '$marketplace.price' },

                // Social Stats
                totalLikes: { $sum: '$stats.likeCount' },
                totalWatchlist: { $sum: '$stats.watchlistCount' },
                totalViews: { $sum: '$stats.viewCount' },

                // Images
                images: { $push: '$metadata.image' },
            }
        },

        // Stage 3: Calculate floor price and other stats
        {
            $addFields: {
                contractAddress: '$_id',
                floorPrice: { $min: '$prices' },
                averagePrice: { $avg: '$prices' },
                totalValue: { $sum: '$prices' },
                previewImages: { $slice: ['$images', 4] }, // First 4 images
                imageUrl: { $first: '$images' }
            }
        },

        // Stage 4: Apply filters
        {
            $match: {
                ...(minFloorPrice && { floorPrice: { $gte: minFloorPrice } }),
                ...(maxFloorPrice && { floorPrice: { $lte: maxFloorPrice } }),
                ...(minListedCount && { listedCount: { $gte: parseInt(minListedCount) } })
            }
        },

        // Stage 5: Sort
        {
            $sort: {
                [sortBy === 'floorPrice' ? 'floorPrice' :
                    sortBy === 'totalListed' ? 'listedCount' :
                        sortBy === 'totalValue' ? 'totalValue' :
                            sortBy === 'name' ? 'name' : 'listedCount']: sortOrder === 'asc' ? 1 : -1
            }
        },

        // Stage 6: Project final fields
        {
            $project: {
                _id: 1,
                contractAddress: 1,
                name: { $ifNull: ['$name', 'Unknown Collection'] },
                symbol: { $ifNull: ['$symbol', { $substr: ['$contractAddress', 0, 6] }] },
                totalSupply: { $ifNull: ['$totalSupply', 0] },
                listedCount: 1,
                floorPrice: 1,
                averagePrice: 1,
                totalValue: 1,
                imageUrl: 1,
                previewImages: 1,
                totalLikes: 1,
                totalWatchlist: 1,
                totalViews: 1,
                lastUpdated: '$$NOW'
            }
        }
    ];

    // Execute aggregation with pagination
    const [collections, totalResult] = await Promise.all([
        collection.aggregate([
            ...pipeline,
            { $skip: skip },
            { $limit: limit }
        ]).toArray(),
        collection.aggregate([
            ...pipeline,
            { $count: 'total' }
        ]).toArray()
    ]);

    const total = totalResult[0]?.total || 0;

    // Calculate summary stats
    const summary = await collection.aggregate([
        {
            $match: {
                'marketplace.isListed': true,
                'marketplace.price': { $ne: null }
            }
        },
        {
            $group: {
                _id: null,
                totalCollections: { $addToSet: '$contractAddress' },
                totalListedNFTs: { $sum: 1 },
                totalValue: { $sum: { $toLong: '$marketplace.price' } }
            }
        }
    ]).toArray();

    const summaryData = summary[0] || {
        totalCollections: [],
        totalListedNFTs: 0,
        totalValue: 0
    };

    const duration = Date.now() - startTime;
    devLog.info(`✅ Collections query completed in ${duration}ms (${total} collections)`);

    return apiSuccess({
        data: {
            collections: collections.map(col => ({
                ...col,
                // Convert Wei to ETH for display
                floorPrice: col.floorPrice ? formatEther(BigInt(col.floorPrice)) : null,
                averagePrice: col.averagePrice ? formatEther(BigInt(Math.floor(col.averagePrice))) : null,
                totalValue: col.totalValue ? formatEther(BigInt(col.totalValue)) : '0'
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary: {
                totalCollections: summaryData.totalCollections.length,
                totalListedNFTs: summaryData.totalListedNFTs,
                totalValue: formatEther(BigInt(summaryData.totalValue))
            }
        },
        timestamp: Date.now()
    });
});

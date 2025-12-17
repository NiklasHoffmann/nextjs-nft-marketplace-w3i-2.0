import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';

/**
 * GET /api/collections
 * 
 * Aggregates collection statistics directly from marketplace_items
 * Includes preview images from multiple NFTs and social stats
 * 
 * Query params:
 * - includeInsights: boolean (default true) - Include admin insights
 * - minItems: number (default 0) - Minimum item count filter
 * - sortBy: string (default 'itemCount') - Sort field
 * - sortOrder: 'asc' | 'desc' (default 'desc')
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInsights = searchParams.get('includeInsights') !== 'false';
        const minItems = parseInt(searchParams.get('minItems') || '0');
        const sortBy = searchParams.get('sortBy') || 'itemCount';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

        console.log('🔍 [Collections API] Aggregating from marketplace_items...');
        const startTime = Date.now();

        const marketplaceItems = await getCollection('marketplace_items');

        // Aggregate collections from marketplace_items
        const pipeline: any[] = [
            { $match: { isListed: true, listingId: { $ne: null } } },
            {
                $group: {
                    _id: '$contractAddress',
                    contractAddress: { $first: '$contractAddress' },
                    itemCount: { $sum: 1 },
                    floorPrice: { $min: '$price' },
                    totalValue: { $sum: { $toDouble: '$price' } },
                    averagePrice: { $avg: { $toDouble: '$price' } },
                    // Collect token IDs for preview images
                    tokenIds: { $push: '$tokenId' },
                    // Count unique sellers (owners)
                    uniqueSellers: { $addToSet: '$seller' }
                }
            }
        ];

        // Add minItems filter
        if (minItems > 0) {
            pipeline.push({ $match: { itemCount: { $gte: minItems } } });
        }

        // Add sorting
        const sortField = sortBy === 'floorPrice' ? 'floorPrice' :
            sortBy === 'totalValue' ? 'totalValue' :
                sortBy === 'name' ? 'contractAddress' : 'itemCount';
        pipeline.push({ $sort: { [sortField]: sortOrder } });

        const collections = await marketplaceItems.aggregate(pipeline).toArray();

        const fetchTime = Date.now() - startTime;
        console.log(`✅ [Collections API] Aggregated ${collections.length} collections in ${fetchTime}ms`);

        // Get metadata for collections (from nft_metadata) - get multiple images per collection
        const nftMetadata = await getCollection('nft_metadata');
        const contractAddresses = collections.map(c => c.contractAddress);

        // Create lookup queries for all collections at once
        const metadataMap = new Map();
        const contractInfoMap = new Map();

        // Get up to 4 images per collection for preview
        for (const collection of collections) {
            const tokenIds = collection.tokenIds?.slice(0, 4) || [];
            if (tokenIds.length > 0) {
                const nfts = await nftMetadata.find({
                    contractAddress: collection.contractAddress,
                    tokenId: { $in: tokenIds.map(String) }
                }).limit(4).toArray();

                const images = nfts
                    .map((nft: any) => nft.metadata?.image)
                    .filter((img: any) => img && typeof img === 'string');

                metadataMap.set(collection.contractAddress, images);

                // Get contract info from first NFT
                const firstNft = nfts[0];
                if (firstNft) {
                    contractInfoMap.set(collection.contractAddress, {
                        contractName: firstNft.contract?.name,
                        contractSymbol: firstNft.contract?.symbol,
                        totalSupply: firstNft.contract?.totalSupply
                    });
                }
            }
        }

        // Get social stats from nft_stats - aggregate per collection
        const nftStats = await getCollection('nft_stats');
        const statsMap = new Map();

        const statsPipeline = [
            { $match: { contractAddress: { $in: contractAddresses } } },
            {
                $group: {
                    _id: '$contractAddress',
                    totalViews: { $sum: { $ifNull: ['$viewCount', 0] } },
                    totalLikes: { $sum: { $ifNull: ['$likeCount', 0] } },
                    totalWatchlist: { $sum: { $ifNull: ['$watchlistCount', 0] } },
                    totalRatings: { $sum: { $ifNull: ['$ratingCount', 0] } },
                    avgRating: { $avg: { $ifNull: ['$averageRating', 0] } },
                    ratedCount: {
                        $sum: {
                            $cond: [{ $gt: ['$ratingCount', 0] }, 1, 0]
                        }
                    }
                }
            }
        ];

        const statsAggregation = await nftStats.aggregate(statsPipeline).toArray();
        statsAggregation.forEach((stat: any) => {
            statsMap.set(stat._id, {
                totalViews: stat.totalViews || 0,
                totalLikes: stat.totalLikes || 0,
                totalWatchlist: stat.totalWatchlist || 0,
                totalRatings: stat.totalRatings || 0,
                averageRating: stat.ratedCount > 0 ? (stat.avgRating || 0) : 0
            });
        });

        // Get insights if requested
        let insightsMap = new Map();
        if (includeInsights) {
            const insights = await getCollection('admin_nft_insights');
            const insightsDocs = await insights.find({
                contractAddress: { $in: contractAddresses },
                $or: [
                    { tokenId: null },
                    { tokenId: '' },
                    { tokenId: { $exists: false } }
                ]
            }).toArray();

            insightsDocs.forEach((insight: any) => {
                insightsMap.set(insight.contractAddress, {
                    category: insight.category,
                    rarity: insight.rarity,
                    totalSupply: insight.totalSupply,
                    hasInsights: true
                });
            });
        }

        // Transform to API format
        const transformedCollections = collections.map((col: any) => {
            const previewImages = metadataMap.get(col.contractAddress) || [];
            const contractInfo = contractInfoMap.get(col.contractAddress) || {};
            const stats = statsMap.get(col.contractAddress) || {};
            const insights = insightsMap.get(col.contractAddress);

            return {
                contractAddress: col.contractAddress,
                contractName: contractInfo.contractName || col.contractAddress.slice(0, 10) + '...',
                contractSymbol: contractInfo.contractSymbol || 'NFT',
                itemCount: col.itemCount,
                floorPrice: col.floorPrice || null,
                totalValue: col.totalValue || 0,
                averagePrice: col.averagePrice || null,
                imageUrl: previewImages[0] || null,
                previewImages: previewImages,
                // Social stats
                totalViews: stats.totalViews || 0,
                totalLikes: stats.totalLikes || 0,
                totalWatchlist: stats.totalWatchlist || 0,
                totalRatings: stats.totalRatings || 0,
                averageRating: stats.averageRating || 0,
                // Supply info
                totalSupply: contractInfo.totalSupply || insights?.totalSupply || null,
                // Unique owners (sellers with listed items)
                uniqueOwners: col.uniqueSellers?.length || 0,
                insights: includeInsights ? insights : undefined
            };
        });

        const totalTime = Date.now() - startTime;
        console.log(`📊 [Collections API] Total processing time: ${totalTime}ms`);
        console.log(`📸 [Collections API] Preview images loaded for ${transformedCollections.filter((c: any) => c.previewImages.length > 0).length} collections`);

        return apiSuccess({
            collections: transformedCollections,
            count: transformedCollections.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [Collections API] Error:', error);
        return apiInternalError(error instanceof Error ? error.message : 'Failed to fetch collections');
    }
}

/**
 * Marketplace Items API (v2)
 * 
 * Server-side NFT search, filtering, and pagination using MongoDB
 * 
 * GET /api/marketplace/items
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (full-text search)
 * - contractAddress: string
 * - minPrice: string (Wei)
 * - maxPrice: string (Wei)
 * - seller: string
 * - isListed: boolean
 * - category: string
 * - rarity: string
 * - tags: string (comma-separated)
 * - minRating: number
 * - minViews: number
 * - minLikes: number
 * - minWatchlistCount: number
 * - sortBy: price|rating|views|likes|watchlistCount|name|created
 * - sortOrder: asc|desc
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { apiHandler } from '@/lib/api/handler';
import type { MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';

// Auto-start sync service in dev mode
import '@/lib/dev-services-auto-start';

export const GET = apiHandler(async (request: NextRequest) => {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Parse filters
    const search = searchParams.get('search');
    const contractAddress = searchParams.get('contractAddress');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const seller = searchParams.get('seller');
    const isListed = searchParams.get('isListed');
    const category = searchParams.get('category')?.split(',').filter(Boolean);
    const rarity = searchParams.get('rarity')?.split(',').filter(Boolean);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const minRating = searchParams.get('minRating');
    const minViews = searchParams.get('minViews');
    const minLikes = searchParams.get('minLikes');
    const minWatchlistCount = searchParams.get('minWatchlistCount');

    // Parse sorting
    const sortBy = searchParams.get('sortBy') || 'price';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build MongoDB query
    const query: any = {};

    // Default: only show VALID listings (isListed=true AND listingId exists)
    if (isListed === null) {
        query.isListed = true;
        query.listingId = { $ne: null, $exists: true };  // Must have valid listingId
    } else if (isListed !== null) {
        query.isListed = isListed === 'true';
        if (isListed === 'true') {
            query.listingId = { $ne: null, $exists: true };  // Must have valid listingId
        }
    }

    // Marketplace filters
    if (contractAddress) {
        query.contractAddress = contractAddress;
    }
    if (seller) query.seller = seller;

    // Note: Price filters are applied later in the pipeline using $expr
    // because price is stored as string but needs numeric comparison

    // Get database and collections
    const db = await getDatabase();
    const collection = db.collection('marketplace_items');
    const metadataCollection = db.collection('nft_metadata');

    // Build aggregation pipeline
    const pipeline: any[] = [
        { $match: query },

        // Price filters using $expr for numeric comparison (price is stored as string)
        ...(minPrice || maxPrice ? [{
            $match: {
                $expr: {
                    $and: [
                        ...(minPrice ? [{
                            $gte: [
                                { $toLong: { $ifNull: ['$price', '0'] } },
                                parseFloat(minPrice) * 1e18 // Convert ETH to Wei
                            ]
                        }] : []),
                        ...(maxPrice ? [{
                            $lte: [
                                { $toLong: { $ifNull: ['$price', '0'] } },
                                parseFloat(maxPrice) * 1e18 // Convert ETH to Wei
                            ]
                        }] : [])
                    ]
                }
            }
        }] : []),

        // JOIN with nft_metadata collection (get NFT data)
        {
            $lookup: {
                from: 'nft_metadata',
                let: {
                    contractAddr: '$contractAddress',
                    tokId: '$tokenId'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$contractAddress', '$$contractAddr'] },
                                    { $eq: ['$tokenId', '$$tokId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'nftData'
            }
        },

        // Unwind nft_metadata (should always have one result)
        {
            $unwind: {
                path: '$nftData',
                preserveNullAndEmptyArrays: true // Keep listings without metadata
            }
        },

        // JOIN with admin_nft_insights collection
        // Note: Insights can be collection-wide (contractAddress only) OR item-specific (contractAddress + tokenId)
        {
            $lookup: {
                from: 'admin_nft_insights',
                let: {
                    contractAddr: '$contractAddress',
                    tokId: { $toString: '$tokenId' }
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    // Must match contractAddress
                                    { $eq: ['$contractAddress', '$$contractAddr'] },
                                    {
                                        $or: [
                                            // Case 1: Item-specific (exact tokenId match)
                                            { $eq: ['$tokenId', '$$tokId'] },
                                            // Case 2: Collection-wide (tokenId is null, empty string, or doesn't exist)
                                            {
                                                $or: [
                                                    { $eq: ['$tokenId', null] },
                                                    { $eq: ['$tokenId', ''] },
                                                    { $not: ['$tokenId'] }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    // Sort: Item-specific insights first (tokenId = $$tokId), then collection-wide
                    {
                        $addFields: {
                            isItemSpecific: { $cond: [{ $eq: ['$tokenId', '$$tokId'] }, 1, 0] }
                        }
                    },
                    {
                        $sort: {
                            isItemSpecific: -1  // Item-specific first
                        }
                    },
                    // Take only the first match
                    { $limit: 1 }
                ],
                as: 'insightsData'
            }
        },

        // Unwind insights (optional)
        {
            $unwind: {
                path: '$insightsData',
                preserveNullAndEmptyArrays: true
            }
        },

        // JOIN with nft_stats collection for sorting (rating, views, likes, watchlistCount)
        {
            $lookup: {
                from: 'nft_stats',
                let: {
                    contractAddr: '$contractAddress',
                    tokId: '$tokenId'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$contractAddress', '$$contractAddr'] },
                                    { $eq: ['$tokenId', '$$tokId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'statsData'
            }
        },

        // Unwind stats (optional)
        {
            $unwind: {
                path: '$statsData',
                preserveNullAndEmptyArrays: true
            }
        },

        // Restructure document to match expected format (flat structure for compatibility)
        {
            $addFields: {
                // Keep original marketplace_items fields at root level
                // (for backward compatibility with NFTGallery/NFTCard)
                contractAddress: '$contractAddress',
                price: '$price',
                seller: '$seller',
                isListed: '$isListed',
                listedAt: '$listedAt',
                listingId: '$listingId',
                buyer: '$buyer',
                desiredContractAddress: '$desiredContractAddress',
                desiredTokenId: '$desiredTokenId',

                // Add enriched data
                metadata: '$nftData.metadata',
                contract: '$nftData.contract',
                insights: '$insightsData',

                // Stats for sorting and filtering
                stats: {
                    viewCount: { $ifNull: ['$statsData.viewCount', 0] },
                    likeCount: { $ifNull: ['$statsData.likeCount', 0] },
                    watchlistCount: { $ifNull: ['$statsData.watchlistCount', 0] },
                    averageRating: { $ifNull: ['$statsData.averageRating', 0] },
                    ratingCount: { $ifNull: ['$statsData.ratingCount', 0] }
                },

                // Nested marketplace object with ALL v2 fields
                marketplace: {
                    // Core Listing
                    listingId: '$listingId',
                    isListed: '$isListed',

                    // Pricing (v1 & v2)
                    price: '$price',
                    priceTotal: '$priceTotal',
                    unitPrice: '$unitPrice',

                    // Parties
                    seller: '$seller',
                    buyer: '$buyer',

                    // Swap Data
                    desiredContractAddress: '$desiredContractAddress',
                    desiredTokenAddress: '$desiredTokenAddress',
                    desiredTokenId: '$desiredTokenId',
                    desiredErc1155Quantity: '$desiredErc1155Quantity',

                    // v2 Fields
                    tokenStandard: '$tokenStandard',
                    listingType: '$listingType',
                    status: '$status',

                    // ERC1155
                    erc1155QuantityListed: '$erc1155QuantityListed',
                    remainingQuantity: '$remainingQuantity',

                    // Advanced
                    buyerWhitelistEnabled: '$buyerWhitelistEnabled',
                    partialBuyEnabled: '$partialBuyEnabled',
                    feeRate: '$feeRate',

                    // Chain & Timestamps
                    chainId: '$chainId',
                    createdAt: '$createdAt',
                    syncedAt: '$syncedAt',
                    listedAt: '$listedAt'
                },

                // Add sort fields with null handling
                sortName: { $ifNull: ['$nftData.metadata.name', ''] },
                sortPrice: { $toLong: { $ifNull: ['$price', '0'] } }, // Convert string Wei to number for sorting
                sortCreatedAt: '$createdAt',
                sortViewCount: { $ifNull: ['$statsData.viewCount', 0] },
                sortLikeCount: { $ifNull: ['$statsData.likeCount', 0] },
                sortWatchlistCount: { $ifNull: ['$statsData.watchlistCount', 0] },
                sortAverageRating: { $ifNull: ['$statsData.averageRating', 0] }
            }
        }
    ];

    // Apply metadata filters (after $lookup)
    const metadataFilters: any = {};

    // Enhanced search across multiple fields
    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        metadataFilters.$or = [
            // NFT Metadata
            { 'metadata.name': searchRegex },
            { 'metadata.description': searchRegex },

            // Contract Info
            { 'contract.name': searchRegex },
            { 'contract.symbol': searchRegex },

            // Insights
            { 'insights.customTitle': searchRegex },
            { 'insights.title': searchRegex },
            { 'insights.category': searchRegex },
            { 'insights.rarity': searchRegex },
            { 'insights.projectWebsite': searchRegex },
            { 'insights.projectTwitter': searchRegex },
            { 'insights.projectDiscord': searchRegex },

            // Tags (array search - use elemMatch instead of $in with $regex)
            { 'insights.tags': searchRegex },

            // Descriptions (array search - use elemMatch for arrays)
            { 'insights.descriptions': searchRegex },
            { 'insights.cardDescriptions': searchRegex },
            {
                'insights.projectDescriptions.titleDescriptionPairs': {
                    $elemMatch: {
                        $or: [
                            { title: searchRegex },
                            { descriptions: searchRegex }
                        ]
                    }
                }
            },
            {
                'insights.functionalitiesDescriptions.titleDescriptionPairs': {
                    $elemMatch: {
                        $or: [
                            { title: searchRegex },
                            { descriptions: searchRegex }
                        ]
                    }
                }
            },
            {
                'insights.specificDescriptions.titleDescriptionPairs': {
                    $elemMatch: {
                        $or: [
                            { title: searchRegex },
                            { descriptions: searchRegex }
                        ]
                    }
                }
            }
        ];
    }

    if (category && category.length > 0) metadataFilters['insights.category'] = { $in: category };
    if (rarity && rarity.length > 0) metadataFilters['insights.rarity'] = { $in: rarity };
    if (tags && tags.length > 0) metadataFilters['insights.tags'] = { $in: tags };

    if (Object.keys(metadataFilters).length > 0) {
        pipeline.push({ $match: metadataFilters });
    }

    // Apply stats filters
    const statsFilters: any = {};
    if (minRating) statsFilters['statsData.averageRating'] = { $gte: parseFloat(minRating) };
    if (minViews) statsFilters['statsData.viewCount'] = { $gte: parseInt(minViews) };
    if (minLikes) statsFilters['statsData.likeCount'] = { $gte: parseInt(minLikes) };
    if (minWatchlistCount) statsFilters['statsData.watchlistCount'] = { $gte: parseInt(minWatchlistCount) };

    if (Object.keys(statsFilters).length > 0) {
        pipeline.push({ $match: statsFilters });
    }

    // Build sort
    const sort: any = {};
    const sortField =
        sortBy === 'price' ? 'sortPrice' : // Use numeric sortPrice field for correct sorting
            sortBy === 'name' ? 'sortName' :
                sortBy === 'created' ? 'sortCreatedAt' :
                    sortBy === 'rating' ? 'sortAverageRating' :
                        sortBy === 'views' ? 'sortViewCount' :
                            sortBy === 'likes' ? 'sortLikeCount' :
                                sortBy === 'watchlistCount' ? 'sortWatchlistCount' :
                                    'sortPrice'; // Default to numeric price

    sort[sortField] = sortOrder === 'asc' ? 1 : -1;
    sort.listingId = 1; // Stable tie-breaker

    pipeline.push(
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
    );

    // Debug: Check BEFORE cleaning up temporary fields
    const itemsBeforeCleanup = await collection.aggregate(pipeline).toArray();
    if (itemsBeforeCleanup.length > 0) {
        const firstItem: any = itemsBeforeCleanup[0];
        console.log('\n🔍 [API Debug] BEFORE $project cleanup:');
        console.log('  - Has insightsData field?', 'insightsData' in firstItem);
        console.log('  - insightsData value:', firstItem.insightsData);
        console.log('  - Has insights field?', 'insights' in firstItem);
        console.log('  - insights value:', firstItem.insights);
        console.log('');
    }

    // Clean up temporary fields but keep everything else
    pipeline.push({
        $project: {
            nftData: 0,
            insightsData: 0,
            statsData: 0,
            sortName: 0,
            sortPrice: 0, // Remove temporary numeric price field
            sortCreatedAt: 0,
            sortViewCount: 0,
            sortLikeCount: 0,
            sortWatchlistCount: 0,
            sortAverageRating: 0
        }
    });

    const items = await collection.aggregate(pipeline).toArray();
    const total = await collection.countDocuments(query);

    // Debug: Count items with/without insights
    const withInsights = items.filter((item: any) => item.insights).length;
    const withoutInsights = items.filter((item: any) => !item.insights).length;
    console.log(`\n📊 [Marketplace API] Insights Stats:`);
    console.log(`  - Total items: ${items.length}`);
    console.log(`  - With insights: ${withInsights}`);
    console.log(`  - Without insights: ${withoutInsights}`);
    if (withoutInsights > 0 && withoutInsights <= 3) {
        const missing = items.filter((item: any) => !item.insights).map((item: any) => ({
            address: item.contractAddress,
            tokenId: item.tokenId,
            name: item.metadata?.name
        }));
        console.log(`  - Missing insights for:`, missing);
    }
    console.log('');

    // Debug: Log first item structure
    if (items.length > 0) {
        const firstItem: any = items[0];
        console.log('\n📋 [Marketplace API] First Item Structure:');
        console.log('Root Level Fields:');
        console.log('  - contractAddress:', firstItem.contractAddress);
        console.log('  - tokenId:', firstItem.tokenId);
        console.log('  - price:', firstItem.price);
        console.log('  - seller:', firstItem.seller);
        console.log('  - isListed:', firstItem.isListed);
        console.log('  - listingId:', firstItem.listingId);
        console.log('\nEnriched Data:');
        console.log('  - metadata:', !!firstItem.metadata, firstItem.metadata ? `(name: ${firstItem.metadata.name})` : '');
        console.log('  - contract:', !!firstItem.contract, firstItem.contract ? `(name: ${firstItem.contract.name})` : '');
        console.log('  - insights:', !!firstItem.insights, firstItem.insights ? `(category: ${firstItem.insights.category}, rarity: ${firstItem.insights.rarity})` : '');
        // Stats removed - loaded via StatsContext
        console.log('  - marketplace (nested):', !!firstItem.marketplace);
        console.log('');
    }

    // Get filter options (available categories, rarities, price range)
    // Use admin_nft_insights collection for insights-based filters
    const insightsCollection = db.collection('admin_nft_insights');
    const [categories, rarities, priceStats] = await Promise.all([
        insightsCollection.distinct('category'),
        insightsCollection.distinct('rarity'),
        collection.aggregate([
            { $match: { isListed: true, price: { $ne: null } } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]).toArray()
    ]);

    const response: MarketplaceItemsResponse = {
        success: true,
        data: {
            items: items as any[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            },
            filters: {
                appliedFilters: {
                    search,
                    contractAddress,
                    minPrice,
                    maxPrice,
                    seller,
                    isListed,
                    category,
                    rarity,
                    tags,
                    minRating,
                    minViews,
                    minLikes,
                    minWatchlistCount,
                    sortBy,
                    sortOrder
                },
                availableCategories: categories.filter(Boolean),
                availableRarities: rarities.filter(Boolean),
                priceRange: {
                    min: priceStats[0]?.minPrice || '0',
                    max: priceStats[0]?.maxPrice || '0'
                }
            }
        },
        timestamp: Date.now(),
        cached: false
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Marketplace query completed in ${duration}ms (${total} total, ${items.length} returned)`);

    return NextResponse.json(response);
});

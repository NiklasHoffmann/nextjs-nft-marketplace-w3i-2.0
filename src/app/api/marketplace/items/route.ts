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
 * - tokenStandard: ERC721|ERC1155 (comma-separated)
 * - rarity: string
 * - tags: string (comma-separated)
 * - minRating: number
 * - minViews: number
 * - minLikes: number
 * - minWatchlistCount: number
 * - sortBy: price|rating|views|likes|watchlistCount|name|created
 * - sortOrder: asc|desc
 */

import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getSharedCacheValue, setSharedCacheValue } from '@/lib/redis/shared-cache';
import { apiHandler, apiSuccess } from '@/lib/api';
import type { MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';
import { devLog } from '@/utils';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const FILTER_OPTIONS_TTL_MS = 30_000;
const FILTER_OPTIONS_TTL_SECONDS = Math.ceil(FILTER_OPTIONS_TTL_MS / 1000);
const FILTER_OPTIONS_CACHE_KEY = 'marketplace:items:filter-options:v1';

interface FilterOptionsCacheEntry {
    categories: string[];
    rarities: string[];
    priceMin: string;
    priceMax: string;
    expiresAt: number;
}

let filterOptionsCache: FilterOptionsCacheEntry | null = null;

async function getMarketplaceFilterOptionsCached(db: Awaited<ReturnType<typeof getDatabase>>) {
    const now = Date.now();
    if (filterOptionsCache && filterOptionsCache.expiresAt > now) {
        return filterOptionsCache;
    }

    const sharedCachedOptions = await getSharedCacheValue<Omit<FilterOptionsCacheEntry, 'expiresAt'>>(FILTER_OPTIONS_CACHE_KEY);
    if (sharedCachedOptions) {
        filterOptionsCache = {
            ...sharedCachedOptions,
            expiresAt: now + FILTER_OPTIONS_TTL_MS,
        };
        return filterOptionsCache;
    }

    const collection = db.collection('marketplace_items');
    const insightsCollection = db.collection('admin_nft_insights');

    const [resolvedCategories, resolvedRarities, priceStats] = await Promise.all([
        insightsCollection.distinct('category'),
        insightsCollection.distinct('rarity'),
        collection.aggregate([
            { $match: { isListed: true, price: { $ne: null } } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: { $toDecimal: { $ifNull: ['$price', '0'] } } },
                    maxPrice: { $max: { $toDecimal: { $ifNull: ['$price', '0'] } } }
                }
            }
        ]).toArray()
    ]);

    filterOptionsCache = {
        categories: (resolvedCategories ?? []).filter(Boolean),
        rarities: (resolvedRarities ?? []).filter(Boolean),
        priceMin: priceStats[0]?.minPrice ? priceStats[0].minPrice.toString() : '0',
        priceMax: priceStats[0]?.maxPrice ? priceStats[0].maxPrice.toString() : '0',
        expiresAt: now + FILTER_OPTIONS_TTL_MS,
    };

    await setSharedCacheValue(FILTER_OPTIONS_CACHE_KEY, {
        categories: filterOptionsCache.categories,
        rarities: filterOptionsCache.rarities,
        priceMin: filterOptionsCache.priceMin,
        priceMax: filterOptionsCache.priceMax,
    }, FILTER_OPTIONS_TTL_SECONDS);

    return filterOptionsCache;
}

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
    const rawSearch = searchParams.get('search')?.trim();
    const search = rawSearch ? rawSearch.slice(0, 120) : null;
    const contractAddress = searchParams.get('contractAddress');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const seller = searchParams.get('seller');
    const isListed = searchParams.get('isListed');
    const category = searchParams.get('category')?.split(',').filter(Boolean);
    const tokenStandard = searchParams
        .get('tokenStandard')
        ?.split(',')
        .map(value => value.trim().toUpperCase())
        .filter((value): value is 'ERC721' | 'ERC1155' => value === 'ERC721' || value === 'ERC1155');
    const rarity = searchParams.get('rarity')?.split(',').filter(Boolean);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const minRating = searchParams.get('minRating');
    const minViews = searchParams.get('minViews');
    const minLikes = searchParams.get('minLikes');
    const minWatchlistCount = searchParams.get('minWatchlistCount');
    const includeFilters = searchParams.get('includeFilters') !== 'false';

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
        const exactAddressRegex = { $regex: `^${escapeRegex(contractAddress)}$`, $options: 'i' };
        query.$or = [
            { contractAddress: exactAddressRegex },
            { nftAddress: exactAddressRegex },
            { tokenAddress: exactAddressRegex }
        ];
    }
    if (seller) query.seller = seller;
    if (tokenStandard && tokenStandard.length > 0) query.tokenStandard = { $in: tokenStandard };

    // Note: Price filters are applied later in the pipeline using $expr
    // because price is stored as string but needs numeric comparison

    // Get database and collections
    const db = await getDatabase();
    const collection = db.collection('marketplace_items');
    const metadataCollection = db.collection('nft_metadata');

    // Build aggregation pipeline
    const pipeline: any[] = [
        { $match: query },

        // Normalize legacy address fields for downstream lookups
        {
            $addFields: {
                resolvedContractAddress: {
                    $ifNull: ['$contractAddress', { $ifNull: ['$nftAddress', '$tokenAddress'] }]
                },
                resolvedTokenId: { $toString: '$tokenId' }
            }
        },

        // Price filters using string comparison (price stored as string Wei)
        ...(minPrice ? [{
            $match: {
                $expr: {
                    $gte: [
                        { $toDecimal: { $ifNull: ['$price', '0'] } },
                        { $toDecimal: (parseFloat(minPrice) * 1e18).toString() }
                    ]
                }
            }
        }] : []),
        ...(maxPrice ? [{
            $match: {
                $expr: {
                    $lte: [
                        { $toDecimal: { $ifNull: ['$price', '0'] } },
                        { $toDecimal: (parseFloat(maxPrice) * 1e18).toString() }
                    ]
                }
            }
        }] : []),

        // JOIN with nft_metadata collection (get NFT data)
        {
            $lookup: {
                from: 'nft_metadata',
                let: {
                    contractAddr: '$resolvedContractAddress',
                    tokId: '$resolvedTokenId' // CRITICAL: Convert number to string for match
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

        // DEBUG: Add debug info about nftData lookup
        {
            $addFields: {
                _debug_lookupKeys: {
                    contractAddr: '$contractAddress',
                    tokenId: '$tokenId',
                    nftDataFound: { $size: { $ifNull: ['$nftData', []] } }
                }
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
                    contractAddr: '$resolvedContractAddress',
                    tokId: '$resolvedTokenId'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    // Must match contractAddress
                                    {
                                        $eq: [
                                            { $toLower: '$contractAddress' },
                                            { $toLower: '$$contractAddr' }
                                        ]
                                    },
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
                    contractAddr: '$resolvedContractAddress',
                    tokId: '$resolvedTokenId'
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
                contractAddress: '$resolvedContractAddress',
                // CRITICAL: Convert price to STRING (MongoDB may store as BSON Long)
                price: { $toString: { $ifNull: ['$price', '0'] } },
                seller: '$seller',
                isListed: '$isListed',
                listedAt: '$listedAt',
                listingId: '$listingId',
                buyer: '$buyer',
                desiredContractAddress: '$desiredContractAddress',
                desiredTokenId: '$desiredTokenId',
                currency: { $ifNull: ['$currency', '0x0000000000000000000000000000000000000000'] },

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

                    // Pricing (v1 & v2) - Convert to STRING
                    price: { $toString: { $ifNull: ['$price', '0'] } },
                    priceTotal: { $toString: { $ifNull: ['$priceTotal', '0'] } },
                    unitPrice: { $toString: { $ifNull: ['$unitPrice', '0'] } },
                    currency: { $ifNull: ['$currency', '0x0000000000000000000000000000000000000000'] },

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
                sortPrice: {
                    $let: {
                        vars: {
                            tokenStandard: { $ifNull: ['$tokenStandard', null] },
                            totalPriceDecimal: {
                                $convert: {
                                    input: { $ifNull: ['$price', '0'] },
                                    to: 'decimal',
                                    onError: { $toDecimal: '0' },
                                    onNull: { $toDecimal: '0' }
                                }
                            },
                            unitPriceDecimal: {
                                $convert: {
                                    input: '$unitPrice',
                                    to: 'decimal',
                                    onError: null,
                                    onNull: null
                                }
                            },
                            quantityDecimal: {
                                $convert: {
                                    input: '$erc1155QuantityListed',
                                    to: 'decimal',
                                    onError: { $toDecimal: '0' },
                                    onNull: { $toDecimal: '0' }
                                }
                            }
                        },
                        in: {
                            $cond: [
                                { $eq: ['$$tokenStandard', 'ERC1155'] },
                                {
                                    $ifNull: [
                                        '$$unitPriceDecimal',
                                        {
                                            $cond: [
                                                { $gt: ['$$quantityDecimal', { $toDecimal: '0' }] },
                                                { $divide: ['$$totalPriceDecimal', '$$quantityDecimal'] },
                                                '$$totalPriceDecimal'
                                            ]
                                        }
                                    ]
                                },
                                '$$totalPriceDecimal'
                            ]
                        }
                    }
                }, // Effective sort price: ERC1155 by unit price, others by total price
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
        const searchRegex = { $regex: escapeRegex(search), $options: 'i' };
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

            // Tags and short card descriptions
            { 'insights.tags': searchRegex },
            { 'insights.cardDescriptions': searchRegex },

            // Listing identifiers
            { contractAddress: searchRegex },
            { resolvedContractAddress: searchRegex },
            { tokenId: searchRegex }
        ];
    }

    // Category filter - case-insensitive match with special character escaping
    if (category && category.length > 0) {
        devLog.info('🏷️ [API] Category filter requested:', category);
        // Escape special regex characters and create regex for each category to match case-insensitively
        const categoryRegexes = category.map(cat => {
            // Escape special regex characters (including spaces)
            const escapedCat = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`^${escapedCat}$`, 'i');
        });
        metadataFilters['insights.category'] = { $in: categoryRegexes };
        devLog.info('🏷️ [API] Category filter applied:', {
            input: category,
            regexes: categoryRegexes.map(r => r.source)
        });
    }

    // Rarity filter - case-insensitive match
    if (rarity && rarity.length > 0) {
        // Create regex for each rarity to match case-insensitively
        const rarityRegexes = rarity.map(r => new RegExp(`^${r}$`, 'i'));
        metadataFilters['insights.rarity'] = { $in: rarityRegexes };
    }

    // Tags filter - strict match (no fallback for missing tags)
    if (tags && tags.length > 0) {
        metadataFilters['insights.tags'] = { $in: tags };
    }

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

    const isDebugMode = process.env.NODE_ENV === 'development';

    // Debug-only snapshot BEFORE cleaning up temporary fields
    if (isDebugMode) {
        const itemsBeforeCleanup = await collection.aggregate(pipeline).toArray();
        if (itemsBeforeCleanup.length > 0) {
            const firstItem: any = itemsBeforeCleanup[0];
            devLog.debug('\n🔍 [API Debug] BEFORE $project cleanup:');
            devLog.debug('  - contractAddress:', firstItem.contractAddress);
            devLog.debug('  - tokenId:', firstItem.tokenId);
            devLog.debug('  - Debug lookup keys:', firstItem._debug_lookupKeys);
            devLog.debug('  - nftData array length:', firstItem.nftData?.length || 0);
            if (firstItem.nftData?.[0]) {
                devLog.debug('  - nftData[0] exists with metadata?', !!firstItem.nftData[0].metadata);
            }
            devLog.debug('  - Has insightsData field?', 'insightsData' in firstItem);
            devLog.debug('  - insightsData value:', firstItem.insightsData);
            devLog.debug('  - Has insights field?', 'insights' in firstItem);
            devLog.debug('  - insights value:', firstItem.insights);
            devLog.debug('');
        }
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
            sortAverageRating: 0,
            _debug_lookupKeys: 0 // Remove debug field
        }
    });

    const items = await collection.aggregate(pipeline).toArray();
    const total = await collection.countDocuments(query);

    // Debug: Count items with/without insights
    const withInsights = items.filter((item: any) => item.insights).length;
    const withoutInsights = items.filter((item: any) => !item.insights).length;
    devLog.debug(`\n📊 [Marketplace API] Insights Stats:`);
    devLog.debug(`  - Total items: ${items.length}`);
    devLog.debug(`  - With insights: ${withInsights}`);
    devLog.debug(`  - Without insights: ${withoutInsights}`);
    if (withoutInsights > 0 && withoutInsights <= 3) {
        const missing = items.filter((item: any) => !item.insights).map((item: any) => ({
            address: item.contractAddress,
            tokenId: item.tokenId,
            name: item.metadata?.name
        }));
        devLog.debug(`  - Missing insights for:`, missing);
    }
    devLog.debug('');

    // Debug: Log first item structure
    if (items.length > 0) {
        const firstItem: any = items[0];
        devLog.debug('\n📋 [Marketplace API] First Item Structure:');
        devLog.debug('Root Level Fields:');
        devLog.debug('  - contractAddress:', firstItem.contractAddress);
        devLog.debug('  - tokenId:', firstItem.tokenId);
        devLog.debug('  - price:', firstItem.price);
        devLog.debug('  - seller:', firstItem.seller);
        devLog.debug('  - isListed:', firstItem.isListed);
        devLog.debug('  - listingId:', firstItem.listingId);
        devLog.debug('\nEnriched Data:');
        devLog.debug('  - metadata:', !!firstItem.metadata, firstItem.metadata ? `(name: ${firstItem.metadata.name})` : '');
        devLog.debug('  - contract:', !!firstItem.contract, firstItem.contract ? `(name: ${firstItem.contract.name})` : '');
        devLog.debug('  - insights:', !!firstItem.insights, firstItem.insights ? `(category: ${firstItem.insights.category}, rarity: ${firstItem.insights.rarity})` : '');
        // Stats removed - loaded via StatsContext
        devLog.debug('  - marketplace (nested):', !!firstItem.marketplace);
        devLog.debug('');
    }

    // Debug: Log all unique categories in result set (if category filter was used)
    if (category && category.length > 0) {
        const uniqueCategories = new Set(items.map((item: any) => item.insights?.category).filter(Boolean));
        devLog.debug('🏷️ [API] Unique categories in filtered results:', Array.from(uniqueCategories));
    }

    // Get filter options (available categories, rarities, price range) only when requested
    let categories: any[] = [];
    let rarities: any[] = [];
    let priceMin = '0';
    let priceMax = '0';

    if (includeFilters) {
        const filterOptions = await getMarketplaceFilterOptionsCached(db);
        categories = filterOptions.categories;
        rarities = filterOptions.rarities;
        priceMin = filterOptions.priceMin;
        priceMax = filterOptions.priceMax;

        // Debug: Log all available categories from insights
        devLog.debug('🏷️ [API] Available categories in admin_nft_insights:', categories);
    }

    const response: MarketplaceItemsResponse['data'] = {
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
                min: priceMin,
                max: priceMax
            }
        },
        timestamp: Date.now(),
        cached: false
    };

    const duration = Date.now() - startTime;
    devLog.info(`✅ Marketplace query completed in ${duration}ms (${total} total, ${items.length} returned)`);

    const apiResponse = apiSuccess(response);
    apiResponse.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return apiResponse;
});

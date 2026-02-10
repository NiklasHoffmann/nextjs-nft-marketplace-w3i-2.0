/**
 * User NFTs API
 * 
 * GET: Retrieve all NFTs owned by a wallet (from cached nft_metadata)
 * Fast endpoint - no external API calls, reads from MongoDB only
 */

import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { withAuth } from '@/lib/middleware';
import {
    apiSuccess,
    apiBadRequest,
    apiInternalError,
    rateLimit,
    RATE_LIMIT_CONFIG,
    getQueryParam,
    isValidAddress,
    BadRequestError
} from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import type { EnrichedNFTMetadata } from '@/types';

/**
 * GET /api/user/nfts
 * 
 * Retrieve all NFTs owned by wallet from database (instant load)
 * Query params: walletAddress (required), plus filters (same as /api/marketplace/items)
 */
export const GET = apiHandler(async (request: NextRequest) => {
    await withAuth(request);
    // @ts-ignore
    const authenticatedUser = request.userAddress as string;

    await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

    const walletAddress = getQueryParam(request, 'walletAddress', true);

    if (!isValidAddress(walletAddress)) {
        throw new BadRequestError('Invalid wallet address format');
    }

    const lowerWalletAddress = walletAddress.toLowerCase();

    // Parse filter parameters (same as marketplace)
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category')?.split(',').filter(Boolean);
    const rarity = searchParams.get('rarity')?.split(',').filter(Boolean);
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const minViews = searchParams.get('minViews');
    const minLikes = searchParams.get('minLikes');
    const minWatchlistCount = searchParams.get('minWatchlistCount');
    const isListed = searchParams.get('isListed');

    // Parse sorting (same as marketplace)
    const sortBy = searchParams.get('sortBy') || 'lastVerified';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`📋 [User NFTs] Loading NFTs for wallet: ${lowerWalletAddress}`);
    console.log(`🔍 [User NFTs] Filters:`, {
        search, category, rarity, minPrice, maxPrice,
        minRating, minViews, minLikes, minWatchlistCount, isListed
    });
    console.log(`📊 [User NFTs] Sort:`, { sortBy, sortOrder });

    // Query nft_metadata with enrichment
    const nftMetadataCollection = await getCollection('nft_metadata');

    // Build match query for wallet + basic filters
    const matchQuery: any = {
        currentOwner: lowerWalletAddress
    };

    // Apply filters (same logic as marketplace)
    if (category && category.length > 0) {
        matchQuery['insights.category'] = { $in: category };
    }
    if (rarity && rarity.length > 0) {
        matchQuery['insights.rarity'] = { $in: rarity };
    }

    const pipeline = [
        // Match NFTs owned by wallet + basic filters
        {
            $match: matchQuery
        },
        // Join with marketplace_items to check listing status
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
                                    { $eq: ['$isListed', true] }  // Check isListed instead of status
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            listingId: 1,
                            price: 1,
                            seller: 1,
                            listedAt: 1,
                            currency: 1,
                            listingType: 1
                        }
                    }
                ],
                as: 'listings'
            }
        },
        // JOIN with admin_nft_insights collection
        // Note: Insights can be collection-wide (contractAddress only) OR item-specific (contractAddress + tokenId)
        {
            $lookup: {
                from: 'admin_nft_insights',
                let: { contractAddr: '$contractAddress', tokId: { $toString: '$tokenId' } },
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
        {
            $unwind: {
                path: '$insightsData',
                preserveNullAndEmptyArrays: true
            }
        },
        // Lookup stats from nft_stats collection
        {
            $lookup: {
                from: 'nft_stats',
                let: {
                    nftAddr: { $toLower: '$contractAddress' },
                    tokId: '$tokenId'
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: [{ $toLower: '$nftAddress' }, '$$nftAddr'] },
                                    { $eq: ['$tokenId', '$$tokId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'statsData'
            }
        },
        {
            $unwind: {
                path: '$statsData',
                preserveNullAndEmptyArrays: true
            }
        },
        // Add computed fields
        {
            $addFields: {
                isListed: { $gt: [{ $size: '$listings' }, 0] },
                insights: '$insightsData',
                stats: '$statsData',
                // Flatten first listing data to top level for easier access
                listingId: { $arrayElemAt: ['$listings.listingId', 0] },
                price: { $arrayElemAt: ['$listings.price', 0] },
                seller: { $arrayElemAt: ['$listings.seller', 0] },
                currency: { $arrayElemAt: ['$listings.currency', 0] },
                listingType: { $arrayElemAt: ['$listings.listingType', 0] }
            }
        },
        // Apply filters that need computed fields
        ...(minPrice || maxPrice || minRating || minViews || minLikes || minWatchlistCount || isListed !== null || search ? [{
            $match: {
                ...(search ? {
                    $or: [
                        { 'metadata.name': { $regex: search, $options: 'i' } },
                        { 'metadata.description': { $regex: search, $options: 'i' } },
                        { contractAddress: { $regex: search, $options: 'i' } }
                    ]
                } : {}),
                $expr: {
                    $and: [
                        // Price filters (from listings)
                        ...(minPrice ? [{
                            $gte: [
                                { $toDouble: { $arrayElemAt: ['$listings.price', 0] } },
                                parseFloat(minPrice)
                            ]
                        }] : []),
                        ...(maxPrice ? [{
                            $lte: [
                                { $toDouble: { $arrayElemAt: ['$listings.price', 0] } },
                                parseFloat(maxPrice)
                            ]
                        }] : []),
                        // Stats filters - use $stats (mapped from $statsData)
                        ...(minRating ? [{
                            $gte: [{ $ifNull: ['$stats.averageRating', 0] }, parseFloat(minRating)]
                        }] : []),
                        ...(minViews ? [{
                            $gte: [{ $ifNull: ['$stats.viewCount', 0] }, parseInt(minViews)]
                        }] : []),
                        ...(minLikes ? [{
                            $gte: [{ $ifNull: ['$stats.likeCount', 0] }, parseInt(minLikes)]
                        }] : []),
                        ...(minWatchlistCount ? [{
                            $gte: [{ $ifNull: ['$stats.watchlistCount', 0] }, parseInt(minWatchlistCount)]
                        }] : []),
                        // Listing status filter
                        ...(isListed !== null ? [{
                            $eq: ['$isListed', isListed === 'true']
                        }] : [])
                    ].filter(f => Object.keys(f).length > 0)
                }
            }
        }] : []),
        // Apply sorting (use $stats which is mapped from $statsData)
        {
            $sort: (() => {
                const sortField: any = {};

                switch (sortBy) {
                    case 'price':
                        sortField['listings.0.price'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'rating':
                        sortField['stats.averageRating'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'views':
                        sortField['stats.viewCount'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'likes':
                        sortField['stats.likeCount'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'watchlistCount':
                        sortField['stats.watchlistCount'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'name':
                        sortField['metadata.name'] = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'created':
                        sortField.createdAt = sortOrder === 'asc' ? 1 : -1;
                        break;
                    default:
                        sortField.lastVerified = -1;
                }

                return sortField;
            })()
        },
        // Clean up
        {
            $project: {
                insightsData: 0,
                statsData: 0
            }
        }
    ];

    const nfts = await nftMetadataCollection.aggregate(pipeline).toArray();

    console.log(`✅ [User NFTs] Found ${nfts.length} NFTs`);

    // DEBUG: Log first listed NFT to check currency/listingType
    const firstListed = nfts.find((n: any) => n.isListed);
    if (firstListed) {
        console.log('🔍 [API /user/nfts] First listed NFT from MongoDB:', {
            tokenId: firstListed.tokenId,
            price: firstListed.price,
            currency: firstListed.currency,
            listingType: firstListed.listingType,
            listingsArray: firstListed.listings
        });
    }

    // Calculate stats
    const listed = nfts.filter((nft: any) => nft.isListed).length;
    const unlisted = nfts.length - listed;

    return apiSuccess({
        nfts: nfts as EnrichedNFTMetadata[],
        total: nfts.length,
        listed,
        unlisted,
        source: 'database',
        cached: true
    });
});

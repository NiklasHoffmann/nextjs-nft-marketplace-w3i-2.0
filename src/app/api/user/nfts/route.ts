/**
 * User NFTs API
 * 
 * GET: Retrieve all NFTs owned by a wallet (from cached nft_metadata)
 * Fast endpoint - no external API calls, reads from MongoDB only
 */

import { NextRequest } from 'next/server';
import {
    apiHandler,
    apiSuccess,
    getQueryParam,
    isValidAddress,
    BadRequestError,
    ForbiddenError
} from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import type { EnrichedNFTMetadata } from '@/types';
import { devLog } from '@/utils';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/user/nfts
 * 
 * Retrieve all NFTs owned by wallet from database (instant load)
 * Query params: walletAddress (required), plus filters (same as /api/marketplace/items)
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const authenticatedUser = request.userAddress as string;

    const walletAddress = getQueryParam(request, 'walletAddress', true);

    if (!isValidAddress(walletAddress)) {
        throw new BadRequestError('Invalid wallet address format');
    }

    const lowerWalletAddress = walletAddress.toLowerCase();
    const lowerAuthenticatedUser = authenticatedUser.toLowerCase();

    if (lowerWalletAddress !== lowerAuthenticatedUser) {
        throw new ForbiddenError('Wallet address does not match authenticated user');
    }

    // Parse filter parameters (same as marketplace)
    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get('search')?.trim();
    const search = rawSearch ? rawSearch.slice(0, 120) : null;
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

    devLog.debug(`📋 [User NFTs] Loading NFTs for wallet: ${lowerWalletAddress}`);
    devLog.debug(`🔍 [User NFTs] Filters:`, {
        search, category, rarity, minPrice, maxPrice,
        minRating, minViews, minLikes, minWatchlistCount, isListed
    });
    devLog.debug(`📊 [User NFTs] Sort:`, { sortBy, sortOrder });

    // Query nft_metadata with enrichment
    const nftMetadataCollection = await getCollection('nft_metadata');

    // Build match query for wallet + basic filters
    const matchQuery: any = {
        $or: [
            { currentOwner: lowerWalletAddress },
            { 'blockchain.owner': lowerWalletAddress },
            { [`ownershipBalances.${lowerWalletAddress}`]: { $gt: 0 } }
        ]
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
                            listingType: 1,
                            tokenStandard: 1,
                            status: 1,
                            erc1155QuantityListed: 1,
                            remainingQuantity: 1,
                            unitPrice: 1,
                            partialBuyEnabled: 1
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
                listingType: { $arrayElemAt: ['$listings.listingType', 0] },
                desiredContractAddress: {
                    $ifNull: [
                        { $arrayElemAt: ['$listings.desiredContractAddress', 0] },
                        { $arrayElemAt: ['$listings.desiredTokenAddress', 0] }
                    ]
                },
                desiredTokenAddress: {
                    $ifNull: [
                        { $arrayElemAt: ['$listings.desiredTokenAddress', 0] },
                        { $arrayElemAt: ['$listings.desiredContractAddress', 0] }
                    ]
                },
                desiredTokenId: { $arrayElemAt: ['$listings.desiredTokenId', 0] },
                listingStatus: { $arrayElemAt: ['$listings.status', 0] },
                listingTokenStandard: { $arrayElemAt: ['$listings.tokenStandard', 0] },
                erc1155QuantityListed: { $arrayElemAt: ['$listings.erc1155QuantityListed', 0] },
                remainingQuantity: { $arrayElemAt: ['$listings.remainingQuantity', 0] },
                unitPrice: { $arrayElemAt: ['$listings.unitPrice', 0] },
                partialBuyEnabled: { $arrayElemAt: ['$listings.partialBuyEnabled', 0] },
                sortPriceEffective: {
                    $let: {
                        vars: {
                            tokenStandard: { $arrayElemAt: ['$listings.tokenStandard', 0] },
                            totalPriceDecimal: {
                                $convert: {
                                    input: { $ifNull: [{ $arrayElemAt: ['$listings.price', 0] }, '0'] },
                                    to: 'decimal',
                                    onError: { $toDecimal: '0' },
                                    onNull: { $toDecimal: '0' }
                                }
                            },
                            unitPriceDecimal: {
                                $convert: {
                                    input: { $arrayElemAt: ['$listings.unitPrice', 0] },
                                    to: 'decimal',
                                    onError: null,
                                    onNull: null
                                }
                            }
                        },
                        in: {
                            $cond: [
                                { $eq: ['$$tokenStandard', 'ERC1155'] },
                                { $ifNull: ['$$unitPriceDecimal', '$$totalPriceDecimal'] },
                                '$$totalPriceDecimal'
                            ]
                        }
                    }
                }
            }
        },
        // Apply filters that need computed fields
        ...(minPrice || maxPrice || minRating || minViews || minLikes || minWatchlistCount || isListed !== null || search ? [{
            $match: {
                ...(search ? {
                    $and: [{
                    $or: [
                        { 'metadata.name': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'metadata.description': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'contract.name': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'contract.symbol': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'insights.customTitle': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'insights.category': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'insights.rarity': { $regex: escapeRegex(search), $options: 'i' } },
                        { 'insights.tags': { $regex: escapeRegex(search), $options: 'i' } },
                        { tokenId: { $regex: escapeRegex(search), $options: 'i' } },
                        { contractAddress: { $regex: escapeRegex(search), $options: 'i' } }
                    ]
                    }]
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
                        sortField.sortPriceEffective = sortOrder === 'asc' ? 1 : -1;
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
                statsData: 0,
                sortPriceEffective: 0
            }
        }
    ];

    const nfts = await nftMetadataCollection.aggregate(pipeline).toArray();

    devLog.debug(`✅ [User NFTs] Found ${nfts.length} NFTs`);

    // DEBUG: Log first listed NFT to check currency/listingType
    const firstListed = nfts.find((n: any) => n.isListed);
    if (firstListed) {
        devLog.debug('🔍 [API /user/nfts] First listed NFT from MongoDB:', {
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
}, { auth: true });

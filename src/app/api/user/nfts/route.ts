/**
 * User NFTs API
 * 
 * GET: Retrieve all NFTs owned by a wallet (from cached nft_metadata)
 * Fast endpoint - no external API calls, reads from MongoDB only
 */

import { NextRequest } from 'next/server';
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
import type { EnrichedNFTMetadata } from '@/types/nft-metadata';

/**
 * GET /api/user/nfts
 * 
 * Retrieve all NFTs owned by wallet from database (instant load)
 * Query params: walletAddress (required)
 */
export async function GET(request: NextRequest) {
    try {
        await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

        const walletAddress = getQueryParam(request, 'walletAddress', true);

        if (!isValidAddress(walletAddress)) {
            throw new BadRequestError('Invalid wallet address format');
        }

        const lowerWalletAddress = walletAddress.toLowerCase();

        console.log(`📋 [User NFTs] Loading NFTs for wallet: ${lowerWalletAddress}`);

        // Query nft_metadata with enrichment
        const nftMetadataCollection = await getCollection('nft_metadata');

        const pipeline = [
            // Match NFTs owned by wallet
            {
                $match: {
                    currentOwner: lowerWalletAddress
                }
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
                                listedAt: 1
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
            // Skip stats lookup - stats are handled by StatsContext for real-time updates
            // Add computed fields
            {
                $addFields: {
                    isListed: { $gt: [{ $size: '$listings' }, 0] },
                    insights: '$insightsData'
                    // Stats removed - loaded via StatsContext
                }
            },
            // Clean up
            {
                $project: {
                    insightsData: 0
                }
            },
            // Sort by most recently verified
            {
                $sort: {
                    lastVerified: -1
                }
            }
        ];

        const nfts = await nftMetadataCollection.aggregate(pipeline).toArray();

        console.log(`✅ [User NFTs] Found ${nfts.length} NFTs`);



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

    } catch (error) {
        console.error('❌ [User NFTs] Error fetching user NFTs:', error);

        if (error instanceof BadRequestError) {
            return apiBadRequest(error.message);
        }

        return apiInternalError('Failed to fetch user NFTs');
    }
}

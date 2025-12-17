/**
 * GET /api/marketplace/nft/[contractAddress]/[tokenId]
 * 
 * Fetches complete NFT data with new architecture:
 * - marketplace_items (listing data)
 * - $lookup nft_metadata (metadata + contract)
 * - $lookup admin_nft_insights (insights with collection-level fallback)
 * - Stats loaded via StatsContext (not included)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ contractAddress: string; tokenId: string }> }
) {
    try {
        const { contractAddress, tokenId } = await params;

        if (!contractAddress || !tokenId) {
            return NextResponse.json(
                { success: false, error: 'Missing contractAddress or tokenId' },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const collection = db.collection('marketplace_items');

        // Aggregation pipeline with triple $lookup
        const pipeline = [
            {
                $match: {
                    contractAddress: contractAddress.toLowerCase(),
                    // Support both string and number tokenId
                    $or: [
                        { tokenId: parseInt(tokenId) },
                        { tokenId: tokenId.toString() }
                    ],
                    listingId: { $ne: null, $exists: true }  // Must have valid listingId
                }
            },
            // JOIN with nft_metadata
            {
                $lookup: {
                    from: 'nft_metadata',
                    let: { contractAddr: '$contractAddress', tokId: '$tokenId' },
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
            {
                $unwind: {
                    path: '$nftData',
                    preserveNullAndEmptyArrays: true
                }
            },
            // JOIN with admin_nft_insights (item-specific OR collection-wide)
            {
                $lookup: {
                    from: 'admin_nft_insights',
                    let: { contractAddr: '$contractAddress', tokId: { $toString: '$tokenId' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$contractAddress', '$$contractAddr'] },
                                        {
                                            $or: [
                                                // Item-specific
                                                { $eq: ['$tokenId', '$$tokId'] },
                                                // Collection-wide
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
                        {
                            $addFields: {
                                isItemSpecific: { $cond: [{ $eq: ['$tokenId', '$$tokId'] }, 1, 0] }
                            }
                        },
                        {
                            $sort: { isItemSpecific: -1 }
                        },
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
            // Restructure
            {
                $addFields: {
                    metadata: '$nftData.metadata',
                    contract: '$nftData.contract',
                    insights: '$insightsData',
                    marketplace: {
                        listingId: '$listingId',
                        price: '$price',
                        seller: '$seller',
                        isListed: '$isListed',
                        listedAt: '$listedAt',
                        desiredContractAddress: '$desiredContractAddress',
                        desiredTokenId: '$desiredTokenId',
                        isValid: '$isValid',
                        invalidReasons: '$invalidReasons',
                        invalidatedAt: '$invalidatedAt'
                    }
                }
            },
            {
                $project: {
                    nftData: 0,
                    insightsData: 0
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        const nft = results[0];

        if (!nft) {
            return NextResponse.json(
                { success: false, error: 'NFT not found in marketplace' },
                { status: 404 }
            );
        }

        // Transform to API response format
        const response = {
            success: true,
            data: {
                contractAddress: nft.contractAddress,
                tokenId: nft.tokenId,
                listingId: nft.listingId,
                price: nft.price,
                seller: nft.seller,
                isListed: nft.isListed,

                metadata: {
                    name: nft.metadata?.name || `NFT #${nft.tokenId}`,
                    description: nft.metadata?.description || null,
                    image: nft.metadata?.image || null,
                    animationUrl: nft.metadata?.animationUrl || null,
                    externalUrl: nft.metadata?.externalUrl || null,
                    attributes: nft.metadata?.attributes || [],
                },

                contract: {
                    contractName: nft.contract?.name || null,
                    contractSymbol: nft.contract?.symbol || null,
                    totalSupply: nft.contract?.totalSupply || null,
                    tokenURI: nft.contract?.tokenURI || null,
                    contractType: nft.contract?.contractType || 'ERC721',
                    owner: nft.contract?.owner || null,
                    ownerBalance: nft.contract?.ownerBalance || null,
                    approved: nft.contract?.approved || nft.contract?.approvedAddress || null, // ✅ ERC-721 approval status
                    approvedAddress: nft.contract?.approved || nft.contract?.approvedAddress || null, // ✅ For backward compatibility
                },

                marketplace: {
                    isListed: nft.isListed,
                    price: nft.price,
                    seller: nft.seller,
                    listingId: nft.listingId,
                    listedAt: nft.listedAt,
                    desiredContractAddress: nft.desiredContractAddress || null,
                    desiredTokenId: nft.desiredTokenId || null,
                    isValid: nft.isValid ?? true,
                    invalidReasons: nft.invalidReasons || null,
                    invalidatedAt: nft.invalidatedAt || null,
                },

                insights: nft.insights ? {
                    customTitle: nft.insights.customTitle || null,
                    category: nft.insights.category || null,
                    tags: nft.insights.tags || [],
                    rarity: nft.insights.rarity || null,
                    cardDescriptions: nft.insights.cardDescriptions || [],
                    projectDescriptions: nft.insights.projectDescriptions || null,
                    functionalitiesDescriptions: nft.insights.functionalitiesDescriptions || null,
                    projectWebsite: nft.insights.projectWebsite || null,
                    projectTwitter: nft.insights.projectTwitter || null,
                    projectDiscord: nft.insights.projectDiscord || null,
                    partnerships: nft.insights.partnerships || [],
                } : null,

                // Data quality flags
                dataQuality: {
                    hasMetadata: !!nft.metadata,
                    hasInsights: !!nft.insights,
                    metadataSource: nft.metadata ? 'blockchain' : 'none',
                },
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching NFT detail:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
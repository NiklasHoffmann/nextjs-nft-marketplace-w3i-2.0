/**
 * NFT Metadata Database Utilities
 * 
 * Helper functions for interacting with the nft_metadata collection.
 * Provides typed access and common query patterns.
 */

import { getCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';
import type { NFTMetadata, EnrichedNFTMetadata } from '@/types';
import type { Document } from 'mongodb';

/**
 * Get nft_metadata collection with proper typing
 */
export async function getNFTMetadataCollection() {
    return getCollection('nft_metadata');
}

/**
 * Find or create NFT metadata document
 */
export async function upsertNFTMetadata(
    contractAddress: string,
    tokenId: string,
    updates: Partial<NFTMetadata>
): Promise<NFTMetadata> {
    const collection = await getNFTMetadataCollection();
    const now = new Date().toISOString();

    const result = await collection.findOneAndUpdate(
        {
            contractAddress: contractAddress.toLowerCase(),
            tokenId: tokenId
        },
        {
            $set: {
                ...updates,
                updatedAt: now
            },
            $setOnInsert: {
                contractAddress: contractAddress.toLowerCase(),
                tokenId: tokenId,
                firstSeen: now,
                createdAt: now
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    return result as unknown as NFTMetadata;
}

/**
 * Get NFT metadata by address + tokenId
 */
export async function getNFTMetadata(
    contractAddress: string,
    tokenId: string
): Promise<NFTMetadata | null> {
    const collection = await getNFTMetadataCollection();

    const result = await collection.findOne({
        contractAddress: contractAddress.toLowerCase(),
        tokenId: tokenId
    });

    return result as unknown as NFTMetadata | null;
}

/**
 * Get all NFTs owned by a wallet address
 */
export async function getNFTsByOwner(
    ownerAddress: string
): Promise<NFTMetadata[]> {
    const collection = await getNFTMetadataCollection();

    const results = await collection.find({
        currentOwner: ownerAddress.toLowerCase()
    }).toArray();

    return results as unknown as NFTMetadata[];
}

/**
 * Update NFT ownership (with history tracking)
 */
export async function updateNFTOwnership(
    contractAddress: string,
    tokenId: string,
    newOwner: string,
    source: 'mint' | 'transfer' | 'purchase' | 'unknown' = 'unknown'
): Promise<void> {
    const collection = await getNFTMetadataCollection();
    const now = new Date();
    const nowISO = now.toISOString();
    const lowerNewOwner = newOwner.toLowerCase();

    // Get current document to check if owner changed
    const existing = await getNFTMetadata(contractAddress, tokenId);

    if (!existing) {
        // Create new document with new blockchain structure
        await upsertNFTMetadata(contractAddress, tokenId, {
            blockchain: {
                owner: lowerNewOwner,
                ownerSince: now,
                approved: null,
                isApprovedForAll: false,
                lastSyncedAt: now
            },
            ownershipHistory: [{
                owner: lowerNewOwner,
                from: now,
                to: now,
                detectedAt: now
            }],
            lastVerified: nowISO
        } as Partial<NFTMetadata>);
        return;
    }

    const currentOwner = existing.blockchain?.owner;

    // Check if owner changed
    if (currentOwner?.toLowerCase() === lowerNewOwner) {
        // Just update lastVerified
        await collection.updateOne(
            { contractAddress: contractAddress.toLowerCase(), tokenId },
            { $set: { lastVerified: nowISO, updatedAt: nowISO } }
        );
        return;
    }

    // Owner changed - update history
    const now2 = new Date();
    
    // Add old owner to history if exists
    if (currentOwner) {
        // Ensure 'from' timestamp is a Date object
        let fromDate: Date;
        if (existing.blockchain?.ownerSince) {
            fromDate = existing.blockchain.ownerSince;
        } else if (existing.createdAt) {
            fromDate = typeof existing.createdAt === 'string' ? new Date(existing.createdAt) : existing.createdAt;
        } else {
            fromDate = now2;
        }

        await collection.updateOne(
            { contractAddress: contractAddress.toLowerCase(), tokenId },
            {
                $push: {
                    ownershipHistory: {
                        owner: currentOwner,
                        from: fromDate,
                        to: now2,
                        detectedAt: now2
                    }
                } as any
            }
        );
    }

    // Update current owner
    await collection.updateOne(
        { contractAddress: contractAddress.toLowerCase(), tokenId },
        {
            $set: {
                'blockchain.owner': lowerNewOwner,
                'blockchain.ownerSince': now2,
                'blockchain.lastSyncedAt': now2,
                lastVerified: nowISO,
                updatedAt: nowISO
            }
        }
    );
}

/**
 * Get enriched NFT metadata with listings and stats
 */
export async function getEnrichedNFTMetadata(
    contractAddress: string,
    tokenId: string,
    userAddress?: string
): Promise<EnrichedNFTMetadata | null> {
    const collection = await getNFTMetadataCollection();

    const pipeline = [
        {
            $match: {
                contractAddress: contractAddress.toLowerCase(),
                tokenId: tokenId
            }
        },
        // Join with marketplace_items (listings)
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
                                    { $eq: ['$status', 'active'] }
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
        // Join with nft_stats
        {
            $lookup: {
                from: 'nft_stats',
                let: { contractAddr: '$contractAddress', tokenId: '$tokenId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$contractAddress', '$$contractAddr'] },
                                    { $eq: ['$tokenId', '$$tokenId'] }
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
                stats: {
                    viewCount: { $ifNull: ['$statsData.viewCount', 0] },
                    likeCount: { $ifNull: ['$statsData.likeCount', 0] },
                    watchlistCount: { $ifNull: ['$statsData.watchlistCount', 0] },
                    averageRating: { $ifNull: ['$statsData.averageRating', 0] },
                    ratingCount: { $ifNull: ['$statsData.ratingCount', 0] }
                }
            }
        },
        {
            $project: {
                statsData: 0
            }
        }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results[0] as EnrichedNFTMetadata || null;
}

/**
 * Create indexes for nft_metadata collection
 */
export async function createNFTMetadataIndexes() {
    const collection = await getNFTMetadataCollection();

    await collection.createIndexes([
        // Primary key
        {
            key: { contractAddress: 1, tokenId: 1 },
            unique: true,
            name: 'nft_unique'
        },
        // Owner queries
        {
            key: { currentOwner: 1 },
            name: 'owner_lookup'
        },
        // Search
        {
            key: { 'metadata.name': 1 },
            name: 'metadata_name_search'
        },
        {
            key: { 'contract.name': 1 },
            name: 'contract_name_search'
        },
        // Stale data cleanup
        {
            key: { lastVerified: 1 },
            name: 'verification_age'
        }
    ]);

    devLog.info('✅ NFT Metadata indexes created');
}

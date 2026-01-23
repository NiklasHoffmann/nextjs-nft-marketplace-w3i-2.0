/**
 * NFT Metadata Database Utilities
 * 
 * Helper functions for interacting with the nft_metadata collection.
 * Provides typed access and common query patterns.
 */

import { getCollection } from '@/lib/mongodb';
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
    const now = new Date().toISOString();
    const lowerNewOwner = newOwner.toLowerCase();

    // Get current document to check if owner changed
    const existing = await getNFTMetadata(contractAddress, tokenId);

    if (!existing) {
        // Create new document
        await upsertNFTMetadata(contractAddress, tokenId, {
            currentOwner: lowerNewOwner,
            ownerHistory: [{
                owner: lowerNewOwner,
                acquiredAt: now,
                source
            }],
            lastVerified: now
        } as Partial<NFTMetadata>);
        return;
    }

    // Check if owner changed
    if (existing.currentOwner === lowerNewOwner) {
        // Just update lastVerified
        await collection.updateOne(
            { contractAddress: contractAddress.toLowerCase(), tokenId },
            { $set: { lastVerified: now, updatedAt: now } }
        );
        return;
    }

    // Owner changed - update history
    const updatedHistory = [...existing.ownerHistory];

    // Mark previous owner's entry as transferred
    if (updatedHistory.length > 0) {
        const lastEntry = updatedHistory[updatedHistory.length - 1];
        if (lastEntry && !lastEntry.transferredAt) {
            lastEntry.transferredAt = now;
        }
    }

    // Add new owner entry
    updatedHistory.push({
        owner: lowerNewOwner,
        acquiredAt: now,
        source
    });

    // Update document
    await collection.updateOne(
        { contractAddress: contractAddress.toLowerCase(), tokenId },
        {
            $set: {
                currentOwner: lowerNewOwner,
                ownerHistory: updatedHistory,
                lastVerified: now,
                updatedAt: now
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

    console.log('✅ NFT Metadata indexes created');
}

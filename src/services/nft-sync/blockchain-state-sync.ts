/**
 * Blockchain State Sync Service (ON-DEMAND)
 * 
 * Fetches ONLY blockchain state (owner + approved) when needed
 * No scheduled runs - called explicitly when data is needed
 * 
 * When to use:
 * - New listing detected (immediately)
 * - NFT detail page loaded (if data older than 5min)
 * - User clicks "Refresh" button
 * - Before listing creation (ensure current state)
 */

import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { getCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';

const ERC721_ABI = [
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'getApproved',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'isApprovedForAll',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'operator', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }],
    }
] as const;

const ERC1155_ABI = [
    {
        name: 'uri',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'isApprovedForAll',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'operator', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }],
    }
] as const;

export interface BlockchainState {
    owner: string;
    approved: string;
    isApprovedForAll: boolean;
    lastSyncedAt: Date;
    tokenStandard?: 'ERC721' | 'ERC1155';
}

export class BlockchainStateSync {
    private client;

    constructor() {
        this.client = createPublicClient({
            chain: sepolia,
            transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
        });
    }

    /**
     * Sync blockchain state for a single NFT (on-demand)
     */
    async syncNFTState(
        contractAddress: string,
        tokenId: string,
        marketplaceAddress?: string
    ): Promise<BlockchainState> {
        try {
            let owner = '';
            let approved = '';
            let tokenStandard: 'ERC721' | 'ERC1155' = 'ERC721';

            try {
                const [ownerResult, approvedResult] = await Promise.all([
                    this.client.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: ERC721_ABI,
                        functionName: 'ownerOf',
                        args: [BigInt(tokenId)]
                    }),
                    this.client.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: ERC721_ABI,
                        functionName: 'getApproved',
                        args: [BigInt(tokenId)]
                    })
                ]);

                owner = ownerResult as string;
                approved = approvedResult as string;
            } catch (error) {
                tokenStandard = 'ERC1155';

                try {
                    await this.client.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: ERC1155_ABI,
                        functionName: 'uri',
                        args: [BigInt(tokenId)]
                    });
                } catch (uriError) {
                    devLog.warn('  ⚠️ Could not resolve token standard:', uriError);
                }
            }


            // Optionally check isApprovedForAll if marketplace address provided
            let isApprovedForAll = false;
            if (marketplaceAddress && owner) {
                try {
                    isApprovedForAll = await this.client.readContract({
                        address: contractAddress as `0x${string}`,
                        abi: tokenStandard === 'ERC1155' ? ERC1155_ABI : ERC721_ABI,
                        functionName: 'isApprovedForAll',
                        args: [owner as `0x${string}`, marketplaceAddress as `0x${string}`]
                    });
                } catch (error) {
                    devLog.warn(`  ⚠️ Could not check isApprovedForAll:`, error);
                }
            }

            const state: BlockchainState = {
                owner,
                approved,
                isApprovedForAll,
                lastSyncedAt: new Date(),
                tokenStandard
            };

            // Update both collections
            await this.updateCollections(contractAddress, tokenId, state);


            return state;

        } catch (error) {
            devLog.error(`❌ [Blockchain Sync] Error for ${contractAddress}/${tokenId}:`, error);
            throw error;
        }
    }

    /**
     * Sync blockchain state for multiple NFTs (batch)
     */
    async syncBatch(nfts: Array<{ contractAddress: string; tokenId: string }>, marketplaceAddress?: string) {

        const BATCH_SIZE = 5; // Process 5 at once to avoid rate limits
        const results: Array<{ success: boolean; nft: any; error?: any }> = [];

        for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
            const batch = nfts.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.allSettled(
                batch.map(nft => this.syncNFTState(nft.contractAddress, nft.tokenId, marketplaceAddress))
            );

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push({ success: true, nft: batch[index] });
                } else {
                    results.push({ success: false, nft: batch[index], error: result.reason });
                }
            });

            // Small delay between batches
            if (i + BATCH_SIZE < nfts.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const successCount = results.filter(r => r.success).length;
        devLog.info(`✅ [Blockchain Sync] Batch complete: ${successCount}/${nfts.length} successful`);

        return results;
    }

    /**
     * Update both marketplace_items and nft_metadata collections
     */
    private async updateCollections(contractAddress: string, tokenId: string, state: BlockchainState) {
        const now = new Date();

        // Update marketplace_items (for quick access)
        const marketplaceItems = await getCollection('marketplace_items');
        await marketplaceItems.updateMany(
            { contractAddress, tokenId },
            {
                $set: {
                    approved: state.approved,
                    approvedAddress: state.approved,
                    lastSyncedAt: now,
                    'lastSync.approval': now
                }
            }
        );

        // Update nft_metadata (source of truth) with ownership history
        const nftMetadata = await getCollection('nft_metadata');
        
        // Get existing document to check for owner change
        const existingNFT = await nftMetadata.findOne({ contractAddress, tokenId });
        const oldOwner = existingNFT?.blockchain?.owner;
        const ownerChanged = existingNFT && oldOwner && state.owner
            ? oldOwner.toLowerCase() !== state.owner.toLowerCase()
            : false;
        
        // Prepare update operations
        const updateOps: any = {
            $set: {
                // CRITICAL: Set contractAddress and tokenId explicitly for upsert
                contractAddress,
                tokenId,
                'blockchain.approved': state.approved,
                'blockchain.isApprovedForAll': state.isApprovedForAll,
                'blockchain.lastSyncedAt': now,
                updatedAt: now
            },
            $setOnInsert: {
                // Only set these on new document creation
                createdAt: now,
                metadataLastUpdated: now,
                ownershipHistory: [] // Initialize history array
            }
        };

        if (state.tokenStandard) {
            updateOps.$set['contract.contractType'] = state.tokenStandard;
        }

        if (state.owner) {
            updateOps.$set['blockchain.owner'] = state.owner;
        }
        
        // If owner changed, add to ownership history
        if (ownerChanged) {
            updateOps.$push = {
                ownershipHistory: {
                    owner: oldOwner,
                    from: existingNFT.blockchain?.ownerSince || existingNFT.createdAt || now,
                    to: now,
                    detectedAt: now
                }
            };
            // Set new owner's "ownerSince" timestamp
            updateOps.$set['blockchain.ownerSince'] = now;
            
            devLog.info(`  🔄 Owner changed: ${oldOwner} → ${state.owner}`);
        } else if (!existingNFT) {
            // New NFT, set initial ownerSince
            updateOps.$setOnInsert['blockchain.ownerSince'] = now;
        }
        
        await nftMetadata.updateOne(
            { contractAddress, tokenId },
            updateOps,
            { upsert: true }
        );
    }

    /**
     * Check if blockchain state is stale (older than 5 minutes)
     */
    async isStateStale(contractAddress: string, tokenId: string, maxAgeMs: number = 5 * 60 * 1000): Promise<boolean> {
        const nftMetadata = await getCollection('nft_metadata');
        const nft = await nftMetadata.findOne({ contractAddress, tokenId });

        if (!nft?.blockchain?.lastSyncedAt) {
            return true; // No data = stale
        }

        const ageMs = Date.now() - nft.blockchain.lastSyncedAt.getTime();
        return ageMs > maxAgeMs;
    }

    /**
     * Sync only if stale (smart sync)
     */
    async syncIfStale(
        contractAddress: string,
        tokenId: string,
        maxAgeMs: number = 5 * 60 * 1000,
        marketplaceAddress?: string
    ): Promise<BlockchainState | null> {
        const isStale = await this.isStateStale(contractAddress, tokenId, maxAgeMs);

        if (isStale) {
            devLog.info(`  ⏰ State is stale, syncing...`);
            return await this.syncNFTState(contractAddress, tokenId, marketplaceAddress);
        } else {
            devLog.info(`  ✅ State is fresh, skipping sync`);
            return null;
        }
    }
}

// Singleton instance
export const blockchainStateSync = new BlockchainStateSync();

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

import type { Address } from 'viem';
import { getCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';
import { executeContractCallWithFallback } from '@/services/blockchain/contract-calls';

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
        name: 'tokenURI',
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

const CONTRACT_METADATA_ABI = [
    {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    }
] as const;

const ERC1155_SUPPLY_ABI = [
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'id', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }],
    }
] as const;

export interface BlockchainState {
    owner: string;
    approved: string;
    isApprovedForAll: boolean;
    lastSyncedAt: Date;
    tokenStandard?: 'ERC721' | 'ERC1155';
    contractName?: string | null;
    contractSymbol?: string | null;
    totalSupply?: number | null;
    tokenURI?: string | null;
}

function normalizeErc1155TokenUri(tokenUri: string, tokenId: string): string {
    const hexTokenId = BigInt(tokenId).toString(16).padStart(64, '0').toLowerCase();
    return tokenUri
        .replace(/\{id\}/gi, hexTokenId)
        .replace(/%7Bid%7D/gi, hexTokenId);
}

interface ContractMetadataCacheEntry {
    name: string | null;
    symbol: string | null;
    expiresAt: number;
}

interface TotalSupplyCacheEntry {
    value: number | null;
    expiresAt: number;
}

const CONTRACT_METADATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TOTAL_SUPPLY_CACHE_TTL_MS = 10 * 60 * 1000;
const contractMetadataCache = new Map<string, ContractMetadataCacheEntry>();
const totalSupplyCache = new Map<string, TotalSupplyCacheEntry>();
const APPROVAL_CACHE_TTL_MS = 2 * 60 * 1000;

interface ApprovalCacheEntry {
    value: boolean;
    expiresAt: number;
}

export class BlockchainStateSync {
    private approvalCache = new Map<string, ApprovalCacheEntry>();
    private lastApprovalRateLimitWarningAt = 0;

    private getCachedContractMetadata(contractAddress: string): ContractMetadataCacheEntry | null {
        const key = contractAddress.toLowerCase();
        const cached = contractMetadataCache.get(key);
        if (!cached) {
            return null;
        }

        if (cached.expiresAt <= Date.now()) {
            contractMetadataCache.delete(key);
            return null;
        }

        return cached;
    }

    private setCachedContractMetadata(
        contractAddress: string,
        name: string | null,
        symbol: string | null
    ): void {
        contractMetadataCache.set(contractAddress.toLowerCase(), {
            name,
            symbol,
            expiresAt: Date.now() + CONTRACT_METADATA_CACHE_TTL_MS,
        });
    }

    private getCachedTotalSupply(contractAddress: string): number | null | undefined {
        const key = contractAddress.toLowerCase();
        const cached = totalSupplyCache.get(key);
        if (!cached) return undefined;

        if (cached.expiresAt <= Date.now()) {
            totalSupplyCache.delete(key);
            return undefined;
        }

        return cached.value;
    }

    private setCachedTotalSupply(contractAddress: string, value: number | null): void {
        totalSupplyCache.set(contractAddress.toLowerCase(), {
            value,
            expiresAt: Date.now() + TOTAL_SUPPLY_CACHE_TTL_MS,
        });
    }

    private async safeReadContract<T>(params: {
        address: `0x${string}`;
        abi: any;
        functionName: string;
        args?: readonly unknown[];
    }): Promise<T | null> {
        const result = await executeContractCallWithFallback<T>({
            address: params.address,
            abi: params.abi,
            functionName: params.functionName,
            args: (params.args ?? []) as any[],
            callType: 'optional',
        });

        if (!result.success) {
            return null;
        }

        return result.data ?? null;
    }

    constructor() {
    }

    private getApprovalCacheKey(contractAddress: string, owner: string, operator: string): string {
        return `${contractAddress.toLowerCase()}:${owner.toLowerCase()}:${operator.toLowerCase()}`;
    }

    private getCachedApproval(contractAddress: string, owner: string, operator: string): boolean | null {
        const key = this.getApprovalCacheKey(contractAddress, owner, operator);
        const cached = this.approvalCache.get(key);
        if (!cached) return null;

        if (cached.expiresAt <= Date.now()) {
            this.approvalCache.delete(key);
            return null;
        }

        return cached.value;
    }

    private setCachedApproval(contractAddress: string, owner: string, operator: string, value: boolean): void {
        const key = this.getApprovalCacheKey(contractAddress, owner, operator);
        this.approvalCache.set(key, {
            value,
            expiresAt: Date.now() + APPROVAL_CACHE_TTL_MS,
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
            const normalizedAddress = contractAddress.toLowerCase();
            const nftMetadata = await getCollection('nft_metadata');
            const marketplaceItems = await getCollection('marketplace_items');

            const [existingNFT, activeListing] = await Promise.all([
                nftMetadata.findOne({ contractAddress: normalizedAddress, tokenId }),
                marketplaceItems.findOne({ contractAddress: normalizedAddress, tokenId, active: true })
            ]);

            const fallbackOwner =
                existingNFT?.blockchain?.owner ||
                existingNFT?.contract?.owner ||
                activeListing?.seller ||
                '';

            let owner = '';
            let approved = '';
            let tokenStandard: 'ERC721' | 'ERC1155' = 'ERC721';
            let resolvedTokenURI: string | null = null;

            // Determine token standard conservatively:
            // only mark as ERC1155 when uri(tokenId) succeeds.
            const ownerResult = await this.safeReadContract<string>({
                address: contractAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)]
            });

            if (ownerResult) {
                tokenStandard = 'ERC721';
                owner = ownerResult;

                const tokenUriResult = await this.safeReadContract<string>({
                    address: contractAddress as `0x${string}`,
                    abi: ERC721_ABI,
                    functionName: 'tokenURI',
                    args: [BigInt(tokenId)]
                });
                resolvedTokenURI = tokenUriResult || null;

                const approvedResult = await this.safeReadContract<string>({
                    address: contractAddress as `0x${string}`,
                    abi: ERC721_ABI,
                    functionName: 'getApproved',
                    args: [BigInt(tokenId)]
                });

                approved = approvedResult || '';
            } else {
                const uriResult = await this.safeReadContract<string>({
                    address: contractAddress as `0x${string}`,
                    abi: ERC1155_ABI,
                    functionName: 'uri',
                    args: [BigInt(tokenId)]
                });

                if (uriResult) {
                    tokenStandard = 'ERC1155';
                    resolvedTokenURI = normalizeErc1155TokenUri(uriResult, tokenId);
                } else {
                    devLog.warn('  ⚠️ Could not confirm token standard via ownerOf or uri; defaulting to ERC721 handling');
                }

                // ERC1155 has no ownerOf/getApproved. Use known seller/owner as approval check owner.
                if (!owner && fallbackOwner) {
                    owner = fallbackOwner;
                }
            }


            // Optionally check isApprovedForAll if marketplace address provided
            let isApprovedForAll = false;
            const approvalOwner = owner || fallbackOwner;

            if (marketplaceAddress && approvalOwner) {
                const cachedApproval = this.getCachedApproval(contractAddress, approvalOwner, marketplaceAddress);
                if (cachedApproval !== null) {
                    isApprovedForAll = cachedApproval;
                } else {
                    const approvalResult = await this.safeReadContract<boolean>({
                        address: contractAddress as `0x${string}`,
                        abi: tokenStandard === 'ERC1155' ? ERC1155_ABI : ERC721_ABI,
                        functionName: 'isApprovedForAll',
                        args: [approvalOwner as Address, marketplaceAddress as Address]
                    });

                    if (approvalResult !== null) {
                        isApprovedForAll = approvalResult;
                        this.setCachedApproval(contractAddress, approvalOwner, marketplaceAddress, approvalResult);
                    } else {
                        const now = Date.now();
                        if (now - this.lastApprovalRateLimitWarningAt > 30000) {
                            this.lastApprovalRateLimitWarningAt = now;
                            devLog.warn('  ⚠️ Could not check isApprovedForAll (RPC busy/rate-limited). Using fallback false.');
                        }
                    }
                }
            }

            const state: BlockchainState = {
                owner: owner || fallbackOwner,
                approved,
                isApprovedForAll,
                lastSyncedAt: new Date(),
                tokenStandard
            };

            const cachedMetadata = this.getCachedContractMetadata(contractAddress);
            let contractName = cachedMetadata?.name ?? null;
            let contractSymbol = cachedMetadata?.symbol ?? null;

            if (!cachedMetadata) {
                const [fetchedName, fetchedSymbol] = await Promise.all([
                    this.safeReadContract<string>({
                        address: contractAddress as `0x${string}`,
                        abi: CONTRACT_METADATA_ABI,
                        functionName: 'name'
                    }),
                    this.safeReadContract<string>({
                        address: contractAddress as `0x${string}`,
                        abi: CONTRACT_METADATA_ABI,
                        functionName: 'symbol'
                    })
                ]);

                contractName = fetchedName;
                contractSymbol = fetchedSymbol;
                this.setCachedContractMetadata(contractAddress, contractName, contractSymbol);
            }

            let totalSupply: number | null = null;
            if (tokenStandard === 'ERC721') {
                const cachedSupply = this.getCachedTotalSupply(contractAddress);
                if (cachedSupply !== undefined) {
                    totalSupply = cachedSupply;
                } else {
                    const erc721Supply = await this.safeReadContract<bigint>({
                        address: contractAddress as `0x${string}`,
                        abi: [
                            {
                                name: 'totalSupply',
                                type: 'function',
                                stateMutability: 'view',
                                inputs: [],
                                outputs: [{ name: '', type: 'uint256' }],
                            }
                        ] as const,
                        functionName: 'totalSupply'
                    });
                    totalSupply = erc721Supply !== null ? Number(erc721Supply) : null;
                    this.setCachedTotalSupply(contractAddress, totalSupply);
                }
            } else {
                const erc1155Supply = await this.safeReadContract<bigint>({
                    address: contractAddress as `0x${string}`,
                    abi: ERC1155_SUPPLY_ABI,
                    functionName: 'totalSupply',
                    args: [BigInt(tokenId)]
                });
                totalSupply = erc1155Supply !== null ? Number(erc1155Supply) : null;
            }

            state.contractName = contractName;
            state.contractSymbol = contractSymbol;
            state.totalSupply = totalSupply;
            state.tokenURI = resolvedTokenURI;

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
                lastMetadataUpdate: null,
                ownershipHistory: [] // Initialize history array
            }
        };

        if (state.tokenStandard) {
            updateOps.$set['contract.contractType'] = state.tokenStandard;
        }

        if (state.contractName !== undefined) {
            updateOps.$set['contract.name'] = state.contractName;
        }

        if (state.contractSymbol !== undefined) {
            updateOps.$set['contract.symbol'] = state.contractSymbol;
        }

        if (state.totalSupply !== undefined) {
            updateOps.$set['contract.totalSupply'] = state.totalSupply;
        }

        if (state.owner && state.tokenStandard !== 'ERC1155') {
            updateOps.$set['blockchain.owner'] = state.owner;
            updateOps.$set['currentOwner'] = state.owner.toLowerCase();
        }

        if (state.tokenURI) {
            updateOps.$set['contract.tokenURI'] = state.tokenURI;
        }
        
        // If owner changed, add to ownership history
        if (ownerChanged && existingNFT) {
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

        const metadataMissing = !existingNFT?.metadata
            || (!existingNFT?.metadata?.name && !existingNFT?.metadata?.image && !existingNFT?.metadata?.imageOriginal);

        if (metadataMissing) {
            try {
                const { ipfsMetadataLazySync } = await import('@/services/nft-sync');
                await ipfsMetadataLazySync.ensureMetadata(contractAddress, tokenId);
            } catch (error) {
                devLog.warn(`  ⚠️ Failed to trigger metadata backfill for ${contractAddress}/${tokenId}`, error);
            }
        }
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

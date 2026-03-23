/**
 * User NFT Sync API
 * 
 * POST: Sync wallet NFTs to nft_metadata collection
 * - Discovery via Alchemy (cheap, withMetadata=false)
 * - Smart update: only fetch metadata for new NFTs
 * - Ownership verification for existing NFTs
 */

import { NextRequest } from 'next/server';
import {
    apiHandler,
    apiSuccess,
    BadRequestError
} from '@/lib/api';
import {
    getNFTsByOwner,
    updateNFTOwnership,
    upsertNFTMetadata
} from '@/lib/db';
import { getKnownContractAddresses, getWalletNFTsFromBlockchain } from '@/lib/blockchain';
import { incrementRequestCounter } from '@/lib/monitoring/request-counter';
import { getSharedCacheValue, setSharedCacheValue } from '@/lib/redis/shared-cache';
import type { NFTMetadataSyncResult } from '@/types';
import { fetchComprehensiveNFTDataNew } from '@/services/blockchain/nft-fetcher';
import type { Address } from 'viem';
import { devLog } from '@/utils';

// Lightweight NFT discovery from Alchemy
interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
}

const SYNC_RESULT_TTL_MS = 120_000;
const SYNC_RESULT_SHARED_CACHE_TTL_SECONDS = Math.ceil(SYNC_RESULT_TTL_MS / 1000);

interface SyncCacheEntry {
    result: NFTMetadataSyncResult;
    expiresAt: number;
}

const syncInFlight = new Map<string, Promise<NFTMetadataSyncResult>>();
const syncResultCache = new Map<string, SyncCacheEntry>();

function buildSyncSharedCacheKey(walletAddress: string): string {
    return `wallet-sync:${walletAddress.toLowerCase()}`;
}

function cleanupSyncCache(): void {
    const now = Date.now();
    for (const [wallet, entry] of syncResultCache.entries()) {
        if (entry.expiresAt <= now) {
            syncResultCache.delete(wallet);
        }
    }
}

async function discoverNFTsViaAlchemy(walletAddress: string): Promise<NFTIdentifier[]> {
    try {
        incrementRequestCounter('alchemy.discovery.user_sync.attempt');

        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
        if (!apiKey) {
            throw new Error('Alchemy API key not configured');
        }

        const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

        const response = await fetch(
            `${baseURL}/getNFTsForOwner?owner=${walletAddress}&withMetadata=false&pageSize=100`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) {
            incrementRequestCounter('alchemy.discovery.user_sync.error');
            throw new Error(`Alchemy API error: ${response.status}`);
        }

        incrementRequestCounter('alchemy.discovery.user_sync.success');

        const data = await response.json();

        return data.ownedNfts?.map((nft: any) => {
            const contractAddress = nft.contract?.address || nft.contractAddress;
            const tokenId = nft.tokenId || nft.id?.tokenId;

            if (!contractAddress || tokenId === undefined) {
                devLog.warn(`⚠️ [Sync] Skipping NFT with missing data`);
                return null;
            }

            return {
                contractAddress,
                tokenId: tokenId.toString(),
            };
        }).filter(Boolean) || [];
    } catch (error) {
        devLog.error('❌ [Sync Alchemy Discovery] Error:', error);
        throw error;
    }
}

async function discoverNFTsViaMoralis(walletAddress: string): Promise<NFTIdentifier[]> {
    incrementRequestCounter('moralis.discovery.user_sync.attempt');

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
        throw new Error('Moralis API key not configured');
    }

    const chain = process.env.MORALIS_CHAIN || 'sepolia';
    const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?chain=${chain}&format=decimal&media_items=false`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        }
    );

    if (!response.ok) {
        incrementRequestCounter('moralis.discovery.user_sync.error');
        throw new Error(`Moralis API error: ${response.status}`);
    }

    incrementRequestCounter('moralis.discovery.user_sync.success');

    const data = await response.json();
    const result = Array.isArray(data?.result) ? data.result : [];

    return result.map((nft: any) => {
        const contractAddress = nft?.token_address;
        const tokenId = nft?.token_id;

        if (!contractAddress || tokenId === undefined || tokenId === null) {
            return null;
        }

        return {
            contractAddress: String(contractAddress).toLowerCase(),
            tokenId: String(tokenId),
        };
    }).filter(Boolean) as NFTIdentifier[];
}

async function discoverNFTsViaKnownContracts(walletAddress: string): Promise<NFTIdentifier[]> {
    const knownContracts = await getKnownContractAddresses();
    if (knownContracts.length === 0) {
        return [];
    }

    const nfts = await getWalletNFTsFromBlockchain(walletAddress as Address, knownContracts as Address[]);

    return nfts
        .map((nft) => {
            if (!nft.contractAddress || nft.tokenId === undefined || nft.tokenId === null) {
                return null;
            }

            return {
                contractAddress: String(nft.contractAddress).toLowerCase(),
                tokenId: String(nft.tokenId),
            };
        })
        .filter(Boolean) as NFTIdentifier[];
}

async function discoverNFTsWithFallback(walletAddress: string): Promise<{ nfts: NFTIdentifier[]; source: 'alchemy' | 'moralis' | 'blockchain'; }> {
    try {
        const nfts = await discoverNFTsViaAlchemy(walletAddress);
        return { nfts, source: 'alchemy' };
    } catch (alchemyError) {
        devLog.warn('⚠️ [NFT Sync] Alchemy discovery failed, trying Moralis fallback', alchemyError);
    }

    try {
        const nfts = await discoverNFTsViaMoralis(walletAddress);
        return { nfts, source: 'moralis' };
    } catch (moralisError) {
        devLog.warn('⚠️ [NFT Sync] Moralis discovery failed, trying blockchain fallback', moralisError);
    }

    const nfts = await discoverNFTsViaKnownContracts(walletAddress);
    return { nfts, source: 'blockchain' };
}

/**
 * POST /api/user/nfts/sync
 * 
 * Sync wallet NFTs to database
 * Requires authentication - wallet must match authenticated user
 */
export const POST = apiHandler(async (request: NextRequest) => {
    // Get authenticated wallet address from withAuth middleware
    const walletAddress = request.userAddress?.toLowerCase();
    const forceSync = request.nextUrl.searchParams.get('force') === 'true';

    if (!walletAddress) {
        throw new BadRequestError('Authentication required');
    }

    cleanupSyncCache();

    if (!forceSync) {
        const cachedSync = syncResultCache.get(walletAddress);
        if (cachedSync && cachedSync.expiresAt > Date.now()) {
            return apiSuccess(cachedSync.result);
        }
    }

    const sharedCacheKey = buildSyncSharedCacheKey(walletAddress);
    if (!forceSync) {
        const sharedCachedSync = await getSharedCacheValue<NFTMetadataSyncResult>(sharedCacheKey);
        if (sharedCachedSync) {
            syncResultCache.set(walletAddress, {
                result: sharedCachedSync,
                expiresAt: Date.now() + SYNC_RESULT_TTL_MS,
            });
            return apiSuccess(sharedCachedSync);
        }
    }

    if (!forceSync) {
        const existingSync = syncInFlight.get(walletAddress);
        if (existingSync) {
            const result = await existingSync;
            return apiSuccess(result);
        }
    }

    const syncPromise = (async (): Promise<NFTMetadataSyncResult> => {
        const startTime = Date.now();

        devLog.info(`🔄 [NFT Sync] Starting sync for wallet: ${walletAddress}`);

        // STEP 1: Discovery - Alchemy first, then Moralis, then known-contract blockchain fallback.
        devLog.debug('📡 [NFT Sync] Fetching NFT list with fallback discovery...');
        const { nfts: discoveredNFTs, source: discoverySource } = await discoverNFTsWithFallback(walletAddress);

        devLog.debug(`✅ [NFT Sync] Found ${discoveredNFTs.length} NFTs in wallet (source: ${discoverySource})`);

        // STEP 2: Get existing NFTs from database
        devLog.debug('🗄️  [NFT Sync] Checking database for existing NFTs...');
        const existingNFTs = await getNFTsByOwner(walletAddress);
        const existingMap = new Map(
            existingNFTs.map(nft => [`${nft.contractAddress}-${nft.tokenId}`, nft])
        );

        devLog.debug(`📊 [NFT Sync] Found ${existingNFTs.length} existing NFTs in database`);

        // STEP 3: Categorize NFTs
        const newNFTs: Array<{ contractAddress: string; tokenId: string }> = [];
        const existingToUpdate: Array<{ contractAddress: string; tokenId: string }> = [];
        const currentNFTKeys = new Set<string>();

        for (const discoveredNFT of discoveredNFTs) {
            const key = `${discoveredNFT.contractAddress.toLowerCase()}-${discoveredNFT.tokenId}`;
            currentNFTKeys.add(key);

            if (existingMap.has(key)) {
                existingToUpdate.push({
                    contractAddress: discoveredNFT.contractAddress.toLowerCase(),
                    tokenId: discoveredNFT.tokenId
                });
            } else {
                newNFTs.push({
                    contractAddress: discoveredNFT.contractAddress.toLowerCase(),
                    tokenId: discoveredNFT.tokenId
                });
            }
        }

        // Find transferred NFTs (in DB but not in wallet anymore)
        const transferredNFTs = existingNFTs.filter(
            nft => !currentNFTKeys.has(`${nft.contractAddress}-${nft.tokenId}`)
        );

        devLog.debug(`📈 [NFT Sync] Analysis:
  - New NFTs: ${newNFTs.length}
  - Existing to verify: ${existingToUpdate.length}
  - Transferred out: ${transferredNFTs.length}`);

        const result: NFTMetadataSyncResult = {
            total: discoveredNFTs.length,
            new: 0,
            updated: 0,
            transferred: 0,
            unchanged: 0,
            errors: [],
            duration: 0
        };

        // STEP 4: Process new NFTs (fetch full metadata)
        if (newNFTs.length > 0) {
            devLog.debug(`🆕 [NFT Sync] Fetching metadata for ${newNFTs.length} new NFTs...`);

            // Process in batches of 3 to avoid rate limits
            const batchSize = 3;
            for (let i = 0; i < newNFTs.length; i += batchSize) {
                const batch = newNFTs.slice(i, i + batchSize);
                devLog.debug(`  📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newNFTs.length / batchSize)} (${batch.length} NFTs)`);

                // Process batch concurrently
                const batchPromises = batch.map(async (nft) => {
                    try {
                        devLog.debug(`    📥 Fetching: ${nft.contractAddress}/${nft.tokenId}`);

                        // Fetch contract data from blockchain
                        const blockchainData = await fetchComprehensiveNFTDataNew(
                            nft.contractAddress, nft.tokenId, walletAddress
                        );

                        if (!blockchainData) {
                            const message = 'Blockchain data unavailable (likely nonexistent token or stale listing)';
                            devLog.warn(`    ⚠️  ${message}: ${nft.contractAddress}/${nft.tokenId}`);
                            result.errors.push({
                                contractAddress: nft.contractAddress,
                                tokenId: nft.tokenId,
                                error: message
                            });
                            return;
                        }

                        // Fetch metadata from tokenURI if available
                        let metadata = {
                            name: null,
                            description: null,
                            image: null,
                            attributes: []
                        };

                        if (blockchainData.tokenURI) {
                            try {
                                // Resolve IPFS URLs
                                let metadataURL = blockchainData.tokenURI;
                                if (metadataURL.startsWith('ipfs://')) {
                                    metadataURL = metadataURL.replace('ipfs://', 'https://ipfs.io/ipfs/');
                                }

                                const metadataResponse = await fetch(metadataURL, {
                                    signal: AbortSignal.timeout(5000)
                                });

                                if (metadataResponse.ok) {
                                    const metadataJson = await metadataResponse.json();
                                    metadata = {
                                        name: metadataJson.name || null,
                                        description: metadataJson.description || null,
                                        image: metadataJson.image || null,
                                        attributes: metadataJson.attributes || []
                                    };
                                }
                            } catch (metaError) {
                                devLog.warn(`    ⚠️  Failed to fetch metadata: ${metaError}`);
                            }
                        }

                        // Upsert to nft_metadata
                        await upsertNFTMetadata(nft.contractAddress, nft.tokenId, {
                            metadata,
                            contract: {
                                name: blockchainData.contractName || null,
                                symbol: blockchainData.contractSymbol || null,
                                totalSupply: blockchainData.totalSupply ? parseInt(blockchainData.totalSupply) : null,
                                contractType: blockchainData.tokenStandard || null,
                                tokenURI: blockchainData.tokenURI || null,
                                owner: blockchainData.owner || walletAddress || null,
                                ownerBalance: blockchainData.ownerBalance ? parseInt(blockchainData.ownerBalance) : null,
                                approved: blockchainData.approvedAddress || null
                            },
                            currentOwner: walletAddress,
                            ownerHistory: [{
                                owner: walletAddress,
                                acquiredAt: new Date().toISOString(),
                                source: 'unknown'
                            }],
                            lastVerified: new Date().toISOString(),
                            lastMetadataUpdate: new Date().toISOString()
                        } as any);

                        result.new++;
                        devLog.debug(`    ✅ Saved: ${nft.contractAddress}/${nft.tokenId}`);

                    } catch (error) {
                        devLog.error(`    ❌ Error fetching ${nft.contractAddress}/${nft.tokenId}:`, error);
                        result.errors.push({
                            contractAddress: nft.contractAddress,
                            tokenId: nft.tokenId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                });

                // Wait for batch to complete
                await Promise.all(batchPromises);

                // Small delay between batches to be rate-limit friendly
                if (i + batchSize < newNFTs.length) {
                    devLog.debug('  ⏳ Rate limit pause...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // STEP 5: Update existing NFTs (just verify ownership)
        if (existingToUpdate.length > 0) {
            devLog.debug(`🔍 [NFT Sync] Verifying ownership for ${existingToUpdate.length} existing NFTs...`);

            for (const nft of existingToUpdate) {
                try {
                    await updateNFTOwnership(
                        nft.contractAddress, nft.tokenId,
                        walletAddress,
                        'unknown'
                    );
                    result.unchanged++;
                } catch (error) {
                    devLog.error(`  ❌ Error updating ${nft.contractAddress}/${nft.tokenId}:`, error);
                    result.errors.push({
                        contractAddress: nft.contractAddress,
                        tokenId: nft.tokenId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        }

        // STEP 6: Mark transferred NFTs (update ownership to null)
        if (transferredNFTs.length > 0) {
            devLog.debug(`📤 [NFT Sync] Marking ${transferredNFTs.length} NFTs as transferred...`);

            for (const nft of transferredNFTs) {
                try {
                    await updateNFTOwnership(
                        nft.contractAddress, nft.tokenId,
                        '', // Empty owner = transferred
                        'transfer'
                    );
                    result.transferred++;
                } catch (error) {
                    devLog.error(`  ❌ Error marking transferred ${nft.contractAddress}/${nft.tokenId}:`, error);
                }
            }
        }

        result.duration = Date.now() - startTime;

        devLog.info(`✅ [NFT Sync] Sync completed in ${result.duration}ms:
  - New: ${result.new}
  - Unchanged: ${result.unchanged}
  - Transferred: ${result.transferred}
  - Errors: ${result.errors.length}`);

        return result;
    })();

    syncInFlight.set(walletAddress, syncPromise);

    try {
        const result = await syncPromise;
        syncResultCache.set(walletAddress, {
            result,
            expiresAt: Date.now() + SYNC_RESULT_TTL_MS,
        });
        await setSharedCacheValue(sharedCacheKey, result, SYNC_RESULT_SHARED_CACHE_TTL_SECONDS);
        return apiSuccess(result);
    } finally {
        syncInFlight.delete(walletAddress);
    }
}, {
    auth: true,
    rateLimit: {
        maxRequests: 6,
        windowSeconds: 60,
    }
});

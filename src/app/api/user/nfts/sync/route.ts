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
import type { NFTMetadataSyncResult } from '@/types';
import { fetchComprehensiveNFTDataNew } from '@/services/blockchain/nft-fetcher';
import { devLog } from '@/utils';

// Lightweight NFT discovery from Alchemy
interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
}

const SYNC_RESULT_TTL_MS = 20_000;

interface SyncCacheEntry {
    result: NFTMetadataSyncResult;
    expiresAt: number;
}

const syncInFlight = new Map<string, Promise<NFTMetadataSyncResult>>();
const syncResultCache = new Map<string, SyncCacheEntry>();

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
            throw new Error(`Alchemy API error: ${response.status}`);
        }

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

/**
 * POST /api/user/nfts/sync
 * 
 * Sync wallet NFTs to database
 * Requires authentication - wallet must match authenticated user
 */
export const POST = apiHandler(async (request: NextRequest) => {
    // Get authenticated wallet address from withAuth middleware
    const walletAddress = request.userAddress?.toLowerCase();

    if (!walletAddress) {
        throw new BadRequestError('Authentication required');
    }

    cleanupSyncCache();

    const cachedSync = syncResultCache.get(walletAddress);
    if (cachedSync && cachedSync.expiresAt > Date.now()) {
        return apiSuccess(cachedSync.result);
    }

    const existingSync = syncInFlight.get(walletAddress);
    if (existingSync) {
        const result = await existingSync;
        return apiSuccess(result);
    }

    const syncPromise = (async (): Promise<NFTMetadataSyncResult> => {
        const startTime = Date.now();

        devLog.info(`🔄 [NFT Sync] Starting sync for wallet: ${walletAddress}`);

        // STEP 1: Discovery - Get current NFTs from Alchemy (cheap, no metadata)
        devLog.debug('📡 [NFT Sync] Fetching NFT list from Alchemy (discovery only)...');
        const alchemyNFTs = await discoverNFTsViaAlchemy(walletAddress);

        devLog.debug(`✅ [NFT Sync] Found ${alchemyNFTs.length} NFTs in wallet`);

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

        for (const alchemyNFT of alchemyNFTs) {
            const key = `${alchemyNFT.contractAddress.toLowerCase()}-${alchemyNFT.tokenId}`;
            currentNFTKeys.add(key);

            if (existingMap.has(key)) {
                existingToUpdate.push({
                    contractAddress: alchemyNFT.contractAddress.toLowerCase(),
                    tokenId: alchemyNFT.tokenId
                });
            } else {
                newNFTs.push({
                    contractAddress: alchemyNFT.contractAddress.toLowerCase(),
                    tokenId: alchemyNFT.tokenId
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
            total: alchemyNFTs.length,
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
                            throw new Error('No data returned from blockchain');
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

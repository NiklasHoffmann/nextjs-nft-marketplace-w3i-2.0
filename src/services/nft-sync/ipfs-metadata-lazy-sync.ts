/**
 * IPFS Metadata Lazy-Loading Service
 * 
 * Fetches IPFS metadata ONLY when missing (one-time fetch)
 * IPFS is immutable - cache forever, no re-fetching needed
 * 
 * Called by:
 * - NFT detail page API (if metadata missing)
 * - Marketplace items API (lazy-load on demand)
 */

import { getCollection } from '@/lib/mongodb';

export interface IPFSMetadata {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    external_url?: string;
    animation_url?: string;
    background_color?: string;
}

export class IPFSMetadataLazySync {

    /**
     * Fetch and store IPFS metadata if missing (one-time operation)
     */
    async ensureMetadata(contractAddress: string, tokenId: string): Promise<IPFSMetadata | null> {
        try {
            // Check if metadata already exists
            const nftMetadata = await getCollection('nft_metadata');
            const existing = await nftMetadata.findOne({
                contractAddress,
                tokenId,
                'metadata.name': { $exists: true }
            });

            if (existing?.metadata) {
                console.log(`  ✅ Metadata already cached for ${contractAddress}/${tokenId}`);
                return existing.metadata as IPFSMetadata;
            }

            console.log(`  📡 Fetching IPFS metadata for ${contractAddress}/${tokenId}...`);

            // Get tokenURI from blockchain
            const tokenURI = await this.getTokenURI(contractAddress, tokenId);

            if (!tokenURI) {
                console.warn(`  ⚠️ No tokenURI for ${contractAddress}/${tokenId}`);
                return null;
            }

            // Fetch metadata from IPFS
            const metadata = await this.fetchIPFSMetadata(tokenURI);

            if (!metadata) {
                console.warn(`  ⚠️ Could not fetch metadata from ${tokenURI}`);
                return null;
            }

            // Store in nft_metadata (infinite cache - IPFS is immutable)
            await nftMetadata.updateOne(
                { contractAddress, tokenId },
                {
                    $set: {
                        // CRITICAL: Set contractAddress and tokenId explicitly for upsert
                        contractAddress,
                        tokenId,
                        metadata,
                        metadataFetchedAt: new Date(),
                        'contract.tokenURI': tokenURI,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            console.log(`  ✅ Metadata stored: ${metadata.name || 'Unnamed NFT'}`);

            return metadata;

        } catch (error) {
            console.error(`❌ Error fetching metadata for ${contractAddress}/${tokenId}:`, error);
            return null;
        }
    }

    /**
     * Batch ensure metadata for multiple NFTs
     */
    async ensureBatch(nfts: Array<{ contractAddress: string; tokenId: string }>) {
        console.log(`🔄 [IPFS Sync] Ensuring metadata for ${nfts.length} NFTs`);

        const BATCH_SIZE = 3; // Process 3 at once (IPFS can be slow)
        const results: Array<{ success: boolean; nft: any; metadata?: IPFSMetadata }> = [];

        for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
            const batch = nfts.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.allSettled(
                batch.map(nft => this.ensureMetadata(nft.contractAddress, nft.tokenId))
            );

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push({ success: true, nft: batch[index], metadata: result.value });
                } else {
                    results.push({ success: false, nft: batch[index] });
                }
            });

            // Delay between batches (IPFS can be slow)
            if (i + BATCH_SIZE < nfts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ [IPFS Sync] Batch complete: ${successCount}/${nfts.length} successful`);

        return results;
    }

    /**
     * Get tokenURI from blockchain
     */
    private async getTokenURI(contractAddress: string, tokenId: string): Promise<string | null> {
        try {
            const { createPublicClient, http } = await import('viem');
            const { sepolia } = await import('viem/chains');

            const client = createPublicClient({
                chain: sepolia,
                transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
            });

            const ERC721_ABI = [
                {
                    name: 'tokenURI',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [{ name: 'tokenId', type: 'uint256' }],
                    outputs: [{ name: '', type: 'string' }],
                }
            ] as const;

            const tokenURI = await client.readContract({
                address: contractAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)]
            });

            return tokenURI as string;

        } catch (error) {
            console.error(`  ❌ Error getting tokenURI:`, error);
            return null;
        }
    }

    /**
     * Fetch metadata from IPFS URI
     */
    private async fetchIPFSMetadata(tokenURI: string): Promise<IPFSMetadata | null> {
        try {
            // Convert IPFS URLs to HTTP gateway
            let metadataUri = tokenURI;

            if (metadataUri.startsWith('ipfs://')) {
                metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            // Fetch with timeout (10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(metadataUri, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const metadata: IPFSMetadata = await response.json();

            // Process image URL
            if (metadata.image && metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            return metadata;

        } catch (error) {
            console.error(`  ❌ Error fetching IPFS metadata from ${tokenURI}:`, error);
            return null;
        }
    }

    /**
     * Get metadata from cache (if exists)
     */
    async getMetadataFromCache(contractAddress: string, tokenId: string): Promise<IPFSMetadata | null> {
        const nftMetadata = await getCollection('nft_metadata');
        const nft = await nftMetadata.findOne({
            contractAddress,
            tokenId,
            'metadata.name': { $exists: true }
        });

        return nft?.metadata as IPFSMetadata || null;
    }
}

// Singleton instance
export const ipfsMetadataLazySync = new IPFSMetadataLazySync();

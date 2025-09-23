/**
 * @deprecated These hooks are no longer used - replaced by NFTContext.getListedNFTs()
 * 
 * LEGACY CODE - Token discovery via blockchain events and ownership checks
 * Very expensive operations that are not needed for marketplace-only display
 * 
 * @see NFTContext.tsx - centralized marketplace data management
 * @see CollectionPageClient.tsx - uses getListedNFTs().filter()
 */

import { useState, useCallback } from 'react';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/config/wagmi';

/**
 * @deprecated Use NFTContext.getListedNFTs() instead
 * Hook to discover all token IDs in a collection by analyzing Transfer events
 * This is the most reliable method as it captures all minted tokens
 */
export function useTokenDiscoveryByEvents() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const discoverTokenIds = useCallback(async (contractAddress: string): Promise<string[]> => {
        if (!contractAddress) return [];

        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 Discovering token IDs via Transfer events for: ${contractAddress}`);

            // Get all Transfer events from contract creation to now
            // Transfer(address from, address to, uint256 tokenId)
            const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');

            // Fetch Transfer events in chunks to avoid RPC limits
            const allTokenIds = new Set<string>();
            const latestBlock = await publicClient.getBlockNumber();
            const startBlock = BigInt(0); // Start from genesis or contract deployment
            const chunkSize = BigInt(10000); // Process in 10k block chunks

            console.log(`📊 Scanning blocks ${startBlock} to ${latestBlock} (${latestBlock - startBlock} blocks)`);

            for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
                const toBlock = fromBlock + chunkSize - BigInt(1) > latestBlock ? latestBlock : fromBlock + chunkSize - BigInt(1);

                try {
                    console.log(`🔄 Processing blocks ${fromBlock} to ${toBlock}`);

                    const logs = await publicClient.getLogs({
                        address: contractAddress as `0x${string}`,
                        event: transferEvent,
                        fromBlock,
                        toBlock,
                    });

                    console.log(`📄 Found ${logs.length} Transfer events in blocks ${fromBlock}-${toBlock}`);

                    // Extract token IDs from Transfer events
                    logs.forEach(log => {
                        if (log.args.tokenId) {
                            allTokenIds.add(log.args.tokenId.toString());
                        }
                    });

                    // Small delay to avoid overwhelming RPC
                    if (fromBlock + chunkSize <= latestBlock) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                } catch (chunkError) {
                    console.warn(`⚠️ Error processing blocks ${fromBlock}-${toBlock}:`, chunkError);
                    // Continue with next chunk
                }
            }

            const tokenIds = Array.from(allTokenIds).sort((a, b) => parseInt(a) - parseInt(b));
            console.log(`✅ Discovered ${tokenIds.length} unique token IDs: ${tokenIds.slice(0, 10).join(', ')}${tokenIds.length > 10 ? '...' : ''}`);

            return tokenIds;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to discover token IDs';
            console.error('❌ Token discovery error:', errorMessage);
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        discoverTokenIds,
        loading,
        error
    };
}

/**
 * Alternative: Discover token IDs by trying sequential ranges
 * Less reliable but faster for large collections
 */
export function useTokenDiscoveryByOwnership() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const discoverTokenIdsByOwnership = useCallback(async (
        contractAddress: string,
        maxTokens: number = 1000
    ): Promise<string[]> => {
        if (!contractAddress) return [];

        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 Discovering token IDs via ownership checks for: ${contractAddress}`);

            const existingTokenIds: string[] = [];
            const batchSize = 50;

            // Try different patterns: 0-based, 1-based, custom ranges
            const patterns = [
                { start: 1, end: Math.min(maxTokens, 1000) }, // 1-based (most common)
                { start: 0, end: Math.min(maxTokens, 1000) }, // 0-based
            ];

            for (const pattern of patterns) {
                console.log(`🔢 Trying pattern: ${pattern.start} to ${pattern.end}`);

                for (let i = pattern.start; i <= pattern.end; i += batchSize) {
                    const batch = Array.from(
                        { length: Math.min(batchSize, pattern.end - i + 1) },
                        (_, index) => i + index
                    );

                    const batchPromises = batch.map(async (tokenId) => {
                        try {
                            // Try to get owner - this will fail if token doesn't exist
                            const owner = await publicClient.readContract({
                                address: contractAddress as `0x${string}`,
                                abi: [parseAbiItem('function ownerOf(uint256 tokenId) view returns (address)')],
                                functionName: 'ownerOf',
                                args: [BigInt(tokenId)],
                            });

                            if (owner && owner !== '0x0000000000000000000000000000000000000000') {
                                return tokenId.toString();
                            }
                        } catch {
                            // Token doesn't exist or error - skip
                        }
                        return null;
                    });

                    const batchResults = await Promise.allSettled(batchPromises);
                    const validTokens = batchResults
                        .filter((result): result is PromiseFulfilledResult<string> =>
                            result.status === 'fulfilled' && result.value !== null
                        )
                        .map(result => result.value);

                    existingTokenIds.push(...validTokens);

                    console.log(`📊 Batch ${i}-${i + batchSize - 1}: Found ${validTokens.length} tokens`);

                    // Small delay between batches
                    if (i + batchSize <= pattern.end) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
            }

            const uniqueTokenIds = Array.from(new Set(existingTokenIds)).sort((a, b) => parseInt(a) - parseInt(b));
            console.log(`✅ Discovered ${uniqueTokenIds.length} existing token IDs via ownership`);

            return uniqueTokenIds;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to discover token IDs';
            console.error('❌ Token discovery error:', errorMessage);
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        discoverTokenIdsByOwnership,
        loading,
        error
    };
}
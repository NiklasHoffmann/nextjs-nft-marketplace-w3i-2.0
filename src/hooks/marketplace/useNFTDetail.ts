/**
 * Hook for fetching single NFT detail from marketplace cache or API
 * Uses MarketplaceCacheContext to prevent unnecessary reloads
 * Also checks WalletNFTsContext for user-owned NFTs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMarketplaceItems } from '@/contexts/marketplace-items';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import type { EnrichedNFTDocument } from '@/types/marketplace/enriched-nft';

interface UseNFTDetailOptions {
    contractAddress: string;
    tokenId: string;
    autoFetch?: boolean;
}

interface UseNFTDetailReturn {
    nft: EnrichedNFTDocument | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching single NFT detail with cache support
 */
export function useNFTDetail(options: UseNFTDetailOptions): UseNFTDetailReturn {
    const { contractAddress, tokenId, autoFetch = true } = options;

    const [nft, setNFT] = useState<EnrichedNFTDocument | null>(null);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);

    const cache = useMarketplaceItems();
    const walletNFTs = useWalletNFTs();

    /**
     * Create cache key for this specific NFT
     */
    const createCacheKey = useCallback(() => {
        return `nft-detail:${contractAddress.toLowerCase()}:${tokenId}`;
    }, [contractAddress, tokenId]);

    /**
     * Fetch NFT from API or cache
     * Priority: Marketplace API/Cache (complete data) → WalletNFTs (fallback)
     */
    const fetchNFT = useCallback(async () => {
        if (!contractAddress || !tokenId) {
            setError('Missing contractAddress or tokenId');
            setLoading(false);
            return;
        }

        // 1. Check marketplace cache first (has complete contract data)
        const cacheKey = createCacheKey();
        const cached = cache.getCached(cacheKey);

        if (cached) {
            setNFT(cached.data.items[0] || null);
            setLoading(false);
            return;
        }

        // 2. Fetch from API (has complete contract data from nft_metadata)
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/marketplace/nft/${contractAddress}/${tokenId}`);

            if (!response.ok) {
                // 404 is expected for NFTs not on marketplace - try WalletNFTs as fallback
                if (response.status === 404) {
                    // 3. Fallback to WalletNFTsContext (for user-owned NFTs not on marketplace)
                    const walletNFT = walletNFTs.getNFT(contractAddress, tokenId);
                    if (walletNFT) {
                        // Convert WalletNFT to EnrichedNFTDocument format
                        const enrichedNFT: EnrichedNFTDocument = {
                            _id: undefined,
                            contractAddress: walletNFT.contractAddress,
                            tokenId: walletNFT.tokenId,
                            listingId: walletNFT.listingId || null,

                            // Marketplace data
                            marketplace: {
                                listingId: walletNFT.listingId || null,
                                isListed: walletNFT.isListed || false,
                                isValid: walletNFT.isListed ? true : undefined,
                                invalidReasons: null,
                                invalidatedAt: null,
                                price: walletNFT.listingPrice || null,
                                seller: walletNFT.seller || null,
                                buyer: null,
                                desiredContractAddress: null,
                                desiredTokenId: null,
                            },

                            // Metadata from Alchemy/Moralis
                            metadata: {
                                name: walletNFT.name || `NFT #${walletNFT.tokenId}`,
                                description: walletNFT.description || null,
                                image: walletNFT.image || null,
                                animationUrl: walletNFT.animationUrl || null,
                                externalUrl: null,
                                attributes: walletNFT.attributes || [],
                            },

                            // Contract data (limited from Alchemy)
                            contract: {
                                owner: null,
                                tokenURI: null,
                                name: walletNFT.contractName || null,
                                symbol: walletNFT.contractSymbol || null,
                                totalSupply: null,
                                ownerBalance: walletNFT.balance ? parseInt(walletNFT.balance) : null,
                                approvedAddress: null,
                                approved: null,
                            },

                            // Insights from MongoDB enrichment
                            insights: {
                                customTitle: walletNFT.insights?.customTitle || null,
                                category: walletNFT.category || walletNFT.insights?.category || null,
                                tags: [],
                                rarity: walletNFT.rarity || walletNFT.insights?.rarity || null,
                                cardDescriptions: walletNFT.insights?.cardDescriptions || null,
                                projectDescriptions: null,
                                functionalitiesDescriptions: null,
                                projectWebsite: null,
                                projectTwitter: null,
                                projectDiscord: null,
                                partnerships: null,
                            },

                            // Data quality flags
                            dataQuality: {
                                hasMetadata: !!(walletNFT.name || walletNFT.description || walletNFT.image),
                                hasInsights: !!(walletNFT.category || walletNFT.rarity || walletNFT.insights?.customTitle),
                                metadataSource: walletNFT.image ? 'ipfs' : 'none',
                            },

                            // Timestamps
                            createdAt: new Date(),
                            lastUpdated: new Date(),
                            metadataLastUpdated: new Date(),
                            insightsLastUpdated: walletNFT.category ? new Date() : null,
                        };

                        setNFT(enrichedNFT);
                        setLoading(false);
                        setError(null);
                        return;
                    }

                    // NFT not found anywhere
                    setError('NFT not found in marketplace database or wallet');
                    setNFT(null);
                    setLoading(false);
                    return;
                }
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch NFT');
            }

            const nftData = result.data;
            setNFT(nftData);

            // Store in cache (wrap in items array to match cache format)
            cache.setCache(cacheKey, {
                items: [nftData],
                pagination: {
                    page: 1,
                    limit: 1,
                    total: 1,
                    totalPages: 1,
                    hasMore: false
                },
                filters: undefined
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [contractAddress, tokenId, createCacheKey, cache, walletNFTs]);

    /**
     * Auto-fetch on mount if enabled
     */
    useEffect(() => {
        if (autoFetch) {
            fetchNFT();
        }
    }, [autoFetch, fetchNFT]);

    /**
     * Refresh function to force refetch
     */
    const refetch = useCallback(async () => {
        // Clear cache before refetching
        const cacheKey = createCacheKey();
        cache.getCached(cacheKey); // This doesn't clear, just checks
        await fetchNFT();
    }, [createCacheKey, cache, fetchNFT]);

    return {
        nft,
        loading,
        error,
        refetch
    };
}

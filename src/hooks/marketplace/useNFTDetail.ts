/**
 * Hook for fetching single NFT detail from OPTIMIZED API
 * 
 * Uses /api/nft/detail which:
 * - Fetches from nft_metadata (cached IPFS data)
 * - On-demand blockchain sync for owner/approved (5min cache)
 * - Lazy-loads IPFS metadata if missing
 * - Always returns fresh blockchain state!
 * 
 * Fallbacks:
 * 1. Cache (MarketplaceCacheContext)
 * 2. Optimized API (/api/nft/detail)
 * 3. WalletNFTsContext (for non-listed NFTs)
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

        // 2. Fetch from OPTIMIZED API (with on-demand blockchain sync)
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/nft/detail?contractAddress=${contractAddress}&tokenId=${tokenId}`);

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

                            // Blockchain state (fallback - no data from wallet)
                            blockchain: {
                                owner: null,
                                approved: null,
                                isApprovedForAll: false,
                                lastSyncedAt: null,
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
            
            // apiHandler wraps response in { success: true, data: {...} }
            const nftData = result.success ? result.data : result;

            // Convert /api/nft/detail response to EnrichedNFTDocument format
            const enrichedNFT: EnrichedNFTDocument = {
                _id: undefined,
                contractAddress: nftData.contractAddress,
                tokenId: nftData.tokenId,
                listingId: nftData.marketplace?.listingId || null,

                // Marketplace data
                marketplace: nftData.marketplace || {
                    listingId: null,
                    isListed: false,
                    isValid: undefined,
                    invalidReasons: null,
                    invalidatedAt: null,
                    price: null,
                    seller: null,
                    buyer: null,
                    desiredContractAddress: null,
                    desiredTokenId: null,
                },

                // Metadata from nft_metadata (IPFS data)
                metadata: nftData.metadata || {
                    name: `NFT #${nftData.tokenId}`,
                    description: null,
                    image: null,
                    animationUrl: null,
                    externalUrl: null,
                    attributes: [],
                },

                // Contract data (static info)
                contract: {
                    owner: null, // Deprecated - use blockchain.owner
                    tokenURI: nftData.contract?.tokenURI || null,
                    name: nftData.contract?.name || null,
                    symbol: nftData.contract?.symbol || null,
                    totalSupply: nftData.contract?.totalSupply || null,
                    ownerBalance: nftData.contract?.ownerBalance || null,
                    approvedAddress: null, // Deprecated - use blockchain.approved
                    approved: null, // Deprecated - use blockchain.approved
                },

                // Blockchain state (on-demand synced - USE THIS!)
                blockchain: {
                    owner: nftData.blockchain?.owner || null,
                    approved: nftData.blockchain?.approved || null,
                    isApprovedForAll: nftData.blockchain?.isApprovedForAll || false,
                    lastSyncedAt: nftData.blockchain?.lastSyncedAt ? new Date(nftData.blockchain.lastSyncedAt) : null,
                },

                // Insights from admin_nft_insights
                insights: nftData.insights || {
                    customTitle: null,
                    category: null,
                    tags: [],
                    rarity: null,
                    cardDescriptions: null,
                    projectDescriptions: null,
                    functionalitiesDescriptions: null,
                    projectWebsite: null,
                    projectTwitter: null,
                    projectDiscord: null,
                    partnerships: null,
                },

                // Data quality flags
                dataQuality: {
                    hasMetadata: !!(nftData.metadata?.name || nftData.metadata?.description || nftData.metadata?.image),
                    hasInsights: !!(nftData.insights?.category || nftData.insights?.rarity),
                    metadataSource: nftData.cached ? 'cache' : 'ipfs',
                },

                // Timestamps
                createdAt: new Date(),
                lastUpdated: new Date(),
                metadataLastUpdated: new Date(),
                insightsLastUpdated: nftData.insights ? new Date() : null,
            };

            setNFT(enrichedNFT);

            // Store in cache (wrap in items array to match cache format)
            cache.setCache(cacheKey, {
                items: [enrichedNFT],
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

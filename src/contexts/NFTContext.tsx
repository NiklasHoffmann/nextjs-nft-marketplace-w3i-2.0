/**
 * NFTContext - Unified NFT Data Management
 * 
 * This context provides centralized NFT data management with intelligent caching,
 * granular data access patterns, and performance optimizations.
 * 
 * Architecture:
 * - Types: Defined in /types/nft-context.ts
 * - Utilities: Defined in /utils/05-performance/03-performance-context.ts
 * - API Layer: Defined in /utils/07-api/01-api-nft.ts
 * - Context Implementation: This file (core logic and hooks)
 */

'use client';

// ===== IMPORTS =====

// React and external dependencies
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    ReactNode
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Type definitions
import type {
    NFTContextType,
    NFTData,
    NFTCache,
    NFTCardData,
    NFTDetailData,
    PreloaderHooks,
    AdminHooks,
    NFTIdentifier,
    NFTStats
} from '@/types/nft-context';

import type { AdminNFTInsight, NFTContractInfo } from '@/types';

// Utility functions
import {
    createNFTKey,
    createEmptyNFTData,
    createEmptyErrorState,
    calculateCacheStats,
    isDataFresh,
    filterCacheByAge,
    createBatches,
    delay,
    isValidNFTIdentifier,
    createNFTErrorMessage
} from '@/utils';

// API functions
import {
    fetchNFTMetadata,
    fetchNFTInsights,
    fetchNFTStats
} from '@/utils';

// ===== CONTEXT CREATION =====

/**
 * Context for NFT data management
 */
const NFTContext = createContext<NFTContextType | null>(null);

// ===== CONTEXT PROVIDER =====

/**
 * Props for NFTProvider component
 */
interface NFTProviderProps {
    children: ReactNode;
    /** Cache expiration time in milliseconds (default: 5 minutes) */
    cacheExpiration?: number;
    /** Maximum cache size (default: 1000 items) */
    maxCacheSize?: number;
    /** Enable automatic cache cleanup (default: true) */
    autoCleanup?: boolean;
}

/**
 * NFT Context Provider Component
 * 
 * Provides unified NFT data management with caching, batching, and performance optimizations.
 * Supports granular data access patterns for different use cases.
 */
export function NFTProvider({
    children,
    cacheExpiration = 5 * 60 * 1000, // 5 minutes
    maxCacheSize = 1000,
    autoCleanup = true
}: NFTProviderProps) {

    // ===== STATE MANAGEMENT =====

    /** Main NFT data cache */
    const [cache, setCache] = useState<NFTCache>({});

    /** Global loading state for batch operations */
    const [globalLoading, setGlobalLoading] = useState(false);

    /** Query client for React Query integration */
    const queryClient = useQueryClient();

    // ===== CACHE MANAGEMENT =====

    /**
     * Updates NFT data in cache with partial updates
     */
    const updateNFTData = useCallback((nftAddress: string, tokenId: string, updates: Partial<NFTData>) => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        setCache(prev => ({
            ...prev,
            [nftKey]: {
                ...prev[nftKey] || createEmptyNFTData(nftAddress, tokenId),
                ...updates,
                lastUpdated: Date.now()
            }
        }));
    }, []);

    /**
     * Clears all cached data
     */
    const clearCache = useCallback(() => {
        setCache({});
        queryClient.clear();
    }, [queryClient]);

    /**
     * Removes expired entries from cache
     */
    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        setCache(prev => filterCacheByAge(prev, now - cacheExpiration));
    }, [cacheExpiration]);

    /**
     * Gets cache statistics
     */
    const getCacheStats = useCallback(() => {
        return calculateCacheStats(cache);
    }, [cache]);

    // ===== DATA LOADING =====

    /**
     * Loads complete NFT data for a single NFT (metadata, insights, stats only)
     * Marketplace data should be passed via props from useActiveItems for efficiency
     */
    const loadNFTData = useCallback(async (nftAddress: string, tokenId: string): Promise<NFTData> => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        // Set initial loading state
        updateNFTData(nftAddress, tokenId, {
            loadingState: {
                metadata: true,
                insights: true,
                stats: true,
                contractInfo: true
            },
            errorState: {
                metadata: null,
                insights: null,
                stats: null,
                contractInfo: null
            }
        });

        try {
            // Fetch core NFT data (no marketplace queries to avoid redundancy)
            const [metadataResult, insightsResult, statsResult] = await Promise.allSettled([
                fetchNFTMetadata(nftAddress, tokenId),
                fetchNFTInsights(nftAddress, tokenId),
                fetchNFTStats(nftAddress, tokenId)
            ]);

            // Process results with graceful error handling
            const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
            const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : null;
            const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;

            // Log errors only if they're not "not found" errors
            if (insightsResult.status === 'rejected') {
                const error = insightsResult.reason;
                if (!error?.message?.includes('No insights data found')) {
                    console.warn(`Unexpected insights error for ${nftAddress}/${tokenId}:`, error);
                }
            }

            if (statsResult.status === 'rejected') {
                const error = statsResult.reason;
                if (!error?.message?.includes('No stats data found')) {
                    console.warn(`Unexpected stats error for ${nftAddress}/${tokenId}:`, error);
                }
            }

            // Update cache with final data (marketplace data comes from props)
            const finalData: Partial<NFTData> = {
                metadata: metadata?.metadata || null,
                imageUrl: metadata?.imageUrl || null,
                animationUrl: metadata?.animationUrl || null,
                contractInfo: metadata?.contractInfo
                    ? {
                        name: metadata.contractInfo.name,
                        symbol: metadata.contractInfo.symbol,
                        owner: metadata.contractInfo.owner,
                        totalSupply: metadata.contractInfo.totalSupply
                            ? BigInt(metadata.contractInfo.totalSupply)
                            : undefined,
                        ownerBalance: metadata.contractInfo.ownerBalance
                            ? BigInt(metadata.contractInfo.ownerBalance)
                            : undefined,
                        approvedAddress: metadata.contractInfo.approvedAddress,
                    } as NFTContractInfo
                    : null, // Include contractInfo from API
                insights,
                stats,
                // Default marketplace values (will be overridden by props when available)
                price: null,
                isListed: false,
                seller: null,
                owner: null,
                listingId: null,
                loadingState: {
                    metadata: false,
                    insights: false,
                    stats: false,
                    contractInfo: false
                },
                errorState: {
                    metadata: metadataResult.status === 'rejected' ? createNFTErrorMessage('metadata', metadataResult.reason) : null,
                    // Only set as error if it's not a "not found" error
                    insights: (insightsResult.status === 'rejected' && !insightsResult.reason?.message?.includes('No insights data found'))
                        ? createNFTErrorMessage('insights', insightsResult.reason) : null,
                    stats: (statsResult.status === 'rejected' && !statsResult.reason?.message?.includes('No stats data found'))
                        ? createNFTErrorMessage('stats', statsResult.reason) : null,
                    contractInfo: null
                }
            };

            updateNFTData(nftAddress, tokenId, finalData);

            return cache[nftKey] || createEmptyNFTData(nftAddress, tokenId);

        } catch (error) {
            // Handle critical errors (should rarely happen due to Promise.allSettled)
            console.warn(`Critical error loading NFT data for ${nftAddress}/${tokenId}:`, error);

            updateNFTData(nftAddress, tokenId, {
                loadingState: {
                    metadata: false,
                    insights: false,
                    stats: false,
                    contractInfo: false
                },
                errorState: {
                    metadata: createNFTErrorMessage('metadata', error),
                    insights: createNFTErrorMessage('insights', error),
                    stats: createNFTErrorMessage('stats', error),
                    contractInfo: null
                }
            });

            // Return empty data instead of throwing
            return createEmptyNFTData(nftAddress, tokenId);
        }
    }, [updateNFTData, cache]);

    /**
     * Refreshes NFT data (forces reload)
     */
    const refreshNFTData = useCallback(async (nftAddress: string, tokenId: string) => {
        await loadNFTData(nftAddress, tokenId);
    }, [loadNFTData]);

    /**
     * Loads multiple NFTs in batches
     */
    const loadMultipleNFTs = useCallback(async (identifiers: NFTIdentifier[]): Promise<NFTData[]> => {
        setGlobalLoading(true);

        try {
            const batches = createBatches(identifiers, 5); // Process 5 at a time
            const results: NFTData[] = [];

            for (const batch of batches) {
                const batchPromises = batch.map(({ nftAddress, tokenId }) =>
                    loadNFTData(nftAddress, tokenId)
                );

                const batchResults = await Promise.allSettled(batchPromises);

                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        const { nftAddress, tokenId } = batch[index];
                        results.push(createEmptyNFTData(nftAddress, tokenId));
                    }
                });

                // Small delay between batches
                if (batches.indexOf(batch) < batches.length - 1) {
                    await delay(200);
                }
            }

            return results;

        } finally {
            setGlobalLoading(false);
        }
    }, [loadNFTData]);

    /**
     * Refreshes multiple NFTs
     */
    const refreshMultipleNFTs = useCallback(async (identifiers: NFTIdentifier[]) => {
        await loadMultipleNFTs(identifiers);
    }, [loadMultipleNFTs]);

    // ===== DATA ACCESS =====

    /**
     * Gets complete NFT data
     */
    const getNFTData = useCallback((nftAddress: string, tokenId: string): NFTData | null => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        return cache[nftKey] || null;
    }, [cache]);

    /**
     * Gets optimized data for NFT cards (only essential card data)
     */
    const getNFTCardData = useCallback((nftAddress: string, tokenId: string): NFTCardData | null => {
        const fullData = getNFTData(nftAddress, tokenId);
        if (!fullData) return null;

        return {
            nftAddress,
            tokenId,
            // Metadata (minimal)
            imageUrl: fullData.imageUrl,
            name: fullData.metadata?.name || null,
            contractInfo: fullData.contractInfo || null,
            // Marketplace data
            price: fullData.price,
            listingId: fullData.listingId,
            isListed: fullData.isListed,
            // Card-specific insights
            customTitle: fullData.insights?.customTitle || null,
            category: fullData.insights?.category || null,
            cardDescriptions: fullData.insights?.cardDescriptions || null,
            rarity: fullData.insights?.rarity || null,
            // Stats (card-relevant)
            averageRating: fullData.stats?.averageRating || null,
            ratingCount: fullData.stats?.ratingCount || null,
            likeCount: fullData.stats?.favoriteCount || null,
            watchlistCount: fullData.stats?.watchlistCount || null,
            // Meta
            lastUpdated: fullData.lastUpdated
        };
    }, [getNFTData]);

    /**
     * Gets comprehensive data for NFT detail pages
     */
    const getNFTDetailData = useCallback((nftAddress: string, tokenId: string): NFTDetailData | null => {
        const fullData = getNFTData(nftAddress, tokenId);
        if (!fullData) return null;

        return {
            nftAddress,
            tokenId,
            metadata: fullData.metadata,
            imageUrl: fullData.imageUrl,
            animationUrl: fullData.animationUrl,
            isListed: fullData.isListed,
            price: fullData.price,
            seller: fullData.seller,
            owner: fullData.owner,
            listingId: fullData.listingId,
            insights: fullData.insights,
            stats: fullData.stats,
            contractInfo: fullData.contractInfo,
            lastUpdated: fullData.lastUpdated
        };
    }, [getNFTData]);

    /**
     * Gets all NFTs owned by a specific wallet address
     */
    const getNFTsByWallet = useCallback((walletAddress: string): NFTCardData[] => {
        if (!walletAddress) return [];

        const normalizedWallet = walletAddress.toLowerCase();

        return Object.values(cache)
            .filter(nft => {
                // Only check if this wallet is the actual owner (not seller)
                // Seller is just who listed it on marketplace, owner is who actually owns it
                const owner = nft.owner?.toLowerCase();

                return owner === normalizedWallet;
            })
            .map(nft => ({
                nftAddress: nft.nftAddress,
                tokenId: nft.tokenId,
                // Metadata (minimal)
                imageUrl: nft.imageUrl,
                name: nft.metadata?.name || null,
                contractInfo: nft.contractInfo || null,
                // Marketplace data
                price: nft.price,
                listingId: nft.listingId,
                isListed: nft.isListed,
                // Card-specific insights
                customTitle: nft.insights?.customTitle || null,
                category: nft.insights?.category || null,
                cardDescriptions: nft.insights?.cardDescriptions || null,
                rarity: nft.insights?.rarity || null,
                // Stats (card-relevant)
                averageRating: nft.stats?.averageRating || null,
                ratingCount: nft.stats?.ratingCount || null,
                likeCount: nft.stats?.favoriteCount || null,
                watchlistCount: nft.stats?.watchlistCount || null,
                // Meta
                lastUpdated: nft.lastUpdated
            }))
            .sort((a, b) => b.lastUpdated - a.lastUpdated); // Most recent first
    }, [cache]);

    /**
     * Gets NFTs listed on marketplace by a specific seller
     */
    const getNFTsBySeller = useCallback((sellerAddress: string): NFTCardData[] => {
        if (!sellerAddress) return [];

        const normalizedSeller = sellerAddress.toLowerCase();

        return Object.values(cache)
            .filter(nft => {
                // Only check if this wallet is the seller and NFT is listed
                const seller = nft.seller?.toLowerCase();
                return seller === normalizedSeller && nft.isListed;
            })
            .map(nft => ({
                nftAddress: nft.nftAddress,
                tokenId: nft.tokenId,
                // Metadata (minimal)
                imageUrl: nft.imageUrl,
                name: nft.metadata?.name || null,
                contractInfo: nft.contractInfo || null,
                // Marketplace data
                price: nft.price,
                listingId: nft.listingId,
                isListed: nft.isListed,
                // Card-specific insights
                customTitle: nft.insights?.customTitle || null,
                category: nft.insights?.category || null,
                cardDescriptions: nft.insights?.cardDescriptions || null,
                rarity: nft.insights?.rarity || null,
                // Stats (card-relevant)
                averageRating: nft.stats?.averageRating || null,
                ratingCount: nft.stats?.ratingCount || null,
                likeCount: nft.stats?.favoriteCount || null,
                watchlistCount: nft.stats?.watchlistCount || null,
                // Meta
                lastUpdated: nft.lastUpdated
            }))
            .sort((a, b) => b.lastUpdated - a.lastUpdated); // Most recent first
    }, [cache]);

    /**
     * Updates stats for a specific NFT in the cache
     */
    const updateNFTStats = useCallback((nftAddress: string, tokenId: string, statsUpdates: Partial<NFTStats>) => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        const existingData = cache[nftKey];

        if (existingData) {
            const updatedData: NFTData = {
                ...existingData,
                stats: {
                    contractAddress: existingData.stats?.contractAddress || nftAddress,
                    tokenId: existingData.stats?.tokenId || tokenId,
                    viewCount: existingData.stats?.viewCount || 0,
                    favoriteCount: existingData.stats?.favoriteCount || 0,
                    averageRating: existingData.stats?.averageRating || 0,
                    ratingCount: existingData.stats?.ratingCount || 0,
                    watchlistCount: existingData.stats?.watchlistCount || 0,
                    ...statsUpdates
                }
            };

            setCache(prevCache => ({
                ...prevCache,
                [nftKey]: updatedData
            }));

            console.log('NFTContext: Updated stats for', nftAddress, tokenId, statsUpdates);
        }
    }, [cache]);

    /**
     * Checks if data is fresh (within cache expiration)
     */
    const isDataFreshCheck = useCallback((nftAddress: string, tokenId: string, maxAge?: number): boolean => {
        const data = getNFTData(nftAddress, tokenId);
        if (!data) return false;

        return isDataFresh(data, maxAge || cacheExpiration);
    }, [getNFTData, cacheExpiration]);

    // ===== PRELOADER HOOKS =====

    const preloader: PreloaderHooks = useMemo(() => ({
        preloadNFTData: async (nftAddress: string, tokenId: string) => {
            if (!isDataFreshCheck(nftAddress, tokenId)) {
                await loadNFTData(nftAddress, tokenId);
            }
        },

        preloadMultipleNFTs: async (identifiers: NFTIdentifier[]) => {
            const staleIdentifiers = identifiers.filter(({ nftAddress, tokenId }) =>
                !isDataFreshCheck(nftAddress, tokenId)
            );

            if (staleIdentifiers.length > 0) {
                await loadMultipleNFTs(staleIdentifiers);
            }
        },

        isDataPreloaded: (nftAddress: string, tokenId: string) => {
            return isDataFreshCheck(nftAddress, tokenId);
        },

        getPreloadProgress: () => {
            const allIdentifiers = Object.keys(cache).map(key => {
                const [nftAddress, tokenId] = key.split('_');
                return { nftAddress, tokenId };
            });

            const loadedCount = allIdentifiers.filter(({ nftAddress, tokenId }) =>
                isDataFreshCheck(nftAddress, tokenId)
            ).length;

            return {
                loaded: loadedCount,
                total: allIdentifiers.length
            };
        }
    }), [loadNFTData, loadMultipleNFTs, isDataFreshCheck, cache]);

    // ===== ADMIN HOOKS =====

    const admin: AdminHooks = useMemo(() => ({
        refreshInsights: async (nftAddress: string, tokenId: string) => {
            try {
                const insights = await fetchNFTInsights(nftAddress, tokenId);
                updateNFTData(nftAddress, tokenId, { insights });
            } catch (error) {
                const currentErrorState = getNFTData(nftAddress, tokenId)?.errorState || createEmptyErrorState();
                updateNFTData(nftAddress, tokenId, {
                    errorState: {
                        ...currentErrorState,
                        insights: createNFTErrorMessage('insights', error)
                    }
                });
            }
        },

        refreshAllInsights: async () => {
            const identifiers = Object.keys(cache).map(key => {
                const [nftAddress, tokenId] = key.split('_');
                return { nftAddress, tokenId };
            });

            await Promise.all(
                identifiers.map(({ nftAddress, tokenId }) =>
                    admin.refreshInsights(nftAddress, tokenId)
                )
            );
        },

        getInsightsSummary: () => {
            const allData = Object.values(cache);
            const totalNFTs = allData.length;
            const totalViews = 0; // Not available in current AdminNFTInsight structure
            const totalPrices = allData
                .filter(data => data.price)
                .map(data => parseFloat(data.price || '0'));
            const averagePrice = totalPrices.length > 0
                ? totalPrices.reduce((sum, price) => sum + price, 0) / totalPrices.length
                : 0;

            return {
                totalNFTs,
                totalViews,
                averagePrice
            };
        },

        exportInsightsData: async () => {
            const data = Object.values(cache)
                .filter(nft => nft.insights)
                .map(nft => ({
                    nftAddress: nft.nftAddress,
                    tokenId: nft.tokenId,
                    name: nft.metadata?.name,
                    insights: nft.insights
                }));

            return JSON.stringify(data, null, 2);
        }
    }), [cache, updateNFTData, getNFTData]);

    // ===== AUTO CLEANUP =====

    useEffect(() => {
        if (!autoCleanup) return;

        const cleanup = setInterval(() => {
            clearExpiredCache();

            // Also enforce max cache size
            const cacheEntries = Object.entries(cache);
            if (cacheEntries.length > maxCacheSize) {
                // Remove oldest entries
                const sortedEntries = cacheEntries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
                const entriesToKeep = sortedEntries.slice(-maxCacheSize);
                const newCache = Object.fromEntries(entriesToKeep);
                setCache(newCache);
            }
        }, 60000); // Run every minute

        return () => clearInterval(cleanup);
    }, [autoCleanup, clearExpiredCache, cache, maxCacheSize]);

    // ===== CONTEXT VALUE =====

    const contextValue: NFTContextType = useMemo(() => ({
        // Data access
        getNFTData,
        getNFTCardData,
        getNFTDetailData,
        getNFTsByWallet,
        getNFTsBySeller,

        // Data operations
        loadNFTData,
        refreshNFTData,
        updateNFTData,
        updateNFTStats,
        loadMultipleNFTs,
        refreshMultipleNFTs,

        // Cache management
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isDataFresh: isDataFreshCheck,

        // Specialized hooks
        preloader,
        admin
    }), [
        getNFTData,
        getNFTCardData,
        getNFTDetailData,
        getNFTsByWallet,
        getNFTsBySeller,
        loadNFTData,
        refreshNFTData,
        updateNFTData,
        updateNFTStats,
        loadMultipleNFTs,
        refreshMultipleNFTs,
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isDataFreshCheck,
        preloader,
        admin
    ]);

    return (
        <NFTContext.Provider value={contextValue}>
            {children}
        </NFTContext.Provider>
    );
}

// ===== CUSTOM HOOKS =====

/**
 * Hook to use NFT context
 */
export function useNFTContext(): NFTContextType {
    const context = useContext(NFTContext);
    if (!context) {
        throw new Error('useNFTContext must be used within an NFTProvider');
    }
    return context;
}

/**
 * @deprecated Use useNFTContext() directly for better control and performance
 * Hook for individual NFT data with automatic loading
 */
export function useNFT(nftAddress: string, tokenId: string) {
    const context = useNFTContext();
    const [isLoading, setIsLoading] = useState(false);

    // Get current data
    const nftData = context.getNFTData(nftAddress, tokenId);

    // Auto-load if data doesn't exist or is stale
    useEffect(() => {
        if (!context.isDataFresh(nftAddress, tokenId)) {
            setIsLoading(true);
            context.loadNFTData(nftAddress, tokenId)
                .finally(() => setIsLoading(false));
        }
    }, [context, nftAddress, tokenId]);

    return {
        data: nftData,
        isLoading: isLoading || !nftData,
        refresh: () => context.refreshNFTData(nftAddress, tokenId)
    };
}

/**
 * @deprecated Use useNFTContext() directly for better control and performance
 * Hook for NFT card data (optimized for display)
 */
export function useNFTCardData(nftAddress: string, tokenId: string) {
    const context = useNFTContext();
    const [isLoading, setIsLoading] = useState(false);

    const cardData = context.getNFTCardData(nftAddress, tokenId);

    useEffect(() => {
        if (!context.isDataFresh(nftAddress, tokenId)) {
            setIsLoading(true);
            context.loadNFTData(nftAddress, tokenId)
                .finally(() => setIsLoading(false));
        }
    }, [context, nftAddress, tokenId]);

    return {
        data: cardData,
        isLoading: isLoading || !cardData,
        refresh: () => context.refreshNFTData(nftAddress, tokenId)
    };
}

/**
 * @deprecated Use useNFTContext() directly for better control and performance
 * Hook for NFT detail data (comprehensive)
 */
export function useNFTDetailData(nftAddress: string, tokenId: string) {
    const context = useNFTContext();
    const [isLoading, setIsLoading] = useState(false);

    const detailData = context.getNFTDetailData(nftAddress, tokenId);

    useEffect(() => {
        if (!context.isDataFresh(nftAddress, tokenId)) {
            setIsLoading(true);
            context.loadNFTData(nftAddress, tokenId)
                .finally(() => setIsLoading(false));
        }
    }, [context, nftAddress, tokenId]);

    return {
        data: detailData,
        isLoading: isLoading || !detailData,
        refresh: () => context.refreshNFTData(nftAddress, tokenId)
    };
}

/**
 * Hook for preloading multiple NFTs
 */
export function useNFTPreloader() {
    const { preloader } = useNFTContext();
    return preloader;
}

/**
 * Hook for admin operations
 */
export function useNFTAdmin() {
    const { admin } = useNFTContext();
    return admin;
}

/**
 * Legacy alias for useNFT hook (for backward compatibility)
 */
export const useNFTData = useNFT;

/**
 * Hook for getting NFTs by wallet address
 * Filters already loaded NFTs by owner address only (not seller)
 */
export function useNFTsByWallet(walletAddress: string | undefined) {
    const context = useNFTContext();

    const nfts = useMemo(() => {
        if (!walletAddress) return [];
        return context.getNFTsByWallet(walletAddress);
    }, [context, walletAddress]);

    return {
        nfts,
        count: nfts.length,
        refresh: () => {
            // Refresh all NFTs in the wallet by re-loading their data
            const identifiers = nfts.map(nft => ({
                nftAddress: nft.nftAddress,
                tokenId: nft.tokenId
            }));
            return context.refreshMultipleNFTs(identifiers);
        }
    };
}

/**
 * Hook for getting NFTs listed by seller address
 * Filters marketplace listings by seller address
 */
export function useNFTsBySeller(sellerAddress: string | undefined) {
    const context = useNFTContext();

    const listings = useMemo(() => {
        if (!sellerAddress) return [];
        return context.getNFTsBySeller(sellerAddress);
    }, [context, sellerAddress]);

    return {
        listings,
        count: listings.length,
        refresh: () => {
            // Refresh all listings by re-loading their data
            const identifiers = listings.map(nft => ({
                nftAddress: nft.nftAddress,
                tokenId: nft.tokenId
            }));
            return context.refreshMultipleNFTs(identifiers);
        }
    };
}
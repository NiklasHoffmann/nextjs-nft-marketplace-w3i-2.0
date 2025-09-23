/**
 * NFTContext - Modern NFT Data Management System
 * 
 * This context provides centralized NFT data management using the AggregatedNFT
 * type system. It handles loading, caching, and providing NFT data throughout
 * the application with optimized performance and clean architecture.
 * 
 * Key Features:
 * - Unified AggregatedNFT data structure
 * - Intelligent caching with expiration
 * - Performance optimizations
 * - Clean API without legacy dependencies
 * 
 * @author NFT Marketplace Team
 * @version 2.0
 */

'use client';

// ===== REACT & EXTERNAL IMPORTS =====
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    ReactNode
} from 'react';

// ===== TYPE IMPORTS =====
import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

// ===== UTILITY IMPORTS =====
import {
    createNFTKey,
    createBaseAggregatedNFT,
    mergeAggregatedNFT,
    getDisplayData,
    filterByOwner,
    filterBySeller,
    filterListed,
    sortNFTs
} from '@/utils';

// ===== API IMPORTS =====
import {
    fetchNFTMetadata,
    fetchNFTInsights,
    fetchNFTStats
} from '@/utils';

// ===== CONTEXT INTERFACE =====

/**
 * Modern NFT Context Interface
 * 
 * Provides all necessary methods for NFT data management without legacy dependencies.
 * All methods work with the AggregatedNFT type for consistency and performance.
 */
interface ModernNFTContextType {
    // ===== CORE DATA ACCESS =====

    /**
     * Retrieve a single NFT from cache
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns AggregatedNFT or null if not found/loaded
     */
    getNFT: (nftAddress: string, tokenId: string) => AggregatedNFT | null;

    /**
     * Retrieve all cached NFTs
     * @returns Array of all cached AggregatedNFTs
     */
    getAllNFTs: () => AggregatedNFT[];

    /**
     * Retrieve NFTs filtered by owner address
     * @param ownerAddress - Wallet address of the owner
     * @returns Array of NFTs owned by the specified address
     */
    getNFTsByOwner: (ownerAddress: string) => AggregatedNFT[];

    /**
     * Retrieve NFTs filtered by seller address (listed NFTs)
     * @param sellerAddress - Wallet address of the seller
     * @returns Array of NFTs listed by the specified address
     */
    getNFTsBySeller: (sellerAddress: string) => AggregatedNFT[];

    /**
     * Retrieve all currently listed NFTs
     * @returns Array of listed NFTs
     */
    getListedNFTs: () => AggregatedNFT[];

    // ===== DATA LOADING & REFRESHING =====

    /**
     * Load NFT data from APIs and cache it
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns Promise resolving to loaded AggregatedNFT
     */
    loadNFT: (nftAddress: string, tokenId: string) => Promise<AggregatedNFT>;

    /**
     * Load multiple NFTs in parallel for better performance
     * @param identifiers - Array of NFT identifiers to load
     * @returns Promise resolving to array of loaded AggregatedNFTs
     */
    loadMultipleNFTs: (identifiers: Array<{ nftAddress: string, tokenId: string }>) => Promise<AggregatedNFT[]>;

    /**
     * Force refresh NFT data from APIs, bypassing cache
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns Promise resolving to refreshed AggregatedNFT
     */
    refreshNFT: (nftAddress: string, tokenId: string) => Promise<AggregatedNFT>;

    // ===== CACHE MANAGEMENT =====

    /**
     * Clear all cached NFT data
     */
    clearCache: () => void;

    /**
     * Remove expired entries from cache
     */
    clearExpiredCache: () => void;

    /**
     * Get cache statistics for monitoring
     * @returns Object with cache metrics
     */
    getCacheStats: () => {
        total: number;
        fresh: number;
        expired: number;
        memoryUsage: string;
    };

    /**
     * Check if NFT data is fresh and doesn't need reloading
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns True if data is fresh, false if needs reloading
     */
    isDataFresh: (nftAddress: string, tokenId: string) => boolean;

    // ===== UI DATA HELPERS =====

    /**
     * Get formatted data optimized for NFT cards
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns Formatted data for card display or null if not found
     * @deprecated Use getNFT() with AggregatedNFT instead - LEGACY METHOD
     */
    getNFTCardData: (nftAddress: string, tokenId: string) => NFTCardData | null;

    /**
     * Get comprehensive data optimized for NFT detail pages
     * @param nftAddress - Contract address of the NFT
     * @param tokenId - Token ID of the NFT
     * @returns Comprehensive data for detail display or null if not found
     * @deprecated Use getNFT() with AggregatedNFT instead - LEGACY METHOD
     */
    getNFTDetailData: (nftAddress: string, tokenId: string) => NFTDetailData | null;
}

// ===== HELPER INTERFACES =====

/**
 * NFT Card Data - Optimized for card displays
 * @deprecated Use AggregatedNFT instead - LEGACY INTERFACE
 */
interface NFTCardData {
    nftAddress: string;
    tokenId: string;
    imageUrl: string | null;
    name: string | null;
    price: string | null;
    isListed: boolean;
    customTitle: string | null;
    category: string | null;
    rarity: string | null;
    averageRating: number | null;
    favoriteCount: number | null;
    lastUpdated: number;
}

/**
 * NFT Detail Data - Comprehensive for detail pages
 * @deprecated Use AggregatedNFT instead - LEGACY INTERFACE
 */
interface NFTDetailData {
    // Core NFT Information
    nftAddress: string;
    tokenId: string;
    imageUrl: string | null;
    animationUrl: string | null;

    // Metadata
    metadata: {
        name: string;
        description: string;
        image: string;
        external_url: string;
        attributes: Array<{ trait_type: string; value: any }>;
    } | null;

    // Contract Information
    contractInfo: {
        name: string;
        symbol: string;
        owner: string;
        totalSupply: bigint | null;
    } | null;

    // Marketplace Data
    isListed: boolean;
    price: string | null;
    seller: string | null;
    owner: string | null;
    listingId: string | null;

    // Social & Insights
    insights: {
        contractAddress: string;
        tokenId: string;
        customTitle: string;
        category: string;
        cardDescriptions: string[];
        rarity: string;
    } | null;

    stats: {
        contractAddress: string;
        tokenId: string;
        viewCount: number;
        favoriteCount: number;
        averageRating: number;
        ratingCount: number;
        watchlistCount: number;
    } | null;

    lastUpdated: number;
}

// ===== CACHE CONFIGURATION =====

/**
 * Cache expiration times for different data types (in milliseconds)
 */
const CACHE_EXPIRATION = {
    blockchain: 5 * 60 * 1000,      // 5 minutes - owner changes rarely
    metadata: 12 * 60 * 60 * 1000,  // 12 hours - metadata rarely changes
    marketplace: 30 * 1000,          // 30 seconds - listings change frequently
    social: 2 * 60 * 1000,          // 2 minutes - stats change moderately
    insights: 60 * 60 * 1000        // 1 hour - insights change occasionally
} as const;

/**
 * Maximum number of NFTs to keep in cache
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Auto-cleanup interval (in milliseconds)
 */
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// ===== HELPER FUNCTIONS =====

/**
 * Check if NFT data is fresh based on cache expiration settings
 * @param nft - The AggregatedNFT to check
 * @param cacheExpiration - Cache expiration configuration
 * @returns True if data is fresh, false if expired
 */
function isDataFresh(nft: AggregatedNFT, cacheExpiration: typeof CACHE_EXPIRATION): boolean {
    const age = Date.now() - nft.lastUpdated;

    // Use the shortest expiration time as the overall freshness indicator
    const minExpiration = Math.min(...Object.values(cacheExpiration));
    return age < minExpiration;
}

// ===== CONTEXT CREATION =====

const ModernNFTContext = createContext<ModernNFTContextType | null>(null);

// ===== PROVIDER COMPONENT =====

interface ModernNFTProviderProps {
    children: ReactNode;
    /** Enable automatic cache cleanup */
    autoCleanup?: boolean;
    /** Maximum cache size before forced cleanup */
    maxCacheSize?: number;
    /** Custom cache expiration settings */
    cacheExpiration?: typeof CACHE_EXPIRATION;
}

/**
 * Modern NFT Provider Component
 * 
 * Provides NFT data management throughout the application using the latest
 * AggregatedNFT architecture with optimized caching and performance.
 */
export function ModernNFTProvider({
    children,
    autoCleanup = true,
    maxCacheSize = MAX_CACHE_SIZE,
    cacheExpiration = CACHE_EXPIRATION
}: ModernNFTProviderProps) {

    // ===== STATE MANAGEMENT =====

    /**
     * Main NFT cache - stores all loaded NFT data
     * Key format: `${nftAddress}-${tokenId}`
     */
    const nftCacheRef = useRef(new Map<string, AggregatedNFT>());

    /**
     * Loading tracking - prevents duplicate API calls
     */
    const loadingNFTsRef = useRef(new Set<string>());

    /**
     * Force re-renders when cache changes
     */
    const [cacheVersion, setCacheVersion] = useState(0);

    /**
     * Trigger cache update and re-render
     */
    const updateCache = useCallback(() => {
        setCacheVersion(prev => prev + 1);
    }, []);

    // ===== CORE DATA ACCESS METHODS =====

    /**
     * Retrieve a single NFT from cache
     */
    const getNFT = useCallback((nftAddress: string, tokenId: string): AggregatedNFT | null => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        return nftCacheRef.current.get(nftKey) || null;
    }, [cacheVersion]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Retrieve all cached NFTs
     */
    const getAllNFTs = useCallback((): AggregatedNFT[] => {
        return Array.from(nftCacheRef.current.values());
    }, [cacheVersion]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Retrieve NFTs filtered by owner address
     */
    const getNFTsByOwner = useCallback((ownerAddress: string): AggregatedNFT[] => {
        const allNFTs = getAllNFTs();
        return filterByOwner(allNFTs, ownerAddress);
    }, [getAllNFTs]);

    /**
     * Retrieve NFTs filtered by seller address
     */
    const getNFTsBySeller = useCallback((sellerAddress: string): AggregatedNFT[] => {
        const allNFTs = getAllNFTs();
        return filterBySeller(allNFTs, sellerAddress);
    }, [getAllNFTs]);

    /**
     * Retrieve all currently listed NFTs
     */
    const getListedNFTs = useCallback((): AggregatedNFT[] => {
        const allNFTs = getAllNFTs();
        return filterListed(allNFTs);
    }, [getAllNFTs]);

    // ===== DATA LOADING METHODS =====

    /**
     * Load NFT data from APIs and cache it
     */
    const loadNFT = useCallback(async (nftAddress: string, tokenId: string): Promise<AggregatedNFT> => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        // Check cache first
        const existing = nftCacheRef.current.get(nftKey);
        if (existing && isDataFresh(existing, cacheExpiration)) {
            console.log(`⚡ Using cached NFT data for ${nftAddress}/${tokenId}`);
            return existing;
        }

        // Prevent duplicate loading requests
        if (loadingNFTsRef.current.has(nftKey)) {
            console.log(`⏳ Waiting for existing load request for ${nftAddress}/${tokenId}`);
            // Wait for existing request to finish and return cached result
            while (loadingNFTsRef.current.has(nftKey)) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return nftCacheRef.current.get(nftKey) || createBaseAggregatedNFT(nftAddress, tokenId);
        }

        // Mark as loading
        loadingNFTsRef.current.add(nftKey);
        console.log(`🔄 Loading NFT data for ${nftAddress}/${tokenId}`);

        try {
            // Fetch all data sources in parallel
            const [metadataResult, insightsResult, statsResult] = await Promise.allSettled([
                fetchNFTMetadata(nftAddress, tokenId),
                fetchNFTInsights(nftAddress, tokenId),
                fetchNFTStats(nftAddress, tokenId)
            ]);

            // Process results
            const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
            const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : null;
            const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;

            // Log successful data loading
            console.log(`✅ Loaded NFT data for ${nftAddress}/${tokenId}:`, {
                hasMetadata: !!metadata,
                hasInsights: !!insights,
                hasStats: !!stats,
                contractInfo: metadata?.blockchain
            });

            // Build aggregated NFT data
            const updates: Partial<AggregatedNFT> = {
                // Core blockchain data
                core: {
                    nftAddress: nftAddress as `0x${string}`,
                    tokenId,
                    tokenURI: metadata?.metadata?.image || null,
                    name: metadata?.metadata?.name || null,
                    owner: metadata?.blockchain?.owner as `0x${string}` || null,
                    symbol: metadata?.blockchain?.symbol || null,
                    contractName: metadata?.blockchain?.name || null,
                    contractSymbol: metadata?.blockchain?.symbol || null,
                    totalSupply: metadata?.blockchain?.totalSupply ? parseInt(metadata.blockchain.totalSupply) : null
                },

                // Metadata
                meta: metadata?.metadata ? {
                    name: metadata.metadata.name,
                    description: metadata.metadata.description,
                    image: metadata.imageUrl || metadata.metadata.image,
                    animationUrl: metadata.animationUrl,
                    externalUrl: (metadata.metadata as any).external_url || metadata.metadata.externalUrl,
                    attributes: metadata.metadata.attributes
                } : undefined,

                // Social stats
                social: stats ? {
                    nftAddress: nftAddress as `0x${string}`,
                    tokenId,
                    likeCount: stats.favoriteCount,
                    watchlistCount: stats.watchlistCount,
                    viewCount: stats.viewCount,
                    averageRating: stats.averageRating,
                    ratingCount: stats.ratingCount
                } : undefined,

                // Insights
                insight: insights ? {
                    nftAddress: nftAddress as `0x${string}`,
                    tokenId,
                    customTitle: insights.customTitle,
                    category: insights.category,
                    cardDescription: Array.isArray(insights.cardDescriptions) ? insights.cardDescriptions : [],
                    rarity: insights.rarity as any,
                    createdBy: insights.createdBy as `0x${string}`,
                    updatedAt: insights.updatedAt
                } : undefined,

                // Data sources tracking
                sources: {
                    blockchain: !!metadata?.blockchain,
                    metadata: !!metadata?.metadata,
                    marketplace: false, // Will be set by marketplace data
                    social: !!stats,
                    insights: !!insights
                },

                lastUpdated: Date.now()
            };

            // Create or update aggregated NFT
            let aggregatedNFT = nftCacheRef.current.get(nftKey);
            if (aggregatedNFT) {
                aggregatedNFT = mergeAggregatedNFT(aggregatedNFT, updates);
            } else {
                const baseNFT = createBaseAggregatedNFT(nftAddress, tokenId);
                aggregatedNFT = mergeAggregatedNFT(baseNFT, updates);
            }

            // Update cache
            nftCacheRef.current.set(nftKey, aggregatedNFT);
            updateCache();

            console.log(`💾 Cached NFT data for ${nftAddress}/${tokenId}`);
            return aggregatedNFT;

        } catch (error) {
            console.error(`❌ Failed to load NFT data for ${nftAddress}/${tokenId}:`, error);

            // Return existing data or create base NFT on error
            const existing = nftCacheRef.current.get(nftKey);
            if (existing) {
                return existing;
            }

            const baseNFT = createBaseAggregatedNFT(nftAddress, tokenId);
            nftCacheRef.current.set(nftKey, baseNFT);
            updateCache();
            return baseNFT;

        } finally {
            // Remove from loading set
            loadingNFTsRef.current.delete(nftKey);
        }
    }, [cacheExpiration, updateCache]);

    /**
     * Load multiple NFTs in parallel for better performance
     */
    const loadMultipleNFTs = useCallback(async (
        identifiers: Array<{ nftAddress: string, tokenId: string }>
    ): Promise<AggregatedNFT[]> => {
        console.log(`🔄 Loading ${identifiers.length} NFTs in parallel`);

        const loadPromises = identifiers.map(({ nftAddress, tokenId }) =>
            loadNFT(nftAddress, tokenId)
        );

        const results = await Promise.all(loadPromises);
        console.log(`✅ Loaded ${results.length} NFTs successfully`);

        return results;
    }, [loadNFT]);

    /**
     * Force refresh NFT data from APIs, bypassing cache
     */
    const refreshNFT = useCallback(async (nftAddress: string, tokenId: string): Promise<AggregatedNFT> => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        // Remove from cache to force reload
        nftCacheRef.current.delete(nftKey);
        console.log(`🔄 Force refreshing NFT data for ${nftAddress}/${tokenId}`);

        // Load fresh data
        return loadNFT(nftAddress, tokenId);
    }, [loadNFT]);

    // ===== CACHE MANAGEMENT METHODS =====

    /**
     * Clear all cached NFT data
     */
    const clearCache = useCallback(() => {
        console.log(`🗑️ Clearing all NFT cache (${nftCacheRef.current.size} entries)`);
        nftCacheRef.current.clear();
        loadingNFTsRef.current.clear();
        updateCache();
    }, [updateCache]);

    /**
     * Remove expired entries from cache
     */
    const clearExpiredCache = useCallback(() => {
        const initialSize = nftCacheRef.current.size;
        let removedCount = 0;

        for (const [key, nft] of nftCacheRef.current.entries()) {
            if (!isDataFresh(nft, cacheExpiration)) {
                nftCacheRef.current.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`🧹 Cleaned ${removedCount} expired entries from cache (${initialSize} -> ${nftCacheRef.current.size})`);
            updateCache();
        }
    }, [cacheExpiration, updateCache]);

    /**
     * Get cache statistics for monitoring
     */
    const getCacheStats = useCallback(() => {
        const allNFTs = Array.from(nftCacheRef.current.values());
        const fresh = allNFTs.filter(nft => isDataFresh(nft, cacheExpiration)).length;
        const expired = allNFTs.length - fresh;

        // Rough memory usage calculation
        const memoryUsage = `~${Math.round(JSON.stringify(allNFTs).length / 1024)}KB`;

        return {
            total: allNFTs.length,
            fresh,
            expired,
            memoryUsage
        };
    }, [cacheExpiration, cacheVersion]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Check if NFT data is fresh and doesn't need reloading
     */
    const isNFTDataFresh = useCallback((nftAddress: string, tokenId: string): boolean => {
        const nft = getNFT(nftAddress, tokenId);
        return nft ? isDataFresh(nft, cacheExpiration) : false;
    }, [getNFT, cacheExpiration]);

    // ===== UI DATA HELPERS =====

    /**
     * Get formatted data optimized for NFT cards
     * @deprecated Use getNFT() with AggregatedNFT instead - LEGACY FUNCTION
     */
    const getNFTCardData = useCallback((nftAddress: string, tokenId: string): NFTCardData | null => {
        const nft = getNFT(nftAddress, tokenId);
        if (!nft) return null;

        const display = getDisplayData(nft);

        return {
            nftAddress: nft.nftAddress,
            tokenId: nft.tokenId,
            imageUrl: display.image || nft.meta?.image || null,
            name: display.name || nft.meta?.name || null,
            price: display.price ? display.price.toString() : null,
            isListed: display.isListed,
            customTitle: display.customTitle,
            category: display.category,
            rarity: display.rarity,
            averageRating: display.averageRating,
            favoriteCount: display.likeCount,
            lastUpdated: display.lastUpdated
        };
    }, [getNFT]);

    /**
     * Get comprehensive data optimized for NFT detail pages
     * @deprecated Use getNFT() with AggregatedNFT instead - LEGACY FUNCTION
     */
    const getNFTDetailData = useCallback((nftAddress: string, tokenId: string): NFTDetailData | null => {
        const nft = getNFT(nftAddress, tokenId);
        if (!nft) return null;

        console.log(`🔍 getNFTDetailData core contract data for ${nftAddress}/${tokenId}:`, {
            contractName: nft.core.contractName,
            symbol: nft.core.symbol,
            totalSupply: nft.core.totalSupply,
            owner: nft.core.owner
        });

        const display = getDisplayData(nft);

        return {
            // Core NFT Information
            nftAddress: nft.nftAddress,
            tokenId: nft.tokenId,
            imageUrl: display.image || nft.meta?.image || null,
            animationUrl: nft.meta?.animationUrl || null,

            // Metadata
            metadata: nft.meta ? {
                name: nft.meta.name || '',
                description: nft.meta.description || '',
                image: nft.meta.image || '',
                external_url: nft.meta.externalUrl || '',
                attributes: nft.meta.attributes?.filter(attr => attr.trait_type).map(attr => ({
                    trait_type: attr.trait_type!,
                    value: attr.value
                })) || []
            } : null,

            // Contract Information
            contractInfo: {
                name: nft.core.contractName || '',
                symbol: nft.core.symbol || '',
                owner: nft.core.owner || '0x0',
                totalSupply: nft.core.totalSupply ? BigInt(nft.core.totalSupply) : null
            },

            // Marketplace Data
            isListed: display.isListed,
            price: display.price ? display.price.toString() : null,
            seller: display.seller,
            owner: display.owner,
            listingId: display.listingId,

            // Social & Insights
            insights: nft.insight ? {
                contractAddress: nft.nftAddress,
                tokenId: nft.tokenId,
                customTitle: nft.insight.customTitle || '',
                category: nft.insight.category || '',
                cardDescriptions: Array.isArray(nft.insight.cardDescription) ? nft.insight.cardDescription : [],
                rarity: (nft.insight.rarity as string) || ''
            } : null,

            stats: nft.social ? {
                contractAddress: nft.nftAddress,
                tokenId: nft.tokenId,
                viewCount: nft.social.viewCount || 0,
                favoriteCount: nft.social.likeCount || 0,
                averageRating: nft.social.averageRating || 0,
                ratingCount: nft.social.ratingCount || 0,
                watchlistCount: nft.social.watchlistCount || 0
            } : null,

            lastUpdated: nft.lastUpdated
        };
    }, [getNFT]);

    // ===== AUTO CLEANUP =====

    /**
     * Automatic cache cleanup effect
     */
    useEffect(() => {
        if (!autoCleanup) return;

        console.log('🔧 Starting automatic cache cleanup');

        const cleanup = setInterval(() => {
            // Remove expired entries
            clearExpiredCache();

            // Enforce max cache size
            if (nftCacheRef.current.size > maxCacheSize) {
                const entries = Array.from(nftCacheRef.current.entries());
                const sortedEntries = entries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
                const entriesToKeep = sortedEntries.slice(-maxCacheSize);

                nftCacheRef.current.clear();
                entriesToKeep.forEach(([key, nft]) => {
                    nftCacheRef.current.set(key, nft);
                });

                console.log(`📏 Enforced max cache size: ${entries.length} -> ${entriesToKeep.length}`);
                updateCache();
            }
        }, CLEANUP_INTERVAL);

        return () => {
            console.log('🛑 Stopping automatic cache cleanup');
            clearInterval(cleanup);
        };
    }, [autoCleanup, clearExpiredCache, maxCacheSize, updateCache]);

    // ===== CONTEXT VALUE =====

    /**
     * Memoized context value to prevent unnecessary re-renders
     */
    const contextValue: ModernNFTContextType = useMemo(() => ({
        // Core data access
        getNFT,
        getAllNFTs,
        getNFTsByOwner,
        getNFTsBySeller,
        getListedNFTs,

        // Data loading & refreshing
        loadNFT,
        loadMultipleNFTs,
        refreshNFT,

        // Cache management
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isDataFresh: isNFTDataFresh,

        // UI data helpers
        getNFTCardData,
        getNFTDetailData
    }), [
        getNFT,
        getAllNFTs,
        getNFTsByOwner,
        getNFTsBySeller,
        getListedNFTs,
        loadNFT,
        loadMultipleNFTs,
        refreshNFT,
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isNFTDataFresh,
        getNFTCardData,
        getNFTDetailData
    ]);

    return (
        <ModernNFTContext.Provider value={contextValue}>
            {children}
        </ModernNFTContext.Provider>
    );
}

// ===== CUSTOM HOOKS =====

/**
 * Hook to access the modern NFT context
 * 
 * @throws Error if used outside of ModernNFTProvider
 * @returns ModernNFTContextType with all NFT management methods
 */
export function useModernNFTContext(): ModernNFTContextType {
    const context = useContext(ModernNFTContext);
    if (!context) {
        throw new Error('useModernNFTContext must be used within a ModernNFTProvider');
    }
    return context;
}

/**
 * Hook for loading and managing a single NFT
 * 
 * @param nftAddress - Contract address of the NFT
 * @param tokenId - Token ID of the NFT
 * @param autoLoad - Whether to automatically load the NFT on mount
 * @returns Object with NFT data, loading state, and management functions
 */
export function useModernNFT(nftAddress: string, tokenId: string, autoLoad: boolean = true) {
    const context = useModernNFTContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get NFT from cache
    const nft = context.getNFT(nftAddress, tokenId);

    // Load NFT function
    const load = useCallback(async () => {
        if (!nftAddress || !tokenId) return;

        setIsLoading(true);
        setError(null);

        try {
            await context.loadNFT(nftAddress, tokenId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load NFT');
        } finally {
            setIsLoading(false);
        }
    }, [context, nftAddress, tokenId]);

    // Refresh function
    const refresh = useCallback(async () => {
        if (!nftAddress || !tokenId) return;

        setIsLoading(true);
        setError(null);

        try {
            await context.refreshNFT(nftAddress, tokenId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh NFT');
        } finally {
            setIsLoading(false);
        }
    }, [context, nftAddress, tokenId]);

    // Auto-load effect
    useEffect(() => {
        if (autoLoad && nftAddress && tokenId && !nft && !context.isDataFresh(nftAddress, tokenId)) {
            load();
        }
    }, [autoLoad, nftAddress, tokenId, nft, context, load]);

    return {
        nft,
        isLoading,
        error,
        load,
        refresh,
        isDataFresh: nft ? context.isDataFresh(nftAddress, tokenId) : false
    };
}

// ===== EXPORTS =====

// Export the provider and hooks
export { ModernNFTProvider as NFTProvider };
export { useModernNFTContext as useNFTContext };
export { useModernNFT as useNFT };

// Export types for external use
export type {
    ModernNFTContextType as NFTContextType,
    NFTCardData, /** @deprecated Use AggregatedNFT instead */
    NFTDetailData  /** @deprecated Use AggregatedNFT instead */
};
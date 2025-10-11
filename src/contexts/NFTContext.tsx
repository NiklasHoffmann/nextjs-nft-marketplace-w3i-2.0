/**
 * NFTContext v2.0 - High-Performance NFT Data Management
 * 
 * Complete rewrite with:
 * - Zero UI jumps through optimistic loading
 * - Promise-based caching (no polling loops!)
 * - Selective re-renders via useSyncExternalStore
 * - Automatic revalidation with stale-while-revalidate
 * - Stable references for maximum performance
 * 
 * @version 2.0.0
 * @date 2025-10-07
 */

'use client';

import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    ReactNode,
    useSyncExternalStore
} from 'react';

import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

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

import {
    fetchNFTMetadata,
    fetchNFTInsights,
    fetchNFTStats,
    fetchMarketplaceListing
} from '@/utils';

// ===== TYPES =====

interface CacheEntry {
    data: AggregatedNFT;
    timestamp: number;
    loadedAt: number;
    isLoading: boolean;
    error: Error | null;
}

interface LoadingPromise {
    promise: Promise<AggregatedNFT>;
    timestamp: number;
}

interface ModernNFTContextType {
    // Core data access
    getNFT: (nftAddress: string, tokenId: string) => AggregatedNFT | null;
    getAllNFTs: () => AggregatedNFT[];
    getNFTsByOwner: (ownerAddress: string) => AggregatedNFT[];
    getNFTsBySeller: (sellerAddress: string) => AggregatedNFT[];
    getListedNFTs: () => AggregatedNFT[];

    // Data loading & refreshing
    loadNFT: (nftAddress: string, tokenId: string) => Promise<AggregatedNFT>;
    loadMultipleNFTs: (identifiers: Array<{ nftAddress: string, tokenId: string }>) => Promise<AggregatedNFT[]>;
    loadAllNFTs: () => Promise<AggregatedNFT[]>;
    refreshNFT: (nftAddress: string, tokenId: string) => Promise<AggregatedNFT>;

    // Cache management
    clearCache: () => void;
    clearExpiredCache: () => void;
    getCacheStats: () => { total: number; fresh: number; expired: number; memoryUsage: string; activeSubscribers: number; globalSubscribers: number };
    isDataFresh: (nftAddress: string, tokenId: string) => boolean;

    // UI helpers
    getDisplayData: (nft: AggregatedNFT) => ReturnType<typeof getDisplayData>;
    sortNFTs: (nfts: AggregatedNFT[], sortBy?: 'price' | 'name' | 'recent') => AggregatedNFT[];

    // Internal - store reference for hooks
    _store?: NFTCacheStore;
}

// ===== CONSTANTS =====

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes - fresh data
const STALE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes - stale data (still show, but revalidate)
const LOADING_TIMEOUT_MS = 30 * 1000; // 30 seconds max for loading
const LOCALSTORAGE_KEY = 'nft-cache-v2'; // Version key for localStorage
const LOCALSTORAGE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days max age for localStorage

// ===== CONTEXT =====

const ModernNFTContext = createContext<ModernNFTContextType | null>(null);

// ===== CACHE STORE (External Store for useSyncExternalStore) =====

class NFTCacheStore {
    private cache = new Map<string, CacheEntry>();
    private loadingPromises = new Map<string, LoadingPromise>();

    // Per-NFT subscribers for selective re-renders
    private nftSubscribers = new Map<string, Set<() => void>>();
    // Global subscribers (for getAllNFTs etc.)
    private globalSubscribers = new Set<() => void>();

    // Subscribe to specific NFT changes
    subscribeToNFT = (nftKey: string, callback: () => void) => {
        if (!this.nftSubscribers.has(nftKey)) {
            this.nftSubscribers.set(nftKey, new Set());
        }
        this.nftSubscribers.get(nftKey)!.add(callback);

        return () => {
            const subscribers = this.nftSubscribers.get(nftKey);
            if (subscribers) {
                subscribers.delete(callback);
                // Cleanup empty subscriber sets
                if (subscribers.size === 0) {
                    this.nftSubscribers.delete(nftKey);
                }
            }
        };
    };

    // Subscribe to all cache changes (for global operations)
    subscribeGlobal = (callback: () => void) => {
        this.globalSubscribers.add(callback);
        return () => this.globalSubscribers.delete(callback);
    };

    // Notify specific NFT subscribers
    private notifyNFT(nftKey: string) {
        const subscribers = this.nftSubscribers.get(nftKey);
        if (subscribers) {
            subscribers.forEach(callback => callback());
        }
    }

    // Notify all global subscribers
    private notifyGlobal() {
        this.globalSubscribers.forEach(callback => callback());
    }

    // Notify both specific NFT and global subscribers
    private notify(nftKey?: string) {
        if (nftKey) {
            this.notifyNFT(nftKey);
        }
        this.notifyGlobal();
    }

    // Get snapshot of entire cache (for global subscribers)
    getSnapshot = () => {
        return this.cache;
    };

    // Get snapshot of specific NFT (for per-NFT subscribers)
    getNFTSnapshot = (nftKey: string) => {
        return this.cache.get(nftKey);
    };

    // Get single NFT from cache
    get(key: string): CacheEntry | undefined {
        return this.cache.get(key);
    }

    // Set NFT in cache and notify subscribers
    set(key: string, entry: CacheEntry) {
        const hadEntry = this.cache.has(key);
        const oldEntry = this.cache.get(key);

        this.cache.set(key, entry);

        // Only notify if data actually changed
        if (!hadEntry || oldEntry?.data !== entry.data || oldEntry?.isLoading !== entry.isLoading) {
            this.notify(key);
        }
    }

    // Get all entries
    getAll(): CacheEntry[] {
        return Array.from(this.cache.values());
    }

    // Clear entire cache
    clear() {
        this.cache.clear();
        this.loadingPromises.clear();
        this.notifyGlobal();
    }

    // Clear expired entries
    clearExpired(expirationMs: number) {
        const now = Date.now();
        let changed = false;
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > expirationMs) {
                keysToDelete.push(key);
                changed = true;
            }
        }

        // Delete and notify for each key
        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.notify(key);
        });

        if (changed) {
            this.notifyGlobal();
        }
    }

    // Get or create loading promise (prevents duplicate requests)
    getOrCreateLoadingPromise(
        key: string,
        factory: () => Promise<AggregatedNFT>
    ): Promise<AggregatedNFT> {
        const existing = this.loadingPromises.get(key);

        if (existing) {
            // Check if promise is still fresh (not timed out)
            if (Date.now() - existing.timestamp < LOADING_TIMEOUT_MS) {
                return existing.promise;
            }
            // Timeout - remove old promise
            this.loadingPromises.delete(key);
        }

        // Create new loading promise
        const promise = factory()
            .finally(() => {
                // Clean up after loading completes
                this.loadingPromises.delete(key);
            });

        this.loadingPromises.set(key, {
            promise,
            timestamp: Date.now()
        });

        return promise;
    }

    // Get cache statistics
    getStats() {
        const now = Date.now();
        let fresh = 0;
        let expired = 0;

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp < CACHE_EXPIRATION_MS) {
                fresh++;
            } else {
                expired++;
            }
        }

        // Calculate approximate memory usage
        const memoryBytes = this.cache.size * 2048; // Rough estimate: 2KB per NFT
        const memoryKB = memoryBytes / 1024;
        const memoryUsage = memoryKB > 1024
            ? `${(memoryKB / 1024).toFixed(2)} MB`
            : `${memoryKB.toFixed(2)} KB`;

        return {
            total: this.cache.size,
            fresh,
            expired,
            memoryUsage,
            activeSubscribers: this.nftSubscribers.size,
            globalSubscribers: this.globalSubscribers.size
        };
    }

    // ===== LOCALSTORAGE PERSISTENCE =====

    /**
     * Save cache to localStorage (Layer 1 - Client Cache)
     */
    saveToLocalStorage() {
        if (typeof window === 'undefined') return; // SSR check

        try {
            const cacheData: Record<string, {
                data: AggregatedNFT;
                timestamp: number;
            }> = {};

            // Convert Map to plain object
            for (const [key, entry] of this.cache.entries()) {
                // Only save non-loading entries that aren't too old
                if (!entry.isLoading && !entry.error) {
                    const age = Date.now() - entry.timestamp;
                    if (age < LOCALSTORAGE_MAX_AGE) {
                        cacheData[key] = {
                            data: entry.data,
                            timestamp: entry.timestamp
                        };
                    }
                }
            }

            const serialized = JSON.stringify({
                version: 2,
                timestamp: Date.now(),
                data: cacheData
            });

            localStorage.setItem(LOCALSTORAGE_KEY, serialized);
        } catch (err) {
            console.warn('⚠️ Failed to save cache to localStorage:', err);
            // Storage quota exceeded - clear old cache
            try {
                localStorage.removeItem(LOCALSTORAGE_KEY);
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Restore cache from localStorage (Layer 1 - Client Cache)
     * Returns number of entries restored
     */
    restoreFromLocalStorage(): number {
        if (typeof window === 'undefined') return 0; // SSR check

        try {
            const stored = localStorage.getItem(LOCALSTORAGE_KEY);
            if (!stored) {

                return 0;
            }

            const parsed = JSON.parse(stored);

            // Version check
            if (parsed.version !== 2) {

                localStorage.removeItem(LOCALSTORAGE_KEY);
                return 0;
            }

            // Age check
            const cacheAge = Date.now() - parsed.timestamp;
            if (cacheAge > LOCALSTORAGE_MAX_AGE) {

                localStorage.removeItem(LOCALSTORAGE_KEY);
                return 0;
            }

            // Restore entries
            const cacheData = parsed.data || {};
            let restoredCount = 0;

            for (const [key, value] of Object.entries(cacheData)) {
                const entry = value as { data: AggregatedNFT; timestamp: number };

                this.cache.set(key, {
                    data: entry.data,
                    timestamp: entry.timestamp,
                    loadedAt: entry.timestamp,
                    isLoading: false,
                    error: null
                });
                restoredCount++;
            }

            // Notify all subscribers about restored cache
            this.notifyGlobal();

            return restoredCount;
        } catch (err) {
            console.warn('⚠️ Failed to restore cache from localStorage:', err);
            // Clear corrupted cache
            try {
                localStorage.removeItem(LOCALSTORAGE_KEY);
            } catch (e) {
                // Ignore
            }
            return 0;
        }
    }

    /**
     * Clear localStorage cache
     */
    clearLocalStorage() {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(LOCALSTORAGE_KEY);

        } catch (err) {
            console.warn('⚠️ Failed to clear localStorage:', err);
        }
    }
}

// ===== PROVIDER =====

export function ModernNFTProvider({
    children,
    cacheExpiration = CACHE_EXPIRATION_MS
}: {
    children: ReactNode;
    cacheExpiration?: number;
}) {
    // Single source of truth - external store
    const storeRef = useRef(new NFTCacheStore());
    const store = storeRef.current;

    // Store cacheExpiration in ref to avoid useCallback dependencies
    const cacheExpirationRef = useRef(cacheExpiration);
    cacheExpirationRef.current = cacheExpiration;

    // ===== HELPER FUNCTIONS =====

    const isDataFreshInternal = useCallback((entry: CacheEntry): boolean => {
        return Date.now() - entry.timestamp < cacheExpirationRef.current;
    }, []); // no dependencies - use ref

    const isDataStale = useCallback((entry: CacheEntry): boolean => {
        const age = Date.now() - entry.timestamp;
        return age > cacheExpirationRef.current && age < STALE_EXPIRATION_MS;
    }, []); // no dependencies - use ref

    // ===== CORE LOADING FUNCTION =====

    const loadNFTInternal = useCallback(async (
        nftAddress: string,
        tokenId: string,
        forceRefresh: boolean = false
    ): Promise<AggregatedNFT> => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const existing = store.get(nftKey);
            if (existing) {
                // IMPORTANT: Force refresh if listing data is missing (added in v2.1)
                // This ensures old cached data gets updated with marketplace info
                const hasListingData = existing.data.sources?.marketplace === true;
                if (!hasListingData) {
                    // Continue to load fresh data below
                } else {
                    // Fresh data - return immediately
                    if (isDataFreshInternal(existing)) {
                        return existing.data;
                    }

                    // Stale data - return but trigger background refresh
                    if (isDataStale(existing)) {
                        // Return stale data immediately (no UI jump!)
                        const staleData = existing.data;

                        // Trigger background revalidation (don't await!)
                        loadNFTInternal(nftAddress, tokenId, true).catch(err => {
                            console.error(`Background revalidation failed for ${nftAddress}/${tokenId}:`, err);
                        });

                        return staleData;
                    }
                }
            }
        }

        // Use or create loading promise (prevents duplicate requests)
        return store.getOrCreateLoadingPromise(nftKey, async () => {

            // Create optimistic placeholder immediately (prevents UI jump!)
            const placeholder = createBaseAggregatedNFT(nftAddress, tokenId);
            store.set(nftKey, {
                data: placeholder,
                timestamp: Date.now(),
                loadedAt: Date.now(),
                isLoading: true,
                error: null
            });

            try {
                // Fetch all data in parallel

                const [metadataResult, insightsResult, statsResult, listingResult] = await Promise.allSettled([
                    fetchNFTMetadata(nftAddress, tokenId),
                    fetchNFTInsights(nftAddress, tokenId),
                    fetchNFTStats(nftAddress, tokenId),
                    fetchMarketplaceListing(nftAddress, tokenId)
                ]);

                // Extract results
                const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
                const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : null;
                const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
                const listing = listingResult.status === 'fulfilled' ? listingResult.value : null;



                // Convert API responses to AggregatedNFT format
                const updates: Partial<AggregatedNFT> = {
                    // Listing status from TheGraph
                    listed: listing?.isListed || false,
                    listing: listing || undefined,

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
                        likeCount: stats.favoriteCount || 0,
                        watchlistCount: stats.watchlistCount || 0,
                        viewCount: stats.viewCount || 0,
                        averageRating: stats.averageRating || 0,
                        ratingCount: stats.ratingCount || 0
                    } : undefined,

                    // Insights - Map ALL insight fields for comprehensive display
                    insight: insights ? {
                        nftAddress: nftAddress as `0x${string}`,
                        tokenId,
                        customTitle: insights.customTitle || undefined,
                        category: insights.category || undefined,
                        cardDescription: Array.isArray(insights.cardDescriptions) ? insights.cardDescriptions : undefined,
                        rarity: insights.rarity as any,
                        tags: insights.tags || undefined,
                        // Project information
                        projectDescriptions: insights.projectDescriptions || undefined,
                        functionalitiesDescriptions: insights.functionalitiesDescriptions || undefined,
                        specificDescriptions: insights.specificDescriptions || undefined,
                        descriptions: insights.descriptions || undefined,
                        description: insights.description || undefined,
                        // Social links
                        projectWebsite: insights.projectWebsite || undefined,
                        projectTwitter: insights.projectTwitter || undefined,
                        projectDiscord: insights.projectDiscord || undefined,
                        // Partnerships
                        partnerships: insights.partnerships || undefined,
                        partnershipDetails: insights.partnershipDetails || undefined,
                        // Metadata
                        createdBy: insights.createdBy as `0x${string}` || undefined,
                        createdAt: insights.createdAt || undefined,
                        updatedAt: insights.updatedAt
                    } : undefined,

                    // Data sources tracking
                    sources: {
                        blockchain: !!metadata?.blockchain,
                        metadata: !!metadata?.metadata,
                        marketplace: !!listing,
                        social: !!stats,
                        insights: !!insights
                    },

                    // Update timestamp
                    lastUpdated: Date.now()
                };

                // Merge all data
                const aggregatedNFT = mergeAggregatedNFT(placeholder, updates);

                // Update cache with loaded data
                store.set(nftKey, {
                    data: aggregatedNFT,
                    timestamp: Date.now(),
                    loadedAt: Date.now(),
                    isLoading: false,
                    error: null
                });

                return aggregatedNFT;

            } catch (error) {
                console.error(`❌ Failed to load NFT: ${nftAddress}/${tokenId}`, error);

                // Store error in cache
                store.set(nftKey, {
                    data: placeholder,
                    timestamp: Date.now(),
                    loadedAt: Date.now(),
                    isLoading: false,
                    error: error instanceof Error ? error : new Error(String(error))
                });

                throw error;
            }
        });
    }, []); // no dependencies - store and helpers are stable via refs

    // ===== PUBLIC API =====

    const getNFT = useCallback((nftAddress: string, tokenId: string): AggregatedNFT | null => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        const entry = store.get(nftKey);
        return entry?.data || null;
    }, []); // store is a ref, always stable

    const getAllNFTs = useCallback((): AggregatedNFT[] => {
        return store.getAll().map(entry => entry.data);
    }, []); // store is a ref, always stable

    const getNFTsByOwner = useCallback((ownerAddress: string): AggregatedNFT[] => {
        const allNFTs = store.getAll().map(entry => entry.data);
        return filterByOwner(allNFTs, ownerAddress);
    }, []); // use store directly, not getAllNFTs

    const getNFTsBySeller = useCallback((sellerAddress: string): AggregatedNFT[] => {
        const allNFTs = store.getAll().map(entry => entry.data);
        return filterBySeller(allNFTs, sellerAddress);
    }, []); // use store directly, not getAllNFTs

    const getListedNFTs = useCallback((): AggregatedNFT[] => {
        const allNFTs = store.getAll().map(entry => entry.data);
        return filterListed(allNFTs);
    }, []); // use store directly, not getAllNFTs

    const loadNFT = useCallback((nftAddress: string, tokenId: string): Promise<AggregatedNFT> => {
        return loadNFTInternal(nftAddress, tokenId, false);
    }, []); // loadNFTInternal is stable

    const loadMultipleNFTs = useCallback(async (
        identifiers: Array<{ nftAddress: string, tokenId: string }>
    ): Promise<AggregatedNFT[]> => {

        const promises = identifiers.map(({ nftAddress, tokenId }) =>
            loadNFTInternal(nftAddress, tokenId, false)
        );

        return Promise.all(promises);
    }, []); // use loadNFTInternal directly

    const loadAllNFTs = useCallback(async (): Promise<AggregatedNFT[]> => {

        try {
            // Use GraphQL GET_ACTIVE_ITEMS to fetch all listed NFTs
            const query = `{
                items(first: 1000, where: { isListed: true }, orderBy: listingId, orderDirection: desc) {
                    nftAddress
                    tokenId
                    listingId
                    price
                    seller
                    buyer
                    isListed
                    desiredNftAddress
                    desiredTokenId
                }
            }`;

            const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/nftmarketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                throw new Error('GraphQL query failed');
            }

            const items = result.data?.items || [];

            if (items.length === 0) {
                console.warn('⚠️ No marketplace items found');
                return [];
            }

            // Extract unique NFT identifiers
            const allNFTIdentifiers: Array<{ nftAddress: string, tokenId: string }> = items.map((item: any) => ({
                nftAddress: item.nftAddress,
                tokenId: item.tokenId
            }));

            // Load all NFTs in parallel
            const loadedNFTs = await loadMultipleNFTs(allNFTIdentifiers);

            return loadedNFTs;
        } catch (err) {
            console.error('❌ Failed to preload NFTs:', err);
            // Don't throw - preloading failure shouldn't break the app
            return [];
        }
    }, []); // use loadNFTInternal directly, no dependencies

    const refreshNFT = useCallback((nftAddress: string, tokenId: string): Promise<AggregatedNFT> => {

        return loadNFTInternal(nftAddress, tokenId, true);
    }, []); // loadNFTInternal is stable

    const clearCache = useCallback(() => {

        store.clear();
    }, []); // store is a ref, always stable

    const clearExpiredCache = useCallback(() => {

        store.clearExpired(STALE_EXPIRATION_MS);
    }, []); // store is a ref, always stable

    const getCacheStats = useCallback(() => {
        return store.getStats();
    }, []); // store is a ref, always stable

    const isDataFresh = useCallback((nftAddress: string, tokenId: string): boolean => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        const entry = store.get(nftKey);
        return entry ? isDataFreshInternal(entry) : false;
    }, []); // store and isDataFreshInternal are stable

    const getDisplayDataHelper = useCallback((nft: AggregatedNFT) => {
        return getDisplayData(nft);
    }, []);

    const sortNFTsHelper = useCallback((nfts: AggregatedNFT[], sortBy: 'price' | 'name' | 'recent' = 'recent') => {
        return sortNFTs(nfts, sortBy);
    }, []);

    // ===== AUTO CLEANUP =====

    useEffect(() => {
        // Clear expired cache every 5 minutes
        const interval = setInterval(() => {
            store.clearExpired(STALE_EXPIRATION_MS);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []); // store is stable, no need for clearExpiredCache dependency

    // ===== LOCALSTORAGE PERSISTENCE =====

    useEffect(() => {
        // 1. RESTORE from localStorage on mount (Layer 1 - Client Cache)

        const restoredCount = store.restoreFromLocalStorage();

        if (restoredCount > 0) {

        }

        // 2. AUTO-SAVE to localStorage on cache changes
        const saveInterval = setInterval(() => {
            store.saveToLocalStorage();
        }, 10 * 1000); // Save every 10 seconds

        return () => clearInterval(saveInterval);
    }, [store]);

    // ===== PRELOADING =====

    useEffect(() => {
        // 🚀 Preload all NFTs on mount for instant UX

        loadAllNFTs().then((nfts) => {

            const stats = getCacheStats();

            // Save to localStorage after preload
            store.saveToLocalStorage();
        }).catch((err: Error) => {
            console.error('❌ Failed to preload NFTs:', err);
        });
    }, [loadAllNFTs, getCacheStats, store]);

    // ===== CONTEXT VALUE (STABLE REFERENCE!) =====

    const contextValue = useMemo<ModernNFTContextType>(() => ({
        getNFT,
        getAllNFTs,
        getNFTsByOwner,
        getNFTsBySeller,
        getListedNFTs,
        loadNFT,
        loadMultipleNFTs,
        loadAllNFTs,
        refreshNFT,
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isDataFresh,
        getDisplayData: getDisplayDataHelper,
        sortNFTs: sortNFTsHelper,
        _store: store // Internal: expose store for hooks
    }), [
        getNFT,
        getAllNFTs,
        getNFTsByOwner,
        getNFTsBySeller,
        getListedNFTs,
        loadNFT,
        loadMultipleNFTs,
        loadAllNFTs,
        refreshNFT,
        clearCache,
        clearExpiredCache,
        getCacheStats,
        isDataFresh,
        getDisplayDataHelper,
        sortNFTsHelper,
        store
    ]);

    return (
        <ModernNFTContext.Provider value={contextValue}>
            {children}
        </ModernNFTContext.Provider>
    );
}

// ===== HOOKS =====

export function useModernNFTContext(): ModernNFTContextType {
    const context = useContext(ModernNFTContext);
    if (!context) {
        throw new Error('useModernNFTContext must be used within ModernNFTProvider');
    }
    return context;
}

/**
 * Hook for loading and using a single NFT with automatic reactivity
 * Uses useSyncExternalStore for selective re-renders (only when THIS NFT changes!)
 */
export function useModernNFT(nftAddress: string, tokenId: string, autoLoad: boolean = true) {
    const context = useModernNFTContext();
    const { loadNFT, refreshNFT, _store } = context;

    if (!_store) {
        throw new Error('useModernNFT: Store not available in context');
    }

    const store = _store;
    const nftKey = createNFTKey(nftAddress, tokenId);

    // Subscribe to ONLY this specific NFT (selective re-renders!)
    const nftEntry = useSyncExternalStore<CacheEntry | undefined>(
        // Subscribe function - only re-render when THIS NFT changes
        useCallback((onStoreChange) => {
            // Subscribe to this specific NFT key
            return store.subscribeToNFT(nftKey, onStoreChange);
        }, [store, nftKey]),

        // Get snapshot function - only for THIS NFT
        useCallback(() => {
            return store.getNFTSnapshot(nftKey);
        }, [store, nftKey]),

        // Server snapshot (SSR)
        () => undefined
    );

    // Extract NFT data and states from cache entry
    const nft = nftEntry?.data || null;
    const isLoading = nftEntry?.isLoading ?? false;
    const error = nftEntry?.error || null;

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad && !nftEntry) {
            loadNFT(nftAddress, tokenId).catch(err => {
                console.error(`Failed to auto-load NFT ${nftAddress}/${tokenId}:`, err);
            });
        }
    }, [autoLoad, nftEntry, nftAddress, tokenId, loadNFT]);

    return {
        nft,
        isLoading,
        error,
        refresh: useCallback(() => refreshNFT(nftAddress, tokenId), [refreshNFT, nftAddress, tokenId])
    };
}

// ===== EXPORTS =====

export { ModernNFTProvider as NFTProvider };
export { useModernNFTContext as useNFTContext };
export { useModernNFT as useNFT };

export type { ModernNFTContextType };

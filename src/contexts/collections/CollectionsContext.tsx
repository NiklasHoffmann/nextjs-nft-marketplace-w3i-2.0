'use client';

/**
 * Collections Context (Refactored)
 *
 * Manages collection data from marketplace collections.
 * Separated from context for better testability and reusability.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { devLog } from '@/utils/devLog';
import { CollectionsService, type Collection } from './CollectionsService';
import { CollectionsCache, type CollectionsState } from './CollectionsCache';
import { onDataInvalidation, type InvalidationEventDetail } from '@/services/validation';
import { useMarketplaceEventsContext } from '@/contexts/marketplace-events';
import { useContextDevtools } from '@/hooks/useContextDevtools';

interface CollectionsContextValue {
    collections: Collection[];
    loading: boolean;
    error: string | null;
    lastFetched: Date | null;

    // Actions
    refresh: () => Promise<void>;
    getCollection: (contractAddress: string) => Collection | undefined;
    getBySymbol: (symbol: string) => Collection | undefined;

    // Statistics
    totalCollections: number;
    totalListedItems: number;
    collectionsWithInsights: number;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(undefined);

interface CollectionsProviderProps {
    children: React.ReactNode;
    autoLoad?: boolean; // Auto-load on mount
    cacheDuration?: number; // Cache duration in milliseconds (default 5 min)
}

export function CollectionsProvider({
    children,
    autoLoad = true,
    cacheDuration = 5 * 60 * 1000 // 5 minutes
}: CollectionsProviderProps) {
    const [state, setState] = useState<CollectionsState>(CollectionsCache.createInitialState());
    const cache = useMemo(() => new CollectionsCache(cacheDuration), [cacheDuration]);

    // 🔥 Subscribe to WebSocket events from EventContext
    const eventsContext = useMarketplaceEventsContext();
    const { subscribe } = eventsContext;

    useEffect(() => {
        console.log('🎯 [CollectionsContext] Subscribing to marketplace events');

        // Subscribe to all events - collections stats change on any listing/purchase/cancel
        const unsubscribe = subscribe('*', (event) => {
            console.log('🔔 [CollectionsContext] Received event:', event.eventName);

            // Invalidate cache and refetch after delay
            setTimeout(() => {
                cache.clearCache();
                fetchCollections(true);
            }, 600);
        });

        return () => {
            console.log('👋 [CollectionsContext] Unsubscribing from events');
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscribe]); // cache and fetchCollections are used in closure, not as dependencies

    /**
     * Fetch collections using service and cache
     */
    const fetchCollections = useCallback(async (force = false) => {
        // Check cache first (unless forced)
        if (!force) {
            const cached = cache.getCached();
            if (cached) {
                setState(cached);
                return;
            }
        }

        setState(CollectionsCache.createLoadingState());

        try {
            const collections = await CollectionsService.fetchCollections();
            const newState = CollectionsCache.createSuccessState(collections);

            setState(newState);
            cache.setCache(collections);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            devLog.error('collections', '🔴 [CollectionsContext] ========== ERROR ==========');
            devLog.error('collections', 'Error fetching collections:', err);
            devLog.error('collections', '========================================');

            setState(CollectionsCache.createErrorState(errorMessage));
        }
    }, [cache]);

    /**
     * Manual refresh (clears cache)
     */
    const refresh = useCallback(async () => {
        devLog.info('collections', '🔄 [CollectionsContext] Manual refresh requested - clearing cache');
        cache.clearCache();
        await fetchCollections(true);
    }, [cache, fetchCollections]);

    /**
     * Get collection by contract address
     */
    const getCollection = useCallback((contractAddress: string): Collection | undefined => {
        return CollectionsService.getCollection(state.collections, contractAddress);
    }, [state.collections]);

    /**
     * Get collection by symbol
     */
    const getBySymbol = useCallback((symbol: string): Collection | undefined => {
        return CollectionsService.getBySymbol(state.collections, symbol);
    }, [state.collections]);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad && state.collections.length === 0 && !state.loading && !state.lastFetched) {
            devLog.info('collections', '🔵 [CollectionsContext] Auto-loading collections...');
            fetchCollections();
        }
    }, [autoLoad, state.collections.length, state.loading, state.lastFetched, fetchCollections]);

    /**
     * Listen for data invalidation events
     * Auto-refresh collections when marketplace events occur
     * Optimized: Only full refresh on global events, partial on NFT-specific events
     */
    useEffect(() => {
        const unsubscribe = onDataInvalidation((detail: InvalidationEventDetail) => {
            devLog.info('collections', `🔔 Received invalidation event:`, detail);

            // Full refresh only for global events
            const needsFullRefresh =
                detail.type === 'graph-update' ||
                detail.type === 'manual-refresh';

            // Partial refresh for NFT-specific events (only affects one collection)
            const needsPartialRefresh =
                detail.type === 'listing-created' ||
                detail.type === 'listing-canceled' ||
                detail.type === 'nft-purchased';

            if (needsFullRefresh) {
                devLog.info('collections', `🔄 Full refresh after ${detail.type}`);
                cache.clearCache();
                fetchCollections(true);
            } else if (needsPartialRefresh && detail.contractAddress) {
                // Refresh for listing events after DB sync delay
                devLog.info('collections', `🔄 Refresh for collection ${detail.contractAddress}`);
                cache.clearCache();
                // Single fetch with delay for DB sync completion
                setTimeout(() => {
                    fetchCollections(true);
                }, 600); // 600ms delay matches other contexts
            }
        });

        return unsubscribe;
    }, [cache, fetchCollections]);

    // NOTE: SSE handling removed - we rely on MarketplaceEventsContext to prevent multiple WebSocket connections
    // All updates come through eventsContext.subscribe() above

    // Calculate statistics
    const stats = useMemo(() => CollectionsService.calculateStats(state.collections), [state.collections]);

    // DevTools (development only)
    useContextDevtools('Collections', {
        collectionsCount: state.collections.length,
        loading: state.loading,
        error: state.error,
        lastFetched: state.lastFetched,
        stats
    });

    const value: CollectionsContextValue = {
        collections: state.collections,
        loading: state.loading,
        error: state.error,
        lastFetched: state.lastFetched,
        refresh,
        getCollection,
        getBySymbol,
        totalCollections: stats.totalCollections,
        totalListedItems: stats.totalListedItems,
        collectionsWithInsights: stats.collectionsWithInsights
    };

    return (
        <CollectionsContext.Provider value={value}>
            {children}
        </CollectionsContext.Provider>
    );
}

/**
 * Hook to access collections context
 */
export function useCollections() {
    const context = useContext(CollectionsContext);
    if (!context) {
        throw new Error('useCollections must be used within CollectionsProvider');
    }
    return context;
}
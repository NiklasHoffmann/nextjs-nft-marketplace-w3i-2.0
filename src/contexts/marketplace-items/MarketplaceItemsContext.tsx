'use client';

/**
 * Marketplace Items Context (Refactored)
 *
 * Caches marketplace data to prevent unnecessary reloads when navigating
 * back from NFT detail pages. Keeps data fresh while avoiding full reloads.
 *
 * Features:
 * - In-memory cache of marketplace items
 * - Selective refresh (only stats and listing status)
 * - Cache invalidation after 5 minutes
 * - Optimistic updates for user interactions
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { devLog } from '@/utils/devLog';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';
import type { NFTStatsUpdateDetail } from '@/types';
import { MarketplaceItemsService, type CacheEntry } from './MarketplaceItemsService';
import { MarketplaceItemsCache } from './MarketplaceItemsCache';
import { emitStatsUpdate } from './MarketplaceItemsEvents';
import { onDataInvalidation, type InvalidationEventDetail } from '@/services/validation';
import { useServerEvents } from '@/hooks/marketplace/useServerEvents';
import { useContextDevtools } from '@/hooks/useContextDevtools';

interface MarketplaceItemsContextType {
    // Cache operations
    getCached: (filterKey: string) => CacheEntry | null;
    setCache: (filterKey: string, data: MarketplaceItemsResponse['data']) => void;
    invalidateCache: (filterKey?: string) => void;

    // NEW: Post-transaction invalidation
    removeListing: (listingId: string) => void;
    removeNFT: (contractAddress: string, tokenId: string) => void;
    refreshMarketplace: () => Promise<void>;

    // Selective refresh operations
    refreshItemStats: (contractAddress: string, tokenId: string) => Promise<void>;
    refreshItemListing: (contractAddress: string, tokenId: string) => Promise<void>;

    // Update operations
    updateItemInCache: (filterKey: string, contractAddress: string, tokenId: string, updates: Partial<EnrichedNFTDocument>) => void;

    // NEW: Refresh trigger for hooks to watch
    refreshTrigger: number;
}

const MarketplaceItemsContext = createContext<MarketplaceItemsContextType | undefined>(undefined);

export function MarketplaceItemsProvider({ children }: { children: React.ReactNode }) {
    const [cache] = useState(() => new MarketplaceItemsCache());
    const [service] = useState(() => new MarketplaceItemsService(cache));
    const refreshingRef = useRef<Set<string>>(new Set());

    // Refresh trigger: Increment to notify hooks about cache invalidation
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Deduplication: Track last invalidation to prevent double-refresh
    const lastInvalidationRef = useRef<{ key: string; timestamp: number } | null>(null);
    const DEDUP_WINDOW = 1000; // 1 second window

    const buildInvalidationKey = (detail: {
        type: string;
        contractAddress?: string;
        tokenId?: string;
        listingId?: string;
    }) => {
        return `${detail.type}:${detail.contractAddress || ''}:${detail.tokenId || ''}:${detail.listingId || ''}`;
    };

    /**
     * Get cached data if still valid
     */
    const getCached = useCallback((filterKey: string): CacheEntry | null => {
        return service.getCached(filterKey);
    }, [service]);

    /**
     * Set cache entry
     */
    const setCacheEntry = useCallback((filterKey: string, data: MarketplaceItemsResponse['data']) => {
        service.setCache(filterKey, data);
    }, [service]);

    /**
     * Invalidate cache (all or specific key)
     */
    const invalidateCache = useCallback((filterKey?: string) => {
        service.invalidate(filterKey);
    }, [service]);

    /**
     * NEW: Remove specific listing by listingId (post-transaction)
     */
    const removeListing = useCallback((listingId: string) => {
        devLog.info('marketplace-items', `🗑️ Removing listing ${listingId} from cache`);
        service.removeListing(listingId);
        setRefreshTrigger(prev => prev + 1);
    }, [service]);

    /**
     * NEW: Remove specific NFT by contract + tokenId (post-transaction)
     */
    const removeNFT = useCallback((contractAddress: string, tokenId: string) => {
        devLog.info('marketplace-items', `🗑️ Removing NFT ${contractAddress}/${tokenId} from cache`);
        service.removeNFT(contractAddress, tokenId);
        setRefreshTrigger(prev => prev + 1);
    }, [service]);

    /**
     * NEW: Force refresh all marketplace data (re-fetch from API)
     */
    const refreshMarketplace = useCallback(async () => {
        devLog.info('marketplace-items', `🔄 Force refreshing marketplace data...`);
        service.invalidate(); // Clear all caches
        devLog.success('marketplace-items', `✅ Marketplace cache cleared`);
        setRefreshTrigger(prev => prev + 1);
    }, [service]);

    /**
     * Refresh stats for a specific item (lightweight update)
     */
    const refreshItemStats = useCallback(async (contractAddress: string, tokenId: string) => {
        const itemKey = `${contractAddress}:${tokenId}`;

        // Prevent concurrent refreshes
        if (refreshingRef.current.has(itemKey)) {
            devLog.debug('marketplace-items', `⏸️ Stats refresh already in progress for ${itemKey}`);
            return;
        }

        refreshingRef.current.add(itemKey);

        try {
            await service.refreshItemStats(contractAddress, tokenId);

            // Emit stats update event for NFTStatsContext
            const response = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
            const result = await response.json();

            if (result.success && result.data) {
                const detail: NFTStatsUpdateDetail = {
                    contractAddress: contractAddress,
                    tokenId,
                    stats: {
                        contractAddress,
                        tokenId,
                        viewCount: result.data.viewCount || 0,
                        likeCount: result.data.likeCount || 0,
                        watchlistCount: result.data.watchlistCount || 0,
                        averageRating: result.data.averageRating || 0,
                        ratingCount: result.data.ratingCount || 0,
                        lastUpdated: Date.now()
                    },
                    timestamp: Date.now(),
                    source: 'api'
                };
                emitStatsUpdate(detail);
            }
        } finally {
            refreshingRef.current.delete(itemKey);
        }
    }, [cache]);

    /**
     * Refresh listing status for a specific item (check if still listed, owner change)
     */
    const refreshItemListing = useCallback(async (contractAddress: string, tokenId: string) => {
        const itemKey = `${contractAddress}:${tokenId}`;

        // Prevent concurrent refreshes
        if (refreshingRef.current.has(`listing:${itemKey}`)) {
            devLog.debug('marketplace-items', `⏸️ Listing refresh already in progress for ${itemKey}`);
            return;
        }

        refreshingRef.current.add(`listing:${itemKey}`);

        try {
            await service.refreshItemListing(contractAddress, tokenId);
        } finally {
            refreshingRef.current.delete(`listing:${itemKey}`);
        }
    }, [cache]);

    /**
     * Update specific item in cache (for optimistic updates)
     */
    const updateItemInCache = useCallback((
        filterKey: string,
        contractAddress: string,
        tokenId: string,
        updates: Partial<EnrichedNFTDocument>
    ) => {
        service.updateItemInCache(filterKey, contractAddress, tokenId, updates);
    }, [service]);

    /**
     * Listen for data invalidation events from other parts of the app
     * Deduplication: Skip if same event type within 1s window
     */
    useEffect(() => {
        const unsubscribe = onDataInvalidation((detail: InvalidationEventDetail) => {
            devLog.info('marketplace-items', `🔔 Received invalidation event:`, detail);

            // Deduplication check
            const now = Date.now();
            const key = buildInvalidationKey(detail);
            const last = lastInvalidationRef.current;
            if (last && last.key === key && (now - last.timestamp) < DEDUP_WINDOW) {
                devLog.info('marketplace-items', `⏭️ Skipping duplicate invalidation (${key}) within 1s window`);
                return;
            }

            // Mark as processed
            lastInvalidationRef.current = { key, timestamp: now };

            switch (detail.type) {
                case 'listing-created':
                    // Invalidate all caches to show new listing
                    devLog.info('marketplace-items', `🔄 Invalidating cache after listing created`);
                    service.invalidate();
                    // Trigger immediate refetch in consuming hooks
                    setRefreshTrigger(prev => prev + 1);
                    break;

                case 'listing-canceled':
                    // Remove specific NFT from cache
                    if (detail.contractAddress && detail.tokenId) {
                        devLog.info('marketplace-items', `🗑️ Removing NFT after cancel`);
                        service.removeNFT(detail.contractAddress, detail.tokenId);
                    }
                    break;

                case 'nft-purchased':
                    // Remove purchased NFT from all listings
                    if (detail.contractAddress && detail.tokenId) {
                        devLog.info('marketplace-items', `🗑️ Removing NFT after purchase`);
                        service.removeNFT(detail.contractAddress, detail.tokenId);
                    }
                    break;

                case 'nft-transferred':
                    // Refresh to show correct ownership
                    if (detail.contractAddress && detail.tokenId) {
                        devLog.info('marketplace-items', `🔄 Refreshing after transfer`);
                        service.removeNFT(detail.contractAddress, detail.tokenId);
                    }
                    break;

                case 'graph-update':
                case 'manual-refresh':
                    // Full refresh
                    devLog.info('marketplace-items', `🔄 Full invalidation after ${detail.type}`);
                    service.invalidate();
                    break;
            }
        });

        return unsubscribe;
    }, [service, DEDUP_WINDOW]);

    /**
     * Listen for Server-Sent Events (SSE) - real-time updates from OTHER clients
     * ONLY THIS CONTEXT HANDLES SSE - it will emit dataInvalidation events for others
     * Deduplication: Skip if same event type within 1s window
     */
    useServerEvents({
        enabled: true, // ✅ This is the ONLY SSE connection per tab
        onEvent: (event) => {
            devLog.info('marketplace-items', `📡 [SSE] Received server event:`, event.eventName);

            if (event.eventName === 'BuyerWhitelisted' || event.eventName === 'BuyerRemovedFromWhitelist') {
                devLog.info('marketplace-items', `ℹ️ [SSE] Ignoring buyer whitelist event (no cache impact)`);
                return;
            }

            // Map blockchain event names to invalidation types
            const eventNameMap: Record<string, string> = {
                'ItemListed': 'listing-created',
                'ItemBought': 'nft-purchased',
                'ItemCanceled': 'listing-canceled',
                'ItemUpdated': 'listing-created', // Treat as new listing
                'ListingCanceledDueToInvalidListing': 'listing-canceled',
                'CollectionWhitelistRevokedCancelTriggered': 'listing-canceled'
            };

            const invalidationType = eventNameMap[event.eventName] || 'marketplace-event';
            const eventData = event.data as {
                nftAddress?: string;
                tokenAddress?: string;
                tokenId?: string | number | bigint;
                listingId?: string | number | bigint;
            } | undefined;
            const contractAddress = eventData?.nftAddress || eventData?.tokenAddress;
            const eventKey = buildInvalidationKey({
                type: invalidationType,
                contractAddress,
                tokenId: eventData?.tokenId?.toString(),
                listingId: eventData?.listingId?.toString()
            });

            // Deduplication check
            const now = Date.now();
            const last = lastInvalidationRef.current;
            if (last && last.key === eventKey && (now - last.timestamp) < DEDUP_WINDOW) {
                devLog.info('marketplace-items', `⏭️ [SSE] Skipping duplicate invalidation (${eventKey}) within 1s window`);
                return;
            }

            // Mark as processed
            lastInvalidationRef.current = { key: eventKey, timestamp: now };

            // When another client triggers an event, invalidate cache
            devLog.info('marketplace-items', `🔄 [SSE] Invalidating marketplace cache after ${event.eventName}`);
            service.invalidate();

            // Trigger refetch in all consuming hooks
            setRefreshTrigger(prev => prev + 1);

            // ✅ PROPAGATE TO OTHER CONTEXTS via dataInvalidation event
            const detail = {
                type: invalidationType,
                contractAddress: contractAddress || '',
                tokenId: eventData?.tokenId?.toString() || '',
                timestamp: Date.now()
            };

            devLog.info('marketplace-items', `📡 [SSE] Broadcasting dataInvalidation event: ${invalidationType}`);
            window.dispatchEvent(new CustomEvent('dataInvalidation', { detail }));
        },
        onConnectionChange: (connected) => {
            devLog.info('marketplace-items', `🔌 [SSE] Connection ${connected ? 'established' : 'lost'}`);
        }
    });

    // DevTools (development only)
    useContextDevtools('MarketplaceItems', {
        cacheSize: cache.getSize?.() || 0,
        refreshTrigger
    });

    const value: MarketplaceItemsContextType = {
        getCached,
        setCache: setCacheEntry,
        invalidateCache,
        removeListing,
        removeNFT,
        refreshMarketplace,
        refreshItemStats,
        refreshItemListing,
        updateItemInCache,
        refreshTrigger // NEW: Allows hooks to watch for cache invalidation
    };

    return (
        <MarketplaceItemsContext.Provider value={value}>
            {children}
        </MarketplaceItemsContext.Provider>
    );
}

export function useMarketplaceItems() {
    const context = useContext(MarketplaceItemsContext);
    if (!context) {
        throw new Error('useMarketplaceItems must be used within MarketplaceItemsProvider');
    }
    return context;
}
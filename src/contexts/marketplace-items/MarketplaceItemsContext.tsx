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

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { devLog } from '@/utils/devLog';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';
import type { NFTStatsUpdateDetail } from '@/types/events';
import { MarketplaceItemsService, type CacheEntry } from './MarketplaceItemsService';
import { MarketplaceItemsCache } from './MarketplaceItemsCache';
import { emitStatsUpdate } from './MarketplaceItemsEvents';

interface MarketplaceItemsContextType {
    // Cache operations
    getCached: (filterKey: string) => CacheEntry | null;
    setCache: (filterKey: string, data: MarketplaceItemsResponse['data']) => void;
    invalidateCache: (filterKey?: string) => void;

    // Selective refresh operations
    refreshItemStats: (contractAddress: string, tokenId: string) => Promise<void>;
    refreshItemListing: (contractAddress: string, tokenId: string) => Promise<void>;

    // Update operations
    updateItemInCache: (filterKey: string, contractAddress: string, tokenId: string, updates: Partial<EnrichedNFTDocument>) => void;
}

const MarketplaceItemsContext = createContext<MarketplaceItemsContextType | undefined>(undefined);

export function MarketplaceItemsProvider({ children }: { children: React.ReactNode }) {
    const [cache] = useState(() => new MarketplaceItemsCache());
    const [service] = useState(() => new MarketplaceItemsService(cache));
    const refreshingRef = useRef<Set<string>>(new Set());

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

    const value: MarketplaceItemsContextType = {
        getCached,
        setCache: setCacheEntry,
        invalidateCache,
        refreshItemStats,
        refreshItemListing,
        updateItemInCache
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
'use client';

/**
 * Marketplace Items Service
 *
 * Handles API calls for marketplace data.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils/devLog';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';
import type { NFTStatsUpdateDetail } from '@/types/events';
import { MarketplaceItemsCache } from './MarketplaceItemsCache';
import { emitStatsUpdate } from './MarketplaceItemsEvents';

export interface CacheEntry {
    data: MarketplaceItemsResponse['data'];
    timestamp: number;
    filters: string; // Serialized filter key
}

export class MarketplaceItemsService {
    private cache: MarketplaceItemsCache;

    constructor(cache?: MarketplaceItemsCache) {
        this.cache = cache || new MarketplaceItemsCache();
    }

    /**
     * Get cached data if still valid
     */
    getCached(filterKey: string): CacheEntry | null {
        return this.cache.getCached(filterKey);
    }

    /**
     * Set cache entry
     */
    setCache(filterKey: string, data: MarketplaceItemsResponse['data']): void {
        this.cache.setCache(filterKey, data);
    }

    /**
     * Invalidate cache (all or specific key)
     */
    invalidate(filterKey?: string): void {
        this.cache.invalidate(filterKey);
    }

    /**
     * Update specific item in cache (for optimistic updates)
     */
    updateItemInCache(
        filterKey: string,
        contractAddress: string,
        tokenId: string,
        updates: Partial<EnrichedNFTDocument>
    ): void {
        this.cache.updateItemInCache(filterKey, contractAddress, tokenId, updates);
    }

    /**
     * Get cache statistics
     */
    getStats(): { totalEntries: number; totalItems: number } {
        return this.cache.getStats();
    }

    /**
     * Refresh stats for a specific item (lightweight update)
     */
    async refreshItemStats(contractAddress: string, tokenId: string): Promise<void> {
        const itemKey = `${contractAddress}:${tokenId}`;

        try {
            devLog.info('marketplace-items', `🔄 Refreshing stats for ${itemKey}...`);

            const response = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
            const result = await response.json();

            if (result.success && result.data) {
                // Update cache
                this.cache.updateItemStatsInCache(contractAddress, tokenId);

                // Emit stats update event for NFTStatsContext
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
        } catch (error) {
            devLog.error('marketplace-items', `❌ Error refreshing stats for ${itemKey}:`, error);
        }
    }

    /**
     * Refresh listing status for a specific item
     */
    async refreshItemListing(contractAddress: string, tokenId: string): Promise<void> {
        const itemKey = `${contractAddress}:${tokenId}`;

        try {
            devLog.info('marketplace-items', `🔄 Refreshing listing for ${itemKey}...`);

            // Fetch from marketplace API (has latest listing data)
            const response = await fetch(`/api/nft/${contractAddress}/${tokenId}`);
            const result = await response.json() as { success: boolean; data: EnrichedNFTDocument };

            if (result.success && result.data) {
                // Update cache with marketplace data
                this.cache.updateItemListingInCache(
                    contractAddress,
                    tokenId,
                    result.data.marketplace
                );
            }
        } catch (error) {
            devLog.error('marketplace-items', `❌ Error refreshing listing for ${itemKey}:`, error);
        }
    }

    /**
     * Get the underlying cache instance
     */
    getCache(): MarketplaceItemsCache {
        return this.cache;
    }
}
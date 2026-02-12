'use client';

/**
 * Marketplace Items Cache Service
 *
 * Manages caching logic for marketplace data.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';

export interface MarketplaceItemsCacheEntry {
    data: MarketplaceItemsResponse['data'];
    timestamp: number;
    filters: string; // Serialized filter key
}

export interface MarketplaceItemsCacheState {
    entries: Map<string, MarketplaceItemsCacheEntry>;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

export class MarketplaceItemsCache {
    private static readonly CACHE_TTL = 60 * 1000; // 60 seconds (aligned with TheGraph polling)
    private static readonly INITIAL_STATE: MarketplaceItemsCacheState = {
        entries: new Map(),
        loading: false,
        error: null,
        lastFetched: null
    };

    private state: MarketplaceItemsCacheState = { ...MarketplaceItemsCache.INITIAL_STATE };

    /**
     * Get cached data if still valid
     */
    getCached(filterKey: string): MarketplaceItemsCacheEntry | null {
        const entry = this.state.entries.get(filterKey);

        if (!entry) return null;

        // Check if cache is still valid
        const age = Date.now() - entry.timestamp;
        if (age > MarketplaceItemsCache.CACHE_TTL) {
            devLog.cache(`Cache expired for key: ${filterKey} (age: ${Math.round(age / 1000)}s)`);
            this.invalidate(filterKey);
            return null;
        }

        devLog.cache(`Cache hit for key: ${filterKey} (age: ${Math.round(age / 1000)}s)`);
        return entry;
    }

    /**
     * Set cache entry
     */
    setCache(filterKey: string, data: MarketplaceItemsResponse['data']): void {
        const items = Array.isArray(data?.items) ? data.items : [];
        // Debug: Log incoming data structure
        if (items.length > 0) {
            const firstItem: any = items[0];
            devLog.debug('\n📥 [MarketplaceItemsCache] Incoming Data Structure:');
            devLog.debug('Root Level Fields:', {
                contractAddress: firstItem.contractAddress,
                tokenId: firstItem.tokenId,
                price: firstItem.price,
                seller: firstItem.seller,
                isListed: firstItem.isListed,
                listingId: firstItem.listingId
            });
            devLog.debug('Enriched Objects:', {
                metadata: !!firstItem.metadata,
                contract: !!firstItem.contract,
                insights: !!firstItem.insights,
                marketplace: !!firstItem.marketplace
            });
        }

        this.state.entries.set(filterKey, {
            data: {
                ...data,
                items,
            },
            timestamp: Date.now(),
            filters: filterKey
        });

        this.state.lastFetched = Date.now();
        devLog.cache(`Cached ${items.length} items for key: ${filterKey}`);
    }

    /**
     * Invalidate cache (all or specific key)
     */
    invalidate(filterKey?: string): void {
        if (filterKey) {
            this.state.entries.delete(filterKey);
            devLog.cache(`Invalidated cache for key: ${filterKey}`);
        } else {
            this.state.entries.clear();
            this.state.lastFetched = null;
            devLog.cache(`Invalidated all cache`);
        }
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
        const entry = this.state.entries.get(filterKey);
        if (!entry) return;

        const itemIndex = entry.data.items.findIndex(
            item => item.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
                && item.tokenId === tokenId
        );

        if (itemIndex !== -1) {
            const updatedItems = [...entry.data.items];
            const currentItem = updatedItems[itemIndex];

            if (!currentItem) return;

            updatedItems[itemIndex] = {
                ...currentItem,
                ...updates
            } as EnrichedNFTDocument;

            this.state.entries.set(filterKey, {
                ...entry,
                data: {
                    ...entry.data,
                    items: updatedItems
                }
            });

            devLog.cache(`Optimistically updated item in cache: ${contractAddress}/${tokenId}`);
        }
    }

    /**
     * Update item stats in all cache entries
     */
    updateItemStatsInCache(contractAddress: string, tokenId: string): void {
        for (const [key, entry] of this.state.entries.entries()) {
            const itemIndex = entry.data.items.findIndex(
                item => item.contractAddress.toLowerCase() === contractAddress.toLowerCase()
                    && item.tokenId === tokenId
            );

            if (itemIndex !== -1) {
                const updatedItems = [...entry.data.items];
                const currentItem = updatedItems[itemIndex];

                // Trigger re-render by creating new object
                updatedItems[itemIndex] = {
                    ...currentItem,
                    lastUpdated: new Date()
                } as EnrichedNFTDocument;

                this.state.entries.set(key, {
                    ...entry,
                    data: {
                        ...entry.data,
                        items: updatedItems
                    },
                    timestamp: Date.now() // Refresh timestamp
                });

                devLog.cache(`Updated stats in cache key: ${key}`);
            }
        }
    }

    /**
     * Update item listing in all cache entries
     */
    updateItemListingInCache(
        contractAddress: string,
        tokenId: string,
        marketplaceUpdates: Partial<EnrichedNFTDocument['marketplace']>
    ): void {
        for (const [key, entry] of this.state.entries.entries()) {
            const itemIndex = entry.data.items.findIndex(
                item => item.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
                    && item.tokenId === tokenId
            );

            if (itemIndex !== -1) {
                const updatedItems = [...entry.data.items];
                const currentItem = updatedItems[itemIndex];

                if (!currentItem) continue;

                // Update only marketplace-related fields
                updatedItems[itemIndex] = {
                    ...currentItem,
                    marketplace: {
                        ...currentItem.marketplace,
                        ...marketplaceUpdates
                    },
                    lastUpdated: new Date()
                } as EnrichedNFTDocument;

                this.state.entries.set(key, {
                    ...entry,
                    data: {
                        ...entry.data,
                        items: updatedItems
                    },
                    timestamp: Date.now() // Refresh timestamp
                });

                devLog.cache(`Updated listing in cache key: ${key}`);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): { totalEntries: number; totalItems: number } {
        const totalEntries = this.state.entries.size;
        const totalItems = Array.from(this.state.entries.values()).reduce((sum, entry) => sum + entry.data.items.length, 0);

        return { totalEntries, totalItems };
    }

    /**
     * Get current state
     */
    getState(): MarketplaceItemsCacheState {
        return { ...this.state };
    }

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
        this.state.loading = loading;
    }

    /**
     * Set error state
     */
    setError(error: string | null): void {
        this.state.error = error;
        this.state.loading = false;
    }

    /**
     * Create initial state
     */
    static createInitialState(): MarketplaceItemsCacheState {
        return { ...MarketplaceItemsCache.INITIAL_STATE };
    }

    /**
     * Create loading state
     */
    static createLoadingState(): MarketplaceItemsCacheState {
        return {
            ...MarketplaceItemsCache.INITIAL_STATE,
            loading: true
        };
    }

    /**
     * Create error state
     */
    static createErrorState(error: string): MarketplaceItemsCacheState {
        return {
            ...MarketplaceItemsCache.INITIAL_STATE,
            error
        };
    }

    /**
     * NEW: Remove specific listing by listingId from all cache entries
     */
    removeListing(listingId: string): void {
        devLog.info('cache', `🗑️ Removing listing ${listingId} from all cache entries`);

        let removedCount = 0;
        const allKeys = Array.from(this.state.entries.keys());

        allKeys.forEach(key => {
            const entry = this.state.entries.get(key);
            if (!entry) return;

            const filtered = entry.data.items.filter(
                item => item.marketplace.listingId !== listingId
            );

            if (filtered.length !== entry.data.items.length) {
                this.state.entries.set(key, {
                    ...entry,
                    data: {
                        ...entry.data,
                        items: filtered,
                        pagination: {
                            ...entry.data.pagination,
                            total: filtered.length
                        }
                    },
                    timestamp: Date.now()
                });
                removedCount++;
                devLog.debug('cache', `✅ Removed listing from cache key: ${key}`);
            }
        });

        devLog.success('cache', `✅ Removed listing from ${removedCount} cache entries`);
    }

    /**
     * NEW: Remove specific NFT by contract address + tokenId from all cache entries
     */
    removeNFT(contractAddress: string, tokenId: string): void {
        devLog.info('cache', `🗑️ Removing NFT ${contractAddress}/${tokenId} from all cache entries`);

        let removedCount = 0;
        const allKeys = Array.from(this.state.entries.keys());

        allKeys.forEach(key => {
            const entry = this.state.entries.get(key);
            if (!entry) return;

            const filtered = entry.data.items.filter(
                item => !(item.contractAddress === contractAddress && item.tokenId === tokenId)
            );

            if (filtered.length !== entry.data.items.length) {
                this.state.entries.set(key, {
                    ...entry,
                    data: {
                        ...entry.data,
                        items: filtered,
                        pagination: {
                            ...entry.data.pagination,
                            total: filtered.length
                        }
                    },
                    timestamp: Date.now()
                });
                removedCount++;
                devLog.debug('cache', `✅ Removed NFT from cache key: ${key}`);
            }
        });

        devLog.success('cache', `✅ Removed NFT from ${removedCount} cache entries`);
    }

    /**
     * Get cache size for DevTools
     */
    getSize(): number {
        return this.state.entries.size;
    }
}
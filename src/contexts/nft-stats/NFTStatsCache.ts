'use client';

/**
 * NFT Stats Cache Service
 *
 * Manages caching logic for NFT statistics and user interactions.
 * Separated from context for better testability and reusability.
 */

import type { NFTStats, UserInteractionState } from './NFTStatsService';

export interface NFTStatsCacheState {
    statsCache: Record<string, NFTStats>;
    userInteractionsCache: Record<string, UserInteractionState>;
    loadingStates: Record<string, boolean>;
}

export class NFTStatsCache {
    private statsCache: Record<string, NFTStats> = {};
    private userInteractionsCache: Record<string, UserInteractionState> = {};
    private loadingStates: Record<string, boolean> = {};

    /**
     * Create NFT key for caching
     */
    private static createNFTKey(contractAddress: string | undefined, tokenId: string | undefined): string {
        if (!contractAddress || !tokenId) {
            return 'unknown_unknown';
        }
        return `${contractAddress.toLowerCase()}_${tokenId}`;
    }

    /**
     * Create user key for caching
     */
    private static createUserKey(
        contractAddress: string | undefined,
        tokenId: string | undefined,
        userAddress: string | undefined
    ): string {
        if (!contractAddress || !tokenId || !userAddress) {
            return 'unknown_unknown_unknown';
        }
        return `${contractAddress.toLowerCase()}_${tokenId}_${userAddress.toLowerCase()}`;
    }

    /**
     * Get stats from cache
     */
    getStats(contractAddress: string | undefined, tokenId: string | undefined): NFTStats | null {
        if (!contractAddress || !tokenId) {
            return null;
        }
        const nftKey = NFTStatsCache.createNFTKey(contractAddress, tokenId);
        return this.statsCache[nftKey] || null;
    }

    /**
     * Get user interactions from cache
     */
    getUserInteractions(
        contractAddress: string | undefined,
        tokenId: string | undefined,
        userAddress?: string
    ): UserInteractionState | null {
        if (!contractAddress || !tokenId || !userAddress) return null;

        const userKey = NFTStatsCache.createUserKey(contractAddress, tokenId, userAddress);
        return this.userInteractionsCache[userKey] || null;
    }

    /**
     * Check if loading
     */
    isLoading(contractAddress: string | undefined, tokenId: string | undefined): boolean {
        if (!contractAddress || !tokenId) return false;
        const nftKey = NFTStatsCache.createNFTKey(contractAddress, tokenId);
        return this.loadingStates[nftKey] || false;
    }

    /**
     * Update stats in cache
     */
    updateStats(contractAddress: string | undefined, tokenId: string | undefined, updates: Partial<NFTStats>): void {
        if (!contractAddress || !tokenId) {
            return;
        }

        const nftKey = NFTStatsCache.createNFTKey(contractAddress, tokenId);

        this.statsCache = {
            ...this.statsCache,
            [nftKey]: {
                ...(this.statsCache[nftKey] || {
                    viewCount: 0,
                    likeCount: 0,
                    watchlistCount: 0,
                    averageRating: 0,
                    ratingCount: 0,
                    lastUpdated: Date.now(),
                    contractAddress: contractAddress,
                    tokenId: tokenId
                }),
                ...updates,
                contractAddress: contractAddress,
                tokenId: tokenId,
                lastUpdated: Date.now()
            }
        };
    }

    /**
     * Update user interactions in cache
     */
    updateUserInteractions(
        contractAddress: string,
        tokenId: string,
        userAddress: string,
        updates: Partial<UserInteractionState>
    ): void {
        const userKey = NFTStatsCache.createUserKey(contractAddress, tokenId, userAddress);

        this.userInteractionsCache = {
            ...this.userInteractionsCache,
            [userKey]: {
                ...(this.userInteractionsCache[userKey] || {
                    isFavorited: false,
                    isWatchlisted: false,
                    userRating: 0,
                    hasViewed: false
                }),
                ...updates
            }
        };
    }

    /**
     * Set loading state
     */
    setLoading(contractAddress: string | undefined, tokenId: string | undefined, loading: boolean): void {
        if (!contractAddress || !tokenId) return;
        const nftKey = NFTStatsCache.createNFTKey(contractAddress, tokenId);
        this.loadingStates = {
            ...this.loadingStates,
            [nftKey]: loading
        };
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalStats: number;
        totalUserInteractions: number;
        loadingCount: number;
    } {
        return {
            totalStats: Object.keys(this.statsCache).length,
            totalUserInteractions: Object.keys(this.userInteractionsCache).length,
            loadingCount: Object.values(this.loadingStates).filter(Boolean).length
        };
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.statsCache = {};
        this.userInteractionsCache = {};
        this.loadingStates = {};
    }

    /**
     * Get complete cache state (for debugging)
     */
    getState(): NFTStatsCacheState {
        return {
            statsCache: this.statsCache,
            userInteractionsCache: this.userInteractionsCache,
            loadingStates: this.loadingStates
        };
    }
}
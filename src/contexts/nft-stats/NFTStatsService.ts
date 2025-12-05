'use client';

/**
 * NFT Stats Service
 *
 * Handles all API interactions for NFT statistics and user interactions.
 * Separated from context for better testability and reusability.
 */

import type { NFTStatsWithMeta } from '@/types/events';
import { devLog } from '@/utils/devLog';

// Re-export the stats type with metadata
export type NFTStats = NFTStatsWithMeta;

export interface UserInteractionState {
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating: number;
    hasViewed: boolean;
}

export interface NFTStatsApiResponse {
    success: boolean;
    stats?: NFTStats;
    userInteractions?: UserInteractionState;
    error?: string;
}

export class NFTStatsService {
    /**
     * Record a view for an NFT
     */
    async recordView(contractAddress: string, tokenId: string): Promise<NFTStatsApiResponse> {
        try {
            // Debounce: Check if we recently recorded a view for this NFT
            const viewKey = `${contractAddress}:${tokenId}`;
            const now = Date.now();
            const lastViewTime = (window as any).__lastViewRecorded?.[viewKey];

            if (lastViewTime && (now - lastViewTime) < 5000) {
                devLog.info('View already recorded recently, skipping...');
                return { success: false, error: 'View already recorded recently' };
            }

            // Mark that we're recording a view now
            if (!(window as any).__lastViewRecorded) {
                (window as any).__lastViewRecorded = {};
            }
            (window as any).__lastViewRecorded[viewKey] = now;

            devLog.api('Recording view for NFT:', { contractAddress, tokenId });

            // Record view in database
            const response = await fetch('/api/nft/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress: contractAddress,
                    tokenId: tokenId,
                    userId: null // Anonymous view for now
                })
            });

            if (!response.ok) {
                devLog.error('Failed to record view - HTTP error:', response.status, response.statusText);
                const errorText = await response.text();
                devLog.error('Error response:', errorText);
                return { success: false, error: `HTTP ${response.status}: ${errorText}` };
            }

            const result = await response.json();
            if (!result.success) {
                devLog.error('Failed to record view:', result.error || 'Unknown error');
                devLog.error('Full response:', result);
                return { success: false, error: result.error || 'Failed to record view' };
            }

            // Load fresh stats from server to get the updated viewCount
            const statsResponse = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
            const statsResult = await statsResponse.json();

            if (statsResult.success && statsResult.data) {
                const stats: NFTStats = {
                    contractAddress,
                    tokenId,
                    viewCount: statsResult.data.viewCount || 0,
                    likeCount: statsResult.data.likeCount || 0,
                    watchlistCount: statsResult.data.watchlistCount || 0,
                    averageRating: statsResult.data.averageRating || 0,
                    ratingCount: statsResult.data.ratingCount || 0,
                    lastUpdated: Date.now()
                };

                devLog.success('View recorded, stats updated:', {
                    nft: `${contractAddress}/${tokenId}`,
                    viewCount: stats.viewCount
                });

                return { success: true, stats };
            }

            return { success: false, error: 'Failed to load updated stats' };
        } catch (error) {
            devLog.error('Error recording view:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Load stats from API
     */
    async loadStats(contractAddress: string, tokenId: string): Promise<NFTStatsApiResponse> {
        try {
            const apiUrl = `/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`;
            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result.success && result.data) {
                const stats: NFTStats = {
                    contractAddress: result.data.contractAddress || contractAddress,
                    tokenId: result.data.tokenId || tokenId,
                    viewCount: result.data.viewCount || 0,
                    likeCount: result.data.likeCount || 0,
                    watchlistCount: result.data.watchlistCount || 0,
                    averageRating: result.data.averageRating || 0,
                    ratingCount: result.data.ratingCount || 0,
                    lastUpdated: Date.now()
                };

                return { success: true, stats };
            }

            return { success: false, error: 'No stats data available' };
        } catch (error) {
            devLog.error('Error loading stats from API:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Load user interactions from API
     */
    async loadUserInteractions(
        contractAddress: string,
        tokenId: string,
        userAddress: string
    ): Promise<NFTStatsApiResponse> {
        try {
            const response = await fetch(
                `/api/user/interactions?userId=${userAddress}&contractAddress=${contractAddress}&tokenId=${tokenId}`
            );
            const result = await response.json();

            if (result.success && result.data) {
                const userInteractions: UserInteractionState = {
                    isFavorited: result.data.isFavorite ?? false,
                    isWatchlisted: result.data.isWatchlisted ?? false,
                    userRating: result.data.rating ?? 0,
                    hasViewed: true // Assume user has viewed if they have interactions
                };

                return { success: true, userInteractions };
            }

            return { success: false, error: 'No user interactions data available' };
        } catch (error) {
            devLog.error('Error loading user interactions from API:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Toggle user interaction (favorite/watchlist)
     */
    async toggleUserInteraction(
        contractAddress: string,
        tokenId: string,
        userAddress: string,
        interactionType: 'favorite' | 'watchlist'
    ): Promise<NFTStatsApiResponse> {
        const isFavorite = interactionType === 'favorite';
        const apiField = isFavorite ? 'isFavorite' : 'isWatchlisted';
        const actionName = isFavorite ? 'favorite' : 'watchlist';

        devLog.info(`toggle${isFavorite ? 'Favorite' : 'Watchlist'} called:`, { contractAddress, tokenId, userAddress });

        try {
            // Call API to persist state
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: contractAddress,
                    tokenId: tokenId,
                    [apiField]: true // API handles toggle logic
                })
            });

            const result = await response.json();
            if (!result.success) {
                devLog.error(`Failed to toggle ${actionName}:`, result.error);
                return { success: false, error: result.error || `Failed to update ${actionName}` };
            }

            // Parse API response
            const apiData = result.data?.data || result.data;
            const apiStats = result.stats || result.data?.stats;

            if (!apiData || !apiStats) {
                return { success: false, error: 'Invalid API response format' };
            }

            const userInteractions: UserInteractionState = {
                isFavorited: apiData.isFavorite ?? false,
                isWatchlisted: apiData.isWatchlisted ?? false,
                userRating: apiData.rating ?? 0,
                hasViewed: true
            };

            const stats: NFTStats = {
                contractAddress,
                tokenId,
                likeCount: apiStats.likeCount || 0,
                watchlistCount: apiStats.watchlistCount || 0,
                averageRating: apiStats.averageRating || 0,
                ratingCount: apiStats.ratingCount || 0,
                viewCount: apiStats.viewCount || 0,
                lastUpdated: Date.now()
            };

            devLog.success(`${actionName} complete with stats from API:`, {
                nft: `${contractAddress}/${tokenId}`,
                likeCount: stats.likeCount,
                watchlistCount: stats.watchlistCount
            });

            return { success: true, userInteractions, stats };
        } catch (error) {
            devLog.error(`Error toggling ${actionName}:`, error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Set user rating
     */
    async setUserRating(
        contractAddress: string,
        tokenId: string,
        userAddress: string,
        rating: number
    ): Promise<NFTStatsApiResponse> {
        devLog.info('setUserRating called:', { contractAddress, tokenId, userAddress, rating });

        try {
            // Call API to persist rating
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: contractAddress,
                    tokenId: tokenId,
                    rating: rating // Send 0 to remove rating, 1-5 to set rating
                })
            });

            const result = await response.json();
            if (!result.success) {
                devLog.error('Failed to set rating:', result.error);
                return { success: false, error: result.error || 'Failed to update rating' };
            }

            // Parse API response
            const apiData = result.data?.data || result.data;
            const apiStats = result.stats || result.data?.stats;

            if (!apiData || !apiStats) {
                return { success: false, error: 'Invalid API response format' };
            }

            const userInteractions: UserInteractionState = {
                isFavorited: apiData.isFavorite ?? false,
                isWatchlisted: apiData.isWatchlisted ?? false,
                userRating: apiData.rating ?? 0,
                hasViewed: true
            };

            const stats: NFTStats = {
                contractAddress,
                tokenId,
                likeCount: apiStats.likeCount || 0,
                watchlistCount: apiStats.watchlistCount || 0,
                averageRating: apiStats.averageRating || 0,
                ratingCount: apiStats.ratingCount || 0,
                viewCount: apiStats.viewCount || 0,
                lastUpdated: Date.now()
            };

            devLog.success('Rating complete with stats from API:', {
                nft: `${contractAddress}/${tokenId}`,
                averageRating: stats.averageRating,
                ratingCount: stats.ratingCount,
                userRating: rating
            });

            return { success: true, userInteractions, stats };
        } catch (error) {
            devLog.error('Error setting user rating:', error);
            return { success: false, error: String(error) };
        }
    }
}
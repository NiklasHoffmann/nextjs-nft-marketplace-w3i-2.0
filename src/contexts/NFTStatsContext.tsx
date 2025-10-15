/**
 * NFTStatsContext - Real-time NFT Statistics Management
 * 
 * Provides centralized stats management with instant synchronization
 * across all components (Header, PersonalTab, etc.)
 */

'use client';

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

import { useNFTContext } from './NFTContext';
import { devLog } from '@/utils/devLog';
import type { NFTStatsWithMeta } from '@/types/events';
import { dispatchNFTStatsUpdate as emitStatsUpdate } from '@/types/events';

// ===== TYPES =====

// Re-export the stats type with metadata
export type NFTStats = NFTStatsWithMeta;

export interface UserInteractionState {
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating: number;
    hasViewed: boolean;
}

export interface NFTStatsContextType {
    // Stats data
    getStats: (nftAddress: string, tokenId: string) => NFTStats | null;
    getUserInteractions: (nftAddress: string, tokenId: string, userAddress?: string) => UserInteractionState | null;

    // Stats operations
    incrementViewCount: (nftAddress: string, tokenId: string) => Promise<void>;
    toggleFavorite: (nftAddress: string, tokenId: string, userAddress: string) => Promise<void>;
    toggleWatchlist: (nftAddress: string, tokenId: string, userAddress: string) => Promise<void>;
    setUserRating: (nftAddress: string, tokenId: string, userAddress: string, rating: number) => Promise<void>;

    // Bulk operations
    loadStats: (nftAddress: string, tokenId: string) => Promise<void>;
    loadUserInteractions: (nftAddress: string, tokenId: string, userAddress: string) => Promise<void>;
    refreshStats: (nftAddress: string, tokenId: string) => Promise<void>;

    // Loading states
    isLoading: (nftAddress: string, tokenId: string) => boolean;
}

// ===== HELPER FUNCTIONS =====

const createNFTKey = (nftAddress: string, tokenId: string): string =>
    `${nftAddress.toLowerCase()}_${tokenId}`;

const createUserKey = (nftAddress: string, tokenId: string, userAddress: string): string =>
    `${nftAddress.toLowerCase()}_${tokenId}_${userAddress.toLowerCase()}`;

// ===== CONTEXT CREATION =====

const NFTStatsContext = createContext<NFTStatsContextType | null>(null);

// ===== PROVIDER COMPONENT =====

interface NFTStatsProviderProps {
    children: ReactNode;
}

export function NFTStatsProvider({ children }: NFTStatsProviderProps) {
    // ===== STATE =====

    /** NFT statistics cache */
    const [statsCache, setStatsCache] = useState<Record<string, NFTStats>>({});

    /** User interaction states cache */
    const [userInteractionsCache, setUserInteractionsCache] = useState<Record<string, UserInteractionState>>({});

    /** Loading states */
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    // ===== NFT CONTEXT CONNECTION =====

    const nftContext = useNFTContext();

    // ===== CACHE OPERATIONS =====

    const updateStats = useCallback((nftAddress: string, tokenId: string, updates: Partial<NFTStats>) => {
        const nftKey = createNFTKey(nftAddress, tokenId);

        setStatsCache(prev => {
            const updated = {
                ...prev,
                [nftKey]: {
                    ...(prev[nftKey] || {
                        viewCount: 0,
                        favoriteCount: 0,
                        watchlistCount: 0,
                        averageRating: 0,
                        ratingCount: 0,
                        lastUpdated: Date.now()
                    }),
                    ...updates,
                    lastUpdated: Date.now()
                }
            };

            const newStats = updated[nftKey];

            devLog.cache('Stats cache updated:', {
                nftKey,
                favoriteCount: newStats.favoriteCount,
                watchlistCount: newStats.watchlistCount,
                viewCount: newStats.viewCount
            });

            // Trigger event AFTER state update with the actual new stats
            // This ensures components receive the correct updated values
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    emitStatsUpdate({
                        nftAddress,
                        tokenId,
                        stats: newStats,
                        timestamp: Date.now(),
                        source: 'api' // Can be customized by caller
                    });
                    devLog.event('Event dispatched for', `${nftAddress}/${tokenId}`, 'with stats:', newStats);
                }, 0);
            }

            return updated;
        });
    }, [nftContext]);

    const updateUserInteractions = useCallback((
        nftAddress: string,
        tokenId: string,
        userAddress: string,
        updates: Partial<UserInteractionState>
    ) => {
        const userKey = createUserKey(nftAddress, tokenId, userAddress);

        setUserInteractionsCache(prev => ({
            ...prev,
            [userKey]: {
                ...(prev[userKey] || {
                    isFavorited: false,
                    isWatchlisted: false,
                    userRating: 0,
                    hasViewed: false
                }),
                ...updates
            }
        }));
    }, []);

    const setLoading = useCallback((nftAddress: string, tokenId: string, loading: boolean) => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        setLoadingStates(prev => ({
            ...prev,
            [nftKey]: loading
        }));
    }, []);

    // ===== DATA ACCESS =====

    const getStats = useCallback((nftAddress: string, tokenId: string): NFTStats | null => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        return statsCache[nftKey] || null;
    }, [statsCache]);

    const getUserInteractions = useCallback((
        nftAddress: string,
        tokenId: string,
        userAddress?: string
    ): UserInteractionState | null => {
        if (!userAddress) return null;

        const userKey = createUserKey(nftAddress, tokenId, userAddress);
        return userInteractionsCache[userKey] || null;
    }, [userInteractionsCache]);

    const isLoading = useCallback((nftAddress: string, tokenId: string): boolean => {
        const nftKey = createNFTKey(nftAddress, tokenId);
        return loadingStates[nftKey] || false;
    }, [loadingStates]);

    // ===== STATS OPERATIONS =====

    const incrementViewCount = useCallback(async (nftAddress: string, tokenId: string) => {
        try {
            // DON'T do optimistic update for viewCount!
            // We need to load the real count from DB first to avoid overwriting with wrong values
            // (e.g. cache shows 0, but DB has 475 views)

            devLog.api('Recording view for NFT:', { nftAddress, tokenId });

            // Record view in database
            const response = await fetch('/api/nft/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress: nftAddress,
                    tokenId: tokenId,
                    userId: null // Anonymous view for now
                })
            });

            const result = await response.json();
            if (!result.success) {
                devLog.error('Failed to record view:', result.error);
            } else {
                // Load fresh stats from server to get the updated viewCount
                // This ensures we always show the correct value from DB
                const statsResponse = await fetch(`/api/nft/stats?contractAddress=${nftAddress}&tokenId=${tokenId}`);
                const statsResult = await statsResponse.json();

                if (statsResult.success && statsResult.data) {
                    devLog.success('View recorded, stats updated:', {
                        nft: `${nftAddress}/${tokenId}`,
                        viewCount: statsResult.data.viewCount
                    });
                    updateStats(nftAddress, tokenId, {
                        viewCount: statsResult.data.viewCount || 0,
                        favoriteCount: statsResult.data.favoriteCount || 0,
                        watchlistCount: statsResult.data.watchlistCount || 0,
                        averageRating: statsResult.data.averageRating || 0,
                        ratingCount: statsResult.data.ratingCount || 0,
                    });
                } else {
                    devLog.fail('Failed to load stats after view:', statsResult);
                }
            }
        } catch (error) {
            devLog.error('Error incrementing view count:', error);
        }
    }, [updateStats]);

    // ===== USER INTERACTION OPERATIONS =====

    /**
     * Generic toggle function for user interactions (favorite/watchlist)
     * Handles optimistic updates, API calls, and error recovery
     */
    const toggleUserInteraction = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string,
        interactionType: 'favorite' | 'watchlist'
    ) => {
        const isFavorite = interactionType === 'favorite';
        const stateField = isFavorite ? 'isFavorited' : 'isWatchlisted';
        const apiField = isFavorite ? 'isFavorite' : 'isWatchlisted';
        const actionName = isFavorite ? 'favorite' : 'watchlist';

        devLog.info(`toggle${isFavorite ? 'Favorite' : 'Watchlist'} called:`, { nftAddress, tokenId, userAddress });

        try {
            setLoading(nftAddress, tokenId, true);

            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress) || {
                isFavorited: false,
                isWatchlisted: false,
                userRating: 0,
                hasViewed: false
            };

            const currentState = currentInteractions[stateField];
            const newState = !currentState;

            devLog.debug('Current state:', {
                type: actionName,
                current: currentState,
                new: newState
            });

            // Optimistic update ONLY for user interaction (not for counts!)
            // This gives instant visual feedback for the icon
            updateUserInteractions(nftAddress, tokenId, userAddress, {
                [stateField]: newState
            } as Partial<UserInteractionState>);

            // Call API to persist state
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: nftAddress,
                    tokenId: tokenId,
                    [apiField]: newState
                })
            });

            const result = await response.json();
            if (!result.success) {
                devLog.error(`Failed to toggle ${actionName}:`, result.error);
                // Revert optimistic update on API failure
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    [stateField]: currentState
                } as Partial<UserInteractionState>);
                throw new Error(result.error || `Failed to update ${actionName}`);
            }

            // Update user interactions with actual API response data
            if (result.data) {
                const apiInteractions: UserInteractionState = {
                    isFavorited: result.data.isFavorite || false,
                    isWatchlisted: result.data.isWatchlisted || false,
                    userRating: result.data.rating || 0,
                    hasViewed: true
                };
                updateUserInteractions(nftAddress, tokenId, userAddress, apiInteractions);
            }

            // Load real stats from server immediately after successful update
            try {
                const statsResponse = await fetch(`/api/nft/stats?contractAddress=${nftAddress}&tokenId=${tokenId}`);
                const statsResult = await statsResponse.json();
                if (statsResult.success && statsResult.data) {
                    devLog.success(`${isFavorite ? 'Favorite' : 'Watchlist'} toggle complete:`, {
                        nft: `${nftAddress}/${tokenId}`,
                        favoriteCount: statsResult.data.favoriteCount,
                        watchlistCount: statsResult.data.watchlistCount,
                        newState
                    });
                    // Don't touch viewCount to avoid race conditions
                    updateStats(nftAddress, tokenId, {
                        favoriteCount: statsResult.data.favoriteCount || 0,
                        watchlistCount: statsResult.data.watchlistCount || 0,
                        averageRating: statsResult.data.averageRating || 0,
                        ratingCount: statsResult.data.ratingCount || 0,
                    });
                } else {
                    devLog.fail('Failed to load stats:', statsResult);
                }
            } catch (error) {
                devLog.error('Error loading stats after toggle:', error);
                // Keep optimistic update if stats load fails
            }

        } catch (error) {
            devLog.error(`Error toggling ${actionName}:`, error);
            // Revert user interaction on error
            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress);
            if (currentInteractions) {
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    [stateField]: !currentInteractions[stateField]
                } as Partial<UserInteractionState>);
            }
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [getUserInteractions, getStats, updateUserInteractions, updateStats, setLoading]);

    const toggleFavorite = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string
    ) => {
        await toggleUserInteraction(nftAddress, tokenId, userAddress, 'favorite');
    }, [toggleUserInteraction]);

    const toggleWatchlist = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string
    ) => {
        await toggleUserInteraction(nftAddress, tokenId, userAddress, 'watchlist');
    }, [toggleUserInteraction]);

    const setUserRating = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string,
        rating: number
    ) => {
        try {
            setLoading(nftAddress, tokenId, true);

            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress) || {
                isFavorited: false,
                isWatchlisted: false,
                userRating: 0,
                hasViewed: false
            };
            const currentStats = getStats(nftAddress, tokenId) || {
                viewCount: 0,
                favoriteCount: 0,
                watchlistCount: 0,
                averageRating: 0,
                ratingCount: 0,
                lastUpdated: Date.now()
            };

            const oldRating = currentInteractions.userRating;
            const wasRated = oldRating > 0;
            const isNewRating = rating > 0;

            // Calculate new average rating
            let newRatingCount = currentStats.ratingCount;
            let newAverageRating = currentStats.averageRating;

            if (wasRated && isNewRating) {
                // Update existing rating
                const totalRating = currentStats.averageRating * currentStats.ratingCount;
                const newTotalRating = totalRating - oldRating + rating;
                newAverageRating = newTotalRating / currentStats.ratingCount;
            } else if (!wasRated && isNewRating) {
                // Add new rating
                const totalRating = currentStats.averageRating * currentStats.ratingCount;
                const newTotalRating = totalRating + rating;
                newRatingCount = currentStats.ratingCount + 1;
                newAverageRating = newTotalRating / newRatingCount;
            } else if (wasRated && !isNewRating) {
                // Remove rating
                if (currentStats.ratingCount > 1) {
                    const totalRating = currentStats.averageRating * currentStats.ratingCount;
                    const newTotalRating = totalRating - oldRating;
                    newRatingCount = currentStats.ratingCount - 1;
                    newAverageRating = newTotalRating / newRatingCount;
                } else {
                    newRatingCount = 0;
                    newAverageRating = 0;
                }
            }

            // Optimistic update ONLY for user's rating (not for aggregate stats!)
            updateUserInteractions(nftAddress, tokenId, userAddress, {
                userRating: rating
            });

            // DON'T do optimistic update for averageRating/ratingCount
            // These are calculated server-side from all user ratings

            // Call API to persist rating
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: nftAddress,
                    tokenId: tokenId,
                    rating: rating // Send 0 to remove rating, 1-5 to set rating
                })
            });

            const result = await response.json();
            if (!result.success) {
                devLog.error('Failed to set rating:', result.error);
                // Revert optimistic user rating update on API failure
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    userRating: oldRating
                });
                throw new Error(result.error || 'Failed to update rating');
            }

            // Update user interactions with actual API response data
            if (result.data) {
                const apiInteractions: UserInteractionState = {
                    isFavorited: result.data.isFavorite || false,
                    isWatchlisted: result.data.isWatchlisted || false,
                    userRating: result.data.rating || 0,
                    hasViewed: true
                };
                updateUserInteractions(nftAddress, tokenId, userAddress, apiInteractions);
            }

            // Load real stats from server to get updated averageRating and ratingCount
            try {
                const statsResponse = await fetch(`/api/nft/stats?contractAddress=${nftAddress}&tokenId=${tokenId}`);
                const statsResult = await statsResponse.json();
                if (statsResult.success && statsResult.data) {
                    // Only update rating-related stats - don't touch viewCount
                    updateStats(nftAddress, tokenId, {
                        favoriteCount: statsResult.data.favoriteCount || 0,
                        watchlistCount: statsResult.data.watchlistCount || 0,
                        averageRating: statsResult.data.averageRating || 0,
                        ratingCount: statsResult.data.ratingCount || 0,
                    });
                }
            } catch (error) {
                devLog.error('Error loading stats after rating:', error);
            }

        } catch (error) {
            devLog.error('Error setting user rating:', error);
            // Revert user rating on error (stats will be correct from server)
            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress);
            if (currentInteractions) {
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    userRating: currentInteractions.userRating
                });
            }
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [getUserInteractions, getStats, updateUserInteractions, updateStats, setLoading]);

    // ===== BULK OPERATIONS =====

    const loadStats = useCallback(async (nftAddress: string, tokenId: string) => {

        try {
            setLoading(nftAddress, tokenId, true);

            // Load real stats from API
            const apiUrl = `/api/nft/stats?contractAddress=${nftAddress}&tokenId=${tokenId}`;

            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result.success && result.data) {
                const apiStats: NFTStats = {
                    contractAddress: result.data.contractAddress || nftAddress,
                    tokenId: result.data.tokenId || tokenId,
                    viewCount: result.data.viewCount || 0,
                    favoriteCount: result.data.favoriteCount || 0,
                    watchlistCount: result.data.watchlistCount || 0,
                    averageRating: result.data.averageRating || 0,
                    ratingCount: result.data.ratingCount || 0,
                    lastUpdated: Date.now()
                };

                updateStats(nftAddress, tokenId, apiStats);

            } else {
                // FIXED: Erstelle Default-Stats wenn keine von API kommen
                // Das verhindert, dass optimistische Updates überschrieben werden
                const currentStats = getStats(nftAddress, tokenId);
                if (!currentStats) {
                    const defaultStats: NFTStats = {
                        contractAddress: nftAddress,
                        tokenId: tokenId,
                        viewCount: 0,
                        favoriteCount: 0,
                        watchlistCount: 0,
                        averageRating: 0,
                        ratingCount: 0,
                        lastUpdated: Date.now()
                    };
                    updateStats(nftAddress, tokenId, defaultStats);
                }
            }

        } catch (error) {
            devLog.error('Error loading stats from API:', error);
            // No fallback data - stats will remain null
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [updateStats, setLoading]);

    const loadUserInteractions = useCallback(async (nftAddress: string, tokenId: string, userAddress: string) => {
        try {
            setLoading(nftAddress, tokenId, true);

            // Load real user interactions from API
            const response = await fetch(`/api/user/interactions?userId=${userAddress}&contractAddress=${nftAddress}&tokenId=${tokenId}`);
            const result = await response.json();

            if (result.success && result.data) {
                const apiInteractions: UserInteractionState = {
                    isFavorited: result.data.isFavorite || false,
                    isWatchlisted: result.data.isWatchlisted || false,
                    userRating: result.data.rating || 0,
                    hasViewed: true // Assume user has viewed if they have interactions
                };

                updateUserInteractions(nftAddress, tokenId, userAddress, apiInteractions);

            } else {

                // No fallback data - interactions will remain null
            }

        } catch (error) {
            devLog.error('Error loading user interactions from API:', error);
            // No fallback data - interactions will remain null
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [updateUserInteractions, setLoading]);

    const refreshStats = useCallback(async (nftAddress: string, tokenId: string) => {
        await loadStats(nftAddress, tokenId);
    }, [loadStats]);

    // ===== CONTEXT VALUE =====

    const contextValue: NFTStatsContextType = useMemo(() => ({
        // Data access
        getStats,
        getUserInteractions,
        isLoading,

        // Operations
        incrementViewCount,
        toggleFavorite,
        toggleWatchlist,
        setUserRating,

        // Bulk operations
        loadStats,
        loadUserInteractions,
        refreshStats
    }), [
        getStats,
        getUserInteractions,
        isLoading,
        incrementViewCount,
        toggleFavorite,
        toggleWatchlist,
        setUserRating,
        loadStats,
        loadUserInteractions,
        refreshStats
    ]);

    return (
        <NFTStatsContext.Provider value={contextValue}>
            {children}
        </NFTStatsContext.Provider>
    );
}

// ===== CUSTOM HOOKS =====

/**
 * Hook to use NFT stats context
 */
export function useNFTStatsContext(): NFTStatsContextType {
    const context = useContext(NFTStatsContext);
    if (!context) {
        throw new Error('useNFTStatsContext must be used within an NFTStatsProvider');
    }
    return context;
}

/**
 * Hook for individual NFT stats with automatic loading
 */
export function useNFTStats(nftAddress: string, tokenId: string) {
    const context = useNFTStatsContext();

    const stats = context.getStats(nftAddress, tokenId);
    const loading = context.isLoading(nftAddress, tokenId);

    // Auto-load stats if not present
    useEffect(() => {
        if (!stats && !loading) {
            context.loadStats(nftAddress, tokenId);
        }
    }, [context, nftAddress, tokenId, stats, loading]);

    return {
        stats,
        loading,
        refresh: () => context.refreshStats(nftAddress, tokenId)
    };
}

/**
 * Hook for user interactions with stats
 */
export function useNFTUserStats(nftAddress: string, tokenId: string, userAddress?: string) {
    const context = useNFTStatsContext();

    // Use state to make stats and userInteractions reactive
    const [stats, setStats] = useState(() => context.getStats(nftAddress, tokenId));
    const [userInteractions, setUserInteractions] = useState(() =>
        context.getUserInteractions(nftAddress, tokenId, userAddress)
    );
    const loading = context.isLoading(nftAddress, tokenId);

    // Use refs to avoid recreating event handler on every render
    const contextRef = useRef(context);
    const userAddressRef = useRef(userAddress);

    useEffect(() => {
        contextRef.current = context;
        userAddressRef.current = userAddress;
    });

    // Listen for stats updates via custom event
    useEffect(() => {
        const handleStatsUpdate = (event: WindowEventMap['nft-stats-updated']) => {
            const detail = event.detail;

            if (detail.nftAddress === nftAddress && detail.tokenId === tokenId) {
                // Use stats from event detail (guaranteed to be latest)
                // OR fall back to fetching from context if not provided
                const latestStats = detail.stats || contextRef.current.getStats(nftAddress, tokenId);
                const latestInteractions = contextRef.current.getUserInteractions(nftAddress, tokenId, userAddressRef.current);

                devLog.info('Stats updated for', `${nftAddress}/${tokenId}:`, {
                    favoriteCount: latestStats?.favoriteCount,
                    watchlistCount: latestStats?.watchlistCount,
                    isFavorited: latestInteractions?.isFavorited,
                    isWatchlisted: latestInteractions?.isWatchlisted,
                    source: detail.source
                });

                setStats(latestStats);
                setUserInteractions(latestInteractions);
            }
        };

        window.addEventListener('nft-stats-updated', handleStatsUpdate);

        return () => {
            window.removeEventListener('nft-stats-updated', handleStatsUpdate);
        };
        // Only re-run when NFT identity changes
    }, [nftAddress, tokenId]);

    // Auto-load stats if not present - aber nur beim ersten Mount
    const [statsLoadInitiated, setStatsLoadInitiated] = useState(false);
    useEffect(() => {
        if (!stats && !loading && !statsLoadInitiated) {
            setStatsLoadInitiated(true);
            context.loadStats(nftAddress, tokenId);
        }
    }, [context, nftAddress, tokenId, stats, loading, statsLoadInitiated]);

    // Auto-load user interactions if user is connected
    useEffect(() => {

        if (userAddress && !userInteractions && !loading) {

            // Only load if we don't have user interactions yet
            context.loadUserInteractions?.(nftAddress, tokenId, userAddress);
        } else {

        }
    }, [context, nftAddress, tokenId, userAddress, userInteractions, loading]);

    const toggleFavorite = useCallback(async () => {
        if (!userAddress) return;
        await context.toggleFavorite(nftAddress, tokenId, userAddress);
    }, [context, nftAddress, tokenId, userAddress]);

    const toggleWatchlist = useCallback(async () => {
        if (!userAddress) return;
        await context.toggleWatchlist(nftAddress, tokenId, userAddress);
    }, [context, nftAddress, tokenId, userAddress]);

    const setRating = useCallback(async (rating: number) => {
        if (!userAddress) return;
        await context.setUserRating(nftAddress, tokenId, userAddress, rating);
    }, [context, nftAddress, tokenId, userAddress]);

    const incrementViews = useCallback(async () => {
        await context.incrementViewCount(nftAddress, tokenId);
    }, [context, nftAddress, tokenId]);

    return {
        // Stats data
        stats,
        userInteractions,
        loading,

        // Actions
        toggleFavorite,
        toggleWatchlist,
        setRating,
        incrementViews,

        // Utilities
        refresh: () => context.refreshStats(nftAddress, tokenId),
        hasUserAddress: !!userAddress,

        // Change detection for external subscribers
        statsVersion: stats?.lastUpdated || 0
    };
}

export default NFTStatsProvider;
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
    ReactNode
} from 'react';

import { useNFTContext } from './NFTContext';

// ===== TYPES =====

export interface NFTStats {
    viewCount: number;
    favoriteCount: number;
    watchlistCount: number;
    averageRating: number;
    ratingCount: number;
    lastUpdated: number;
}

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

        setStatsCache(prev => ({
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
        }));

        // Note: ModernNFTContext doesn't support direct updates
        // The updated stats will be fetched on next NFT load

        // Trigger custom event for cross-component updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nft-stats-updated', {
                detail: {
                    nftAddress,
                    tokenId,
                    updates,
                    timestamp: Date.now()
                }
            }));

        }
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
            // Optimistic update
            const currentStats = getStats(nftAddress, tokenId) || {
                viewCount: 0,
                favoriteCount: 0,
                watchlistCount: 0,
                averageRating: 0,
                ratingCount: 0,
                lastUpdated: Date.now()
            };
            updateStats(nftAddress, tokenId, {
                viewCount: currentStats.viewCount + 1
            });

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
                console.error('Failed to record view:', result.error);
                // Revert optimistic update on API failure
                updateStats(nftAddress, tokenId, {
                    viewCount: currentStats.viewCount
                });
            } else {

            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
            // Revert optimistic update on error
            const currentStats = getStats(nftAddress, tokenId);
            if (currentStats) {
                updateStats(nftAddress, tokenId, {
                    viewCount: Math.max(0, currentStats.viewCount - 1)
                });
            }
        }
    }, [getStats, updateStats]);

    const toggleFavorite = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string
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

            const newFavoriteState = !currentInteractions.isFavorited;

            // Optimistic updates
            updateUserInteractions(nftAddress, tokenId, userAddress, {
                isFavorited: newFavoriteState
            });

            updateStats(nftAddress, tokenId, {
                favoriteCount: newFavoriteState
                    ? currentStats.favoriteCount + 1
                    : Math.max(0, currentStats.favoriteCount - 1)
            });

            // Call API to persist favorite state
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: nftAddress,
                    tokenId: tokenId,
                    isFavorite: newFavoriteState // API expects 'isFavorite'
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to toggle favorite:', result.error);
                // Revert optimistic updates on API failure
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    isFavorited: !newFavoriteState
                });
                updateStats(nftAddress, tokenId, {
                    favoriteCount: !newFavoriteState
                        ? currentStats.favoriteCount + 1
                        : Math.max(0, currentStats.favoriteCount - 1)
                });
            } else {

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

                // FIXED: Keine loadStats() mehr - behalte optimistische Updates
                // Das verhindert das "Aufblitzen" und Race Conditions
                // await loadStats(nftAddress, tokenId);

            }

        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert on error
            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress);
            const currentStats = getStats(nftAddress, tokenId);

            if (currentInteractions) {
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    isFavorited: !currentInteractions.isFavorited
                });
            }

            if (currentStats) {
                updateStats(nftAddress, tokenId, {
                    favoriteCount: currentInteractions?.isFavorited
                        ? currentStats.favoriteCount + 1
                        : Math.max(0, currentStats.favoriteCount - 1)
                });
            }
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [getUserInteractions, getStats, updateUserInteractions, updateStats, setLoading]);

    const toggleWatchlist = useCallback(async (
        nftAddress: string,
        tokenId: string,
        userAddress: string
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

            const newWatchlistState = !currentInteractions.isWatchlisted;

            // Optimistic updates
            updateUserInteractions(nftAddress, tokenId, userAddress, {
                isWatchlisted: newWatchlistState
            });

            updateStats(nftAddress, tokenId, {
                watchlistCount: newWatchlistState
                    ? currentStats.watchlistCount + 1
                    : Math.max(0, currentStats.watchlistCount - 1)
            });

            // Call API to persist watchlist state
            const response = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userAddress,
                    contractAddress: nftAddress,
                    tokenId: tokenId,
                    isWatchlisted: newWatchlistState
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to toggle watchlist:', result.error);
                // Revert optimistic updates on API failure
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    isWatchlisted: !newWatchlistState
                });
                updateStats(nftAddress, tokenId, {
                    watchlistCount: !newWatchlistState
                        ? currentStats.watchlistCount + 1
                        : Math.max(0, currentStats.watchlistCount - 1)
                });
            } else {

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

                // FIXED: Keine loadStats() mehr - behalte optimistische Updates
                // Das verhindert das "Aufblitzen" und Race Conditions
                // await loadStats(nftAddress, tokenId);

            }

        } catch (error) {
            console.error('Error toggling watchlist:', error);
            // Revert on error
            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress);
            const currentStats = getStats(nftAddress, tokenId);

            if (currentInteractions) {
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    isWatchlisted: !currentInteractions.isWatchlisted
                });
            }

            if (currentStats) {
                updateStats(nftAddress, tokenId, {
                    watchlistCount: currentInteractions?.isWatchlisted
                        ? currentStats.watchlistCount + 1
                        : Math.max(0, currentStats.watchlistCount - 1)
                });
            }
        } finally {
            setLoading(nftAddress, tokenId, false);
        }
    }, [getUserInteractions, getStats, updateUserInteractions, updateStats, setLoading]);

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

            // Optimistic updates
            updateUserInteractions(nftAddress, tokenId, userAddress, {
                userRating: rating
            });

            updateStats(nftAddress, tokenId, {
                averageRating: newAverageRating,
                ratingCount: newRatingCount
            });

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
                console.error('Failed to set rating:', result.error);
                // Revert optimistic updates on API failure
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    userRating: oldRating
                });
                updateStats(nftAddress, tokenId, {
                    averageRating: currentStats.averageRating,
                    ratingCount: currentStats.ratingCount
                });
            } else {

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

                // FIXED: Für Ratings behalten wir loadStats() da Durchschnitte komplex sind
                // Aber nur bei erfolgreichem Update, nicht bei Fehlern
                // await loadStats(nftAddress, tokenId);

            }

        } catch (error) {
            console.error('Error setting user rating:', error);
            // Revert on error
            const currentInteractions = getUserInteractions(nftAddress, tokenId, userAddress);
            if (currentInteractions) {
                updateUserInteractions(nftAddress, tokenId, userAddress, {
                    userRating: currentInteractions.userRating
                });
            }
            // TODO: Revert stats changes
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
            console.error('Error loading stats from API:', error);
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
            console.error('Error loading user interactions from API:', error);
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

    const stats = context.getStats(nftAddress, tokenId);
    const userInteractions = context.getUserInteractions(nftAddress, tokenId, userAddress);
    const loading = context.isLoading(nftAddress, tokenId);

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
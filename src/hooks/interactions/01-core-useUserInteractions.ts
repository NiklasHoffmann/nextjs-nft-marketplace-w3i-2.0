import { useState, useEffect, useCallback } from 'react';
import {
    CombinedUserInteractionData,
    CombinedUserInteractionsResponse
} from '@/types';

// PURPOSE: Verwaltet alle User-Interaktionen für ein spezifisches NFT
// USE CASE: Favoriten, Watchlist, Ratings, Views für eingeloggte User
// FEATURES: CRUD-Operationen, Auto-Sync, Offline-Support
interface UseUserInteractionsOptions {
    contractAddress?: string;
    tokenId?: string;
    userWalletAddress?: string;
    autoFetch?: boolean;
}

interface UseUserInteractionsReturn {
    // Data
    userInteractions: CombinedUserInteractionData | null;

    // States
    loading: boolean;
    error: string | null;

    // Quick access properties
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating?: number;

    // Actions
    toggleFavorite: () => Promise<void>;
    toggleWatchlist: () => Promise<void>;
    setRating: (rating: number) => Promise<void>;
    recordView: () => Promise<void>;

    // Generic CRUD
    updateInteraction: (data: Partial<CombinedUserInteractionData>) => Promise<CombinedUserInteractionData>;
    createInteraction: (data: Partial<CombinedUserInteractionData>) => Promise<CombinedUserInteractionData>;
    refetch: () => Promise<void>;
}

export function useUserInteractions(options: UseUserInteractionsOptions = {}): UseUserInteractionsReturn {
    const { contractAddress, tokenId, userWalletAddress, autoFetch = true } = options;

    const [userInteractions, setUserInteractions] = useState<CombinedUserInteractionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user interactions
    const fetchUserInteractions = useCallback(async () => {
        if (!contractAddress || !tokenId || !userWalletAddress) {
            console.log('🚫 useUserInteractions: Missing required parameters');
            setUserInteractions(null);
            return;
        }

        console.log('🚀 useUserInteractions: Fetching for', { contractAddress, tokenId, userWalletAddress });
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                tokenId,
                userId: userWalletAddress
            });

            console.log('📡 Fetching user interactions with params:', params.toString());
            const response = await fetch(`/api/user/interactions?${params}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            console.log('📥 User interactions response status:', response.status);
            const result = await response.json();
            console.log('📋 User interactions data:', result);

            if (result.success && result.data) {
                setUserInteractions(result.data);
                console.log('✅ Set user interactions:', result.data);
            } else {
                setUserInteractions(null);
                console.log('ℹ️ No user interactions found');
            }

        } catch (err) {
            console.error('❌ Error fetching user interactions:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setUserInteractions(null);
        } finally {
            console.log('🏁 fetchUserInteractions finished');
            setLoading(false);
        }
    }, [contractAddress, tokenId, userWalletAddress]);

    // Generic update function
    const updateInteraction = useCallback(async (data: Partial<CombinedUserInteractionData>): Promise<CombinedUserInteractionData> => {
        if (!contractAddress || !tokenId || !userWalletAddress) {
            throw new Error('Missing required parameters for user interaction update');
        }

        console.log('📝 Updating user interaction:', data);

        const updateData = {
            ...data,
            contractAddress,
            tokenId,
            userId: userWalletAddress,
        };

        const response = await fetch('/api/user/interactions', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to update user interaction');
        }

        // Update local state
        setUserInteractions(result.data);
        console.log('✅ Updated user interaction:', result.data);

        // Trigger stats refresh (with small delay to allow backend to update)
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('nftStatsChanged', {
                    detail: { contractAddress, tokenId }
                }));
            }
        }, 500);

        return result.data;
    }, [contractAddress, tokenId, userWalletAddress]);

    // Generic create function
    const createInteraction = useCallback(async (data: Partial<CombinedUserInteractionData>): Promise<CombinedUserInteractionData> => {
        if (!contractAddress || !tokenId || !userWalletAddress) {
            throw new Error('Missing required parameters for user interaction creation');
        }

        console.log('📝 Creating user interaction:', data);

        const createData = {
            ...data,
            contractAddress,
            tokenId,
            userId: userWalletAddress,
        };

        const response = await fetch('/api/user/interactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createData),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to create user interaction');
        }

        // Update local state
        setUserInteractions(result.data);
        console.log('✅ Created user interaction:', result.data);

        // Trigger stats refresh (with small delay to allow backend to update)
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('nftStatsChanged', {
                    detail: { contractAddress, tokenId }
                }));
            }
        }, 500);

        return result.data;
    }, [contractAddress, tokenId, userWalletAddress]);

    // Convenience function: Toggle favorite
    const toggleFavorite = useCallback(async () => {
        const newFavoriteState = !userInteractions?.isFavorite;

        if (userInteractions) {
            await updateInteraction({ isFavorite: newFavoriteState });
        } else {
            await createInteraction({ isFavorite: newFavoriteState });
        }
    }, [userInteractions, updateInteraction, createInteraction]);

    // Convenience function: Toggle watchlist
    const toggleWatchlist = useCallback(async () => {
        const newWatchlistState = !userInteractions?.isWatchlisted;

        if (userInteractions) {
            await updateInteraction({ isWatchlisted: newWatchlistState });
        } else {
            await createInteraction({ isWatchlisted: newWatchlistState });
        }
    }, [userInteractions, updateInteraction, createInteraction]);

    // Convenience function: Set rating
    const setRating = useCallback(async (rating: number) => {
        if (userInteractions) {
            await updateInteraction({ rating });
        } else {
            await createInteraction({ rating });
        }
    }, [userInteractions, updateInteraction, createInteraction]);

    // Convenience function: Record view
    const recordView = useCallback(async () => {
        try {
            // Views are typically just recorded, not stored as persistent user state
            await fetch('/api/nft/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractAddress,
                    tokenId,
                    userId: userWalletAddress
                })
            });
            console.log('✅ Recorded view');
        } catch (err) {
            console.error('❌ Error recording view:', err);
        }
    }, [contractAddress, tokenId, userWalletAddress]);

    // Auto-fetch data
    useEffect(() => {
        console.log('🔍 useUserInteractions useEffect check:', {
            autoFetch,
            contractAddress,
            tokenId,
            userWalletAddress,
            willFetch: autoFetch && contractAddress && tokenId && userWalletAddress
        });

        if (autoFetch && contractAddress && tokenId && userWalletAddress) {
            fetchUserInteractions();
        }
    }, [autoFetch, contractAddress, tokenId, userWalletAddress, fetchUserInteractions]);

    return {
        // Data
        userInteractions,

        // States
        loading,
        error,

        // Quick access properties
        isFavorited: userInteractions?.isFavorite || false,
        isWatchlisted: userInteractions?.isWatchlisted || false,
        userRating: userInteractions?.rating,

        // Actions
        toggleFavorite,
        toggleWatchlist,
        setRating,
        recordView,

        // Generic CRUD
        updateInteraction,
        createInteraction,
        refetch: fetchUserInteractions
    };
}
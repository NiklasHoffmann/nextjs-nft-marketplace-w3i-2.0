"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

import { TabType, NFTDetailsPageData } from '@/types';
import { UserNFTInteractions } from '@/types';

import { useNFTInsights } from '@/hooks';
import { useUserInteractions } from '@/hooks';

import { isValidNFTAddress, isValidNFTTokenId, createShareableNFTUrl } from '@/utils';

/**
 * Custom hook that manages UI logic and state for the NFT Detail Page
 * Focuses on navigation, tabs, user interactions, and mock data
 * 
 * NOTE: Does NOT fetch NFT metadata - use useNFT directly in components
 * NOTE: Does NOT fetch insights/user data - use useNFTInsights/useUserInteractions directly
 */
export function useNFTDetailLogic() {
    const params = useParams();
    const router = useRouter();

    // State
    const [nftDetails, setNftDetails] = useState<NFTDetailsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('project');

    // Extract and validate params
    const nftAddress = useMemo(() => params.nftAddress as string, [params.nftAddress]);
    const tokenId = useMemo(() => params.tokenId as string, [params.tokenId]);

    // Get wallet address from wagmi/RainbowKit
    const { address: connectedWalletAddress } = useAccount();
    const userWalletAddress = useMemo(() => {
        return connectedWalletAddress || null; // No fallback - must be actually connected
    }, [connectedWalletAddress]);

    // Check if user is actually connected to wallet
    const isWalletConnected = Boolean(connectedWalletAddress);

    // Validate parameters with memoization
    const isValidParams = useMemo(() => {
        return isValidNFTAddress(nftAddress) && isValidNFTTokenId(tokenId);
    }, [nftAddress, tokenId]);

    // Separate hooks for insights and user interactions
    const {
        insights: publicInsights,
        loading: insightsLoading,
        error: insightsError
    } = useNFTInsights({
        contractAddress: nftAddress,
        tokenId: tokenId,
        autoFetch: isValidParams
    });

    console.log('🚀 useNFTDetailLogic: publicInsights', publicInsights);

    const {
        userInteractions,
        loading: userLoading,
        error: userError,
        updateInteraction: updateUserInteraction,
        createInteraction: createUserInteraction,
        toggleFavorite: toggleFavoriteAction,
        toggleWatchlist,
        setRating,
        recordView
    } = useUserInteractions({
        contractAddress: nftAddress,
        tokenId: tokenId,
        userWalletAddress: userWalletAddress || undefined, // Convert null to undefined
        autoFetch: isValidParams && isWalletConnected // Only fetch if wallet is connected
    });

    console.log('🚀 useNFTDetailLogic: userInteractions', userInteractions);

    // Record view when NFT is loaded (once per page visit)
    // Views can be recorded even without wallet connection
    useEffect(() => {
        if (isValidParams && recordView) {
            recordView();
        }
    }, [isValidParams, recordView]);

    // Memoized mock listing data fetcher
    const createMockNFTDetails = useCallback((address: string, token: string): NFTDetailsPageData => ({
        listingId: `${address}-${token}`,
        nftAddress: address,
        tokenId: token,
        isListed: true,
        price: "50000000000000000", // 0.05 ETH in Wei
        seller: "0x742d35Cc6634C0532925a3b8D0C1C4C9C68F82D4",
        desiredNftAddress: address,
        desiredTokenId: token
    }), []);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleShare = useCallback(() => {
        if (!nftAddress || !tokenId) return;

        const shareUrl = createShareableNFTUrl(nftAddress, tokenId);
        if (navigator.share) {
            navigator.share({
                title: `NFT ${tokenId}`,
                text: `Check out this NFT here on Ideationmarket from collection ${nftAddress}`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    }, [nftAddress, tokenId]);

    // User interaction handlers
    const handleUpdateUserInteraction = useCallback(async (data: Partial<UserNFTInteractions>) => {
        if (!isWalletConnected) {
            console.warn('❌ Update user interaction requires wallet connection');
            alert('Please connect your wallet to save personal data');
            return;
        }

        try {
            console.log('🔧 useNFTDetailLogic: handleUpdateUserInteraction called with:', data);

            if (userInteractions) {
                // Update existing interaction using hook's updateUserInteraction
                await updateUserInteraction(data as any); // Type compatibility
                console.log('✅ Updated existing interaction');
            } else {
                // Create new interaction using hook's createUserInteraction
                await createUserInteraction(data as any); // Type compatibility
                console.log('✅ Created new interaction');
            }
        } catch (err) {
            console.error('❌ Error updating user interaction:', err);
            throw err;
        }
    }, [userInteractions, updateUserInteraction, createUserInteraction, isWalletConnected]);

    // Toggle favorite status (wallet-gated)
    const toggleFavorite = useCallback(async () => {
        if (!isWalletConnected) {
            console.warn('❌ Add to favorites requires wallet connection');
            alert('Please connect your wallet to add favorites');
            return;
        }
        await toggleFavoriteAction();
    }, [isWalletConnected, toggleFavoriteAction]);

    // Toggle watchlist status (wallet-gated)  
    const toggleWatchlistGated = useCallback(async () => {
        if (!isWalletConnected) {
            console.warn('❌ Add to watchlist requires wallet connection');
            alert('Please connect your wallet to add to watchlist');
            return;
        }
        await toggleWatchlist();
    }, [isWalletConnected, toggleWatchlist]);

    // Set rating (wallet-gated)
    const setRatingGated = useCallback(async (rating: number) => {
        if (!isWalletConnected) {
            console.warn('❌ Rating requires wallet connection');
            alert('Please connect your wallet to rate this NFT');
            return;
        }
        await setRating(rating);
    }, [isWalletConnected, setRating]);

    // Tab change handler
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    // Mock data fetcher for backward compatibility
    const fetchListingData = useCallback(async () => {
        if (!isValidParams) {
            setError('Invalid NFT address or token ID');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create mock listing data
            const mockData = createMockNFTDetails(nftAddress, tokenId);
            setNftDetails(mockData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch NFT details');
        } finally {
            setLoading(false);
        }
    }, [isValidParams, nftAddress, tokenId, createMockNFTDetails]);

    // Auto-fetch mock data on mount
    useMemo(() => {
        if (isValidParams) {
            fetchListingData();
        }
    }, [isValidParams, fetchListingData]);

    // Check if we have valid data to display (simplified - just check params and mock data)
    const hasValidData = useMemo(() => {
        return isValidParams && nftDetails;
    }, [isValidParams, nftDetails]);

    // Determine if user has favorited this NFT
    const isFavorited = useMemo(() => {
        return userInteractions?.isFavorite || false;
    }, [userInteractions?.isFavorite]);

    return {
        // Mock NFT Details (for marketplace functionality)
        nftDetails,

        // Public Insights & User Interactions
        publicInsights,
        userInteractions,

        // UI State
        activeTab,
        isFavorited,
        isLoading: loading || insightsLoading || userLoading,
        error: error || insightsError,
        hasValidData,

        // Identifiers & Wallet State
        nftAddress,
        tokenId,
        userWalletAddress,
        isWalletConnected,

        // Handlers
        handleBack,
        handleShare,
        toggleFavorite,
        toggleWatchlist: toggleWatchlistGated,
        setRating: setRatingGated,
        handleTabChange,
        handleUpdateUserInteraction,
        fetchListingData,

        // Legacy compatibility (for old insights)
        insights: publicInsights, // Map public insights to old insights prop
        insightsLoading: insightsLoading || userLoading
    };
}
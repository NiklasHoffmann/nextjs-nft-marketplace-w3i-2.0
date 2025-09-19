"use client";

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

import { TabType } from '@/types';
import { useUserInteractions } from '@/hooks';
import { createShareableNFTUrl } from '@/utils';

/**
 * NFT User Actions & UI State Hook
 * Handles user interactions, navigation, and UI state for NFT detail pages
 * 
 * FOCUSED RESPONSIBILITIES:
 * - User actions (favorites, watchlist, ratings) with wallet gating
 * - Navigation handlers (back, share)
 * - UI state management (active tabs)
 * - Wallet connection state
 * 
 * REMOVED REDUNDANCIES:
 * - NFT data fetching (use NFTContext directly)
 * - Parameter extraction (do in component)
 * - Validation logic (do in component) 
 * - Insights fetching (use NFTContext directly)
 */
export function useNFTUserActions(nftAddress: string, tokenId: string) {
    const router = useRouter();
    const { address: connectedWalletAddress } = useAccount();

    // Simple UI state
    const [activeTab, setActiveTab] = useState<TabType>('project');

    // Wallet state
    const isWalletConnected = Boolean(connectedWalletAddress);
    const userWalletAddress = connectedWalletAddress || undefined;

    // User interactions hook (only if wallet connected)
    const {
        userInteractions,
        toggleFavorite: toggleFavoriteAction,
        toggleWatchlist,
        setRating,
        recordView
    } = useUserInteractions({
        contractAddress: nftAddress,
        tokenId: tokenId,
        userWalletAddress,
        autoFetch: isWalletConnected
    });

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
                text: `Check out this NFT on Ideationmarket from collection ${nftAddress}`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    }, [nftAddress, tokenId]);

    // Wallet-gated user actions
    const toggleFavorite = useCallback(async () => {
        if (!isWalletConnected) {
            alert('Please connect your wallet to add favorites');
            return;
        }
        await toggleFavoriteAction();
    }, [isWalletConnected, toggleFavoriteAction]);

    const toggleWatchlistGated = useCallback(async () => {
        if (!isWalletConnected) {
            alert('Please connect your wallet to add to watchlist');
            return;
        }
        await toggleWatchlist();
    }, [isWalletConnected, toggleWatchlist]);

    const setRatingGated = useCallback(async (rating: number) => {
        if (!isWalletConnected) {
            alert('Please connect your wallet to rate this NFT');
            return;
        }
        await setRating(rating);
    }, [isWalletConnected, setRating]);

    // Tab management
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    // Computed values
    const isFavorited = useMemo(() => {
        return userInteractions?.isFavorite || false;
    }, [userInteractions?.isFavorite]);

    return {
        // UI State
        activeTab,
        isFavorited,

        // Wallet State
        isWalletConnected,

        // Navigation Handlers
        handleBack,
        handleShare,

        // User Action Handlers (wallet-gated)
        toggleFavorite,
        toggleWatchlist: toggleWatchlistGated,
        setRating: setRatingGated,

        // UI Handlers
        handleTabChange,

        // User Data
        userInteractions,
        recordView
    };
}
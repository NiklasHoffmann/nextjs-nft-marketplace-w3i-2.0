/**
 * NFTInteractionCards Component
 * 
 * Interactive stat cards for NFT detail pages.
 * Handles likes, watchlist, ratings, and sharing functionality.
 * 
 * @module app/nft/[contractAddress]/[tokenId]/components
 */

"use client";

import { useState } from 'react';
import { StatCard } from '@/components/ui';

interface NFTInteractionCardsProps {
    // Stats data
    viewCount: number;
    likeCount: number;
    watchlistCount: number;
    averageRating: number;
    ratingCount: number;

    // User interactions
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating: number;

    // Actions
    onToggleFavorite: () => void;
    onToggleWatchlist: () => void;
    onSetRating: (rating: number) => void;
    onShare: () => void;

    // Wallet state
    isConnected: boolean;

    // Compact mode (from PageHeader scroll state)
    isCompact?: boolean;
}

export function NFTInteractionCards({
    viewCount,
    likeCount,
    watchlistCount,
    averageRating,
    ratingCount,
    isFavorited,
    isWatchlisted,
    userRating,
    onToggleFavorite,
    onToggleWatchlist,
    onSetRating,
    onShare,
    isConnected,
    isCompact = false
}: NFTInteractionCardsProps) {
    const [showRatingMenu, setShowRatingMenu] = useState(false);

    const handleWalletGatedAction = (action: () => void, actionName: string) => {
        if (!isConnected) {
            alert(`Please connect your wallet to ${actionName}`);
            return;
        }
        action();
    };

    const handleRatingClick = (rating: number) => {
        if (!isConnected) {
            alert('Please connect your wallet to rate this NFT');
            return;
        }
        onSetRating(rating);
        setShowRatingMenu(false);
    };

    return (
        <div className={
            isCompact
                ? "hidden lg:flex flex-wrap gap-2 justify-end items-stretch transition-all"
                : "hidden lg:grid grid-cols-5 gap-3 items-stretch transition-all"
        }>
            {/* Views Card */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                }
                label="Views"
                value={viewCount}
                variant="gray"
                hideSecondaryPlaceholder
                isCompact={isCompact}
            />

            {/* Likes Card - Interactive */}
            <button
                onClick={() => handleWalletGatedAction(onToggleFavorite, 'like this NFT')}
                disabled={!isConnected}
                className={`transition-all ${!isConnected ? 'cursor-not-allowed opacity-50' : ''}`}
                title={!isConnected ? 'Connect wallet to like NFTs' : isFavorited ? 'Remove like' : 'Like this NFT'}
            >
                <StatCard
                    icon={
                        <svg
                            className={`w-4 h-4 ${isFavorited ? 'text-red-600' : 'text-gray-600'}`}
                            fill={isFavorited ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    }
                    label="Likes"
                    value={likeCount}
                    variant={isFavorited ? 'red' : 'gray'}
                    hideSecondaryPlaceholder
                    isCompact={isCompact}
                />
            </button>

            {/* Watchlist Card - Interactive */}
            <button
                onClick={() => handleWalletGatedAction(onToggleWatchlist, 'manage your watchlist')}
                disabled={!isConnected}
                className={`transition-all ${!isConnected ? 'cursor-not-allowed opacity-50' : ''}`}
                title={!isConnected ? 'Connect wallet to manage watchlist' : isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            >
                <StatCard
                    icon={
                        <svg
                            className={`w-4 h-4 ${isWatchlisted ? 'text-blue-600' : 'text-gray-600'}`}
                            fill={isWatchlisted ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    }
                    label="Saved"
                    value={watchlistCount}
                    variant={isWatchlisted ? 'blue' : 'gray'}
                    hideSecondaryPlaceholder
                    isCompact={isCompact}
                />
            </button>

            {/* Rating Card - Interactive */}
            <div className="relative">
                <button
                    onClick={() => {
                        if (!isConnected) {
                            alert('Please connect your wallet to rate this NFT');
                            return;
                        }
                        setShowRatingMenu(!showRatingMenu);
                    }}
                    disabled={!isConnected}
                    className={`w-full transition-all ${!isConnected ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={!isConnected ? 'Connect wallet to rate NFTs' : userRating ? `Your rating: ${userRating} stars` : 'Rate this NFT'}
                >
                    <StatCard
                        icon={
                            <svg
                                className={`w-4 h-4 ${userRating ? 'text-yellow-600' : 'text-gray-600'}`}
                                fill={userRating ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        }
                        label="Rating"
                        value={ratingCount > 0
                            ? `${averageRating.toFixed(1)} (${ratingCount})`
                            : '0.0 (0)'
                        }
                        variant={userRating ? 'yellow' : 'gray'}
                        hideSecondaryPlaceholder
                        isCompact={isCompact}
                    />
                </button>

                {/* Rating Dropdown */}
                {showRatingMenu && isConnected && (
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                        <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() => handleRatingClick(rating)}
                                    className={`w-6 h-6 rounded transition-colors ${(userRating && rating <= userRating)
                                        ? 'text-yellow-500 hover:text-yellow-600'
                                        : 'text-gray-300 hover:text-yellow-400'
                                        }`}
                                >
                                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        {userRating > 0 && (
                            <button
                                onClick={() => handleRatingClick(0)}
                                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors border-t border-gray-100 pt-2"
                            >
                                Remove Rating
                            </button>
                        )}
                        <p className="text-xs text-gray-500 mt-1 text-center">Click to rate</p>
                    </div>
                )}
            </div>

            {/* Share Card - Interactive */}
            <button
                onClick={onShare}
                className="hover:opacity-90 transition-all"
                title="Share this NFT"
            >
                <StatCard
                    icon={
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                    }
                    label="Share"
                    value={
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    }
                    variant="gray"
                    hideSecondaryPlaceholder
                    isCompact={isCompact}
                />
            </button>
        </div>
    );
}

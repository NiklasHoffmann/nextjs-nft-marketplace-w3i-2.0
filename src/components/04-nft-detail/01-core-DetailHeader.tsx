"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { NFTDetailHeaderProps } from '@/types';
import { formatNFTDisplayName, formatCollectionDisplayName } from '@/utils';
import { useNFTUserStats } from '@/contexts/NFTStatsContext';

interface ExtendedNFTDetailHeaderProps extends NFTDetailHeaderProps {
    // Remove individual stats props - now using context
}

export default function NFTDetailHeader({
    name,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    nftAddress,
    // Keep these for backward compatibility (will be overridden by context)
    isFavorited: legacyIsFavorited,
    onToggleFavorite: legacyOnToggleFavorite,
    onShare
}: ExtendedNFTDetailHeaderProps) {
    const router = useRouter();
    const [showRatingMenu, setShowRatingMenu] = useState(false);

    // Get wallet connection state
    const { address: userAddress, isConnected } = useAccount();

    // Use the new unified stats context
    const {
        stats,
        userInteractions,
        toggleFavorite,
        toggleWatchlist,
        setRating,
        incrementViews,
        hasUserAddress
    } = useNFTUserStats(nftAddress, tokenId, userAddress);

    // Record view on mount
    const viewRecorded = useRef(false);

    useEffect(() => {
        // Only record view once per component instance
        if (viewRecorded.current) return;

        let timeoutId: NodeJS.Timeout;

        // Delay view recording to avoid counting quick page exits
        timeoutId = setTimeout(() => {
            incrementViews();
            viewRecorded.current = true;
        }, 2000);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [nftAddress, tokenId]); // Only depend on NFT identity, not incrementViews function

    const handleBack = () => {
        router.back();
    };

    const handleRatingClick = (rating: number) => {
        if (!isConnected) {
            alert('Please connect your wallet to rate this NFT');
            return;
        }
        setRating(rating);
        setShowRatingMenu(false);
    };

    const handleWalletGatedAction = (action: () => void, actionName: string) => {
        if (!isConnected) {
            alert(`Please connect your wallet to ${actionName}`);
            return;
        }
        action();
    };

    // Use context data with fallbacks to legacy props - instant updates
    const displayStats = {
        viewCount: stats?.viewCount ?? 0,
        favoriteCount: stats?.favoriteCount ?? 0,
        watchlistCount: stats?.watchlistCount ?? 0,
        averageRating: stats?.averageRating ?? 0,
        ratingCount: stats?.ratingCount ?? 0
    };

    // Debug console output to check what we're getting
    console.log('🔍 DetailHeader Debug:', {
        nftAddress: nftAddress?.substring(0, 10) + '...',
        tokenId,
        isConnected,
        userAddress: userAddress?.substring(0, 10) + '...',
        hasStats: !!stats,
        stats,
        hasUserInteractions: !!userInteractions,
        userInteractions,
        displayStats,
        hasUserAddress
    });

    const displayUserInteractions = {
        isFavorited: userInteractions?.isFavorited ?? legacyIsFavorited ?? false,
        isWatchlisted: userInteractions?.isWatchlisted ?? false,
        userRating: userInteractions?.userRating ?? 0,
    };

    return (
        <div className="bg-white shadow-sm border-b fixed top-16 left-0 right-0 z-40">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    {/* Left Side - Back button and NFT Info */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Go back"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {formatNFTDisplayName(name, tokenId)}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {formatCollectionDisplayName(contractName, collection, contractSymbol, nftAddress)}
                            </p>
                        </div>
                    </div>

                    {/* Center - Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="min-w-[40px]">{displayStats.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="min-w-[30px]">{displayStats.favoriteCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="min-w-[30px]">{displayStats.watchlistCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <span className="min-w-[60px]">
                                {displayStats.ratingCount > 0
                                    ? `${displayStats.averageRating.toFixed(1)} (${displayStats.ratingCount})`
                                    : '0 (0)'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Right Side - User Actions */}
                    <div className="flex items-center gap-2">
                        {/* Watchlist */}
                        <button
                            onClick={() => handleWalletGatedAction(toggleWatchlist, 'manage your watchlist')}
                            disabled={!isConnected}
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center w-10 h-10 ${!isConnected
                                ? 'text-gray-400 cursor-not-allowed opacity-50'
                                : displayUserInteractions.isWatchlisted
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            aria-label={displayUserInteractions.isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                            title={!isConnected ? 'Connect wallet to manage watchlist' : undefined}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>

                        {/* Favorite */}
                        <button
                            onClick={() => handleWalletGatedAction(toggleFavorite, 'like this NFT')}
                            disabled={!isConnected}
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center w-10 h-10 ${!isConnected
                                ? 'text-gray-400 cursor-not-allowed opacity-50'
                                : displayUserInteractions.isFavorited
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            aria-label={displayUserInteractions.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                            title={!isConnected ? 'Connect wallet to like NFTs' : undefined}
                        >
                            {displayUserInteractions.isFavorited ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                        </button>

                        {/* Rating */}
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
                                className={`p-2 rounded-lg transition-colors flex items-center justify-center w-10 h-10 ${!isConnected
                                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                                    : displayUserInteractions.userRating
                                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                aria-label={displayUserInteractions.userRating ? `Rated ${displayUserInteractions.userRating} stars` : 'Rate this NFT'}
                                title={!isConnected ? 'Connect wallet to rate NFTs' : undefined}
                            >
                                <svg className="w-4 h-4" fill={displayUserInteractions.userRating ? 'currentColor' : 'none'}
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>

                            {/* Rating Dropdown */}
                            {showRatingMenu && isConnected && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                                    <div className="flex space-x-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => handleRatingClick(rating)}
                                                className={`w-6 h-6 rounded transition-colors ${(displayUserInteractions.userRating && rating <= displayUserInteractions.userRating)
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
                                    {displayUserInteractions.userRating > 0 && (
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
                        </div>                        {/* Share */}
                        <button
                            onClick={onShare}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Share NFT"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NFTDetailHeaderProps } from '@/types';
import { formatNFTDisplayName, formatCollectionDisplayName } from '@/utils/nft-helpers';

interface ExtendedNFTDetailHeaderProps extends NFTDetailHeaderProps {
    // User Actions
    isWatchlisted?: boolean;
    userRating?: number;
    onToggleWatchlist?: () => void;
    onSetRating?: (rating: number) => void;
    
    // Stats for display
    viewCount?: number;
    favoriteCount?: number;
    averageRating?: number;
    ratingCount?: number;
    watchlistCount?: number;
}

export default function NFTDetailHeader({
    name,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    nftAddress,
    isFavorited,
    onToggleFavorite,
    onShare,
    // Extended props
    isWatchlisted = false,
    userRating,
    onToggleWatchlist,
    onSetRating,
    viewCount = 0,
    favoriteCount = 0,
    averageRating = 0,
    ratingCount = 0,
    watchlistCount = 0
}: ExtendedNFTDetailHeaderProps) {
    const router = useRouter();
    const [showRatingMenu, setShowRatingMenu] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const handleRatingClick = (rating: number) => {
        onSetRating?.(rating);
        setShowRatingMenu(false);
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
                            <span>{viewCount} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{favoriteCount} likes</span>
                        </div>
                        {watchlistCount > 0 && (
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{watchlistCount} watching</span>
                            </div>
                        )}
                        {ratingCount > 0 && (
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span>{averageRating.toFixed(1)} ({ratingCount})</span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - User Actions */}
                    <div className="flex items-center gap-2">
                        {/* Watchlist */}
                        {onToggleWatchlist && (
                            <button
                                onClick={onToggleWatchlist}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                    isWatchlisted
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="hidden sm:inline text-xs">
                                    {isWatchlisted ? 'Watching' : 'Watch'}
                                </span>
                            </button>
                        )}

                        {/* Favorite */}
                        <button
                            onClick={onToggleFavorite}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                isFavorited
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                            <span className="hidden sm:inline text-xs">
                                {isFavorited ? 'Liked' : 'Like'}
                            </span>
                        </button>

                        {/* Rating */}
                        {onSetRating && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowRatingMenu(!showRatingMenu)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                        userRating
                                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                    aria-label={userRating ? `Rated ${userRating} stars` : 'Rate this NFT'}
                                >
                                    <svg className="w-4 h-4" fill={userRating ? 'currentColor' : 'none'} 
                                         stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <span className="hidden sm:inline text-xs">
                                        {userRating ? `${userRating}★` : 'Rate'}
                                    </span>
                                </button>

                                {/* Rating Dropdown */}
                                {showRatingMenu && (
                                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => handleRatingClick(rating)}
                                                    className={`w-6 h-6 rounded transition-colors ${
                                                        (userRating && rating <= userRating)
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
                                        <p className="text-xs text-gray-500 mt-1 text-center">Click to rate</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Share */}
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

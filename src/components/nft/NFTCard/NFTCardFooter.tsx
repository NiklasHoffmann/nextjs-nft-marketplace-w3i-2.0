/**
 * NFTCardFooter - Footer section for NFT cards
 * Shows categories and social stats (likes, watchlist)
 */

import { memo } from 'react';
import type { AggregatedNFT } from '@/types/core/core-nft-modern';

interface NFTCardFooterProps {
    categories: string[];
    likeCount?: number;
    watchlistCount?: number;
    enableInsights?: boolean;
    nft?: AggregatedNFT;
}

export const NFTCardFooter = memo<NFTCardFooterProps>(({
    categories,
    likeCount = 0,
    watchlistCount = 0,
    enableInsights = true,
    nft
}) => {
    return (
        <div className="flex items-center gap-1">
            {/* Categories - left side */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 min-w-0">
                    {categories.slice(0, 1).map((cat, index) => (
                        <div
                            key={index}
                            className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && nft?.insight?.category
                                    ? 'bg-purple-100/95 border-purple-200/60 ring-purple-300/20'
                                    : 'bg-white/95 border-gray-200/60 ring-gray-300/20'
                                }`}
                        >
                            <span className={`text-xs font-medium truncate ${enableInsights && nft?.insight?.category ? 'text-purple-700' : 'text-gray-700'
                                }`}>
                                {cat}
                            </span>
                        </div>
                    ))}
                    {categories.length > 1 && (
                        <div
                            className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && nft?.insight?.category
                                    ? 'bg-purple-100/95 border-purple-200/60 ring-purple-300/20'
                                    : 'bg-white/95 border-gray-200/60 ring-gray-300/20'
                                }`}
                        >
                            <span className={`text-xs font-medium ${enableInsights && nft?.insight?.category ? 'text-purple-600' : 'text-gray-500'
                                }`}>
                                +{categories.length - 1}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Flexible spacer to push social stats to the right */}
            <div className="flex-1"></div>

            {/* Social Stats - always right side */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Like Count */}
                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                    <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                        {likeCount}
                    </span>
                </div>

                {/* Watchlist Count */}
                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                        {watchlistCount}
                    </span>
                </div>
            </div>
        </div>
    );
});

NFTCardFooter.displayName = 'NFTCardFooter';

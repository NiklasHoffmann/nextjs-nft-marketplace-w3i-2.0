"use client";

import { memo } from "react";

interface NFTCardSkeletonProps {
    className?: string;
}

/**
 * NFTCardSkeleton - Accurate loading placeholder for NFTCard
 * 
 * Mirrors the exact structure of NFTCard:
 * - Header with collection name and rating stars
 * - 50/50 split: Image (left) and Description (right)
 * - Category badges and social stats
 * - Price display at bottom
 */
const NFTCardSkeleton = memo(({
    className = ""
}: NFTCardSkeletonProps) => {
    return (
        <div className={`rounded-lg shadow-xl flex flex-col gap-2 w-full h-72 relative bg-gray-200 border border-black ${className}`}>
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-lg" />

            {/* Content container */}
            <div className="absolute inset-2 shadow-lg rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)] bg-gray-100">
                <div className="relative z-10 flex flex-col h-full p-1 gap-1">
                    {/* NFT Name Header at top */}
                    <div className="flex-shrink-0">
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 space-y-1">
                                    {/* Collection Name skeleton */}
                                    <div className="h-3.5 bg-gray-300 rounded w-24 animate-pulse" />
                                    {/* NFT Name skeleton */}
                                    <div className="h-3 bg-gray-300 rounded w-32 animate-pulse" />
                                </div>
                                {/* Rating stars skeleton */}
                                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 h-6 flex items-center gap-0.5 ml-2">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <div key={i} className="w-2.5 h-2.5 bg-gray-300 rounded-full animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image and Description side by side - 50/50 split */}
                    <div className="flex-1 flex gap-1 min-h-0">
                        {/* Left: Image skeleton - 50% */}
                        <div className="w-1/2 flex justify-center items-stretch overflow-hidden">
                            <div className="rounded-md border-2 border-white/50 backdrop-blur-sm overflow-hidden relative h-full bg-gray-300 w-full animate-pulse">
                                {/* Image placeholder icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Right: Description skeleton - 50% */}
                        <div className="w-1/2">
                            <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-lg h-full space-y-1.5">
                                <div className="h-2.5 bg-gray-300 rounded w-full animate-pulse" />
                                <div className="h-2.5 bg-gray-300 rounded w-5/6 animate-pulse" />
                                <div className="h-2.5 bg-gray-300 rounded w-4/5 animate-pulse" />
                                <div className="h-2.5 bg-gray-300 rounded w-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Categories and Social Stats */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-1">
                            {/* Category badge skeleton */}
                            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 h-6 flex items-center">
                                <div className="h-3 bg-gray-300 rounded w-16 animate-pulse" />
                            </div>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Social stats skeletons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Like count skeleton */}
                                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 h-6 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    <div className="h-3 bg-gray-300 rounded w-4 animate-pulse" />
                                </div>

                                {/* Watchlist count skeleton */}
                                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 h-6 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    <div className="h-3 bg-gray-300 rounded w-4 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Display skeleton at bottom */}
                    <div className="flex-shrink-0">
                        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-200/60 h-[62px]">
                            <div className="flex justify-between items-center h-full">
                                <div className="flex-1 space-y-1">
                                    {/* ETH price skeleton */}
                                    <div className="h-5 bg-gray-300 rounded w-24 animate-pulse" />
                                    {/* Fiat price skeleton */}
                                    <div className="h-3 bg-gray-300 rounded w-16 animate-pulse" />
                                </div>
                                {/* Sell/Swap indicator skeleton */}
                                <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-xl border border-gray-200/60 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                                    <div className="h-3 bg-gray-300 rounded w-8 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

NFTCardSkeleton.displayName = 'NFTCardSkeleton';

export default NFTCardSkeleton;

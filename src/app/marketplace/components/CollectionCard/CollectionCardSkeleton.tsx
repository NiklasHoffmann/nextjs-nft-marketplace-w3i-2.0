"use client";

import { memo } from "react";

interface CollectionCardSkeletonProps {
    className?: string;
}

/**
 * CollectionCardSkeleton - Loading placeholder for CollectionCard
 * 
 * Mirrors the exact structure of CollectionCard:
 * - Header with collection name
 * - Preview images grid (2x2)
 * - Stats section with floor price, total value, items count
 */
const CollectionCardSkeleton = memo(({
    className = ""
}: CollectionCardSkeletonProps) => {
    return (
        <div className={`group flex-shrink-0 w-80 ${className}`}>
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                {/* Header skeleton */}
                <div className="p-4 border-b border-gray-100">
                    <div className="space-y-2">
                        {/* Collection symbol skeleton */}
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        {/* Collection name skeleton */}
                        <div className="h-5 bg-gray-300 rounded w-32 animate-pulse" />
                    </div>
                </div>

                {/* Preview images grid skeleton - 2x2 */}
                <div className="relative h-80 bg-gray-50">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 p-2 h-full">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="relative bg-gray-200 rounded-lg overflow-hidden animate-pulse">
                                {/* Image placeholder icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats skeleton */}
                <div className="p-4 space-y-3 border-t border-gray-100">
                    {/* Floor price skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-5 bg-gray-300 rounded w-20 animate-pulse" />
                    </div>

                    {/* Total value skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                        <div className="h-5 bg-gray-300 rounded w-24 animate-pulse" />
                    </div>

                    {/* Items count skeleton */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
                        <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
                    </div>

                    {/* Social stats skeleton */}
                    <div className="flex items-center gap-3 pt-2">
                        {/* Likes */}
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <div className="h-3 bg-gray-200 rounded w-6 animate-pulse" />
                        </div>

                        {/* Views */}
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
                        </div>

                        {/* Watchlist */}
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <div className="h-3 bg-gray-200 rounded w-6 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Shimmer animation keyframes */}
            <style jsx>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
});

CollectionCardSkeleton.displayName = 'CollectionCardSkeleton';

export default CollectionCardSkeleton;

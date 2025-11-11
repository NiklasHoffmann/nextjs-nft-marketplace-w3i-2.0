"use client";

import { memo } from "react";

interface NFTCardSkeletonProps {
    className?: string;
    width?: number;
    height?: number;
    fill?: boolean;
}

const NFTCardSkeleton = memo(({
    className = "",
    width,
    height,
    fill = false
}: NFTCardSkeletonProps) => {
    return (
        <div
            className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-xl border border-black h-72 ${className}`}
            style={!fill && width && height ? { width, height } : undefined}
        >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Image placeholder */}
            <div className="w-full h-3/4 bg-gray-300 rounded-t-lg" />

            {/* Content placeholder */}
            <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse" />
            </div>
        </div>
    );
});

NFTCardSkeleton.displayName = 'NFTCardSkeleton';

export default NFTCardSkeleton;

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
    width = 256,
    height = 256,
    fill = false
}: NFTCardSkeletonProps) => {
    return (
        <div
            className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${className}`}
            style={fill ? {} : { width, height }}
        >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Image placeholder */}
            <div className="w-full h-3/4 bg-gray-200 rounded-t-lg" />

            {/* Content placeholder */}
            <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
});

NFTCardSkeleton.displayName = 'NFTCardSkeleton';

export default NFTCardSkeleton;
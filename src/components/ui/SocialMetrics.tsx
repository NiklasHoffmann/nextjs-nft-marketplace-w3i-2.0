"use client";

import React from 'react';
import { HeartIcon, EyeIcon, BookmarkIcon, StarIcon } from '@/components/icons';

interface SocialMetricsProps {
    likes?: number;
    views?: number;
    watchlist?: number;
    rating?: number;
    ratingCount?: number;
    layout?: 'horizontal' | 'vertical' | 'grid';
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    className?: string;
}

/**
 * Reusable Social Metrics display component
 * Shows likes, views, watchlist count, and ratings
 * Used in CollectionCard and NFTCard
 */
export const SocialMetrics = React.memo(({
    likes = 0,
    views = 0,
    watchlist = 0,
    rating,
    ratingCount = 0,
    layout = 'grid',
    size = 'sm',
    showLabels = false,
    className = '',
}: SocialMetricsProps) => {
    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };
    
    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };
    
    const MetricItem = ({ icon, value, label, color }: { 
        icon: React.ReactNode; 
        value: string | number; 
        label?: string;
        color: string;
    }) => (
        <div className="flex items-center gap-1">
            <span className={color}>{icon}</span>
            <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {showLabels && label && (
                <span className="text-gray-500 text-xs">{label}</span>
            )}
        </div>
    );
    
    const hasRating = rating !== undefined && rating > 0;
    
    if (layout === 'horizontal') {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                <MetricItem 
                    icon={<HeartIcon className={iconSizes[size]} />} 
                    value={likes} 
                    label="Likes"
                    color="text-red-500" 
                />
                <MetricItem 
                    icon={<EyeIcon className={iconSizes[size]} />} 
                    value={views} 
                    label="Views"
                    color="text-blue-500" 
                />
                <MetricItem 
                    icon={<BookmarkIcon className={iconSizes[size]} />} 
                    value={watchlist} 
                    label="Watchlist"
                    color="text-amber-500" 
                />
                {hasRating ? (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-yellow-500`} />
                        <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
                            {rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">({ratingCount})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-gray-400`} />
                        <span className="text-xs text-gray-500">N/A</span>
                    </div>
                )}
            </div>
        );
    }
    
    if (layout === 'vertical') {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <MetricItem 
                    icon={<HeartIcon className={iconSizes[size]} />} 
                    value={likes} 
                    label="Likes"
                    color="text-red-500" 
                />
                <MetricItem 
                    icon={<EyeIcon className={iconSizes[size]} />} 
                    value={views} 
                    label="Views"
                    color="text-blue-500" 
                />
                <MetricItem 
                    icon={<BookmarkIcon className={iconSizes[size]} />} 
                    value={watchlist} 
                    label="Watchlist"
                    color="text-amber-500" 
                />
                {hasRating ? (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-yellow-500`} />
                        <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
                            {rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">({ratingCount})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-gray-400`} />
                        <span className="text-xs text-gray-500">N/A</span>
                    </div>
                )}
            </div>
        );
    }
    
    // Grid layout (2x2) - default
    return (
        <div className={`space-y-2 ${className}`}>
            {/* Row 1: Likes & Views */}
            <div className="flex items-center justify-between">
                <MetricItem 
                    icon={<HeartIcon className={iconSizes[size]} />} 
                    value={likes} 
                    color="text-red-500" 
                />
                <MetricItem 
                    icon={<EyeIcon className={iconSizes[size]} />} 
                    value={views} 
                    color="text-blue-500" 
                />
            </div>
            {/* Row 2: Watchlist & Rating */}
            <div className="flex items-center justify-between">
                <MetricItem 
                    icon={<BookmarkIcon className={iconSizes[size]} />} 
                    value={watchlist} 
                    color="text-amber-500" 
                />
                {hasRating ? (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-yellow-500`} />
                        <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
                            {rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">({ratingCount})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <StarIcon className={`${iconSizes[size]} text-gray-400`} />
                        <span className="text-xs text-gray-500">N/A</span>
                    </div>
                )}
            </div>
        </div>
    );
});

SocialMetrics.displayName = 'SocialMetrics';

export default SocialMetrics;

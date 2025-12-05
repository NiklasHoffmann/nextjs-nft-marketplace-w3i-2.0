"use client";

import React from 'react';
import { SocialMetrics } from '@/components/ui';
import { CollectionPriceDisplay } from './CollectionPriceDisplay';

interface CollectionCardStatsProps {
    // Supply & Listing
    totalSupply?: number;
    itemCount: number;
    // Social Metrics
    totalLikes?: number;
    totalViews?: number;
    totalWatchlist?: number;
    averageRating?: number;
    totalRatings?: number;
    // Price
    totalValue: number;
    floorPrice: number | null;
    // Insights (optional)
    insights?: {
        totalSupply?: number;
    };
}

/**
 * Stats section for collection cards
 * Shows supply, listed count, social metrics, and price info
 */
export const CollectionCardStats = React.memo(({
    totalSupply,
    itemCount,
    totalLikes = 0,
    totalViews = 0,
    totalWatchlist = 0,
    averageRating,
    totalRatings = 0,
    totalValue,
    floorPrice,
    insights,
}: CollectionCardStatsProps) => {
    // Get supply from props or insights
    const supply = totalSupply || insights?.totalSupply;
    const supplyDisplay = supply && supply > 0 ? supply.toLocaleString() : 'N/A';

    return (
        <div className="p-4 space-y-3">
            {/* Supply & Listed */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Supply:</span>
                <span className="font-semibold text-gray-900">{supplyDisplay}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Listed:</span>
                <span className="font-semibold text-green-600">{itemCount}</span>
            </div>

            {/* Social Metrics */}
            <div className="pt-2 border-t border-gray-200">
                <SocialMetrics
                    likes={totalLikes}
                    views={totalViews}
                    watchlist={totalWatchlist}
                    rating={averageRating}
                    ratingCount={totalRatings}
                    layout="grid"
                    size="sm"
                />
            </div>

            {/* Price Info */}
            {itemCount > 0 ? (
                <div className="pt-2 border-t border-gray-200">
                    <CollectionPriceDisplay
                        totalValue={totalValue}
                        floorPrice={floorPrice}
                    />
                </div>
            ) : (
                <div className="pt-2 border-t border-gray-200 text-sm text-gray-500 text-center min-h-[60px] flex items-center justify-center">
                    No listings
                </div>
            )}
        </div>
    );
});

CollectionCardStats.displayName = 'CollectionCardStats';

export default CollectionCardStats;

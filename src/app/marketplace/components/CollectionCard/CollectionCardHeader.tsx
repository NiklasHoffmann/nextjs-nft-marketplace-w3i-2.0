"use client";

import React from 'react';

interface CollectionCardHeaderProps {
    contractSymbol?: string;
    contractName?: string;
    averageRating?: number;
    totalRatings?: number;
}

/**
 * Header section for collection cards
 * Shows contract symbol and name
 */
export const CollectionCardHeader = React.memo(({
    contractSymbol,
    contractName,
    averageRating,
    totalRatings = 0,
}: CollectionCardHeaderProps) => {
    const rawRating = averageRating || 0;
    const normalizedRating = rawRating > 0 ? Math.round(rawRating * 2) / 2 : null;
    const ratingLabel = normalizedRating !== null
        ? (Number.isInteger(normalizedRating) ? normalizedRating.toFixed(0) : normalizedRating.toFixed(1))
        : null;

    return (
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {contractSymbol || 'Unknown'}
                    </h3>
                    <p
                        className="text-xs text-gray-600 truncate"
                        title={contractName || 'Unknown Collection'}
                    >
                        {contractName || 'Unknown Collection'}
                    </p>
                </div>

                {normalizedRating !== null && (
                    <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1 ml-2">
                        <span className="text-yellow-500 text-xs leading-none">★</span>
                        <span className="text-xs font-semibold text-gray-700 leading-none">{ratingLabel}</span>
                        <span className="text-[10px] text-gray-500">({totalRatings})</span>
                    </div>
                )}
            </div>
        </div>
    );
});

CollectionCardHeader.displayName = 'CollectionCardHeader';

export default CollectionCardHeader;

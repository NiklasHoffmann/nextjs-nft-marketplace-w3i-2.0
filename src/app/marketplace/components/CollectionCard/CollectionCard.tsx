"use client";

import React from 'react';
import { CollectionCardHeader } from './CollectionCardHeader';
import { CollectionCardPreview } from './CollectionCardPreview';
import { CollectionCardStats } from './CollectionCardStats';

// Types for collection data
export interface CollectionData {
    contractAddress: string;
    contractSymbol?: string;
    contractName?: string;
    previewImages?: string[];
    totalSupply?: number;
    itemCount: number;
    totalLikes?: number;
    totalViews?: number;
    totalWatchlist?: number;
    averageRating?: number;
    totalRatings?: number;
    totalValue: number;
    floorPrice: number | null;
    insights?: {
        totalSupply?: number;
    };
}

interface CollectionCardProps {
    collection: CollectionData;
    onClick?: (contractAddress: string) => void;
}

/**
 * Complete collection card component
 * Combines header, preview images, and stats
 */
export const CollectionCard = React.memo(({
    collection,
    onClick,
}: CollectionCardProps) => {
    const handleClick = () => {
        if (onClick && collection.contractAddress) {
            onClick(collection.contractAddress);
        }
    };

    return (
        <div
            className="group cursor-pointer transform-gpu flex-shrink-0 w-80"
            onClick={handleClick}
        >
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 ease-out">
                <CollectionCardHeader
                    contractSymbol={collection.contractSymbol}
                    contractName={collection.contractName}
                />

                <CollectionCardPreview
                    previewImages={collection.previewImages}
                    contractAddress={collection.contractAddress}
                    contractName={collection.contractName}
                />

                <CollectionCardStats
                    totalSupply={collection.totalSupply}
                    itemCount={collection.itemCount}
                    totalLikes={collection.totalLikes}
                    totalViews={collection.totalViews}
                    totalWatchlist={collection.totalWatchlist}
                    averageRating={collection.averageRating}
                    totalRatings={collection.totalRatings}
                    totalValue={collection.totalValue}
                    floorPrice={collection.floorPrice}
                    insights={collection.insights}
                />
            </div>
        </div>
    );
});

CollectionCard.displayName = 'CollectionCard';

export default CollectionCard;

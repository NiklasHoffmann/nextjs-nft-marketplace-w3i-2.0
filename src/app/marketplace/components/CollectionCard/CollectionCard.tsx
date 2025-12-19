"use client";

import React from 'react';
import { BaseCard } from '@/components/core/Card/BaseCard';
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
 * Uses BaseCard wrapper with header, preview, and stats slots
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
        <BaseCard
            size="md"
            hoverable
            onClick={handleClick}
            header={
                <CollectionCardHeader
                    contractSymbol={collection.contractSymbol}
                    contractName={collection.contractName}
                />
            }
            image={
                <CollectionCardPreview
                    previewImages={collection.previewImages}
                    contractAddress={collection.contractAddress}
                    contractName={collection.contractName}
                />
            }
            footer={
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
            }
        />
    );
});

CollectionCard.displayName = 'CollectionCard';

export default CollectionCard;

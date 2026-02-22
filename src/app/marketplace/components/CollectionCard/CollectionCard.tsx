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
    itemCount: number;
    totalLikes?: number;
    totalViews?: number;
    totalWatchlist?: number;
    averageRating?: number;
    totalRatings?: number;
    totalValue: number;
    floorPrice: number | null;
    erc721ItemCount?: number;
    erc1155ItemCount?: number;
    erc1155ListedUnits?: number;
    erc1155RemainingUnits?: number;
    partialBuyEnabledCount?: number;
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
            className="border-black bg-gradient-to-br from-gray-50 to-white overflow-hidden h-[30rem]"
            padding="p-1 h-full flex flex-col [&>div]:h-full"
            rounded="md"
            onClick={handleClick}
            content={
                <div className="h-full flex flex-col gap-1">
                    <CollectionCardHeader
                        contractSymbol={collection.contractSymbol}
                        contractName={collection.contractName}
                        averageRating={collection.averageRating}
                        totalRatings={collection.totalRatings}
                    />

                    <CollectionCardPreview
                        previewImages={collection.previewImages}
                        contractAddress={collection.contractAddress}
                        contractName={collection.contractName}
                    />

                    <div className="mt-auto">
                        <CollectionCardStats
                            itemCount={collection.itemCount}
                            totalLikes={collection.totalLikes}
                            totalValue={collection.totalValue}
                            floorPrice={collection.floorPrice}
                            erc721ItemCount={collection.erc721ItemCount}
                            erc1155ItemCount={collection.erc1155ItemCount}
                            erc1155ListedUnits={collection.erc1155ListedUnits}
                            erc1155RemainingUnits={collection.erc1155RemainingUnits}
                            partialBuyEnabledCount={collection.partialBuyEnabledCount}
                        />
                    </div>
                </div>
            }
        />
    );
});

CollectionCard.displayName = 'CollectionCard';

export default CollectionCard;

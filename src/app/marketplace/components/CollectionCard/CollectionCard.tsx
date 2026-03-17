"use client";

import React from 'react';
import { BaseCard } from '@/components/core/Card/BaseCard';
import { OptimizedNFTImage } from '@/components/nft';
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
    displayTotalValue?: number;
    totalValueCurrency?: string | null;
    currencyTotals?: Array<{
        currency: string;
        totalValue: number;
    }>;
    floorPrice: string | null;
    floorPriceCurrency?: string | null;
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
    const firstPreviewImage = collection.previewImages?.[0] || '';

    const handleClick = () => {
        if (onClick && collection.contractAddress) {
            onClick(collection.contractAddress);
        }
    };

    return (
        <div>
            <BaseCard
                size="md"
                hoverable
                className="border-black overflow-hidden h-[22.5rem] relative"
                padding="p-0 h-full flex flex-col [&>div]:h-full"
                rounded="md"
                onClick={handleClick}
                content={
                    <div className="relative h-full overflow-hidden rounded-md">
                        {firstPreviewImage ? (
                            <div className="absolute inset-0">
                                <OptimizedNFTImage
                                    imageUrl={firstPreviewImage}
                                    tokenId={`${collection.contractAddress}-card-bg`}
                                    alt={`${collection.contractName || 'Collection'} background`}
                                    className="w-full h-full object-cover"
                                    variant="card"
                                    fill
                                    sizes="(max-width: 640px) 94vw, (max-width: 1024px) 44vw, 360px"
                                />
                                <div className="absolute inset-0 bg-white/30" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}

                        <div className="relative z-10 h-full p-1 flex flex-col gap-1">
                            <div className="flex-shrink-0">
                                <CollectionCardHeader
                                    contractSymbol={collection.contractSymbol}
                                    contractName={collection.contractName}
                                    averageRating={collection.averageRating}
                                />
                            </div>

                            <div className="flex-1 min-h-0">
                                <CollectionCardPreview
                                    previewImages={collection.previewImages}
                                    contractAddress={collection.contractAddress}
                                    contractName={collection.contractName}
                                    className="h-full"
                                />
                            </div>

                            <div className="flex-shrink-0">
                                <CollectionCardStats
                                    itemCount={collection.itemCount}
                                    totalLikes={collection.totalLikes}
                                    totalValue={collection.totalValue}
                                    displayTotalValue={collection.displayTotalValue}
                                    totalValueCurrency={collection.totalValueCurrency}
                                    currencyTotals={collection.currencyTotals}
                                    floorPrice={collection.floorPrice}
                                    floorPriceCurrency={collection.floorPriceCurrency}
                                    erc721ItemCount={collection.erc721ItemCount}
                                    erc1155ItemCount={collection.erc1155ItemCount}
                                    erc1155ListedUnits={collection.erc1155ListedUnits}
                                    erc1155RemainingUnits={collection.erc1155RemainingUnits}
                                />
                            </div>
                        </div>
                    </div>
                }
            />
        </div>
    );
});

CollectionCard.displayName = 'CollectionCard';

export default CollectionCard;

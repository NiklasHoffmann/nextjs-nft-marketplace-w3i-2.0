"use client";

import React from 'react';
import { useETHPrice } from "@/contexts/CurrencyContext";

interface CollectionPriceDisplayProps {
    totalValue: number;
    floorPrice: number | null;
    hasERC721?: boolean;
    hasERC1155?: boolean;
}

/**
 * Price display component for collections
 * Shows total value in ETH with USD conversion and floor price
 */
export const CollectionPriceDisplay = React.memo(({
    totalValue,
    floorPrice,
    hasERC721 = false,
    hasERC1155 = false,
}: CollectionPriceDisplayProps) => {
    // Convert from Wei to ETH (divide by 10^18)
    const totalValueInEth = totalValue / 1e18;
    const floorPriceInEth = floorPrice ? floorPrice / 1e18 : null;

    const { convertedPrice, loading } = useETHPrice(totalValueInEth);

    return (
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 min-h-[62px]">
            <div className="relative">
                <div className="text-left min-w-0 pr-24">
                    {loading ? (
                        <div className="text-sm font-semibold text-gray-900">Lädt...</div>
                    ) : (
                        <div className="text-sm font-semibold text-gray-900">{convertedPrice}</div>
                    )}
                    <div className="text-xs text-gray-600">≈ {totalValueInEth.toFixed(4)} ETH</div>
                    <div className="text-xs text-blue-600 mt-0.5">
                        {floorPriceInEth ? `Floor: ${floorPriceInEth.toFixed(4)} ETH` : 'Floor: —'}
                    </div>
                </div>

                {(hasERC721 || hasERC1155) && (
                    <div className="absolute right-0 bottom-0 flex items-center gap-1">
                        {hasERC721 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
                                ERC-721
                            </span>
                        )}
                        {hasERC1155 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                                ERC-1155
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

CollectionPriceDisplay.displayName = 'CollectionPriceDisplay';

export default CollectionPriceDisplay;

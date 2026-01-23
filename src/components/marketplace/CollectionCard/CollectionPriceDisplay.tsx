"use client";

import React from 'react';
import { useETHPrice } from "@/contexts/CurrencyContext";

interface CollectionPriceDisplayProps {
    totalValue: number;
    floorPrice: number | null;
}

/**
 * Price display component for collections
 * Shows total value in ETH with USD conversion and floor price
 */
export const CollectionPriceDisplay = React.memo(({
    totalValue,
    floorPrice,
}: CollectionPriceDisplayProps) => {
    // Convert from Wei to ETH (divide by 10^18)
    const totalValueInEth = totalValue / 1e18;
    const floorPriceInEth = floorPrice ? floorPrice / 1e18 : null;

    const { convertedPrice, loading } = useETHPrice(totalValueInEth);

    return (
        <div className="space-y-1 min-h-[60px]">
            <div className="text-sm font-semibold text-gray-900">
                {totalValueInEth.toFixed(4)} ETH
            </div>
            {loading ? (
                <div className="text-xs text-gray-500">Lädt...</div>
            ) : (
                <div className="text-xs text-gray-600">≈ {convertedPrice}</div>
            )}
            <div className="text-xs text-blue-600">
                {floorPriceInEth ? `Floor: ${floorPriceInEth.toFixed(4)} ETH` : 'Floor: —'}
            </div>
        </div>
    );
});

CollectionPriceDisplay.displayName = 'CollectionPriceDisplay';

export default CollectionPriceDisplay;

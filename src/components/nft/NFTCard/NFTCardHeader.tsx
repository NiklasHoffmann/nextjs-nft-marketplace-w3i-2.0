/**
 * NFTCardHeader - Header section for NFT cards
 * Shows collection symbol, NFT name, and rating
 */

import { memo } from 'react';

interface NFTCardHeaderProps {
    contractAddress: string;
    tokenId: string;
    contractSymbol?: string | null;
    contractName?: string | null;
    customTitle?: string | null;
    nftName?: string | null;
    averageRating?: number | null;
}

export const NFTCardHeader = memo<NFTCardHeaderProps>(({
    contractAddress,
    tokenId,
    contractSymbol,
    contractName,
    customTitle,
    nftName,
    averageRating
}) => {
    const displaySymbol = contractSymbol || `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
    const displayTitle = customTitle || nftName || contractName || `#${tokenId}`;
    const rawRating = averageRating || 0;
    const roundedRating = Math.round(rawRating * 2) / 2;
    const showRating = roundedRating > 0;
    const ratingLabel = Number.isInteger(roundedRating)
        ? `${roundedRating.toFixed(0)}`
        : `${roundedRating.toFixed(1)}`;

    return (
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    {/* Collection Symbol/Address */}
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {displaySymbol}
                    </h3>
                    {/* NFT Name: customTitle > metadata name > contract name */}
                    <p className="text-xs text-gray-600 truncate">
                        {displayTitle}
                    </p>
                </div>

                {/* Average Rating */}
                <div className="flex items-center gap-1 ml-2">
                    {showRating && (
                        <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                            <span className="text-yellow-500 text-xs leading-none">★</span>
                            <span className="text-xs font-semibold text-gray-700 leading-none">{ratingLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

NFTCardHeader.displayName = 'NFTCardHeader';

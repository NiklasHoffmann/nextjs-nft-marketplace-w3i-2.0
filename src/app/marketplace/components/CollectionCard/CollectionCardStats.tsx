"use client";

import React from 'react';
import { CollectionPriceDisplay } from './CollectionPriceDisplay';

interface CollectionCardStatsProps {
    // Listing
    itemCount: number;
    // Social Metrics
    totalLikes?: number;
    // Price
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
}

/**
 * Stats section for collection cards
 * Shows supply, listed count, social metrics, and price info
 */
export const CollectionCardStats = React.memo(({
    itemCount,
    totalLikes = 0,
    totalValue,
    displayTotalValue,
    totalValueCurrency,
    currencyTotals,
    floorPrice,
    floorPriceCurrency,
    erc721ItemCount = 0,
    erc1155ItemCount = 0,
    erc1155ListedUnits = 0,
    erc1155RemainingUnits = 0,
}: CollectionCardStatsProps) => {
    const listed1155Units = Math.max(0, Math.round(erc1155ListedUnits));
    const remaining1155Units = Math.max(0, Math.round(erc1155RemainingUnits));
    const hasQtyBadge = listed1155Units > 0;
    const hasERC721 = erc721ItemCount > 0;
    const hasERC1155 = erc1155ItemCount > 0;
    const rowRef = React.useRef<HTMLDivElement | null>(null);
    const badgesRef = React.useRef<HTMLDivElement | null>(null);
    const likesRef = React.useRef<HTMLDivElement | null>(null);
    const [likesOnTop, setLikesOnTop] = React.useState(false);

    const evaluateLayout = React.useCallback(() => {
        if (!rowRef.current || !badgesRef.current || !likesRef.current) return;

        const availableWidth = rowRef.current.clientWidth;
        const badgesWidth = badgesRef.current.scrollWidth;
        const likesWidth = likesRef.current.scrollWidth;
        const requiredWidth = badgesWidth + likesWidth + 8;

        setLikesOnTop(requiredWidth > availableWidth);
    }, []);

    React.useEffect(() => {
        evaluateLayout();

        if (typeof window === 'undefined') return;

        const resizeObserver = new ResizeObserver(() => {
            evaluateLayout();
        });

        if (rowRef.current) resizeObserver.observe(rowRef.current);
        if (badgesRef.current) resizeObserver.observe(badgesRef.current);
        if (likesRef.current) resizeObserver.observe(likesRef.current);

        window.addEventListener('resize', evaluateLayout);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', evaluateLayout);
        };
    }, [evaluateLayout]);

    const likesBadge = (
        <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1" ref={likesRef}>
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">{totalLikes}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-1">
            {likesOnTop && <div className="flex justify-end">{likesBadge}</div>}

            <div ref={rowRef} className="flex items-center justify-between gap-2 w-full">
                <div ref={badgesRef} className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`${hasQtyBadge ? 'flex-1' : 'w-full'} inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200 shadow-xl whitespace-nowrap`}>
                        Listed: {itemCount}
                    </span>

                    {hasQtyBadge && (
                        <span className="flex-1 inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 shadow-xl whitespace-nowrap">
                            Units: {remaining1155Units}/{listed1155Units}
                        </span>
                    )}
                </div>

                {!likesOnTop && (
                    <div className="flex-shrink-0">
                        {likesBadge}
                    </div>
                )}
            </div>

            {/* Price Info */}
            {itemCount > 0 ? (
                <div>
                    <CollectionPriceDisplay
                        totalValue={totalValue}
                        displayTotalValue={displayTotalValue}
                        totalValueCurrency={totalValueCurrency}
                        currencyTotals={currencyTotals}
                        floorPrice={floorPrice}
                        floorPriceCurrency={floorPriceCurrency}
                        hasERC721={hasERC721}
                        hasERC1155={hasERC1155}
                    />
                </div>
            ) : (
                <div className="text-sm text-gray-500 text-center min-h-[60px] flex items-center justify-center">
                    No listings
                </div>
            )}
        </div>
    );
});

CollectionCardStats.displayName = 'CollectionCardStats';

export default CollectionCardStats;

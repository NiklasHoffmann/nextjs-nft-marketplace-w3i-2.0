/**
 * NFTCardPrice - Price display for NFT cards
 * Shows price in ETH/WETH with USD conversion, or "Not Listed" placeholder
 */

import { memo, useMemo } from 'react';
import { useETHPrice } from '@/contexts/CurrencyContext';
import { formatEther } from '@/utils';
import { getCurrencySymbol } from '@/config/tokens';

interface NFTCardPriceProps {
    price: string | null;
    isListed: boolean;
    desiredContractAddress?: string | null;
    currency?: string | null;
}

export const NFTCardPrice = memo<NFTCardPriceProps>(({
    price,
    isListed,
    desiredContractAddress,
    currency
}) => {
    const ethPrice = useMemo(() =>
        price ? parseFloat(formatEther(price)) : 0,
        [price]
    );
    const { convertedPrice, loading } = useETHPrice(ethPrice);
    const currencySymbol = getCurrencySymbol(currency);

    if (!isListed || !price) {
        return (
            <div className="bg-gray-100/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-300/60 ring-1 ring-gray-400/20 h-[62px]">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500 font-medium text-lg leading-tight">Not Listed</div>
                </div>
            </div>
        );
    }

    const isSwap = desiredContractAddress && desiredContractAddress !== "0x0000000000000000000000000000000000000000";

    return (
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-200/60 ring-1 ring-gray-300/20">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    <div className="text-orange font-semibold text-lg">{formatEther(price)} {currencySymbol}</div>
                    {loading ? (
                        <div className="text-xs text-gray-500">Lädt...</div>
                    ) : (
                        <div className="text-xs text-gray-600">˜ {convertedPrice}</div>
                    )}
                </div>
                {/* Sell/Swap Indicator */}
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isSwap ? 'bg-orange' : 'bg-forestgreen'}`}></div>
                        <span className={`text-xs font-medium ${isSwap ? 'text-orange' : 'text-forestgreen'}`}>
                            {isSwap ? 'Swap' : 'Sell'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

NFTCardPrice.displayName = 'NFTCardPrice';

/**
 * NFTCardPrice - Price display for NFT cards
 * Shows price in ETH/WETH/USDC/DAI/MERC20 with USD conversion, or "Not Listed" placeholder
 * Supports mock tokens with simulated exchange rates for testing
 */

import { memo, useMemo, useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatEther } from '@/utils';
import { getCurrencySymbolByAddress, isNativeETH } from '@/config/tokens';
import type { ListingType } from '@/types/marketplace/listing-v2';
import { isSwapListing } from '@/types/marketplace/listing-v2';

interface NFTCardPriceProps {
    price: string | null;
    isListed: boolean;
    desiredContractAddress?: string | null; // Deprecated: Use listingType instead
    currency?: string | null;
    chainId?: number; // Optional: override from props
    listingType?: ListingType | null; // PURE_ETH | SWAP_AND_ETH | PURE_SWAP
}

export const NFTCardPrice = memo<NFTCardPriceProps>(({
    price,
    isListed,
    desiredContractAddress,
    currency,
    chainId: chainIdProp,
    listingType
}) => {
    const chainIdFromHook = useChainId();
    const chainId = chainIdProp || chainIdFromHook;
    const { formatPrice, convertTokenToUSD } = useCurrency();

    const [usdPrice, setUsdPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const ethPrice = useMemo(() =>
        price ? parseFloat(formatEther(price)) : 0,
        [price]
    );

    // Get accurate currency symbol based on chain and address
    const currencySymbol = useMemo(() =>
        getCurrencySymbolByAddress(chainId, currency),
        [chainId, currency]
    );

    // Check if this is native ETH or an ERC20 token
    const isETH = useMemo(() =>
        !currency || isNativeETH(currency),
        [currency]
    );

    // Convert token price to USD
    useEffect(() => {
        if (!price || ethPrice === 0) {
            setUsdPrice('');
            return;
        }

        const convert = async () => {
            setLoading(true);
            try {
                const usdValue = await convertTokenToUSD(ethPrice, currencySymbol);
                if (usdValue > 0) {
                    setUsdPrice(formatPrice(usdValue));
                } else {
                    setUsdPrice(''); // No USD rate available
                }
            } catch (error) {
                console.error('Error converting token to USD:', error);
                setUsdPrice('');
            } finally {
                setLoading(false);
            }
        };

        convert();
    }, [ethPrice, currencySymbol, convertTokenToUSD, formatPrice, price]);

    if (!isListed || !price) {
        return (
            <div className="bg-gray-100/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-300/60 ring-1 ring-gray-400/20 h-[62px]">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500 font-medium text-lg leading-tight">Not Listed</div>
                </div>
            </div>
        );
    }

    // Determine if this is a swap listing using listingType (preferred) or fallback to desiredContractAddress check
    // A swap requires EITHER:
    // 1. listingType is PURE_SWAP or SWAP_AND_ETH, OR
    // 2. desiredContractAddress is set AND differs from the NFT's own contract (legacy check)
    const isSwap = listingType
        ? isSwapListing({ listingType } as any) // Use helper function from listing-v2.ts
        : (desiredContractAddress && 
           desiredContractAddress !== "0x0000000000000000000000000000000000000000" &&
           desiredContractAddress !== null);

    return (
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-200/60 ring-1 ring-gray-300/20">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    <div className="text-orange font-semibold text-lg">
                        {formatEther(price)} {currencySymbol}
                    </div>
                    {loading ? (
                        <div className="text-xs text-gray-500">Lädt...</div>
                    ) : usdPrice ? (
                        <div className="text-xs text-gray-600">˜ {usdPrice}</div>
                    ) : (
                        <div className="text-xs text-gray-600">{currencySymbol} Token</div>
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

/**
 * NFTCardPrice - Price display for NFT cards
 * Shows price in ETH/WETH/USDC/DAI/MERC20 with USD conversion, or "Not Listed" placeholder
 * Supports mock tokens with simulated exchange rates for testing
 */

import { memo, useMemo, useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatUnits } from 'viem';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import type { ListingType } from '@/types/marketplace/listing-v2';
import { isSwapListing } from '@/types/marketplace/listing-v2';
import { formatCardCurrencyAmount } from '@/utils';
import { devLog } from '@/utils';

interface NFTCardPriceProps {
    price: string | null;
    isListed: boolean;
    desiredContractAddress?: string | null; // Deprecated: Use listingType instead
    currency?: string | null;
    chainId?: number; // Optional: override from props
    listingType?: ListingType | null; // PURE_ETH | SWAP_AND_ETH | PURE_SWAP
    tokenStandard?: 'ERC721' | 'ERC1155' | null;
    unitPrice?: string | null;
    erc1155QuantityListed?: string | null;
    remainingQuantity?: string | null;
    partialBuyEnabled?: boolean;
}

export const NFTCardPrice = memo<NFTCardPriceProps>(({
    price,
    isListed,
    desiredContractAddress,
    currency,
    chainId: chainIdProp,
    listingType,
    tokenStandard,
    unitPrice,
    erc1155QuantityListed,
    remainingQuantity,
    partialBuyEnabled = false
}) => {
    const chainIdFromHook = useChainId();
    const chainId = chainIdProp || chainIdFromHook;
    const { formatPrice, convertTokenToUSD, convertFromUSD } = useCurrency();

    const [usdPrice, setUsdPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Get accurate currency symbol based on chain and address
    const currencySymbol = useMemo(() =>
        getCurrencySymbolByAddress(chainId, currency),
        [chainId, currency]
    );

    const tokenDecimals = useMemo(() =>
        getTokenDecimalsByAddress(chainId, currency),
        [chainId, currency]
    );

    // DEBUG: Log incoming props for listed NFTs
    useEffect(() => {
        if (isListed && price) {
            devLog.info('[NFTCardPrice] Listed NFT:', {
                price,
                currency,
                listingType,
                symbol: currencySymbol
            });
        }
    }, [isListed, price, currency, listingType, chainId, currencySymbol]);

    const tokenAmount = useMemo(() =>
        price ? formatUnits(BigInt(price), tokenDecimals) : '0',
        [price, tokenDecimals]
    );

    const displayAmount = useMemo(() =>
        formatCardCurrencyAmount(tokenAmount),
        [tokenAmount]
    );

    const tokenAmountNum = useMemo(() =>
        price ? parseFloat(tokenAmount) : 0,
        [price, tokenAmount]
    );

    const isERC1155 = tokenStandard === 'ERC1155';
    const listedQty = erc1155QuantityListed ? Number(erc1155QuantityListed) : 0;
    const hasRemainingQuantity = remainingQuantity !== undefined && remainingQuantity !== null && remainingQuantity !== '';
    const availableQty = hasRemainingQuantity ? Number(remainingQuantity) : listedQty;
    const isSoldOut = isERC1155
        && isListed
        && hasRemainingQuantity
        && Number.isFinite(availableQty)
        && availableQty <= 0;

    const unitAmount = useMemo(() =>
        unitPrice ? formatUnits(BigInt(unitPrice), tokenDecimals) : null,
        [unitPrice, tokenDecimals]
    );

    const fallbackUnitRaw = useMemo(() => {
        if (!isERC1155 || !price) return null;
        const qty = listedQty > 0 ? listedQty : availableQty;
        if (!qty || qty <= 0) return null;
        try {
            return (BigInt(price) / BigInt(qty)).toString();
        } catch {
            return null;
        }
    }, [isERC1155, price, listedQty, availableQty]);

    const effectiveUnitRaw = unitPrice || fallbackUnitRaw;

    const effectiveUnitAmount = useMemo(() =>
        effectiveUnitRaw ? formatUnits(BigInt(effectiveUnitRaw), tokenDecimals) : null,
        [effectiveUnitRaw, tokenDecimals]
    );

    const unitDisplayAmount = useMemo(() =>
        effectiveUnitAmount ? formatCardCurrencyAmount(effectiveUnitAmount) : null,
        [effectiveUnitAmount]
    );

    const displayTokenAmountNum = useMemo(() => {
        if (isERC1155) {
            return effectiveUnitAmount ? parseFloat(effectiveUnitAmount) : 0;
        }
        return tokenAmountNum;
    }, [isERC1155, effectiveUnitAmount, tokenAmountNum]);

    // Convert token price to USD
    useEffect(() => {
        if (!price || displayTokenAmountNum === 0) {
            setUsdPrice('');
            return;
        }

        const convert = async () => {
            setLoading(true);
            try {
                const usdValue = await convertTokenToUSD(displayTokenAmountNum, currencySymbol, currency, chainId);
                if (usdValue > 0) {
                    const convertedAmount = await convertFromUSD(usdValue);
                    setUsdPrice(formatPrice(convertedAmount));
                } else {
                    setUsdPrice(''); // No USD rate available
                }
            } catch (error) {
                devLog.error('Error converting token to USD:', error);
                setUsdPrice('');
            } finally {
                setLoading(false);
            }
        };

        convert();
    }, [displayTokenAmountNum, currencySymbol, convertTokenToUSD, convertFromUSD, formatPrice, price, currency, chainId]);

    if (!isListed || !price) {
        return (
            <div className="bg-gray-100/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-300/60 ring-1 ring-gray-400/20 h-[62px]">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500 font-medium text-lg leading-tight">Not Listed</div>
                </div>
            </div>
        );
    }

    if (isSoldOut) {
        return (
            <div className="bg-gray-100/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-300/60 ring-1 ring-gray-400/20 h-[62px]">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500 font-medium text-lg leading-tight">Sold Out</div>
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
            <div className="relative">
                <div className="text-left min-w-0 pr-24">
                    {isERC1155 && (
                        <div className="text-[10px] text-gray-600 leading-tight mb-0.5 truncate">
                            Qty {availableQty}/{listedQty || availableQty} · Partial {partialBuyEnabled ? 'On' : 'Off'}
                        </div>
                    )}
                    <div className="text-orange font-semibold leading-tight flex items-baseline gap-1 min-w-0">
                        <span className="text-base md:text-[17px]">
                            {isERC1155 && unitDisplayAmount ? unitDisplayAmount : displayAmount}
                        </span>
                        <span className="text-sm font-bold whitespace-nowrap">
                            {currencySymbol}
                        </span>
                    </div>
                    {loading ? (
                        <div className="text-xs text-gray-500">Lädt...</div>
                    ) : usdPrice ? (
                        <div className="text-xs text-gray-600 inline-flex items-center gap-1 truncate max-w-full">
                            <span className="leading-none">~</span>
                            <span className="truncate">{usdPrice}</span>
                            {isERC1155 && unitDisplayAmount && (
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">/unit</span>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-600">{currencySymbol} Token</div>
                    )}
                </div>
                {/* Sell/Swap Indicator */}
                <div className="absolute right-0 bottom-0 flex flex-col items-end gap-1">
                    <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSwap ? 'bg-orange-500' : 'bg-green-600'}`}></div>
                            <span className={`text-xs font-semibold leading-none ${isSwap ? 'text-orange-700' : 'text-green-700'}`}>
                                {isSwap ? 'Swap' : 'Sell'}
                            </span>
                        </div>
                    </div>
                    {tokenStandard && (
                        <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center whitespace-nowrap">
                            <span className={`text-[11px] font-semibold whitespace-nowrap leading-none ${
                                tokenStandard === 'ERC1155' ? 'text-purple-700' : 'text-blue-700'
                            }`}>
                                {tokenStandard === 'ERC1155' ? 'ERC-1155' : 'ERC-721'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

NFTCardPrice.displayName = 'NFTCardPrice';

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCardCurrencyAmount } from '@/utils';

const getEffectiveDecimals = (rawValue: number, tokenDecimals: number): number => {
    if (!Number.isFinite(rawValue) || rawValue <= 0 || tokenDecimals >= 18) {
        return tokenDecimals;
    }

    const amountWithTokenDecimals = rawValue / Math.pow(10, tokenDecimals);
    const amountWith18Decimals = rawValue / Math.pow(10, 18);

    if (
        Number.isFinite(amountWithTokenDecimals)
        && Number.isFinite(amountWith18Decimals)
        && amountWith18Decimals > 0
        && amountWithTokenDecimals / amountWith18Decimals >= 1_000_000
    ) {
        return 18;
    }

    return tokenDecimals;
};

interface CollectionPriceDisplayProps {
    totalValue: number;
    displayTotalValue?: number;
    totalValueCurrency?: string | null;
    currencyTotals?: Array<{
        currency: string;
        totalValue: number;
    }>;
    floorPrice: string | null;
    floorPriceCurrency?: string | null;
    hasERC721?: boolean;
    hasERC1155?: boolean;
}

/**
 * Price display component for collections
 * Shows total value in ETH with USD conversion and floor price
 */
export const CollectionPriceDisplay = React.memo(({
    totalValue,
    displayTotalValue,
    totalValueCurrency,
    currencyTotals,
    floorPrice,
    floorPriceCurrency,
    hasERC721 = false,
    hasERC1155 = false,
}: CollectionPriceDisplayProps) => {
    const chainId = useChainId();
    const { convertTokenToUSD, convertFromUSD, convertUSDToETH, formatPrice } = useCurrency();
    const [convertedHeadline, setConvertedHeadline] = useState<string>('');
    const [secondaryValueLabel, setSecondaryValueLabel] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const effectiveChainId = chainId || 11155111;
    const valueCurrency = totalValueCurrency || '0x0000000000000000000000000000000000000000';
    const floorCurrency = floorPriceCurrency || valueCurrency;

    const valueSymbol = useMemo(
        () => getCurrencySymbolByAddress(effectiveChainId, valueCurrency),
        [effectiveChainId, valueCurrency]
    );

    const floorSymbol = useMemo(
        () => getCurrencySymbolByAddress(effectiveChainId, floorCurrency),
        [effectiveChainId, floorCurrency]
    );

    const valueDecimals = useMemo(
        () => getTokenDecimalsByAddress(effectiveChainId, valueCurrency),
        [effectiveChainId, valueCurrency]
    );

    const floorDecimals = useMemo(
        () => getTokenDecimalsByAddress(effectiveChainId, floorCurrency),
        [effectiveChainId, floorCurrency]
    );

    const valueAmount = useMemo(() => {
        const raw = typeof displayTotalValue === 'number' ? displayTotalValue : totalValue;
        const effectiveValueDecimals = getEffectiveDecimals(raw, valueDecimals);
        const divisor = Math.pow(10, effectiveValueDecimals);
        if (!Number.isFinite(divisor) || divisor <= 0) return 0;
        return raw / divisor;
    }, [displayTotalValue, totalValue, valueDecimals]);

    const normalizedCurrencyTotals = useMemo(() => {
        if (Array.isArray(currencyTotals) && currencyTotals.length > 0) {
            return currencyTotals;
        }

        const raw = typeof displayTotalValue === 'number' ? displayTotalValue : totalValue;
        return [{
            currency: valueCurrency,
            totalValue: raw,
        }];
    }, [currencyTotals, displayTotalValue, totalValue, valueCurrency]);

    const isMixedCurrency = normalizedCurrencyTotals.length > 1;

    const floorAmount = useMemo(() => {
        if (!floorPrice) return null;
        const parsed = Number.parseFloat(floorPrice);
        if (!Number.isFinite(parsed)) return null;
        const effectiveFloorDecimals = getEffectiveDecimals(parsed, floorDecimals);
        const divisor = Math.pow(10, effectiveFloorDecimals);
        if (!Number.isFinite(divisor) || divisor <= 0) return null;
        return parsed / divisor;
    }, [floorPrice, floorDecimals]);

    useEffect(() => {
        let active = true;

        const convert = async () => {
            setLoading(true);
            try {
                if (!Number.isFinite(valueAmount) || valueAmount <= 0 || normalizedCurrencyTotals.length === 0) {
                    if (active) setConvertedHeadline(formatPrice(0));
                    if (active) setSecondaryValueLabel(`0.00 ${valueSymbol}`);
                    return;
                }

                let totalUsd = 0;
                for (const entry of normalizedCurrencyTotals) {
                    const entryCurrency = entry.currency || valueCurrency;
                    const entrySymbol = getCurrencySymbolByAddress(effectiveChainId, entryCurrency);
                    const entryDecimals = getTokenDecimalsByAddress(effectiveChainId, entryCurrency);
                    const effectiveEntryDecimals = getEffectiveDecimals(entry.totalValue || 0, entryDecimals);
                    const divisor = Math.pow(10, effectiveEntryDecimals);
                    if (!Number.isFinite(divisor) || divisor <= 0) {
                        continue;
                    }

                    const humanAmount = (entry.totalValue || 0) / divisor;
                    if (!Number.isFinite(humanAmount) || humanAmount <= 0) {
                        continue;
                    }

                    if (entrySymbol === 'ETH') {
                        const usdFromEth = await convertTokenToUSD(humanAmount, 'ETH', entryCurrency, effectiveChainId);
                        totalUsd += usdFromEth;
                    } else {
                        const usdFromToken = await convertTokenToUSD(humanAmount, entrySymbol, entryCurrency, effectiveChainId);
                        totalUsd += usdFromToken;
                    }
                }

                const convertedFiat = totalUsd > 0 ? await convertFromUSD(totalUsd) : 0;
                if (active) setConvertedHeadline(formatPrice(convertedFiat));

                if (valueSymbol === 'ETH') {
                    const ethValue = totalUsd > 0 ? await convertUSDToETH(totalUsd) : 0;
                    if (active) setSecondaryValueLabel(`${formatCardCurrencyAmount(ethValue)} ETH`);
                    return;
                }

                const usdPerDisplayUnit = await convertTokenToUSD(1, valueSymbol, valueCurrency, effectiveChainId);
                const displayUnits = usdPerDisplayUnit > 0 ? totalUsd / usdPerDisplayUnit : valueAmount;
                if (active) setSecondaryValueLabel(`${formatCardCurrencyAmount(displayUnits)} ${valueSymbol}`);
            } catch {
                if (active) setConvertedHeadline('—');
                if (active) setSecondaryValueLabel(`${formatCardCurrencyAmount(valueAmount)} ${valueSymbol}`);
            } finally {
                if (active) setLoading(false);
            }
        };

        convert();

        return () => {
            active = false;
        };
    }, [
        valueAmount,
        normalizedCurrencyTotals,
        valueSymbol,
        valueCurrency,
        effectiveChainId,
        convertTokenToUSD,
        convertFromUSD,
        convertUSDToETH,
        formatPrice,
    ]);

    return (
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 min-h-[62px]">
            <div className="relative">
                <div className="text-left min-w-0 pr-24">
                    {loading ? (
                        <div className="text-sm font-semibold text-gray-900">Lädt...</div>
                    ) : (
                        <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
                            <span className="leading-none">~</span>
                            <span>{convertedHeadline || '—'}</span>
                        </div>
                    )}
                    <div className="text-xs text-gray-600">{secondaryValueLabel || `${formatCardCurrencyAmount(valueAmount)} ${valueSymbol}`}</div>
                    <div className="text-xs text-blue-600 mt-0.5">
                        {floorAmount !== null ? `Floor: ${formatCardCurrencyAmount(floorAmount)} ${floorSymbol}` : 'Floor: —'}
                    </div>
                </div>

                {isMixedCurrency && (
                    <div className="absolute right-0 bottom-7">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 text-amber-700">
                            Mixed
                        </span>
                    </div>
                )}

                {(hasERC721 || hasERC1155) && (
                    <div className="absolute right-0 bottom-0 flex items-center gap-1">
                        {hasERC721 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 text-blue-700 whitespace-nowrap h-6">
                                ERC-721
                            </span>
                        )}
                        {hasERC1155 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20 text-purple-700 whitespace-nowrap h-6">
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

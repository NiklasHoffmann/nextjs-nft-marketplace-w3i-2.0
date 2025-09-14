"use client";

import { useMemo } from 'react';
import { useETHPrice, useCurrency } from '@/contexts/CurrencyContext';
import { formatEther } from '@/utils';

/**
 * Custom hook for managing price data and conversions
 */
export function useNFTPriceData(priceWei: string | null) {
    const { selectedCurrency } = useCurrency();

    // Memoize ETH price calculation
    const ethPrice = useMemo(() => {
        return priceWei ? parseFloat(formatEther(priceWei)) : 0;
    }, [priceWei]);

    // Get converted price
    const { convertedPrice, loading: priceLoading } = useETHPrice(ethPrice);

    // Memoize price display data
    const priceDisplayData = useMemo(() => ({
        ethPrice,
        convertedPrice,
        priceLoading,
        selectedCurrencySymbol: selectedCurrency.symbol,
        formattedEthPrice: formatEther(priceWei || "0"),
        hasValidPrice: !!priceWei && ethPrice > 0
    }), [ethPrice, convertedPrice, priceLoading, selectedCurrency.symbol, priceWei]);

    return priceDisplayData;
}
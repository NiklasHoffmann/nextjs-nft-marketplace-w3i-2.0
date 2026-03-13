"use client";

import { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatUnits } from 'viem';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';

/**
 * Custom hook for managing price data and conversions
 */
export function useNFTPriceData(priceWei: string | null, currency?: string | null, chainIdOverride?: number) {
    const { selectedCurrency, convertTokenToUSD, convertFromUSD, formatPrice } = useCurrency();
    const chainId = useChainId();
    const effectiveChainId = chainIdOverride || chainId;

    const tokenDecimals = useMemo(
        () => getTokenDecimalsByAddress(effectiveChainId, currency),
        [effectiveChainId, currency]
    );

    const effectiveTokenDecimals = useMemo(() => {
        if (!priceWei || tokenDecimals >= 18) return tokenDecimals;

        try {
            const parsedWithTokenDecimals = parseFloat(formatUnits(BigInt(priceWei), tokenDecimals));
            const parsedWith18Decimals = parseFloat(formatUnits(BigInt(priceWei), 18));

            if (
                Number.isFinite(parsedWithTokenDecimals)
                && Number.isFinite(parsedWith18Decimals)
                && parsedWith18Decimals > 0
                && parsedWithTokenDecimals / parsedWith18Decimals >= 1_000_000
            ) {
                return 18;
            }
        } catch {
            return tokenDecimals;
        }

        return tokenDecimals;
    }, [priceWei, tokenDecimals]);

    const tokenSymbol = useMemo(
        () => getCurrencySymbolByAddress(effectiveChainId, currency),
        [effectiveChainId, currency]
    );

    const tokenPrice = useMemo(() => {
        return priceWei ? parseFloat(formatUnits(BigInt(priceWei), effectiveTokenDecimals)) : 0;
    }, [priceWei, effectiveTokenDecimals]);

    const formattedTokenPrice = useMemo(() => {
        return formatUnits(BigInt(priceWei || '0'), effectiveTokenDecimals);
    }, [priceWei, effectiveTokenDecimals]);

    const [convertedPrice, setConvertedPrice] = useState<string>('');
    const [priceLoading, setPriceLoading] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        if (!tokenPrice) {
            setConvertedPrice('');
            setPriceLoading(false);
            return;
        }

        const convert = async () => {
            setPriceLoading(true);
            try {
                const usdValue = await convertTokenToUSD(tokenPrice, tokenSymbol, currency, effectiveChainId);
                if (usdValue <= 0) {
                    if (isMounted) {
                        setConvertedPrice('');
                    }
                    return;
                }

                const convertedAmount = await convertFromUSD(usdValue);
                if (isMounted) {
                    setConvertedPrice(formatPrice(convertedAmount));
                }
            } catch {
                if (isMounted) {
                    setConvertedPrice('');
                }
            } finally {
                if (isMounted) {
                    setPriceLoading(false);
                }
            }
        };

        convert();

        return () => {
            isMounted = false;
        };
    }, [tokenPrice, tokenSymbol, convertTokenToUSD, convertFromUSD, formatPrice]);

    return {
        tokenPrice,
        convertedPrice,
        priceLoading,
        selectedCurrencySymbol: selectedCurrency.symbol,
        formattedTokenPrice,
        hasValidPrice: !!priceWei && tokenPrice > 0,
        tokenSymbol
    };
}

'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletHeader } from './components';
import { WalletLayoutContext } from './context';
import { NFTFilterSidebar } from '@/components';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { useWalletNFTsV2 } from '@/hooks/wallet/useWalletNFTsV2';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { devLog } from '@/utils';

export default function WalletLayout({ children }: { children: ReactNode }) {
    const { address, isConnected, chain } = useAccount();
    const chainId = chain?.id || 11155111;
    const [mounted, setMounted] = useState(false);

    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        tokenStandards: [],
        rarities: [],
        searchTerm: '',
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });
    const [filteredCount, setFilteredCount] = useState(0);

    // Simple data fetching without filters
    const { nfts, total, listed, unlisted } = useWalletNFTsV2({
        walletAddress: address,
        autoFetch: true
    });

    // Group listed NFT prices by token for multi-currency support
    const listedPricesByToken = useMemo(() => {
        const pricesByToken = new Map<string, { total: number; symbol: string; address: string | null }>();

        nfts
            .filter(nft => nft.isListed && nft.listingPrice)
            .forEach(nft => {
                try {
                    const tokenSymbol = getCurrencySymbolByAddress(chainId, nft.currency);
                    const tokenAddress = nft.currency || null;
                    const tokenDecimals = getTokenDecimalsByAddress(chainId, nft.currency);
                    const priceInToken = parseFloat(formatUnits(BigInt(nft.listingPrice || '0'), tokenDecimals));

                    const tokenKey = tokenAddress || tokenSymbol;
                    const existing = pricesByToken.get(tokenKey) || { total: 0, symbol: tokenSymbol, address: tokenAddress };
                    existing.total += priceInToken;
                    pricesByToken.set(tokenKey, existing);
                } catch (error) {
                    devLog.error('Error parsing price:', error);
                }
            });

        return pricesByToken;
    }, [chainId, nfts]);

    // Convert all token prices to USD for total value calculation
    const { convertTokenToUSD, convertFromUSD, formatPrice } = useCurrency();
    const [totalValueDisplay, setTotalValueDisplay] = useState<string>(formatPrice(0));
    const [ethPriceLoading, setEthPriceLoading] = useState<boolean>(true);

    const handleFiltersChange = useCallback((newFilters: NFTFilters) => {
        setFilters(newFilters);
    }, []);

    const handleSortChange = useCallback((newSort: NFTSortOptions) => {
        setSort(newSort);
    }, []);

    const contextValue = useMemo(() => ({
        filters,
        sort,
        onFiltersChange: handleFiltersChange,
        onSortChange: handleSortChange,
        totalItems: total,
        filteredCount,
        setFilteredCount,
    }), [filters, sort, handleFiltersChange, handleSortChange, total, filteredCount]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function calculateTotalUSD() {
            if (listedPricesByToken.size === 0) {
                setTotalValueDisplay(formatPrice(0));
                setEthPriceLoading(false);
                return;
            }

            setEthPriceLoading(true);
            let totalUSD = 0;

            for (const [, { total, symbol, address }] of listedPricesByToken.entries()) {
                try {
                    const usdValue = await convertTokenToUSD(total, symbol, address, chainId);
                    totalUSD += usdValue;
                } catch (error) {
                    devLog.error(`Error converting ${symbol} to USD:`, error);
                }
            }

            if (isMounted) {
                try {
                    const convertedAmount = await convertFromUSD(totalUSD);
                    setTotalValueDisplay(formatPrice(convertedAmount));
                } catch (error) {
                    devLog.error('Error converting total value:', error);
                    setTotalValueDisplay(formatPrice(totalUSD));
                }
                setEthPriceLoading(false);
            }
        }

        calculateTotalUSD();

        return () => {
            isMounted = false;
        };
    }, [chainId, listedPricesByToken, convertTokenToUSD, convertFromUSD, formatPrice]);

    // Keep first server/client render deterministic, then branch on wallet state.
    if (!mounted) {
        return <>{children}</>;
    }

    // Only render header if connected
    if (!isConnected || !address) {
        return <>{children}</>;
    }

    return (
        <WalletLayoutContext.Provider value={contextValue}>
            <div className="min-h-screen bg-gray-50">
                <NFTFilterSidebar
                    onFiltersChange={handleFiltersChange}
                    onSortChange={handleSortChange}
                    currentSort={sort}
                    totalItems={total}
                    filteredCount={filteredCount}
                />
                <main className="pt-[66px]">
                    <WalletHeader
                        address={address}
                        listedCount={listed}
                        unlistedCount={unlisted}
                        totalValueDisplay={totalValueDisplay}
                        ethPriceLoading={ethPriceLoading}
                    />
                    <div className="pt-[100px]">
                        {children}
                    </div>
                </main>
            </div>
        </WalletLayoutContext.Provider>
    );
}

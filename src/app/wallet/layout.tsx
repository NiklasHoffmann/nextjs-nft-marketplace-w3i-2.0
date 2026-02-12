'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletHeader } from './components';
import { useWalletNFTsV2 } from '@/hooks/wallet/useWalletNFTsV2';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { devLog } from '@/utils';

export default function WalletLayout({ children }: { children: ReactNode }) {
    const { address, isConnected, chain } = useAccount();

    // Simple data fetching without filters
    const { nfts, total, listed, unlisted } = useWalletNFTsV2({
        walletAddress: address,
        autoFetch: true
    });

    // Group listed NFT prices by token for multi-currency support
    const listedPricesByToken = new Map<string, { total: number; symbol: string; address: string | null }>();
    
    nfts
        .filter(nft => nft.isListed && nft.listingPrice)
        .forEach(nft => {
            try {
                const chainId = chain?.id || 11155111; // Default to Sepolia
                const tokenSymbol = getCurrencySymbolByAddress(chainId, nft.currency);
                const tokenAddress = nft.currency || null;
                const tokenDecimals = getTokenDecimalsByAddress(chainId, nft.currency);
                const priceInToken = parseFloat(formatUnits(BigInt(nft.listingPrice || '0'), tokenDecimals));

                const tokenKey = tokenAddress || tokenSymbol;
                const existing = listedPricesByToken.get(tokenKey) || { total: 0, symbol: tokenSymbol, address: tokenAddress };
                existing.total += priceInToken;
                listedPricesByToken.set(tokenKey, existing);
            } catch (error) {
                devLog.error('Error parsing price:', error);
            }
        });

    // Convert all token prices to USD for total value calculation
    const { convertTokenToUSD, convertFromUSD, formatPrice } = useCurrency();
    const [totalValueUSD, setTotalValueUSD] = useState<number>(0);
    const [totalValueDisplay, setTotalValueDisplay] = useState<string>(formatPrice(0));
    const [ethPriceLoading, setEthPriceLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        async function calculateTotalUSD() {
            if (listedPricesByToken.size === 0) {
                setTotalValueUSD(0);
                setTotalValueDisplay(formatPrice(0));
                setEthPriceLoading(false);
                return;
            }

            setEthPriceLoading(true);
            let totalUSD = 0;

            for (const [, { total, symbol, address }] of listedPricesByToken.entries()) {
                try {
                    const usdValue = await convertTokenToUSD(total, symbol, address, chain?.id || 11155111);
                    totalUSD += usdValue;
                } catch (error) {
                    devLog.error(`Error converting ${symbol} to USD:`, error);
                }
            }

            if (isMounted) {
                setTotalValueUSD(totalUSD);
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
    }, [nfts, convertTokenToUSD, convertFromUSD, formatPrice]);

    // Only render header if connected
    if (!isConnected || !address) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
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
    );
}

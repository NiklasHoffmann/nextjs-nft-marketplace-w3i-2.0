'use client';

import { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { WalletHeader } from './components';
import { useWalletNFTsV2 } from '@/hooks/wallet/useWalletNFTsV2';
import { useETHPrice } from '@/contexts/CurrencyContext';

export default function WalletLayout({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();

    // Simple data fetching without filters
    const { nfts, total, listed, unlisted } = useWalletNFTsV2({
        walletAddress: address,
        autoFetch: true
    });

    // Calculate total listed value (convert Wei to ETH)
    const totalListedValue = nfts
        .filter(nft => nft.isListed && nft.listingPrice)
        .reduce((sum, nft) => {
            try {
                const priceInEth = parseFloat(formatEther(BigInt(nft.listingPrice || '0')));
                return sum + priceInEth;
            } catch {
                return sum;
            }
        }, 0);

    // Convert total value to USD
    const { convertedPrice: totalValueUSD, loading: ethPriceLoading } = useETHPrice(totalListedValue);

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
                    totalListedValue={totalListedValue}
                    totalValueUSD={totalValueUSD}
                    ethPriceLoading={ethPriceLoading}
                />
                <div className="pt-[100px]">
                    {children}
                </div>
            </main>
        </div>
    );
}

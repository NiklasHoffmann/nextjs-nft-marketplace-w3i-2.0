import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui';
import { formatUnits } from 'viem';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatTokenDisplay } from '@/utils';

interface CollectionHeaderProps {
    contractAddress: string;
    contractName?: string | null;
    contractSymbol?: string | null;
    totalListings: number;
    totalVolume?: number;
    avgPrice?: number;
    floorPrice?: number;
    floorPriceCurrency?: string | null;
    totalViews?: number;
    totalLikes?: number;
}

interface CollectionStatsProps {
    totalListings: number;
    totalVolume?: number;
    avgPrice?: number;
    floorPrice?: number;
    floorPriceCurrency?: string | null;
    totalViews?: number;
    totalLikes?: number;
    isCompact?: boolean;
}

function CollectionStats({
    totalListings,
    totalVolume,
    avgPrice,
    floorPrice,
    floorPriceCurrency,
    totalViews,
    totalLikes,
    isCompact = false
}: CollectionStatsProps) {
    const chainId = useChainId();
    const { convertTokenToUSD, convertUSDToETH } = useCurrency();
    const currencySymbol = floorPriceCurrency 
        ? getCurrencySymbolByAddress(chainId, floorPriceCurrency)
        : 'ETH';
    const tokenDecimals = getTokenDecimalsByAddress(chainId, floorPriceCurrency);
    const [convertedFloorEth, setConvertedFloorEth] = useState<string | null>(null);

    const isEthLike = useMemo(() => {
        const symbol = currencySymbol?.toUpperCase();
        return symbol === 'ETH' || symbol === 'WETH';
    }, [currencySymbol]);

    const formattedFloorPrice = floorPrice !== null && floorPrice !== undefined
        ? formatTokenDisplay(
            formatUnits(BigInt(floorPrice.toString()), tokenDecimals),
            tokenDecimals,
            4
        )
        : null;

    useEffect(() => {
        let isMounted = true;

        const convertFloor = async () => {
            if (floorPrice === null || floorPrice === undefined || isEthLike) {
                if (isMounted) setConvertedFloorEth(null);
                return;
            }

            try {
                const tokenAmount = parseFloat(formatUnits(BigInt(floorPrice.toString()), tokenDecimals));
                if (!tokenAmount) {
                    if (isMounted) setConvertedFloorEth(null);
                    return;
                }

                const usdValue = await convertTokenToUSD(tokenAmount, currencySymbol, floorPriceCurrency, chainId);
                if (!usdValue) {
                    if (isMounted) setConvertedFloorEth(null);
                    return;
                }

                const ethAmount = await convertUSDToETH(usdValue);
                if (!ethAmount) {
                    if (isMounted) setConvertedFloorEth(null);
                    return;
                }

                const formatted = formatTokenDisplay(ethAmount.toFixed(4), 4, 4);
                if (isMounted) setConvertedFloorEth(formatted);
            } catch {
                if (isMounted) setConvertedFloorEth(null);
            }
        };

        void convertFloor();

        return () => {
            isMounted = false;
        };
    }, [floorPrice, tokenDecimals, currencySymbol, isEthLike, convertTokenToUSD, convertUSDToETH]);

    const floorDisplayValue = convertedFloorEth
        ? `${convertedFloorEth} ETH`
        : formattedFloorPrice
            ? `${formattedFloorPrice} ${currencySymbol}`
            : '—';

    return (
        <div className={isCompact ? "flex flex-wrap gap-2 justify-end" : "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"}>
            <StatCard
                icon={
                    <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                }
                label="Listed"
                value={totalListings.toString()}
                hideSecondaryPlaceholder
                variant="purple"
                isCompact={isCompact}
            />
            <StatCard
                icon={
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                }
                label="Floor"
                value={floorDisplayValue}
                hideSecondaryPlaceholder
                variant="green"
                isCompact={isCompact}
            />
            <StatCard
                icon={
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                }
                label="Views"
                value={totalViews?.toString() || '0'}
                hideSecondaryPlaceholder
                variant="blue"
                isCompact={isCompact}
            />
            <StatCard
                icon={
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                }
                label="Likes"
                value={totalLikes?.toString() || '0'}
                hideSecondaryPlaceholder
                variant="red"
                isCompact={isCompact}
            />
        </div>
    );
}

export function CollectionHeader({
    contractAddress,
    contractName,
    contractSymbol,
    totalListings,
    totalVolume,
    avgPrice,
    floorPrice,
    floorPriceCurrency,
    totalViews,
    totalLikes
}: CollectionHeaderProps) {
    return (
        <PageHeader
            backLink={{
                href: "/marketplace",
                label: "Back to Marketplace"
            }}
            icon={{
                type: "svg",
                svgContent: (
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                )
            }}
            title={contractName || 'Collection'}
            subtitle={contractSymbol || contractAddress}
            rightContent={
                <CollectionStats
                    totalListings={totalListings}
                    totalVolume={totalVolume}
                    avgPrice={avgPrice}
                    floorPrice={floorPrice}
                    floorPriceCurrency={floorPriceCurrency}
                    totalViews={totalViews}
                    totalLikes={totalLikes}
                />
            }
            hasSidebar={true}
        />
    );
}

export default CollectionHeader;

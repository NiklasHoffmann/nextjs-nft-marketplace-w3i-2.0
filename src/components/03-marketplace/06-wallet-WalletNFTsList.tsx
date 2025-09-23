import * as React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

import { NFTCard } from '../02-nft/01-core-NFTCard';
import { useWalletNFTs } from '../../hooks/nfts/09-wallet-useWalletNFTs';
import { useETHPrice } from '@/contexts/CurrencyContext';

export interface WalletNFTsListProps {
    /** The wallet address to display NFTs for. If not provided, uses connected wallet */
    walletAddress?: string;
    /** Custom title for the section */
    title?: string;
    /** Whether to show NFTs in separate listed/unlisted sections */
    separateSections?: boolean;
    /** Limit number of NFTs per section when using separateSections */
    limitPerSection?: number;
    /** Custom grid CSS classes for NFT display */
    gridClassName?: string;
    /** Whether to automatically fetch NFTs when component mounts */
    autoFetch?: boolean;
    /** Whether to include marketplace context data enhancement */
    includeContext?: boolean;
    /** Preferred data source for fetching NFTs */
    source?: 'auto' | 'alchemy' | 'moralis';
}

/**
 * WalletNFTsList Component
 * 
 * Displays NFTs owned by a wallet, separated into Listed and Unlisted sections.
 * Shows total value of listed NFTs with ETH/USD conversion.
 * 
 * Usage Examples:
 * 
 * 1. Show current user's NFTs with separate sections:
 * <WalletNFTsList separateSections />
 * 
 * 2. Show specific wallet's NFTs:
 * <WalletNFTsList walletAddress="0x..." separateSections />
 * 
 * 3. Limit results per section:
 * <WalletNFTsList limitPerSection={6} separateSections />
 * 
 * 4. Use specific API source:
 * <WalletNFTsList source="alchemy" separateSections />
 */
export function WalletNFTsList({
    walletAddress,
    title,
    separateSections = true,
    limitPerSection,
    gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6",
    autoFetch = true,
    includeContext = true,
    source = 'auto'
}: WalletNFTsListProps) {
    const { address: connectedWallet } = useAccount();

    // Use provided wallet address or fall back to connected wallet
    const targetWallet = walletAddress || connectedWallet;

    // Get ALL NFTs for the wallet using external APIs
    const { nfts, count, loading, error, source: dataSource, refresh } = useWalletNFTs(targetWallet, {
        autoFetch,
        includeContext,
        source
    });

    // Split NFTs into listed and unlisted
    const { listedNFTs, unlistedNFTs, totalListedValue } = React.useMemo(() => {
        const listed = nfts.filter((nft: any) => nft.listed);
        const unlisted = nfts.filter((nft: any) => !nft.listed);

        // Calculate total value of listed NFTs
        const totalValue = listed.reduce((sum: number, nft: any) => {
            if (nft.marketplaceData?.price) {
                try {
                    // Ensure price is converted to bigint if it's a string
                    const price = typeof nft.marketplaceData.price === 'string'
                        ? BigInt(nft.marketplaceData.price)
                        : nft.marketplaceData.price;
                    return sum + parseFloat(formatEther(price));
                } catch (e) {
                    return sum;
                }
            }
            return sum;
        }, 0);

        return {
            listedNFTs: limitPerSection ? listed.slice(0, limitPerSection) : listed,
            unlistedNFTs: limitPerSection ? unlisted.slice(0, limitPerSection) : unlisted,
            totalListedValue: totalValue
        };
    }, [nfts, limitPerSection]);

    // Convert total value to USD
    const { convertedPrice: totalListedValueUSD, loading: ethPriceLoading } = useETHPrice(totalListedValue);

    // Determine title
    const displayTitle = title ||
        (walletAddress ? `NFTs owned by ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Your NFTs');

    // Handle empty state
    if (!targetWallet) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Connect your wallet to view NFTs</p>
            </div>
        );
    }

    // Loading state
    if (loading && count === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{displayTitle}</h3>
                </div>
                <div className={gridClassName}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-xl aspect-square animate-pulse" />
                    ))}
                </div>
                <div className="text-center mt-4">
                    <p className="text-gray-500">Loading NFTs from {source}...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && count === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <div className="text-red-600 mb-4">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm">{error}</p>
                </div>
                <button
                    onClick={refresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Empty state
    if (count === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No NFTs found in this wallet</p>
                </div>
                <button
                    onClick={refresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>
        );
    }

    // Helper function to render NFT grid
    const renderNFTGrid = (nftList: typeof nfts, sectionTitle: string, badgeColor: string) => {
        if (nftList.length === 0) {
            return (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No {sectionTitle.toLowerCase()} NFTs</p>
                </div>
            );
        }

        return (
            <div className={gridClassName}>
                {nftList.map((nft: any) => (
                    <div key={`${nft.nftAddress}-${nft.tokenId}`} className="relative">
                        <NFTCard
                            contractAddress={nft.nftAddress}
                            tokenId={nft.tokenId}
                            // Marketplace data from enhanced context
                            price={nft.marketplaceData?.price || undefined}
                            isListed={nft.listed}
                            listingId={nft.marketplaceData?.listingId || undefined}
                            seller={nft.marketplaceData?.seller || undefined}
                            buyer={nft.marketplaceData?.buyer || undefined}
                            desiredNftAddress={nft.marketplaceData?.desiredNftAddress || undefined}
                            desiredTokenId={nft.marketplaceData?.desiredTokenId || undefined}
                            // Display options
                            enableInsights={true}
                            showStats={true}
                            priority={false}
                        />

                        {/* Listing Status Badge - Top Right */}
                        <div className="absolute top-2 right-2 z-10">
                            <span className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                                {nft.listed ? 'Listed' : 'Not Listed'}
                            </span>
                        </div>

                        {/* Data source indicator - Top Left */}
                        <div className="absolute top-2 left-2 z-10">
                            {nft.hasContextData && nft.hasExternalData && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Enhanced
                                </span>
                            )}
                            {nft.hasExternalData && !nft.hasContextData && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    External
                                </span>
                            )}
                            {nft.hasContextData && !nft.hasExternalData && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                    Cached
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (!separateSections) {
        // Original single section layout (fallback)
        return (
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {displayTitle}
                            <span className="ml-2 text-sm text-gray-500">({count})</span>
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                            {dataSource && (
                                <p className="text-xs text-gray-400">
                                    Data from: {dataSource}
                                    {loading && <span className="ml-2">• Refreshing...</span>}
                                </p>
                            )}
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-green-700">{listedNFTs.length} Listed</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <span className="text-gray-600">{unlistedNFTs.length} Not Listed</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {renderNFTGrid(nfts, 'All', 'bg-blue-500')}
            </div>
        );
    }

    // Separate sections layout
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {displayTitle}
                        <span className="ml-2 text-sm text-gray-500">({count})</span>
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                        {dataSource && (
                            <p className="text-xs text-gray-400">
                                Data from: {dataSource}
                                {loading && <span className="ml-2">• Refreshing...</span>}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={refresh}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Listed NFTs Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-green-800 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Listed NFTs ({listedNFTs.length})
                        </h4>
                        {totalListedValue > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Total Value:</span>
                                <span className="font-medium text-green-700">
                                    {totalListedValue.toFixed(4)} ETH
                                </span>
                                {!ethPriceLoading && totalListedValueUSD && (
                                    <span className="text-gray-500">
                                        (${totalListedValueUSD})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {renderNFTGrid(listedNFTs, 'Listed', 'bg-green-500')}
            </div>

            {/* Unlisted NFTs Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        Not Listed ({unlistedNFTs.length})
                    </h4>
                </div>
                {renderNFTGrid(unlistedNFTs, 'Not Listed', 'bg-gray-500')}
            </div>
        </div>
    );
}
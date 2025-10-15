import * as React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

import { NFTScrollList } from './08-ui-NFTScrollList';
import type { NFTScrollItem } from './08-ui-NFTScrollList';
import { useWalletNFTs } from '../../hooks/nfts/09-wallet-useWalletNFTs';
import { useNFTFilters } from '../../hooks/nfts/08-utils-useNFTFilters';
import { useETHPrice } from '@/contexts/CurrencyContext';
import type { NFTFilters, NFTSortOptions } from './05-filters-NFTFilterBar';
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters';
import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

export interface WalletNFTsListProps {
    /** The wallet address to display NFTs for. If not provided, uses connected wallet */
    walletAddress?: string;
    /** Custom title for the section */
    title?: string;
    /** Whether to show NFTs in separate listed/unlisted sections */
    separateSections?: boolean;
    /** Limit number of NFTs per section when using separateSections */
    limitPerSection?: number;
    /** Whether to automatically fetch NFTs when component mounts */
    autoFetch?: boolean;
    /** Whether to include marketplace context data enhancement */
    includeContext?: boolean;
    /** Preferred data source for fetching NFTs */
    source?: 'auto' | 'alchemy' | 'moralis';
    /** Filter settings */
    filters?: NFTFilters;
    /** Sort settings */
    sort?: NFTSortOptions;
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
    autoFetch = true,
    includeContext = true,
    source = 'auto',
    filters,
    sort
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

    // Convert NFTs to filterable format
    // Note: useWalletNFTs returns EnhancedAggregatedNFT[] with social stats in different structure than marketplace items
    const filterableItems: FilterableNFTItem[] = React.useMemo(() => {
        return nfts.map((nft) => ({
            contractAddress: nft.nftAddress,
            nftAddress: nft.nftAddress,
            tokenId: nft.tokenId,
            price: (nft as any).marketplaceData?.price,
            isListed: nft.listed,
            listingId: (nft as any).marketplaceData?.listingId,
            seller: (nft as any).marketplaceData?.seller,
            buyer: (nft as any).marketplaceData?.buyer,
            desiredNftAddress: (nft as any).marketplaceData?.desiredNftAddress,
            desiredTokenId: (nft as any).marketplaceData?.desiredTokenId,
            name: nft.meta?.name || nft.core?.name || `NFT #${nft.tokenId}`,
            symbol: nft.core?.symbol || nft.core?.contractSymbol,
            category: nft.insight?.category || null,
            categories: nft.insight?.category ? [nft.insight.category] : [],
            description: nft.meta?.description || null,
            imageUrl: nft.meta?.image || null,
            rarity: nft.insight?.rarity || null,
            customTitle: nft.insight?.customTitle || null,
            cardDescriptions: nft.insight?.cardDescription || null, // Already an array
            tags: nft.insight?.tags || null,
            // Map from AggregatedNFT.social to FilterableNFTItem (note: social uses likeCount, not favoriteCount!)
            averageRating: nft.social?.averageRating || 0,
            ratingCount: nft.social?.ratingCount || 0,
            viewCount: nft.social?.viewCount || 0,
            favoriteCount: nft.social?.likeCount || 0, // AggregatedNFT uses likeCount in social field
            watchlistCount: nft.social?.watchlistCount || 0,
        }));
    }, [nfts]);

    // Apply filters and sorting if provided
    const { filteredItems: filteredNFTs, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters || { categories: [], rarities: [], searchTerm: '' },
        sort || { field: 'price', direction: 'desc' }
    );

    // Split NFTs into listed and unlisted (using filtered NFTs)
    const { listedNFTs, unlistedNFTs, totalListedValue } = React.useMemo(() => {
        const listed = filteredNFTs.filter((nft: FilterableNFTItem) => nft.isListed);
        const unlisted = filteredNFTs.filter((nft: FilterableNFTItem) => !nft.isListed);

        // Calculate total value of listed NFTs
        const totalValue = listed.reduce((sum: number, nft: FilterableNFTItem) => {
            if (nft.price) {
                try {
                    // Ensure price is converted to bigint if it's a string
                    const price = typeof nft.price === 'string'
                        ? BigInt(nft.price)
                        : nft.price;
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
    }, [filteredNFTs, limitPerSection]);

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
                <NFTScrollList
                    items={[]}
                    loading={true}
                    loadingCount={8}
                />
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

    // Helper function to convert NFTs to NFTScrollItem format
    const convertToScrollItems = (nftList: FilterableNFTItem[]): NFTScrollItem[] => {
        return nftList.map((nft: FilterableNFTItem) => ({
            nftAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            price: nft.price || undefined,
            isListed: nft.isListed,
            listingId: nft.listingId,
            seller: nft.seller,
            buyer: nft.buyer || undefined,
            desiredNftAddress: nft.desiredNftAddress,
            desiredTokenId: nft.desiredTokenId,
        }));
    };

    // Secondary badge for data source indicator
    const renderDataSourceBadge = (item: NFTScrollItem) => {
        if (item.hasContextData && item.hasExternalData) {
            return (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Enhanced
                </span>
            );
        }
        if (item.hasExternalData && !item.hasContextData) {
            return (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    External
                </span>
            );
        }
        if (item.hasContextData && !item.hasExternalData) {
            return (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Cached
                </span>
            );
        }
        return null;
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

                <NFTScrollList
                    items={convertToScrollItems(filteredNFTs)}
                    badge={{ text: 'All NFTs', color: 'bg-blue-500' }}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No NFTs found in this wallet"
                />
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
                    className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 pr-4"
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
                                        ({totalListedValueUSD})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <NFTScrollList
                    items={convertToScrollItems(listedNFTs)}
                    secondaryBadge={renderDataSourceBadge}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No listed NFTs"
                    enableViewAll={true}
                    emptyComponent={
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No listed NFTs</p>
                        </div>
                    }
                />
            </div>

            {/* Unlisted NFTs Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        Not Listed ({unlistedNFTs.length})
                    </h4>
                </div>

                <NFTScrollList
                    items={convertToScrollItems(unlistedNFTs)}
                    secondaryBadge={renderDataSourceBadge}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No unlisted NFTs"
                    enableViewAll={true}
                    emptyComponent={
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No unlisted NFTs</p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useWalletNFTs } from '@/hooks';
import { NFTCard } from '@/components';

interface WalletNFTsListProps {
    /** Wallet address to filter NFTs by (optional - uses connected wallet if not provided) */
    walletAddress?: string;
    /** Custom title for the section */
    title?: string;
    /** Show only listed NFTs */
    listedOnly?: boolean;
    /** Show only unlisted NFTs */
    unlistedOnly?: boolean;
    /** Maximum number of NFTs to display */
    limit?: number;
    /** CSS classes for grid layout */
    gridClassName?: string;
    /** Auto-fetch NFTs on mount */
    autoFetch?: boolean;
    /** Include context data (cached NFTs) */
    includeContext?: boolean;
    /** API source preference */
    source?: 'alchemy' | 'moralis' | 'auto';
}

/**
 * WalletNFTsList Component
 * 
 * Displays ALL NFTs owned by a specific wallet address using external APIs.
 * This component fetches complete wallet data from Alchemy, Moralis, or mock data.
 * 
 * Usage Examples:
 * 
 * 1. Show current user's NFTs:
 * <WalletNFTsList />
 * 
 * 2. Show specific wallet's NFTs:
 * <WalletNFTsList walletAddress="0x..." />
 * 
 * 3. Show only listed NFTs:
 * <WalletNFTsList listedOnly />
 * 
 * 4. Limit results:
 * <WalletNFTsList limit={6} />
 * 
 * 5. Use specific API source:
 * <WalletNFTsList source="alchemy" />
 */
export function WalletNFTsList({
    walletAddress,
    title,
    listedOnly = false,
    unlistedOnly = false,
    limit,
    gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
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

    // Apply filters
    const filteredNFTs = React.useMemo(() => {
        let filtered = [...nfts];

        // Filter by listing status
        if (listedOnly) {
            filtered = filtered.filter(nft => nft.isListed);
        } else if (unlistedOnly) {
            filtered = filtered.filter(nft => !nft.isListed);
        }

        // Apply limit
        if (limit && limit > 0) {
            filtered = filtered.slice(0, limit);
        }

        return filtered;
    }, [nfts, listedOnly, unlistedOnly, limit]);

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

    // Filtered empty state
    if (filteredNFTs.length === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <p className="text-gray-500">
                    {listedOnly
                        ? 'No listed NFTs found'
                        : unlistedOnly
                            ? 'No unlisted NFTs found'
                            : 'No NFTs match the current filters'
                    }
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Total NFTs in wallet: {count}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {displayTitle}
                        <span className="ml-2 text-sm text-gray-500">
                            ({filteredNFTs.length}{limit && count > limit ? `/${count}` : ''})
                        </span>
                    </h3>
                    {dataSource && (
                        <p className="text-xs text-gray-400 mt-1">
                            Data from: {dataSource}
                            {loading && <span className="ml-2">• Refreshing...</span>}
                        </p>
                    )}
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

            {/* Error banner (if error but some data available) */}
            {error && count > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm text-yellow-700">
                            Showing cached data. Refresh failed: {error}
                        </p>
                    </div>
                </div>
            )}

            {/* NFT Grid */}
            <div className={gridClassName}>
                {filteredNFTs.map((nft) => (
                    <div key={`${nft.nftAddress}-${nft.tokenId}`} className="relative">
                        <NFTCard
                            contractAddress={nft.nftAddress}
                            tokenId={nft.tokenId}
                            // Pre-loaded marketplace data (if available from context)
                            price={nft.price || undefined}
                            isListed={nft.isListed}
                            listingId={nft.listingId || undefined}
                            // Display options
                            enableInsights={true}
                            showStats={true}
                            priority={false}
                        />

                        {/* Data source indicator */}
                        <div className="absolute top-2 right-2">
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

            {/* Show "load more" hint if limited */}
            {limit && count > limit && (
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        Showing {filteredNFTs.length} of {count} NFTs
                    </p>
                </div>
            )}

            {/* Data quality info */}
            <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Enhanced (Context + API)
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        External API Only
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Cached Data Only
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WalletNFTsList;
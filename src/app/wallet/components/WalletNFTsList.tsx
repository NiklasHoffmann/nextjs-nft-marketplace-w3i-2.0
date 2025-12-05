import * as React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

import { NFTGallery } from '@/components/shared';
import type { NFTScrollItem } from '@/types/marketplace';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters';
import { useETHPrice } from '@/contexts/CurrencyContext';
import type { NFTFilters, NFTSortOptions, FilterableNFTItem } from '@/types/marketplace';

export interface WalletNFTsListProps {
    /** Custom title for the section */
    title?: string;
    /** Whether to show NFTs in separate listed/unlisted sections */
    separateSections?: boolean;
    /** Limit number of NFTs per section when using separateSections */
    limitPerSection?: number;
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
 * Now uses WalletNFTsContext for auto-loading and enriched data.
 * 
 * Usage Examples:
 * 
 * 1. Show current user's NFTs with separate sections:
 * <WalletNFTsList separateSections />
 * 
 * 2. Limit results per section:
 * <WalletNFTsList limitPerSection={6} separateSections />
 */
export function WalletNFTsList({
    title,
    separateSections = true,
    limitPerSection,
    filters,
    sort
}: WalletNFTsListProps) {
    const { address: connectedWallet } = useAccount();

    // Get NFTs from WalletNFTsContext (auto-loads on wallet connect)
    const {
        nfts,
        loading,
        error,
        totalCount,
        listedCount,
        unlistedCount,
        refresh
    } = useWalletNFTs();

    // Convert NFTs to filterable format
    const filterableItems: FilterableNFTItem[] = React.useMemo(() => {
        console.log('[WalletNFTsList] Converting NFTs from context:');
        console.log('  Total from context:', nfts.length);
        if (nfts.length > 0 && nfts[0]) {
            const firstNFT = nfts[0];
            console.log('  First NFT from context:', {
                contractAddress: firstNFT.contractAddress,
                tokenId: firstNFT.tokenId,
                isListed: firstNFT.isListed,
                listingPrice: firstNFT.listingPrice,
                listingId: firstNFT.listingId,
                hasInsights: !!firstNFT.insights,
                insightsRarity: firstNFT.insights?.rarity,
                directRarity: firstNFT.rarity,
                insightsCategory: firstNFT.insights?.category,
                directCategory: firstNFT.category
            });
        }

        const items = nfts.map((nft) => {
            const item = {
                contractAddress: nft.contractAddress, // NFTCard expects contractAddress
                tokenId: nft.tokenId,
                price: nft.listingPrice,
                isListed: nft.isListed || false,
                listingId: nft.listingId,
                seller: nft.seller,
                buyer: undefined,
                desiredContractAddress: undefined,
                desiredTokenId: undefined,
                name: nft.name || `NFT #${nft.tokenId}`,
                symbol: nft.contractSymbol || undefined,
                category: nft.insights?.category || nft.category || null,
                categories: nft.insights?.category ? [nft.insights.category] : nft.category ? [nft.category] : [],
                description: nft.description || null,
                imageUrl: nft.image || null, // ExternalNFT uses 'image', not 'imageUrl'
                rarity: nft.insights?.rarity || nft.rarity || null,
                customTitle: nft.insights?.customTitle || null,
                cardDescriptions: nft.insights?.cardDescriptions || null,
                tags: [],
                averageRating: 0,
                ratingCount: 0,
                viewCount: 0,
                favoriteCount: 0,
                watchlistCount: 0,
                // NFTCard expects metadata object with nested image
                metadata: {
                    name: nft.name || null,
                    description: nft.description || null,
                    image: nft.image || null,
                    animationUrl: nft.animationUrl || undefined,
                    externalUrl: undefined,
                    attributes: nft.attributes || undefined,
                },
                // Pass insights data for NFTCard
                insights: nft.insights ? {
                    customTitle: nft.insights.customTitle || undefined,
                    category: nft.insights.category || nft.category || undefined,
                    tags: [],
                    rarity: nft.insights.rarity || nft.rarity || undefined,
                    cardDescriptions: nft.insights.cardDescriptions || undefined,
                    projectDescriptions: undefined,
                    functionalitiesDescriptions: undefined,
                    projectWebsite: undefined,
                    projectTwitter: undefined,
                    projectDiscord: undefined,
                    partnerships: [],
                } : undefined,
                // Pass contract info - map from the nft object properly
                contract: {
                    name: nft.contractName || null,
                    symbol: nft.contractSymbol || null,
                    totalSupply: nft.totalSupply || null,  // Add totalSupply mapping
                    owner: nft.owner || connectedWallet || null, // Use owner from WalletNFT or fallback to current wallet
                    tokenURI: nft.tokenURI || null,         // Add tokenURI mapping
                    approved: nft.approved || null,         // Add approved mapping
                    ownerBalance: nft.ownerBalance || null, // Add ownerBalance mapping
                },
            };
            return item;
        });

        // Debug: Log first converted item
        if (items.length > 0 && items[0]) {
            console.log('  First converted NFT:', {
                contractAddress: items[0].contractAddress,
                tokenId: items[0].tokenId,
                rarity: items[0].rarity,
                hasInsights: !!items[0].insights,
                insightsRarity: items[0].insights?.rarity
            });
        }

        return items;
    }, [nfts, connectedWallet]);

    // Apply filters and sorting if provided
    const { filteredItems: filteredNFTs } = useNFTFilters(
        filterableItems,
        filters || { categories: [], rarities: [], searchTerm: '' },
        sort || { field: 'price', direction: 'desc' }
    );

    // Split NFTs into listed and unlisted (using filtered NFTs)
    const { listedNFTs, unlistedNFTs, totalListedValue } = React.useMemo(() => {
        console.log('[WalletNFTsList] Splitting NFTs:');
        console.log('  Total NFTs:', filteredNFTs.length);

        const listed = filteredNFTs.filter((nft: FilterableNFTItem) => nft.isListed);
        const unlisted = filteredNFTs.filter((nft: FilterableNFTItem) => !nft.isListed);

        console.log('  Listed:', listed.length);
        console.log('  Unlisted:', unlisted.length);

        // Debug: Log first NFT's listing status
        if (filteredNFTs.length > 0 && filteredNFTs[0]) {
            const firstNFT = filteredNFTs[0];
            console.log('  First NFT:', {
                contractAddress: firstNFT.contractAddress,
                tokenId: firstNFT.tokenId,
                isListed: firstNFT.isListed,
                price: firstNFT.price,
                listingId: firstNFT.listingId
            });
        }

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
    const displayTitle = title || 'Your NFTs';

    // Handle empty state
    if (!connectedWallet) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Connect your wallet to view NFTs</p>
            </div>
        );
    }

    // Loading state
    if (loading && totalCount === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{displayTitle}</h3>
                </div>
                <NFTGallery
                    items={[]}
                    loading={true}
                    loadingCount={8}
                />
                <div className="text-center mt-4">
                    <p className="text-gray-500">Loading NFTs...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && totalCount === 0) {
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
    if (totalCount === 0) {
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
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            price: nft.price || undefined,
            isListed: nft.isListed,
            listingId: nft.listingId,
            seller: nft.seller,
            buyer: nft.buyer || undefined,
            desiredContractAddress: nft.desiredContractAddress,
            desiredTokenId: nft.desiredTokenId,
            // Pass metadata so NFTCard can display images without MongoDB lookup
            metadata: nft.metadata,
            // Pass insights data
            insights: nft.insights,
            // Pass contract info
            contract: nft.contract,
        }));
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
                            <span className="ml-2 text-sm text-gray-500">({totalCount})</span>
                        </h3>
                        <div className="flex items-center gap-3 text-xs mt-1">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-700">{listedCount} Listed</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-600">{unlistedCount} Not Listed</span>
                            </span>
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

                <NFTGallery
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
                        <span className="ml-2 text-sm text-gray-500">({totalCount})</span>
                    </h3>
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
                                        ({totalListedValueUSD})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <NFTGallery
                    items={convertToScrollItems(listedNFTs)}
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

                <NFTGallery
                    items={convertToScrollItems(unlistedNFTs)}
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


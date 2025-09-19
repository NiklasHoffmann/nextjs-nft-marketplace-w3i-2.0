'use client'

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { getAdminAddressesList } from '@/utils';
import { formatEther } from '@/utils/02-formatters/01-formatters-general';
import { useActiveItems } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';
import { useNFTFilters } from '@/hooks/nfts/08-utils-useNFTFilters';
import { NFTCard, ImagePreloader } from '@/components';
import OptimizedNFTImage from '@/components/02-nft/02-utils-OptimizedNFTImage';
import type { NFTFilters, NFTSortOptions } from '@/components/03-marketplace/05-filters-NFTFilterBar';
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters';

interface CollectionPageClientProps {
    contractAddress: string;
}

export default function CollectionPageClient({ contractAddress }: CollectionPageClientProps) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    // Filter and sort state
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    // Wait for client-side mounting before using wagmi hooks
    const { address } = useAccount();

    // Check admin status when address changes
    useEffect(() => {
        if (address) {
            const adminAddresses = getAdminAddressesList();
            const lowerAddress = address.toLowerCase();
            const isCurrentUserAdmin = adminAddresses.includes(lowerAddress);
            setIsAdmin(isCurrentUserAdmin);
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    // Get all marketplace data and filter by collection
    const { items, marketplaceItems, loading: graphLoading, error: graphError, refetch } = useActiveItems();
    const nftContext = useNFTContext();

    // Filter items for this specific collection
    const collectionItems = useMemo(() => {
        if (!items || items.length === 0) return [];

        return items.filter((item: any) =>
            item.contractAddress.toLowerCase() === contractAddress.toLowerCase()
        );
    }, [items, contractAddress]);

    // Get collection info from first item
    const collectionInfo = useMemo(() => {
        if (collectionItems.length === 0) return null;

        const firstItem = collectionItems[0];
        const nftData = nftContext.getNFTCardData(contractAddress, firstItem.tokenId);

        return {
            contractAddress,
            symbol: nftData?.contractInfo?.symbol || `${contractAddress.slice(0, 6)}...`,
            name: nftData?.contractInfo?.name || 'Unknown Collection',
            totalSupply: nftData?.contractInfo?.totalSupply
                ? (typeof nftData.contractInfo.totalSupply === 'bigint'
                    ? Number(nftData.contractInfo.totalSupply)
                    : nftData.contractInfo.totalSupply)
                : 0,
            // Get preview images from multiple items
            previewImages: collectionItems.slice(0, 4).map((item: any) => {
                const data = nftContext.getNFTCardData(contractAddress, item.tokenId);
                return data?.imageUrl;
            }).filter(Boolean) as string[],
            description: '' // Description not available in NFTContractInfo
        };
    }, [collectionItems, contractAddress, nftContext]);

    // Load collection data if not available
    useEffect(() => {
        if (collectionItems.length > 0) {
            collectionItems.forEach((item: any) => {
                const nftData = nftContext.getNFTCardData(contractAddress, item.tokenId);
                if (!nftData && !nftContext.isDataFresh(contractAddress, item.tokenId)) {
                    nftContext.loadNFTData(contractAddress, item.tokenId);
                }
            });
        }
    }, [collectionItems, contractAddress, nftContext]);

    // Convert items to filterable format
    const filterableItems: FilterableNFTItem[] = useMemo(() => {
        return collectionItems.map((item: any) => ({
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            price: item.price,
            isListed: item.isListed,
            listingId: item.listingId,
            seller: item.seller,
            buyer: item.buyer,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId,
            // NFT Context data
            name: item.name,
            category: item.category,
            rarity: item.rarity,
            averageRating: item.averageRating,
            ratingCount: item.ratingCount,
            favoriteCount: item.favoriteCount,
            watchlistCount: item.watchlistCount,
            viewCount: item.viewCount,
            customTitle: item.customTitle,
            cardDescriptions: item.cardDescriptions,
            tags: item.tags,
            imageUrl: item.imageUrl,
        }));
    }, [collectionItems]);

    // Apply filters and sorting
    const { filteredItems, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters,
        sort
    );

    // Enhanced manual refresh
    const handleManualRefresh = useCallback(async () => {
        if (isManualRefreshing) return;

        setIsManualRefreshing(true);
        setLastUpdate(new Date());

        try {
            await refetch();
            await new Promise(resolve => setTimeout(resolve, 300));
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetch, isManualRefreshing]);

    // Staggered rendering for better performance
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        if (filteredItems.length > 0 && visibleCount < filteredItems.length) {
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 4, filteredItems.length));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [filteredItems.length, visibleCount]);

    useEffect(() => {
        setVisibleCount(Math.min(6, filteredItems.length));
    }, [filteredItems.length]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Collection stats
    const collectionStats = useMemo(() => {
        const listedItems = collectionItems.filter(item => item.isListed).length;
        const totalValue = collectionItems
            .filter(item => item.isListed && item.price)
            .reduce((sum, item) => sum + parseFloat(formatEther(item.price)), 0);

        const prices = collectionItems
            .filter(item => item.isListed && item.price)
            .map(item => parseFloat(formatEther(item.price)));

        const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const avgPrice = prices.length > 0 ? totalValue / prices.length : 0;

        return {
            totalItems: collectionItems.length,
            listedItems,
            totalValue: totalValue.toFixed(4),
            floorPrice: floorPrice.toFixed(4),
            avgPrice: avgPrice.toFixed(4)
        };
    }, [collectionItems]);

    // Optimized image URLs for preloading
    const imageUrls = useMemo(() => {
        return filteredItems.slice(0, 6)
            .map(item => item.imageUrl)
            .filter(Boolean) as string[];
    }, [filteredItems]);

    // Don't render anything on server
    if (!isClient) {
        return (
            <div className="py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (graphLoading && totalCount === 0) {
        return (
            <div className="py-8">
                <div className="text-center">Loading collection...</div>
            </div>
        );
    }

    if (graphError && totalCount === 0) {
        return (
            <div className="py-8">
                <div className="text-center text-red-500">Error loading collection</div>
            </div>
        );
    }

    if (!collectionInfo) {
        return (
            <div className="py-8">
                <div className="text-center">Collection not found</div>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const visibleItems = filteredItems.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            {/* Fixed Collection Header - Similar to NFTDetailHeader */}
            <div className="bg-white shadow-sm border-b fixed top-16 left-0 right-0 z-40">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Left Side - Back button and Collection Info */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Go back"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {collectionInfo.symbol}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {collectionInfo.name}
                                </p>
                            </div>
                        </div>

                        {/* Center - Collection Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="min-w-[40px]">{collectionStats.totalItems}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="min-w-[60px]">{collectionStats.floorPrice} ETH</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="min-w-[60px]">{collectionStats.totalValue} ETH</span>
                            </div>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-center gap-3">
                            {/* Sorting Controls */}
                            <select
                                value={`${sort.field}-${sort.direction}`}
                                onChange={(e) => {
                                    const [field, direction] = e.target.value.split('-');
                                    setSort({ field: field as any, direction: direction as 'asc' | 'desc' });
                                }}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="price-desc">Price ↓</option>
                                <option value="price-asc">Price ↑</option>
                                <option value="rating-desc">Rating ↓</option>
                                <option value="views-desc">Views ↓</option>
                                <option value="likes-desc">Likes ↓</option>
                                <option value="name-asc">Name ↑</option>
                            </select>
                            <span className="text-sm text-gray-500">
                                {filteredCount} / {totalCount}
                            </span>
                            <button
                                onClick={handleManualRefresh}
                                disabled={graphLoading || isManualRefreshing}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="Refresh collection data"
                            >
                                {graphLoading || isManualRefreshing ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid - Full Width Layout */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
                <ImagePreloader imageUrls={imageUrls} priority={true} />

                {/* Collection Info Cards - Compact Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Collection Stats */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Collection Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600">Total Items</div>
                                <div className="text-xl font-bold text-gray-900">{collectionStats.totalItems}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Listed</div>
                                <div className="text-xl font-bold text-green-600">{collectionStats.listedItems}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Floor Price</div>
                                <div className="text-lg font-semibold text-gray-900">{collectionStats.floorPrice} ETH</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Total Value</div>
                                <div className="text-lg font-semibold text-gray-900">{collectionStats.totalValue} ETH</div>
                            </div>
                        </div>
                    </div>

                    {/* Collection Info */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Collection Info
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-600">Name</div>
                                <div className="font-medium text-gray-900">{collectionInfo.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Symbol</div>
                                <div className="font-medium text-gray-900">{collectionInfo.symbol}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Total Supply</div>
                                <div className="font-medium text-gray-900">{collectionInfo.totalSupply.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Contract</div>
                                <div className="font-mono text-xs text-gray-700 break-all">{contractAddress.slice(0, 20)}...{contractAddress.slice(-8)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Description</div>
                                <div className="text-xs text-gray-500">{collectionInfo?.description}</div>
                            </div>
                        </div>
                    </div>

                    {/* Collection Preview */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Preview Gallery
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {collectionInfo.previewImages.slice(0, 4).map((imageUrl, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <OptimizedNFTImage
                                        imageUrl={imageUrl}
                                        tokenId={`collection-preview-${index}`}
                                        className="object-cover w-full h-full"
                                        fill={false}
                                        width={80}
                                        height={80}
                                        priority={true}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Collection Items Grid - Full Width */}
                {visibleItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {visibleItems.map((item: any, index: number) => (
                            <div
                                key={item.listingId || `${item.contractAddress}-${item.tokenId}`}
                                className="w-full"
                                style={{
                                    animationName: 'fadeInUp',
                                    animationDuration: '0.5s',
                                    animationTimingFunction: 'ease-out',
                                    animationFillMode: 'forwards',
                                    animationDelay: `${index * 80}ms`
                                }}
                            >
                                <NFTCard
                                    contractAddress={item.contractAddress}
                                    tokenId={item.tokenId}
                                    listingId={item.listingId}
                                    price={item.price}
                                    seller={item.seller}
                                    buyer={item.buyer}
                                    isListed={item.isListed}
                                    desiredNftAddress={item.desiredNftAddress}
                                    desiredTokenId={item.desiredTokenId}
                                    priority={index < 6}
                                    enableInsights={index < 12}
                                />
                            </div>
                        ))}

                        {/* Progressive Loading Indicator */}
                        {visibleCount < filteredItems.length && (
                            <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="text-center">
                                    <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <div className="text-sm font-medium text-gray-600">Loading more items...</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {filteredItems.length - visibleCount} remaining
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <div className="text-gray-500 text-lg mb-4">No items found in this collection</div>
                        <p className="text-gray-400">Try adjusting your filters or check back later</p>
                    </div>
                )}
            </div>

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
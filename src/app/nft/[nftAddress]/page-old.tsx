// app/nft/[nftAddress]/page.tsx
'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { getAdminAddressesList } from '@/utils';
import { formatEther } from '@/utils/02-formatters/01-formatters-general';
import { useActiveItems } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';
import { useNFTFilters } from '@/hooks/nfts/08-utils-useNFTFilters';
import { NFTCard, ImagePreloader } from '@/components';
import { NFTFilterBar } from '@/components/03-marketplace/05-filters-NFTFilterBar';
import OptimizedNFTImage from '@/components/02-nft/02-utils-OptimizedNFTImage';
import type { NFTFilters, NFTSortOptions } from '@/components/03-marketplace/05-filters-NFTFilterBar';
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters';

interface CollectionPageProps {
    params: Promise<{
        nftAddress: string;
    }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    // Await the params in Next.js 15+
    const { nftAddress: encodedAddress } = await params;
    const contractAddress = decodeURIComponent(encodedAddress);

    return <CollectionPageClient contractAddress={contractAddress} />;
}

function CollectionPageClient({ contractAddress }: { contractAddress: string }) {
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
            }).filter(Boolean) as string[]
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

    // Auto-refresh when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && refetch) {
                setTimeout(() => {
                    refetch();
                }, 500);
            }
        };

        const handleFocus = () => {
            if (refetch) {
                setTimeout(() => {
                    refetch();
                }, 500);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [refetch]);

    // Optimized image URLs for preloading
    const imageUrls = useMemo(() => {
        return filteredItems.slice(0, 6)
            .map(item => item.imageUrl)
            .filter(Boolean) as string[];
    }, [filteredItems]);

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
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1 flex flex-col items-center py-12">
                <div className="w-full max-w-[98vw] px-4 mt-8">
                    <ImagePreloader imageUrls={imageUrls} priority={true} />

                    {/* Collection Header */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Collection Preview Images */}
                            <div className="flex gap-2">
                                {collectionInfo.previewImages.slice(0, 4).map((imageUrl, index) => (
                                    <div key={index} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shadow-md border border-gray-200">
                                        <OptimizedNFTImage
                                            imageUrl={imageUrl}
                                            tokenId={`collection-header-${index}`}
                                            className="object-cover w-full h-full"
                                            fill={false}
                                            width={80}
                                            height={80}
                                            priority={true}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Collection Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{collectionInfo.symbol}</h1>
                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        COLLECTION
                                    </span>
                                </div>
                                <h2 className="text-lg text-gray-600 mb-3">{collectionInfo.name}</h2>
                                <div className="text-sm text-gray-500 font-mono mb-4">
                                    {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                                </div>

                                {/* Collection Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-lg font-bold text-blue-600">{collectionStats.totalItems}</div>
                                        <div className="text-xs text-gray-600">Total Items</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-lg font-bold text-green-600">{collectionStats.listedItems}</div>
                                        <div className="text-xs text-gray-600">Listed</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-lg font-bold text-purple-600">{collectionStats.floorPrice} ETH</div>
                                        <div className="text-xs text-gray-600">Floor Price</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-lg font-bold text-orange-600">{collectionStats.avgPrice} ETH</div>
                                        <div className="text-xs text-gray-600">Avg Price</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <div className="text-lg font-bold text-indigo-600">{collectionStats.totalValue} ETH</div>
                                        <div className="text-xs text-gray-600">Total Value</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm font-medium"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleManualRefresh}
                                    disabled={graphLoading || isManualRefreshing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm font-medium"
                                    title="Refresh collection data"
                                >
                                    {graphLoading || isManualRefreshing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Refreshing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            ↻ Refresh
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Compact Filter & Sort Bar */}
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            {/* Left: Title and Count */}
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Collection Items
                                </h2>
                                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                    {filteredCount} / {totalCount} items
                                </span>
                            </div>

                            {/* Right: Compact Controls */}
                            <div className="flex items-center gap-3">
                                {/* Sort Dropdown */}
                                <select
                                    value={`${sort.field}-${sort.direction}`}
                                    onChange={(e) => {
                                        const [field, direction] = e.target.value.split('-');
                                        setSort({ field: field as any, direction: direction as 'asc' | 'desc' });
                                    }}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="price-desc">💰 Preis (hoch → niedrig)</option>
                                    <option value="price-asc">💰 Preis (niedrig → hoch)</option>
                                    <option value="rating-desc">⭐ Rating (hoch → niedrig)</option>
                                    <option value="views-desc">👁️ Views (hoch → niedrig)</option>
                                    <option value="likes-desc">❤️ Likes (hoch → niedrig)</option>
                                    <option value="name-asc">📝 Name (A → Z)</option>
                                </select>

                                {/* Filter Toggle Button */}
                                <button
                                    onClick={() => {
                                        // Toggle advanced filters (you can implement this later)
                                        console.log('Toggle filters');
                                    }}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    🔍 Filter
                                </button>

                                {/* Last updated time */}
                                <span className="text-xs text-gray-500">
                                    {lastUpdate.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>

                        {/* Performance Indicators - Admin Only */}
                        {isAdmin && (
                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600">Collection: {collectionItems.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">Filtered: {filteredCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="text-gray-600">Visible: {visibleCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-gray-600">Preloaded: {imageUrls.length}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NFT Grid */}
                    {visibleItems.length > 0 ? (
                        <div
                            className="flex gap-6 overflow-x-auto pb-8 pt-8 scrollbar-thumb-only scroll-smooth"
                            style={{ scrollBehavior: 'smooth' }}
                        >
                            {visibleItems.map((item: any, index: number) => (
                                <div
                                    key={item.listingId || `${item.contractAddress}-${item.tokenId}`}
                                    className="flex-shrink-0"
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
                                <div className="flex-shrink-0 w-64 h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
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
                        <div className="text-center py-12">
                            <div className="text-gray-500 text-lg mb-4">No items found in this collection</div>
                            <p className="text-gray-400">Try adjusting your filters or check back later</p>
                        </div>
                    )}

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
            </div>
        </div>
    );
}
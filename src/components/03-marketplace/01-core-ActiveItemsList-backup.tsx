"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount } from "wagmi";
import { getAdminAddressesList } from '@/utils';
import { useActiveItems, useNFTPerformance } from '@/hooks';
import { useNFTFilters } from '@/hooks/nfts/08-utils-useNFTFilters';
import { useNFTContext } from '@/contexts/NFTContext';
import { NFTCard, ImagePreloader } from '@/components';
import { NFTFilterBar } from './05-filters-NFTFilterBar';
import type { NFTFilters, NFTSortOptions } from './05-filters-NFTFilterBar';
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters';

export function ActiveItemsList() {
    const [isClient, setIsClient] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Scroll state and refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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

    // Get real marketplace data from The Graph + NFT Context
    const { items, marketplaceItems, loading: graphLoading, error: graphError, refetch } = useActiveItems();

    // Debug logging
    console.log('ActiveItemsList Debug:', {
        itemsCount: items?.length || 0,
        marketplaceItemsCount: marketplaceItems?.length || 0,
        graphLoading,
        graphError: graphError?.message || null,
        hasRefetch: !!refetch,
        items: items || []
    });

    // Auto-refresh when page becomes visible (e.g., when returning from detail page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && refetch) {
                // Small delay to avoid immediate refresh
                setTimeout(() => {
                    refetch();
                }, 500);
            }
        };

        const handleFocus = () => {
            if (refetch) {
                // Small delay to avoid immediate refresh
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

    // Auto-refresh when NFT stats change (likes, ratings, etc.)
    const lastRefreshTime = useRef<number>(Date.now());
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Listen for NFT stats changes via localStorage events
            if (e.key && e.key.startsWith('nft_stats_') && refetch) {
                const now = Date.now();
                // Throttle refreshes to avoid rapid updates
                if (now - lastRefreshTime.current > 1000) {
                    console.log('NFT stats changed, refreshing ActiveItemsList');
                    lastRefreshTime.current = now;
                    refetch();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [refetch]);

    // Convert items to filterable format (already enriched with NFT context data)
    const filterableItems: FilterableNFTItem[] = useMemo(() => {
        return items.map((item: any) => ({
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            price: item.price,
            isListed: item.isListed,
            listingId: item.listingId,
            seller: item.seller,
            buyer: item.buyer,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId,
            // NFT Context data (now available from useActiveItems)
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
    }, [items]);

    // Apply filters and sorting
    const { filteredItems, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters,
        sort
    );

    // Performance monitoring for admin
    const performanceData = useNFTPerformance();
    const cachedCount = performanceData.size || 0;
    const { memoryUsage, loadingCount } = performanceData;

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Optimized image URLs for preloading - only visible items
    const imageUrls = useMemo(() => {
        return filteredItems.slice(0, 6)
            .map(item => item.imageUrl)
            .filter(Boolean) as string[];
    }, [filteredItems]);

    // Staggered rendering for better currency conversion performance
    const [visibleCount, setVisibleCount] = useState(6);

    // Enhanced manual refresh with optimistic update
    const handleManualRefresh = useCallback(async () => {
        if (isManualRefreshing) return;

        setIsManualRefreshing(true);
        setLastUpdate(new Date());

        try {
            await refetch();
            // Brief delay for UX feedback
            await new Promise(resolve => setTimeout(resolve, 300));
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetch, isManualRefreshing]);

    // Scroll functions
    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    }, []);

    const scrollLeft = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
        }
    }, []);

    const scrollRight = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
        }
    }, []);

    // Monitor scroll position
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            checkScrollButtons();
            container.addEventListener('scroll', checkScrollButtons);
            window.addEventListener('resize', checkScrollButtons);

            return () => {
                container.removeEventListener('scroll', checkScrollButtons);
                window.removeEventListener('resize', checkScrollButtons);
            };
        }
    }, [checkScrollButtons, visibleCount]);

    // Check scroll buttons when content changes
    useEffect(() => {
        const timer = setTimeout(checkScrollButtons, 100);
        return () => clearTimeout(timer);
    }, [visibleCount, checkScrollButtons]);

    useEffect(() => {
        if (filteredItems.length > 0 && visibleCount < filteredItems.length) {
            // Gradually show more items to reduce simultaneous currency conversions
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 4, filteredItems.length));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [filteredItems.length, visibleCount]);

    // Reset visible count only when the number of filtered items changes significantly
    useEffect(() => {
        setVisibleCount(Math.min(6, filteredItems.length));
    }, [filteredItems.length]); // Only depend on length, not the entire array

    // Don't render anything on server to avoid hydration mismatch
    if (!isClient) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (graphLoading && totalCount === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (graphError && totalCount === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center text-red-500">Error loading items</div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">No active items found</div>
            </div>
        );
    }

    const visibleItems = filteredItems.slice(0, visibleCount);

    return (
        <div className="py-8 p-12">
            <ImagePreloader imageUrls={imageUrls} priority={true} />

            {/* NFT Filter Bar */}
            <NFTFilterBar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                totalItems={totalCount}
                filteredCount={filteredCount}
            />

            {/* Enhanced Header with Performance Stats
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Active Items ({filteredCount} / {totalCount})
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                FILTERED
                            </span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Live marketplace data with intelligent filtering & caching
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                        <button
                            onClick={handleManualRefresh}
                            disabled={graphLoading || isManualRefreshing}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm font-medium"
                            title="Refresh marketplace data"
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
                </div>*/}

            {/* Performance Indicators - Admin Only 
                {isAdmin && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="font-semibold text-blue-600">{items.length}</div>
                            <div className="text-gray-600">Total Items</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="font-semibold text-green-600">{cachedCount}</div>
                            <div className="text-gray-600">Cached NFTs</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="font-semibold text-purple-600">{visibleCount}</div>
                            <div className="text-gray-600">Visible Items</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="font-semibold text-yellow-600">{loadingCount}</div>
                            <div className="text-gray-600">Loading</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="font-semibold text-indigo-600">{memoryUsage}</div>
                            <div className="text-gray-600">Memory</div>
                        </div>
                    </div>
                )}

                <div className="mt-3 text-xs text-gray-600">
                    Features: Graph Integration • Intelligent Caching • Staggered Loading • Auto-refresh • Performance Monitoring
                </div>
            </div>*/}


            {/* Randloses NFT Grid mit Schatten-Effekten und Scroll-Buttons */}
            <div className="relative">
                {/* Schatten-Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

                {/* Scroll Buttons */}
                {canScrollLeft && (
                    <button
                        onClick={scrollLeft}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all duration-200 group"
                        aria-label="Scroll left"
                    >
                        <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {canScrollRight && (
                    <button
                        onClick={scrollRight}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all duration-200 group"
                        aria-label="Scroll right"
                    >
                        <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Scrollbare NFT Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-8 pt-8 scrollbar-hide scroll-smooth -mx-4 px-4"
                    style={{
                        scrollBehavior: 'smooth',
                        paddingLeft: '24px',
                        paddingRight: '24px'
                    }}
                >
                    {visibleItems.map((item: any, index: number) => (
                        <div
                            key={item.listingId}
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
            </div>

            {/* Optimized Performance Summary - Admin Only */}
            {isAdmin && items.length > 0 && (
                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        🚀 Performance Optimizations Active
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="font-medium text-green-700">Active Features:</div>
                            <ul className="text-green-600 ml-4 mt-1 space-y-1">
                                <li>• The Graph integration for real data</li>
                                <li>• NFTContext smart caching</li>
                                <li>• Staggered rendering optimization</li>
                                <li>• Image preloading & background updates</li>
                            </ul>
                        </div>
                        <div>
                            <div className="font-medium text-blue-700">Live Stats:</div>
                            <ul className="text-blue-600 ml-4 mt-1 space-y-1">
                                <li>• {items.length} total items • {cachedCount} cached</li>
                                <li>• {visibleCount}/{items.length} rendered • {loadingCount} loading</li>
                                <li>• Memory usage: {memoryUsage}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Optimized CSS Animation Styles */}
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
                
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* Internet Explorer 10+ */
                    scrollbar-width: none;  /* Firefox */
                }
                
                .scrollbar-hide::-webkit-scrollbar { 
                    display: none;  /* Safari and Chrome */
                }
            `}</style>
        </div>
    );
}

export default ActiveItemsList;
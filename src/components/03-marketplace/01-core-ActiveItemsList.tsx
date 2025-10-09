"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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

    // Get search term from URL
    const searchParams = useSearchParams();
    const urlSearchTerm = searchParams.get('search') || '';

    // Scroll state and refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Filter and sort state
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: urlSearchTerm,
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    // Update searchTerm when URL changes
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            searchTerm: urlSearchTerm
        }));
    }, [urlSearchTerm]);

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
    const safeItems = items ?? []; // <- Guard

    // Restored more responsive auto-refresh
    const lastRefreshTime = useRef<number>(Date.now());
    const REFRESH_THROTTLE_MS = 5000; // 5 seconds - more responsive
    const STATS_THROTTLE_MS = 1000; // 1 second for stats changes

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {

                // Only refetch if it's been a significant amount of time (2+ minutes)
                // Let the stats system handle immediate updates via events
                const now = Date.now();
                if (now - lastRefreshTime.current > 120000) { // 2 minutes instead of 5 seconds

                    lastRefreshTime.current = now;
                    if (refetch) refetch();
                }
            }
        };

        const handleFocus = () => {
            // Same logic for focus events - only refetch after long periods
            const now = Date.now();
            if (now - lastRefreshTime.current > 120000) { // 2 minutes

                lastRefreshTime.current = now;
                if (refetch) refetch();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [refetch]);

    // More responsive storage change listening
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Only refresh on wallet-related storage changes
            if (e.key && (e.key.includes('wallet') || e.key.includes('connect')) && refetch) {

                const now = Date.now();
                lastRefreshTime.current = now;
                refetch();
            }
            // For NFT stats updates, let the custom event system handle it
            // Don't trigger full marketplace refetch for stats changes
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [refetch]);

    // Convert items to filterable format (already enriched with NFT context data)
    const filterableItems: FilterableNFTItem[] = useMemo(() => {
        const mapped = safeItems.map((item: any) => ({
            contractAddress: item.nftAddress, // Map nftAddress to contractAddress for filter interface
            nftAddress: item.nftAddress, // Keep nftAddress for NFTCard
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
            symbol: item.symbol,
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

        return mapped;
    }, [safeItems]);

    // Apply filters and sorting
    const { filteredItems, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters,
        sort
    );

    // Performance monitoring for admin
    const performanceData = useNFTPerformance();
    const cachedCount = performanceData.total || 0;
    const { loadingCount } = performanceData;

    useEffect(() => {
        setIsClient(true);

        // Mark page as visited to prevent animation on back navigation ⚡
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('activeItemsList-visited', 'true');
        }
    }, []);

    // Optimized image URLs for preloading - increase to 12 for better initial UX
    const imageUrls = useMemo(() => {
        return filteredItems.slice(0, 12)
            .map(item => item.imageUrl)
            .filter(Boolean) as string[];
    }, [filteredItems]);

    // Staggered rendering for better currency conversion performance
    const [visibleCount, setVisibleCount] = useState(12); // Increase initial visible count

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
            // Increased loading speed for better UX
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 6, filteredItems.length));
            }, 200); // Faster loading - 200ms instead of 300ms
            return () => clearTimeout(timer);
        }
    }, [filteredItems.length, visibleCount]);

    // Reset visible count only when the number of filtered items changes significantly
    useEffect(() => {
        setVisibleCount(Math.min(12, filteredItems.length)); // Increase initial load to 12 NFTs
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
        <div className="pt-8 pb-2 w-full">
            <ImagePreloader imageUrls={imageUrls} priority={true} />

            {/* NFT Filter Bar - Fixed position with spacer */}
            <NFTFilterBar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                currentSort={sort}
                totalItems={totalCount}
                filteredCount={filteredCount}
            />

            {/* Spacer for fixed FilterBar - approximate height */}
            <div className="h-20"></div>

            {/* Enhanced Header with Performance Stats*/}
            <div className="max-w-7xl mx-auto px-6">
                {!isAdmin && (
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
                        </div>

                        {/* Performance Indicators - Admin Only */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="font-semibold text-blue-600">{safeItems.length}</div>
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
                                <div className="font-semibold text-indigo-600">{performanceData.fresh}/{performanceData.total}</div>
                                <div className="text-gray-600">Memory</div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                            Features: Graph Integration • Intelligent Caching • Staggered Loading • Auto-refresh • Performance Monitoring
                        </div>
                    </div>
                )}
            </div>

            {/* Randloses NFT Grid mit Scroll-Buttons */}
            <div className="relative overflow-visible pt-8 pb-4">
                {/* Scroll Buttons - hidden on mobile */}
                {canScrollLeft && (
                    <button
                        onClick={scrollLeft}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-20 h-24 bg-primary rounded-lg shadow-lg border-2 border-secondary border border-black flex-col items-center justify-center hover:shadow-xl transition-all duration-200 group p-3"
                        aria-label="Scroll left"
                        style={{
                            border: '2px solid #1273EB',
                            outline: '1px solid black'
                        }}
                    >
                        {/* Lightbulb Icon oben */}
                        <Image
                            src="/media/only-lightbulb.png"
                            alt="Lightbulb"
                            width={32}
                            height={32}
                            className="mb-2 group-hover:scale-110 transition-transform duration-200"
                            priority
                        />
                        {/* Pfeil unten */}
                        <svg className="w-6 h-6 text-black group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {canScrollRight && (
                    <button
                        onClick={scrollRight}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-20 h-24 bg-primary rounded-lg shadow-lg flex-col items-center justify-center hover:shadow-xl transition-all duration-200 group p-3"
                        aria-label="Scroll right"
                        style={{
                            border: '2px solid #1273EB',
                            outline: '1px solid black'
                        }}
                    >
                        {/* Lightbulb Icon oben */}
                        <Image
                            src="/media/only-lightbulb.png"
                            alt="Lightbulb"
                            width={32}
                            height={32
                            }
                            className="mb-2 group-hover:scale-110 transition-transform duration-200"
                            priority
                        />
                        {/* Pfeil unten */}
                        <svg className="w-6 h-6 text-black group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Scrollbare NFT Container - Edge-to-edge */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 pb-8 pt-8 scrollbar-hide scroll-smooth pl-8 pr-6"
                    style={{
                        scrollBehavior: 'smooth',
                        paddingLeft: '32px', // Erhöht für Hover-Effekte der ersten Karte
                        paddingRight: '24px',
                        paddingBottom: '32px', // Padding für Hover-Schatten unten
                        // Verhindert das Abschneiden beim Hover
                        overflowX: 'auto',
                        overflowY: 'visible'
                    }}
                >
                    {visibleItems.map((item: any, index: number) => {
                        // Check if page was already visited (prevent animation on back navigation)
                        const wasVisited = typeof window !== 'undefined' && sessionStorage.getItem('activeItemsList-visited') === 'true';

                        return (
                            <div
                                key={item.listingId}
                                className="flex-shrink-0 w-60"
                                style={{
                                    // Only animate on FIRST visit, instant on back navigation! 🚀
                                    animationName: wasVisited ? 'none' : 'fadeInUp',
                                    animationDuration: wasVisited ? '0s' : '0.5s',
                                    animationTimingFunction: 'ease-out',
                                    animationFillMode: 'forwards',
                                    animationDelay: wasVisited ? '0ms' : `${index * 80}ms`,
                                    opacity: wasVisited ? 1 : undefined // Instant opacity if visited
                                }}
                            >
                                <NFTCard
                                    contractAddress={item.contractAddress || item.nftAddress}
                                    tokenId={item.tokenId}
                                    listingId={item.listingId}
                                    price={item.price}
                                    seller={item.seller}
                                    buyer={item.buyer}
                                    isListed={item.isListed}
                                    desiredNftAddress={item.desiredNftAddress}
                                    desiredTokenId={item.desiredTokenId}
                                    priority={index < 12} // More images get priority loading
                                    enableInsights={true} // Enable insights for all NFTs in the active items list
                                />
                            </div>
                        );
                    })}

                    {/* Progressive Loading Indicator */}
                    {visibleCount < filteredItems.length && (
                        <div className="flex-shrink-0 w-60">
                            <div className="h-72 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <div className="text-sm font-medium text-gray-600">Loading more items...</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {filteredItems.length - visibleCount} remaining
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Monitoring Section - Admin Only */}
            {!isAdmin && safeItems.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 mt-8">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            ⚡ Performance Optimizations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-green-700">Caching:</div>
                                <ul className="text-green-600 ml-4 mt-1 space-y-1">
                                    <li>• Image preloading & caching</li>
                                    <li>• NFT data smart caching</li>
                                    <li>• Intersection Observer lazy loading</li>
                                </ul>
                            </div>
                            <div>
                                <div className="font-medium text-blue-700">Performance:</div>
                                <ul className="text-blue-600 ml-4 mt-1 space-y-1">
                                    <li>• Throttled auto-refresh (30s)</li>
                                    <li>• Optimized glitter effects</li>
                                    <li>• Progressive loading (first 12 items)</li>
                                </ul>
                            </div>
                            <div>
                                <div className="font-medium text-purple-700">Data:</div>
                                <ul className="text-purple-600 ml-4 mt-1 space-y-1">
                                    <li>• The Graph integration</li>
                                    <li>• Total items: {filteredItems.length}</li>
                                    <li>• Visible: {Math.min(visibleCount, filteredItems.length)}</li>
                                </ul>
                            </div>
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
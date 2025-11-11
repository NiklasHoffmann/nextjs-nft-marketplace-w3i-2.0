"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAccount } from "wagmi";
import { getAdminAddressesList } from '@/utils';
import { useActiveItems, useNFTPerformance } from '@/hooks';
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters';
import { useNFTContext } from '@/contexts/NFTContext';
import { ImagePreloader, NFTScrollList } from '@/components';
import type { NFTScrollItem } from './NFTScrollList';
import type { NFTFilters, NFTSortOptions } from './NFTFilterBar';
import type { FilterableNFTItem } from '@/hooks/nfts/useNFTFilters';

interface ActiveItemsListProps {
    externalFilters?: NFTFilters;
    externalSort?: NFTSortOptions;
}

export function ActiveItemsList({ externalFilters, externalSort }: ActiveItemsListProps = {}) {
    const [isClient, setIsClient] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Get search term from URL
    const searchParams = useSearchParams();
    const urlSearchTerm = searchParams.get('search') || '';

    // Filter and sort state - use external if provided
    const [localFilters, setLocalFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: urlSearchTerm,
    });
    const [localSort, setLocalSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    // Use external filters/sort if provided, otherwise use local
    const filters = externalFilters || localFilters;
    const sort = externalSort || localSort;

    // Update searchTerm when URL changes
    useEffect(() => {
        setLocalFilters(prev => ({
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

        // Mark page as visited to prevent animation on back navigation ?
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

    // Convert items to NFTScrollItem format
    const convertToScrollItems = useCallback((items: any[]): NFTScrollItem[] => {
        return items.map((item: any) => ({
            nftAddress: item.contractAddress || item.nftAddress,
            tokenId: item.tokenId,
            price: item.price,
            isListed: item.isListed,
            listingId: item.listingId,
            seller: item.seller,
            buyer: item.buyer,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId
        }));
    }, []);

    useEffect(() => {
        if (filteredItems.length > 0 && visibleCount < filteredItems.length) {
            // Gradually show more items to reduce simultaneous currency conversions
            // Increased loading speed for better UX
            const timer = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 6, filteredItems.length));
            }, 200); // Faster loading - 200ms instead of 300ms
            return () => clearTimeout(timer);
        }
        return undefined;
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

    // Generate dynamic title based on filters
    const getPageTitle = () => {
        const parts: string[] = [];

        // Categories
        if (filters.categories && filters.categories.length > 0) {
            if (filters.categories.length === 1) {
                parts.push(`${filters.categories[0]}`);
            } else {
                parts.push(`${filters.categories.map(c => c).join(', ')}`);
            }
        }

        // Rarities
        if (filters.rarities && filters.rarities.length > 0) {
            if (filters.rarities.length === 1) {
                const rarityMap: Record<string, string> = {
                    'common': 'COMMON',
                    'uncommon': 'UNCOMMON',
                    'rare': 'RARE',
                    'epic': 'EPIC',
                    'legendary': 'LEGENDARY'
                };
                const firstRarity = filters.rarities[0];
                if (firstRarity) {
                    parts.push(`Seltenheit: ${rarityMap[firstRarity] || firstRarity.toUpperCase()}`);
                }
            } else {
                parts.push(`Seltenheiten: ${filters.rarities.map((r: string) => r.toUpperCase()).join(', ')}`);
            }
        }

        // Search term
        if (filters.searchTerm && filters.searchTerm.trim()) {
            parts.push(`Suche: "${filters.searchTerm}"`);
        }

        // Default if no filters
        if (parts.length === 0) {
            return 'Recently Listed';
        }

        return parts.join(' • ');
    };

    return (
        <div className="w-full md:pl-16 pl-10">
            <ImagePreloader imageUrls={imageUrls} priority={true} />

            {/* Dynamic Page Title */}
            <div className="max-w-7xl mx-auto px-12 mb-6">
                <h1 className="text-4xl font-bold text-gray-900">
                    {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-600 pl-2 mt-2">
                    {filteredCount} {filteredCount === 1 ? 'NFT' : 'NFTs'}
                </p>
            </div>

            {/* Enhanced Header with Performance Stats*/}
            <div className="px-8">
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
                                            ? Refresh
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

            {/* NFT Scroll List with View All */}
            <NFTScrollList
                items={convertToScrollItems(visibleItems)}
                enableInsights={true}
                showStats={true}
                priority={false}
                enableViewAll={true}
                padding="pl-8 pr-6 pb-4 pt-4"
                emptyMessage="No NFTs found"
            />

            {/* Performance Monitoring Section - Admin Only */}
            {!isAdmin && safeItems.length > 0 && (
                <div className="px-8 mt-8">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            ? Performance Optimizations
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

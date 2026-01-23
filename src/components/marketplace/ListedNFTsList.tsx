
"use client";

/**
 * ListedNFTsList - MongoDB-powered marketplace listings
 * 
 * Displays all active NFT listings from the marketplace.
 * Uses MongoDB backend for 60x faster performance than TheGraph.
 * 
 * Data Source: MongoDB (via useMarketplaceItems hook)
 * Features: Server-side filtering, pagination (20 items/page), sorting
 * Performance: ~65ms vs V1's 3-5s load time
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMarketplaceItems } from '@/hooks';
import { useMarketplaceLayout } from '@/app/marketplace/layout';
import { ImagePreloader } from '@/components/nft';
import { NFTGallery } from '@/components/shared';
import { RefreshButton } from '@/components/ui';
import { CheckCircleIcon, SpinnerIcon } from '@/components/icons';
import type {
    NFTFilters,
    NFTSortOptions,
    NFTScrollItem
} from '@/types/marketplace';

const AVAILABLE_CATEGORIES = [
    'Art', 'DigitalTwin', 'Collectible', 'Gaming', 'Music', 'Sports', 'Virtual Real Estate', 'Utility'
];

interface ListedNFTsListProps {
    externalFilters?: NFTFilters;
    externalSort?: NFTSortOptions;
    onStatsUpdate?: (stats: { total: number; filtered: number }) => void;
}

interface ListedNFTsListPropsExtended extends ListedNFTsListProps {
    onFiltersChange?: (filters: NFTFilters) => void;
}

export function ListedNFTsList({ externalFilters, externalSort, onStatsUpdate, onFiltersChange }: ListedNFTsListPropsExtended = {}) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showReloadNotification, setShowReloadNotification] = useState(false);
    const [cachedItems, setCachedItems] = useState<NFTScrollItem[]>([]);

    // Get layout context for total items tracking
    const layoutContext = useMarketplaceLayout();

    // Get search term from URL
    const searchParams = useSearchParams();
    const urlSearchTerm = searchParams?.get('search') || '';

    // Filter and sort state
    const [localFilters, setLocalFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: urlSearchTerm,
    });
    const [localSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    const filters = externalFilters || localFilters;
    const sort = externalSort || localSort;

    // Category toggle handler
    const toggleCategory = (category: string) => {
        const newCategories = filters.categories?.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...(filters.categories || []), category];

        const newFilters = { ...filters, categories: newCategories };

        if (onFiltersChange) {
            // Update parent filters if callback provided
            onFiltersChange(newFilters);
        } else {
            // Update local filters
            setLocalFilters(newFilters);
        }
    };

    useEffect(() => {
        if (!externalFilters) {
            setLocalFilters(prev => ({ ...prev, searchTerm: urlSearchTerm }));
        }
    }, [urlSearchTerm, externalFilters]);

    // Map V1 sort format to V2 API format
    const sortByMapping: Record<NFTSortOptions['field'], 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created'> = {
        price: 'price',
        rating: 'rating',
        views: 'views',
        likes: 'likes',
        watchlistCount: 'watchlistCount',
        name: 'name',
        created: 'created',
        rarity: 'name',
        tokenId: 'created'
    };

    // Use MongoDB-powered hook
    const {
        items,
        loading,
        error,
        pagination,
        refetch,
        loadMore,
    } = useMarketplaceItems({
        search: filters.searchTerm,
        minPrice: filters.priceMin?.toString(),
        maxPrice: filters.priceMax?.toString(),
        category: filters.categories.length > 0 ? filters.categories : undefined,
        rarity: filters.rarities.length > 0 ? filters.rarities : undefined,
        minRating: filters.minRating,
        minViews: filters.minViews,
        minLikes: filters.minLikes,
        minWatchlistCount: filters.minWatchlistCount,
        sortBy: sortByMapping[sort.field] || 'price',
        sortOrder: sort.direction,
        limit: 50, // Increased from 20 to 50 for faster initial load (matches Collections)
        autoFetch: true,
    });

    // Convert MongoDB items to NFTScrollItem format
    // Note: Intentionally NOT depending on 'loading' to avoid re-renders during sort operations
    const scrollItems: NFTScrollItem[] = useMemo(() => {
        return items
            .filter(item => item.contractAddress && item.contractAddress !== 'undefined' && item.contractAddress.trim() !== '')
            .map((item) => ({
                contractAddress: item.contractAddress.toLowerCase(),
                tokenId: item.tokenId,
                price: (item as any).price || item.marketplace?.price || undefined,
                isListed: (item as any).isListed ?? item.marketplace?.isListed ?? false,
                listingId: (item as any).listingId || item.marketplace?.listingId || undefined,
                seller: (item as any).seller || item.marketplace?.seller || undefined,
                buyer: (item as any).buyer || item.marketplace?.buyer || undefined,
                desiredContractAddress: (item as any).desiredContractAddress || item.marketplace?.desiredContractAddress || undefined,
                desiredTokenId: (item as any).desiredTokenId || item.marketplace?.desiredTokenId || undefined,
                metadata: item.metadata ? {
                    name: item.metadata.name,
                    description: item.metadata.description,
                    image: item.metadata.image,
                    animationUrl: item.metadata.animationUrl,
                    externalUrl: item.metadata.externalUrl,
                    attributes: item.metadata.attributes
                } : undefined,
                insights: item.insights ? {
                    customTitle: item.insights.customTitle || undefined,
                    category: item.insights.category || undefined,
                    tags: item.insights.tags || undefined,
                    rarity: item.insights.rarity || undefined,
                    cardDescriptions: item.insights.cardDescriptions || undefined,
                    projectDescriptions: item.insights.projectDescriptions || undefined,
                    functionalitiesDescriptions: item.insights.functionalitiesDescriptions || undefined,
                    projectWebsite: item.insights.projectWebsite || undefined,
                    projectTwitter: item.insights.projectTwitter || undefined,
                    projectDiscord: item.insights.projectDiscord || undefined,
                    partnerships: item.insights.partnerships || undefined
                } : undefined,
                contract: item.contract ? {
                    name: item.contract.name,
                    symbol: item.contract.symbol,
                    totalSupply: item.contract.totalSupply,
                    owner: item.contract.owner,
                    tokenURI: item.contract.tokenURI,
                    approved: item.contract.approvedAddress || null,
                    ownerBalance: item.contract.ownerBalance
                } : undefined
            } as NFTScrollItem));
    }, [items]);

    // Preload images
    const imageUrls = useMemo(() => {
        return items.map(item => item.metadata?.image).filter((url): url is string => !!url);
    }, [items]);

    // Cache items to prevent empty state flash during refetch
    useEffect(() => {
        if (scrollItems.length > 0) {
            setCachedItems(scrollItems);
        }
    }, [scrollItems]);

    // Display cached items while loading if available, otherwise show current items
    const displayItems = loading && cachedItems.length > 0 && scrollItems.length === 0 ? cachedItems : scrollItems;

    // Track when first items arrive to hide initial loading state
    useEffect(() => {
        // Only set to false when we actually have items loaded successfully
        if (items.length > 0 && !loading) {
            setIsInitialLoad(false);
        }
    }, [items.length, loading]);

    // Update layout context with total/filtered counts
    useEffect(() => {
        if (layoutContext && pagination) {
            layoutContext.setFilteredCount(items.length);
        }
    }, [items.length, pagination, layoutContext]);

    // Listen for new listings and show notification
    useEffect(() => {
        const handleDataInvalidation = (event: Event) => {
            const customEvent = event as CustomEvent<{ type: string }>;
            const eventType = customEvent.detail?.type;

            if (eventType === 'listing-created') {
                setShowReloadNotification(true);

                // Hide notification after auto-reload completes (3s delay + 2s display)
                setTimeout(() => {
                    setShowReloadNotification(false);
                }, 5000);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('dataInvalidation', handleDataInvalidation);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('dataInvalidation', handleDataInvalidation);
            }
        };
    }, []);

    // Infinite Scroll
    useEffect(() => {
        if (!loadMoreRef.current || !pagination?.hasMore || loading || isLoadingMore.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting && pagination.hasMore && !loading && !isLoadingMore.current) {
                    isLoadingMore.current = true;
                    loadMore().finally(() => { isLoadingMore.current = false; });
                }
            },
            { rootMargin: '200px', threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);
        return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
    }, [loadMore, pagination?.hasMore, loading]);

    // Auto-load all items when total is <= 200 for optimal sorting
    // Only loads once per filter change when hasMore is true
    useEffect(() => {
        const shouldAutoLoad =
            pagination &&
            pagination.hasMore &&
            pagination.total <= 200 &&
            items.length > 0 &&
            items.length < pagination.total &&
            !isLoadingMore.current;

        if (!shouldAutoLoad) return;

        const loadAllFiltered = async () => {
            isLoadingMore.current = true;
            try {
                while (pagination?.hasMore && items.length < pagination.total) {
                    const prevLength = items.length;
                    await loadMore();

                    // Break if no new items were loaded (prevent infinite loop)
                    if (items.length === prevLength) {
                        break;
                    }
                }
            } finally {
                isLoadingMore.current = false;
            }
        };

        loadAllFiltered();
    }, [pagination?.total, pagination?.hasMore, items.length, loadMore]);

    // Remove isClient check to prevent title flickering - component is client-only already
    // This eliminates the flash of smaller title before hydration

    return (
        <div className="w-full">
            <ImagePreloader imageUrls={imageUrls} priority={true} />

            {/* New Listing Notification */}
            {showReloadNotification && (
                <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Neues Listing wird geladen...</span>
                </div>
            )}

            {/* Header with Categories and Active Filters */}
            <div className="sticky top-[66px] z-10 bg-white border-b border-gray-200 mb-8 md:pl-16 pl-10">
                <div className="px-8 py-3">
                    {/* Category Selection */}
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_CATEGORIES.map((category) => {
                                const isSelected = filters.categories?.includes(category);
                                return (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Filter Pills */}
                    {(filters.searchTerm ||
                        (filters.rarities && filters.rarities.length > 0) ||
                        (filters.priceMin && filters.priceMin > 0) ||
                        (filters.priceMax && filters.priceMax > 0) ||
                        (filters.minLikes && filters.minLikes > 0) ||
                        (filters.minViews && filters.minViews > 0) ||
                        (filters.minRating && filters.minRating > 0) ||
                        (filters.minWatchlistCount && filters.minWatchlistCount > 0)) && (
                            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100">
                                {/* Search Term */}
                                {filters.searchTerm && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span className="text-sm font-medium">{filters.searchTerm}</span>
                                    </div>
                                )}

                                {/* Rarity Pills */}
                                {filters.rarities?.map((rarity) => {
                                    const rarityColors = {
                                        legendary: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                        epic: 'bg-purple-50 text-purple-700 border-purple-200',
                                        rare: 'bg-blue-50 text-blue-700 border-blue-200',
                                        uncommon: 'bg-green-50 text-green-700 border-green-200',
                                        common: 'bg-gray-50 text-gray-700 border-gray-200'
                                    };
                                    return (
                                        <div
                                            key={`rar-${rarity}`}
                                            className={`px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${rarityColors[rarity as keyof typeof rarityColors] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                                        >
                                            {rarity}
                                        </div>
                                    );
                                })}

                                {/* Price Range */}
                                {(filters.priceMin || filters.priceMax) && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md border border-green-200">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs font-medium">
                                            {filters.priceMin && filters.priceMax
                                                ? `${filters.priceMin} - ${filters.priceMax} ETH`
                                                : filters.priceMin
                                                    ? `≥ ${filters.priceMin} ETH`
                                                    : `≤ ${filters.priceMax} ETH`}
                                        </span>
                                    </div>
                                )}

                                {/* Min Likes */}
                                {filters.minLikes && filters.minLikes > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-md border border-red-200">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium">≥ {filters.minLikes} likes</span>
                                    </div>
                                )}

                                {/* Min Views */}
                                {filters.minViews && filters.minViews > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-300">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium">≥ {filters.minViews} views</span>
                                    </div>
                                )}

                                {/* Min Rating */}
                                {filters.minRating && filters.minRating > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-xs font-medium">≥ {filters.minRating} rating</span>
                                    </div>
                                )}

                                {/* Min Watchlist Count */}
                                {filters.minWatchlistCount && filters.minWatchlistCount > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-200">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs font-medium">≥ {filters.minWatchlistCount} watchlist</span>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-8 mb-6 md:pl-16 pl-10">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800">Error: {error}</p>
                    </div>
                </div>
            )}

            {/* NFT Gallery */}
            <div className="min-h-[288px] md:pl-16 pl-10">
                <NFTGallery
                    items={displayItems}
                    title="Utilities"
                    largeTitle={true}
                    subtitle={
                        items.length > 0 ? (
                            <>
                                Showing {items.length} of {pagination?.total || 0} Utilities
                                {pagination?.hasMore && <span className="text-gray-400 ml-1">(scroll for more)</span>}
                            </>
                        ) : (
                            `${pagination?.total || 0} Utilities listed`
                        )
                    }
                    actions={
                        <RefreshButton
                            onClick={refetch}
                            loading={loading}
                            label="Refresh"
                            loadingLabel="Refreshing..."
                        />
                    }
                    loading={isInitialLoad}
                    loadingCount={12}
                    enableInsights={true}
                    showStats={true}
                    priority={true}
                    padding="pr-6 pb-4 pt-4"
                    emptyMessage="No active listings found"
                    enableViewAll={true}
                />

            </div>

            {/* Infinite Scroll Trigger - always render to prevent layout shift */}
            <div ref={loadMoreRef} className="h-px opacity-0 pointer-events-none md:pl-16 pl-10" />
        </div>
    );
}

export default ListedNFTsList;


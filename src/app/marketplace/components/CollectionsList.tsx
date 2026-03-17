"use client";

import React, { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketplaceCollections } from '@/hooks';
import { useHorizontalScroll } from '@/hooks';
import { ScrollButtons, RefreshButton } from '@/components/ui';
import { LoadingState } from '@/components/core/Loading';
import { CollectionCard } from './CollectionCard';
import type { NFTSortOptions, NFTFilters } from '@/types/marketplace';

function CollectionCardSkeleton() {
    return (
        <div className="transform-gpu flex-shrink-0 w-60">
            <div className="border border-black overflow-hidden h-[22.5rem] relative rounded-lg shadow-xl bg-white">
                <div className="relative h-full overflow-hidden rounded-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />

                    <div className="relative z-10 h-full p-1 flex flex-col gap-1">
                        <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm p-2 rounded-md border border-gray-200/70 shadow-sm">
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                            <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                        </div>

                        <div className="flex-1 min-h-0 grid grid-cols-2 gap-1">
                            <div className="rounded-md bg-white/90 border border-gray-200/70 animate-pulse" />
                            <div className="rounded-md bg-white/90 border border-gray-200/70 animate-pulse" />
                            <div className="rounded-md bg-white/90 border border-gray-200/70 animate-pulse" />
                            <div className="rounded-md bg-white/90 border border-gray-200/70 animate-pulse" />
                        </div>

                        <div className="flex-shrink-0 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div className="h-5 bg-gray-200 rounded w-16" />
                                <div className="h-5 bg-gray-200 rounded w-20" />
                                <div className="h-5 bg-gray-200 rounded w-10 ml-auto" />
                            </div>
                            <div className="h-7 bg-gray-200 rounded w-full" />
                            <div className="h-6 bg-gray-200 rounded w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CollectionsListProps {
    currentSort: NFTSortOptions;
    onSortChange: (sort: NFTSortOptions) => void;
    filters?: NFTFilters;
}

/**
 * CollectionsList V2 - MongoDB-powered collection display
 * 
 * Refactored to use extracted components:
 * - CollectionCard for individual cards
 * - useHorizontalScroll for scroll functionality
 * - useAdminStatus for admin checks
 * - Shared UI components (RefreshButton, AdminDebugPanel)
 */
export function CollectionsList({ currentSort, onSortChange: _onSortChange, filters }: CollectionsListProps) {
    const router = useRouter();

    // Horizontal scroll functionality
    const {
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        scroll,
        checkScrollPosition
    } = useHorizontalScroll({ scrollAmount: 400 });

    // Map V1 sort format to V2 collections API
    const sortByMapping: Record<NFTSortOptions['field'], 'floorPrice' | 'totalValue' | 'totalListed' | 'name'> = {
        price: 'totalValue',
        created: 'totalListed',
        rating: 'totalListed',
        views: 'totalListed',
        likes: 'totalValue',
        watchlistCount: 'totalValue',
        name: 'name',
        rarity: 'name',
        tokenId: 'name'
    };

    // Fetch collections from MongoDB
    const {
        collections,
        loading,
        error,
        summary,
        refetch,
    } = useMarketplaceCollections({
        sortBy: sortByMapping[currentSort.field] || 'floorPrice',
        sortOrder: currentSort.direction,
        limit: 50,
        autoFetch: true,
    });

    // Events are handled by MarketplaceItemsContext automatically

    // Apply client-side filters
    const filteredCollections = useMemo(() => {
        if (!filters) return collections;

        return collections.filter((collection: any) => {
            if (filters.minSupply !== undefined && collection.insights?.totalSupply && collection.insights.totalSupply < filters.minSupply) {
                return false;
            }
            if (filters.minListedItems !== undefined && collection.itemCount < filters.minListedItems) {
                return false;
            }
            if (filters.minFloorPrice !== undefined && collection.floorPrice) {
                const floorPrice = typeof collection.floorPrice === 'number'
                    ? collection.floorPrice
                    : parseFloat(collection.floorPrice);
                if (floorPrice < filters.minFloorPrice) {
                    return false;
                }
            }
            return true;
        });
    }, [collections, filters]);

    // Handle collection click
    const handleCollectionClick = useCallback((contractAddress: string) => {
        if (!contractAddress) {
            return;
        }
        router.push(`/collection/${contractAddress}`);
    }, [router]);

    // Re-check scroll position when collections change
    useEffect(() => {
        checkScrollPosition();
    }, [filteredCollections.length, checkScrollPosition]);

    // Loading state
    if (loading && collections.length === 0) {
        return (
            <div className="w-full md:pl-16 pl-10">
                <div className="px-8 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
                            <LoadingState size="xs" variant="inline" message="Loading collections..." />
                        </div>
                    </div>
                </div>

                {/* Skeleton cards */}
                <div className="relative overflow-visible pb-4">
                    <div className="flex gap-6 pb-4 pt-4 pl-8 pr-6">
                        {Array.from({ length: 4 }, (_, i) => (
                            <CollectionCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center text-red-500">Error: {error}</div>
            </div>
        );
    }

    // Empty state
    if (collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center">No collections found</div>
            </div>
        );
    }

    return (
        <div className="w-full md:pl-16 pl-10">
            {/* Header */}
            <div className="px-8 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Utility Collections</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Showing {filteredCollections.length} of {summary?.totalCollections || collections.length} Collections
                        </p>
                    </div>
                    <RefreshButton onClick={refetch} loading={loading} />
                </div>
            </div>

            {/* Collections Grid with Horizontal Scroll */}
            <div className="relative overflow-visible pb-4 min-h-[400px]">
                <ScrollButtons
                    canScrollLeft={canScrollLeft}
                    canScrollRight={canScrollRight}
                    onScrollLeft={() => scroll('left')}
                    onScrollRight={() => scroll('right')}
                />

                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 pb-4 pt-4 scrollbar-hide scroll-smooth pl-8 pr-6 transition-all duration-300"
                    style={{
                        scrollBehavior: 'smooth',
                        paddingBottom: '50px',
                        overflowX: 'auto',
                        overflowY: 'visible',
                    }}
                >
                    {filteredCollections.map((collection, index) => (
                        <CollectionCard
                            key={collection.contractAddress || `collection-${index}`}
                            collection={collection}
                            onClick={handleCollectionClick}
                        />
                    ))}
                </div>
            </div>



            {/* CSS for scrollbar-hide */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

export default CollectionsList;

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCollectionsV2 } from '@/hooks/marketplace/useMarketplaceV2';
import { useAdminStatus, useHorizontalScroll } from '@/hooks';
import { ScrollButtons, RefreshButton, AdminDebugPanel } from '@/components/ui';
import { CollectionCard } from './CollectionCard';
import type { NFTSortOptions, NFTFilters } from '@/types/marketplace';

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
export function CollectionsList({ currentSort, onSortChange, filters }: CollectionsListProps) {
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { isAdmin } = useAdminStatus();

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
    } = useCollectionsV2({
        sortBy: sortByMapping[currentSort.field] || 'floorPrice',
        sortOrder: currentSort.direction,
        limit: 50,
        autoFetch: true,
    });

    // Apply client-side filters
    const filteredCollections = useMemo(() => {
        if (!filters) return collections;

        return collections.filter((collection) => {
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
            console.error('CollectionsList: Cannot navigate - contractAddress is undefined');
            return;
        }
        router.push(`/nft/${contractAddress}`);
    }, [router]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Re-check scroll position when collections change
    useEffect(() => {
        checkScrollPosition();
    }, [filteredCollections, checkScrollPosition]);

    // Loading state
    if (!isClient || (loading && collections.length === 0)) {
        return (
            <div className="pt-8 pb-2 w-full">
                <div className="md:pl-16 pl-10">
                    <div className="max-w-7xl mx-auto px-12 mb-6">
                        <h1 className="text-4xl font-bold text-gray-900">Collections</h1>
                        <p className="text-sm text-gray-600 pl-2 mt-2">Loading collections data...</p>
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
        <div className="pt-8 pb-2 w-full">
            <div className="md:pl-16 pl-10">
                {/* Header */}
                <div className="max-w-7xl mx-auto px-12 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Collections</h1>
                            <p className="text-sm text-gray-600 pl-2 mt-2">
                                {filteredCollections.length} {filteredCollections.length === 1 ? 'Collection' : 'Collections'}
                                {filters && filteredCollections.length !== collections.length && (
                                    <span className="text-blue-600"> (von {collections.length} total)</span>
                                )}
                                {summary && (
                                    <span className="ml-3 text-green-600">• Total Value: {summary.totalValue} ETH</span>
                                )}
                            </p>
                        </div>
                        <RefreshButton onClick={refetch} loading={loading} />
                    </div>
                </div>

                {/* Collections Grid with Horizontal Scroll */}
                <div className="relative overflow-visible pb-4">
                    <ScrollButtons
                        canScrollLeft={canScrollLeft}
                        canScrollRight={canScrollRight}
                        onScrollLeft={() => scroll('left')}
                        onScrollRight={() => scroll('right')}
                    />

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 pb-4 pt-4 scrollbar-hide scroll-smooth pl-8 pr-6"
                        style={{
                            scrollBehavior: 'smooth',
                            paddingBottom: '50px',
                            overflowX: 'auto',
                            overflowY: 'visible',
                        }}
                    >
                        {filteredCollections.map((collection, index) => (
                            <CollectionCard
                                key={collection.contractAddress || `unknown-${index}`}
                                collection={collection}
                                onClick={handleCollectionClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Admin Debug Panel */}
                {summary && (
                    <div className="max-w-7xl mx-auto px-12 mt-4">
                        <AdminDebugPanel isAdmin={isAdmin}>
                            <p>🔍 Debug: {summary.totalCollections} collections total</p>
                            <p>📊 Listed: {summary.totalListedNFTs} items</p>
                            <p>💰 Total Value: {summary.totalValue} ETH</p>
                            <p>⚡ Data Source: MongoDB /api/marketplace/collections</p>
                        </AdminDebugPanel>
                    </div>
                )}
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

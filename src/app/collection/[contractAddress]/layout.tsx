'use client';

import React, { use, useState, useCallback, useMemo } from 'react';
import { useCollections } from '@/contexts/collections/CollectionsContext';
import type { Collection } from '@/contexts/collections/CollectionsService';
import { CollectionHeader } from './components';
import { NFTFilterSidebar } from '@/components';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { CollectionLayoutContext } from './context';

export default function CollectionLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ contractAddress: string }>;
}) {
    const { contractAddress: encodedAddress } = use(params);
    const contractAddress = decodeURIComponent(encodedAddress);
    const { collections } = useCollections();

    // Find collection - memoized to prevent unnecessary re-renders when collections array reference changes
    const collection = useMemo(() =>
        collections.find(
            (col: Collection) => col.contractAddress.toLowerCase() === contractAddress.toLowerCase()
        ),
        [collections, contractAddress]
    );

    // Filter and Sort State
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: '',
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });
    const [filteredCount, setFilteredCount] = useState(0);

    // Memoize callbacks to prevent child re-renders
    const handleFiltersChange = useCallback((newFilters: NFTFilters) => {
        setFilters(newFilters);
    }, []);

    const handleSortChange = useCallback((newSort: NFTSortOptions) => {
        setSort(newSort);
    }, []);

    // Calculate stats from collection - memoized to prevent recalculation on every render
    const collectionStats = useMemo(() => ({
        totalListings: collection?.itemCount || 0,
        totalVolume: collection?.totalValue || 0,
        avgPrice: collection?.averagePrice || 0,
        floorPrice: collection?.floorPrice || 0,
        floorPriceCurrency: collection?.floorPriceCurrency || null,
        totalViews: collection?.totalViews || 0,
        totalLikes: collection?.totalLikes || 0,
    }), [collection]);

    return (
        <CollectionLayoutContext.Provider value={{
            filters,
            sort,
            onFiltersChange: handleFiltersChange,
            onSortChange: handleSortChange,
            totalItems: collectionStats.totalListings,
            filteredCount,
            setFilteredCount,
        }}>
            <div className="min-h-screen bg-gray-50">
                <NFTFilterSidebar
                    onFiltersChange={handleFiltersChange}
                    onSortChange={handleSortChange}
                    currentSort={sort}
                    totalItems={collectionStats.totalListings}
                    filteredCount={filteredCount}
                />
                <main className="pt-[66px]">
                    <CollectionHeader
                        contractAddress={contractAddress}
                        contractName={collection?.contractName || ''}
                        contractSymbol={collection?.contractSymbol || ''}
                        totalListings={collectionStats.totalListings}
                        totalVolume={collectionStats.totalVolume}
                        avgPrice={collectionStats.avgPrice}
                        floorPrice={collectionStats.floorPrice}
                        floorPriceCurrency={collectionStats.floorPriceCurrency}
                        totalViews={collectionStats.totalViews}
                        totalLikes={collectionStats.totalLikes}
                    />
                    <div className="pt-[100px]">
                        {children}
                    </div>
                </main>
            </div>
        </CollectionLayoutContext.Provider>
    );
}

'use client';

import { ReactNode, useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { NFTFilterSidebar } from '@/components';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { MarketplaceLayoutContext } from './context';

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const urlSearchTerm = searchParams?.get('search') || '';

    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: urlSearchTerm,
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });
    const [filteredCount, setFilteredCount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // Sync URL search param with filters
    useEffect(() => {
        setFilters(prev => ({ ...prev, searchTerm: urlSearchTerm }));
    }, [urlSearchTerm]);

    // Stable callback references - memoized to prevent child re-renders
    const handleFiltersChange = useCallback((newFilters: NFTFilters) => {
        setFilters(newFilters);
    }, []);

    const handleSortChange = useCallback((newSort: NFTSortOptions) => {
        setSort(newSort);
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        filters,
        sort,
        onFiltersChange: handleFiltersChange,
        onSortChange: handleSortChange,
        totalItems,
        filteredCount,
        setFilteredCount,
    }), [filters, sort, handleFiltersChange, handleSortChange, totalItems, filteredCount]);

    return (
        <MarketplaceLayoutContext.Provider value={contextValue}>
            <div className="min-h-screen bg-gray-50">
                <NFTFilterSidebar
                    onFiltersChange={handleFiltersChange}
                    onSortChange={handleSortChange}
                    currentSort={sort}
                    totalItems={totalItems}
                    filteredCount={filteredCount}
                />
                <main className="pt-[66px]">
                    {children}
                </main>
            </div>
        </MarketplaceLayoutContext.Provider>
    );
}

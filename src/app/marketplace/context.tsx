'use client';

import { createContext, useContext } from 'react';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { devLog } from '@/utils';

export interface MarketplaceLayoutContext {
    filters: NFTFilters;
    sort: NFTSortOptions;
    onFiltersChange: (filters: NFTFilters) => void;
    onSortChange: (sort: NFTSortOptions) => void;
    totalItems: number;
    filteredCount: number;
    setFilteredCount: (count: number) => void;
}

export const MarketplaceLayoutContext = createContext<MarketplaceLayoutContext | null>(null);

export function useMarketplaceLayout() {
    const context = useContext(MarketplaceLayoutContext);
    if (!context) {
        // Return default values instead of throwing during SSR/hydration
        devLog.warn('useMarketplaceLayout: Context not available, returning defaults');
        return {
            filters: { categories: [], rarities: [], searchTerm: '' },
            sort: { field: 'price' as const, direction: 'desc' as const },
            onFiltersChange: () => {},
            onSortChange: () => {},
            totalItems: 0,
            filteredCount: 0,
            setFilteredCount: () => {},
        };
    }
    return context;
}

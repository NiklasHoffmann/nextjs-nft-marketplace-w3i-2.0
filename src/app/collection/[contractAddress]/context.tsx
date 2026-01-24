'use client';

import { createContext, useContext } from 'react';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';

export interface CollectionLayoutContext {
    filters: NFTFilters;
    sort: NFTSortOptions;
    onFiltersChange: (filters: NFTFilters) => void;
    onSortChange: (sort: NFTSortOptions) => void;
    totalItems: number;
    filteredCount: number;
    setFilteredCount: (count: number) => void;
}

export const CollectionLayoutContext = createContext<CollectionLayoutContext | null>(null);

export function useCollectionLayout() {
    const context = useContext(CollectionLayoutContext);
    if (!context) {
        throw new Error('useCollectionLayout must be used within CollectionLayout');
    }
    return context;
}

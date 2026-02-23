'use client';

import { createContext, useContext } from 'react';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { devLog } from '@/utils';

export interface WalletLayoutContext {
    filters: NFTFilters;
    sort: NFTSortOptions;
    onFiltersChange: (filters: NFTFilters) => void;
    onSortChange: (sort: NFTSortOptions) => void;
    totalItems: number;
    filteredCount: number;
    setFilteredCount: (count: number) => void;
}

export const WalletLayoutContext = createContext<WalletLayoutContext | null>(null);

export function useWalletLayout() {
    const context = useContext(WalletLayoutContext);

    if (!context) {
        devLog.warn('useWalletLayout: Context not available, returning defaults');
        return {
            filters: { categories: [], tokenStandards: [], rarities: [], searchTerm: '' },
            sort: { field: 'price' as const, direction: 'desc' as const },
            onFiltersChange: () => { },
            onSortChange: () => { },
            totalItems: 0,
            filteredCount: 0,
            setFilteredCount: () => { },
        };
    }

    return context;
}

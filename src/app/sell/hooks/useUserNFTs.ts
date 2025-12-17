/**
 * Custom hooks for /sell route
 */

import { useState, useMemo } from 'react';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { walletNFTToAggregatedNFT, sortNFTs, filterNFTs } from '../utils';
import { NFTFilterOptions, SortOption, SortOrder } from '../types';

/**
 * Hook for managing user's NFTs with filtering and sorting
 */
export function useUserNFTs() {
    const walletNFTsContext = useWalletNFTs();
    const [filterOptions, setFilterOptions] = useState<NFTFilterOptions>({
        searchTerm: '',
        showOnlyUnlisted: true,
        sortBy: 'name',
        sortOrder: 'asc'
    });

    // Convert wallet NFTs to aggregated format
    const allNFTs = useMemo(
        () => walletNFTsContext.nfts.map(walletNFTToAggregatedNFT),
        [walletNFTsContext.nfts]
    );

    // Apply filters and sorting
    const filteredNFTs = useMemo(() => {
        const filtered = filterNFTs(allNFTs, {
            searchTerm: filterOptions.searchTerm,
            showOnlyUnlisted: filterOptions.showOnlyUnlisted
        });

        return sortNFTs(filtered, filterOptions.sortBy, filterOptions.sortOrder);
    }, [allNFTs, filterOptions]);

    const updateFilter = (updates: Partial<NFTFilterOptions>) => {
        setFilterOptions(prev => ({ ...prev, ...updates }));
    };

    return {
        allNFTs,
        filteredNFTs,
        filterOptions,
        updateFilter,
        loading: walletNFTsContext.loading,
        error: walletNFTsContext.error
    };
}

/**
 * Hook for managing listing form state
 */
export function useListingForm() {
    const [selectedNFT, setSelectedNFT] = useState<AggregatedNFT | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setSelectedNFT(null);
        setShowPreview(false);
        setIsLoading(false);
    };

    return {
        selectedNFT,
        setSelectedNFT,
        showPreview,
        setShowPreview,
        isLoading,
        setIsLoading,
        resetForm
    };
}

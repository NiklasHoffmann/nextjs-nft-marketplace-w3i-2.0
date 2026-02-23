import * as React from 'react';
import { useChainId } from 'wagmi';
import { NFTGallery } from '@/components/shared';
import { EmptyState } from '@/components/core/Empty';
import type { FilterableNFTItem } from '@/types/marketplace';
import type { EnrichedNFTDocument } from '@/types/marketplace/enriched-nft';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters';
import { mapEnrichedNFTToFilterableItem } from '@/utils/nft/scrollItem';

export interface CollectionNFTsListProps {
    /** NFTs from API */
    nfts: EnrichedNFTDocument[];
    /** Loading state */
    loading?: boolean;
    /** Error state */
    error?: string | null;
    /** Filter state */
    filters: NFTFilters;
    /** Sort options */
    sort: NFTSortOptions;
    /** Callback when filtered count changes */
    onFilteredCountChange: (count: number) => void;
}

/**
 * CollectionNFTsList Component
 * 
 * Displays NFTs from a collection with filtering and sorting.
 * Similar architecture to WalletNFTsList but for collection pages.
 */
export function CollectionNFTsList({
    nfts,
    loading = false,
    error = null,
    filters,
    sort,
    onFilteredCountChange
}: CollectionNFTsListProps) {
    const chainId = useChainId();
    const pageSize = 20;
    const [visibleCount, setVisibleCount] = React.useState(pageSize);

    // Convert NFTs to FilterableNFTItem format (direct mapping, no intermediate steps)
    const nftItems: FilterableNFTItem[] = React.useMemo(() => {
        return nfts.map(nft => mapEnrichedNFTToFilterableItem(nft, chainId));
    }, [nfts, chainId]);

    // Apply filters and sorting
    const { filteredItems: filteredNFTs } = useNFTFilters(
        nftItems,
        filters,
        sort
    );

    const visibleNFTs = React.useMemo(() => {
        return filteredNFTs.slice(0, visibleCount);
    }, [filteredNFTs, visibleCount]);

    // Update filtered count
    React.useEffect(() => {
        onFilteredCountChange(filteredNFTs.length);
    }, [filteredNFTs.length, onFilteredCountChange]);

    React.useEffect(() => {
        setVisibleCount(pageSize);
    }, [pageSize, filters, sort, nfts.length]);


    // Loading state
    if (loading && nfts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Loading NFTs...</p>
            </div>
        );
    }

    // Error state
    if (error && nfts.length === 0) {
        return (
            <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg text-sm mb-6">
                Error loading items: {error}
            </div>
        );
    }

    // Empty state
    if (filteredNFTs.length === 0) {
        return (
            <EmptyState
                icon="🖼️"
                title="No NFTs Found"
                description={
                    filters.searchTerm || filters.categories.length > 0 || (filters.tokenStandards?.length || 0) > 0 || filters.rarities.length > 0
                        ? 'Try adjusting your filters'
                        : 'No items listed in this collection'
                }
            />
        );
    }
    // Display NFTs
    return (
        <div className="space-y-6">
            <NFTGallery
                items={visibleNFTs}
                enableInsights={true}
                showStats={true}
                priority={false}
                enableViewAll={true}
                defaultGridView={true}
                emptyMessage="No NFTs found"
            />
            {visibleNFTs.length < filteredNFTs.length && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => Math.min(prev + pageSize, filteredNFTs.length))}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
    );
}

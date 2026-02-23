import * as React from 'react';
import { useAccount } from 'wagmi';

import { NFTGallery } from '@/components/shared';
import { EmptyState } from '@/components/core/Empty';
import type { NFTFilters, NFTSortOptions, FilterableNFTItem } from '@/types/marketplace';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters';
import { mapWalletNFTToFilterableItem } from '@/utils/nft/scrollItem';

export interface WalletNFTsListProps {
    nfts: WalletNFT[];
    loading?: boolean;
    error?: string | null;
    title?: string;
    separateSections?: boolean;
    limitPerSection?: number;
    filters: NFTFilters;
    sort: NFTSortOptions;
    onFilteredCountChange: (count: number) => void;
}

function renderEmptySection(message: string) {
    return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

export function WalletNFTsList({
    nfts,
    loading = false,
    error = null,
    title,
    separateSections = true,
    limitPerSection,
    filters,
    sort,
    onFilteredCountChange,
}: WalletNFTsListProps) {
    const { address: connectedWallet } = useAccount();

    const filterableItems: FilterableNFTItem[] = React.useMemo(() => {
        return nfts.map((nft) => mapWalletNFTToFilterableItem(nft, connectedWallet));
    }, [nfts, connectedWallet]);

    const { filteredItems } = useNFTFilters(filterableItems, filters, sort);

    React.useEffect(() => {
        onFilteredCountChange(filteredItems.length);
    }, [filteredItems.length, onFilteredCountChange]);

    const listedNFTs = React.useMemo(() => {
        const listed = filteredItems.filter((nft) => nft.isListed);
        return limitPerSection ? listed.slice(0, limitPerSection) : listed;
    }, [filteredItems, limitPerSection]);

    const unlistedNFTs = React.useMemo(() => {
        const unlisted = filteredItems.filter((nft) => !nft.isListed);
        return limitPerSection ? unlisted.slice(0, limitPerSection) : unlisted;
    }, [filteredItems, limitPerSection]);

    const displayTitle = title || 'Your NFTs';

    if (!connectedWallet) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Connect your wallet to view NFTs</p>
            </div>
        );
    }

    if (loading && nfts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Loading NFTs...</p>
            </div>
        );
    }

    if (error && filteredItems.length === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (filteredItems.length === 0 && !loading) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <EmptyState
                    icon="🖼️"
                    title="No NFTs Found"
                    description={filters.searchTerm || filters.categories.length > 0 || (filters.tokenStandards?.length || 0) > 0 || filters.rarities.length > 0
                        ? 'Try adjusting your filters'
                        : 'No NFTs found in this wallet'}
                    size="sm"
                />
            </div>
        );
    }

    if (!separateSections) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {displayTitle}
                            <span className="ml-2 text-sm text-gray-500">({filteredItems.length})</span>
                        </h3>
                    </div>
                </div>

                <NFTGallery
                    items={filteredItems}
                    badge={{ text: 'All NFTs', color: 'bg-blue-500' }}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No NFTs found in this wallet"
                />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-green-800 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Listed Utilities ({listedNFTs.length})
                        </h4>
                    </div>
                </div>

                <NFTGallery
                    items={listedNFTs}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No listed NFTs"
                    enableViewAll={true}
                    emptyComponent={renderEmptySection('No listed Utilities')}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 px-4">
                    <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        Not Listed ({unlistedNFTs.length})
                    </h4>
                </div>

                <NFTGallery
                    items={unlistedNFTs}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No unlisted NFTs"
                    enableViewAll={true}
                    emptyComponent={renderEmptySection('No unlisted Utilities')}
                />
            </div>
        </div>
    );
}


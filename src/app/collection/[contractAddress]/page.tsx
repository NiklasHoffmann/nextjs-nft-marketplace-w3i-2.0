'use client';

/**
 * Collection Page - Shows all NFTs from a specific collection
 * 
 * Uses Next.js 15 async params with use() hook in client component.
 * Displays NFTs filtered by contract address with full filter/sort capabilities.
 * 
 * Architecture:
 * - MongoDB via useMarketplaceItems hook (filtered by contractAddress)
 * - CollectionLayoutContext for filter/sort state
 * - CollectionNFTsList handles NFT display with filtering
 */

import React, { use, useEffect } from 'react';
import { useMarketplaceItems } from '@/hooks';
import { useCollectionLayout } from './context';
import { LoadingState } from '@/components/core/Loading';
import { CollectionNFTsList } from './components';

interface CollectionPageProps {
    params: Promise<{
        contractAddress: string;
    }>;
}

export default function CollectionPage({ params }: CollectionPageProps) {
    // Unwrap async params using Next.js 15 use() hook
    const { contractAddress: encodedAddress } = use(params);
    const contractAddress = decodeURIComponent(encodedAddress);

    // Get filter/sort state from layout context
    const { filters, sort, setFilteredCount } = useCollectionLayout();

    // Fetch items for this collection from API
    const {
        items: marketplaceItems,
        loading: itemsLoading,
        error: itemsError,
        pagination,
        loadMore
    } = useMarketplaceItems({
        contractAddress: contractAddress,
        isListed: true,
        autoFetch: true,
        limit: 100,
        sortBy: 'price',
        sortOrder: 'asc'
    });

    useEffect(() => {
        if (!pagination?.hasMore || itemsLoading) {
            return;
        }

        void loadMore();
    }, [pagination?.hasMore, itemsLoading, loadMore]);

    if (itemsLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <div className="flex justify-center items-center min-h-[400px] pt-[66px]">
                    <LoadingState size="md" message="Loading collection..." />
                </div>
            </div>
        );
    }

    return (
        <div className="md:pl-16 py-8">
            <CollectionNFTsList
                nfts={marketplaceItems}
                loading={itemsLoading}
                error={itemsError}
                filters={filters}
                sort={sort}
                onFilteredCountChange={setFilteredCount}
            />
        </div>
    );
}

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
 * - Real-time filtered count updates
 */

import React, { use, useEffect, useMemo } from 'react';
import { useMarketplaceItems } from '@/hooks';
import { useCollections } from '@/contexts/collections/CollectionsContext';
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters';
import { NFTGallery } from '@/components';
import { useCollectionLayout } from './layout';
import { LoadingState } from '@/components/core/Loading';
import { EmptyState } from '@/components/core/Empty';
import { convertToScrollItems, convertToFilterableItems } from '@/utils/marketplace';

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

    // Use V2 API to fetch items for this collection
    const {
        items: marketplaceItems,
        loading: itemsLoading,
        error: itemsError
    } = useMarketplaceItems({
        contractAddress: contractAddress,
        isListed: true,
        autoFetch: true,
        limit: 50,
        sortBy: 'price',
        sortOrder: 'asc'
    });

    // Get collection metadata from CollectionsContext
    const { collections, loading: collectionsLoading } = useCollections();
    const collectionMetadata = useMemo(() =>
        collections.find(c => c.contractAddress?.toLowerCase() === contractAddress.toLowerCase()),
        [collections, contractAddress]
    );

    // Items are already filtered by contract address via API
    const collectionNFTs = marketplaceItems;

    // Convert EnrichedNFTDocument to flat structure for compatibility
    const flattenedItems = useMemo(() => {
        return collectionNFTs.map(item => ({
            // Core identifiers
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            listingId: item.listingId,

            // Marketplace data (flattened from nested structure)
            price: item.marketplace?.price || null,
            isListed: item.marketplace?.isListed || false,
            seller: item.marketplace?.seller || null,
            buyer: item.marketplace?.buyer || null,
            desiredContractAddress: item.marketplace?.desiredContractAddress || null,
            desiredTokenId: item.marketplace?.desiredTokenId || null,

            // Metadata (flattened)
            name: item.metadata?.name || `NFT #${item.tokenId}`,
            description: item.metadata?.description || null,
            image: item.metadata?.image || null,
            imageUrl: item.metadata?.image || null,
            animationUrl: item.metadata?.animationUrl || null,
            attributes: item.metadata?.attributes || [],

            // Contract data (flattened)
            contractName: item.contract?.name || null,
            contractSymbol: item.contract?.symbol || null,
            owner: item.contract?.owner || null,

            // Insights (flattened & nested for NFTCard compatibility)
            customTitle: item.insights?.customTitle || null,
            category: item.insights?.category || null,
            tags: item.insights?.tags || [],
            rarity: item.insights?.rarity || null,
            cardDescriptions: item.insights?.cardDescriptions || null,
            insights: item.insights || undefined,

            // Stats - use from API response
            viewCount: (item as any).stats?.viewCount ?? 0,
            likeCount: (item as any).stats?.likeCount ?? 0,
            favoriteCount: (item as any).stats?.likeCount ?? 0, // Alias
            watchlistCount: (item as any).stats?.watchlistCount ?? 0,
            averageRating: (item as any).stats?.averageRating ?? 0,
            ratingCount: (item as any).stats?.ratingCount ?? 0,

            // Keep nested metadata for NFTCard
            metadata: item.metadata,

            // Keep nested contract for NFTCard
            contract: item.contract
        }));
    }, [collectionNFTs]);

    // Convert to filterable format - using central utility function
    const filterableItems = useMemo(() => {
        return convertToFilterableItems(flattenedItems);
    }, [flattenedItems]);

    // Apply filters and sorting
    const { filteredItems: filteredNFTs } = useNFTFilters(
        filterableItems,
        filters,
        sort
    );

    // Update filtered count when filteredNFTs changes
    useEffect(() => {
        setFilteredCount(filteredNFTs.length);
    }, [filteredNFTs.length, setFilteredCount]);

    if (itemsLoading || collectionsLoading) {
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
            {/* Error Message */}
            {itemsError && (
                <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg text-sm mb-6">
                    Error loading items: {itemsError}
                </div>
            )}

            {filteredNFTs.length > 0 ? (
                <NFTGallery
                    items={convertToScrollItems(filteredNFTs)}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    enableViewAll={true}
                    defaultGridView={true}
                    emptyMessage="No NFTs found"
                />
            ) : (
                <EmptyState
                    icon="🖼️"
                    title="No NFTs Found"
                    description={
                        filters.searchTerm || filters.categories.length > 0 || filters.rarities.length > 0
                            ? 'Try adjusting your filters'
                            : 'No items listed in this collection'
                    }
                    action={
                        (filters.searchTerm || filters.categories.length > 0 || filters.rarities.length > 0) ? {
                            label: 'Clear Filters',
                            onClick: () => {
                                // These are now managed by the layout context
                            }
                        } : undefined
                    }
                />
            )}
        </div>
    );
}

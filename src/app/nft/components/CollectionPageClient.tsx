'use client'

// NFT Collection Page Client Component
// Zeigt alle NFTs einer spezifischen Collection an
// Verwendet von: app/nft/[contractAddress]/page.tsx

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CollectionHeader } from './CollectionHeader'
import { useMarketplaceItems } from '@/hooks'
import { useCollections } from '@/contexts/collections/CollectionsContext'
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters'
import { NFTFilterSidebar, NFTGallery } from '@/components'
import { StatCard } from '@/components/ui'
import { LoadingState } from '@/components/core/Loading'
import { EmptyState } from '@/components/core/Empty'
import { convertToScrollItems, convertToFilterableItems } from '@/utils/marketplace'
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace'

interface CollectionPageClientProps {
    contractAddress: string
}

export default function CollectionPageClient({ contractAddress }: CollectionPageClientProps) {
    // Use V2 API to fetch items for this collection
    const {
        items: marketplaceItems,
        loading: itemsLoading,
        error: itemsError
    } = useMarketplaceItems({
        contractAddress: contractAddress,
        isListed: true,
        autoFetch: true,
        limit: 50, // Reasonable limit for collection pages
        sortBy: 'price',
        sortOrder: 'asc'
    })

    // Get collection metadata from CollectionsContext
    const { collections, loading: collectionsLoading } = useCollections()
    const collectionMetadata = useMemo(() =>
        collections.find(c => c.contractAddress?.toLowerCase() === contractAddress.toLowerCase()),
        [collections, contractAddress]
    )

    const [isLoading, setIsLoading] = useState(true)

    // Debug log
    useEffect(() => {
        console.log('📦 [Collection Page] Items update:', {
            marketplaceItemsCount: marketplaceItems.length,
            loading: itemsLoading,
            error: itemsError,
            contractAddress,
            sample: marketplaceItems[0]
        })
    }, [marketplaceItems, itemsLoading, itemsError, contractAddress])

    // Filter and Sort State (wie im Marketplace)
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: '',
    })
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    })

    // Items are already filtered by contract address via API
    const collectionNFTs = marketplaceItems

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
        }))
    }, [collectionNFTs])

    // Convert to filterable format - using central utility function
    const filterableItems = useMemo(() => {
        const converted = convertToFilterableItems(flattenedItems)
        console.log('🎨 [Collection Page] Converted items sample:', {
            count: converted.length,
            sample: converted[0],
            hasImage: !!converted[0]?.image,
            hasImageUrl: !!converted[0]?.imageUrl,
            hasMetadata: !!converted[0]?.metadata,
            imageValue: converted[0]?.image || converted[0]?.imageUrl,
            metadataImage: converted[0]?.metadata?.image,
            fullSample: converted[0]
        })
        return converted
    }, [flattenedItems])

    // Apply filters and sorting
    const { filteredItems: filteredNFTs, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters,
        sort
    )

    // Debug filtered items
    useEffect(() => {
        console.log('🔍 [Collection Page] Filtering result:', {
            filterableItemsCount: filterableItems.length,
            filteredNFTsCount: filteredNFTs.length,
            totalCount,
            filteredCount,
            filters,
            sort
        })
    }, [filterableItems, filteredNFTs, totalCount, filteredCount, filters, sort])

    // Use collection metadata from CollectionsContext (pre-calculated)
    const collectionStats = useMemo(() => {
        if (!collectionMetadata) return null

        return {
            totalListings: collectionMetadata.itemCount,
            totalVolume: collectionMetadata.totalValue / 1e18, // Convert from wei to ETH
            avgPrice: collectionMetadata.averagePrice ? collectionMetadata.averagePrice / 1e18 : 0,
            minPrice: collectionMetadata.floorPrice ? collectionMetadata.floorPrice / 1e18 : 0,
            maxPrice: 0, // Not in aggregation yet
            totalSupply: collectionMetadata.totalSupply || 0,
            totalLikes: collectionMetadata.totalLikes || 0,
            totalViews: collectionMetadata.totalViews || 0,
            totalWatchlist: collectionMetadata.totalWatchlist || 0,
            averageRating: collectionMetadata.averageRating || 0,
            totalRatings: collectionMetadata.totalRatings || 0,
            uniqueOwners: collectionMetadata.uniqueOwners || 0
        }
    }, [collectionMetadata])

    // Update loading state when data is available
    useEffect(() => {
        if (!itemsLoading && !collectionsLoading) {
            setIsLoading(false)
        }
    }, [itemsLoading, collectionsLoading])

    if (isLoading || itemsLoading || collectionsLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <div className="flex justify-center items-center min-h-[400px] pt-[66px]">
                    <LoadingState size="md" message="Loading collection..." />
                </div>
            </div>
        )
    }

    return (
        <>
            {/* NFTFilterSidebar - wie auf Marketplace */}
            <NFTFilterSidebar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                currentSort={sort}
                totalItems={collectionNFTs.length}
                filteredCount={filteredCount}
            />

            {/* Collection Header */}
            <CollectionHeader
                contractAddress={contractAddress}
                contractName={collectionMetadata?.contractName}
                contractSymbol={collectionMetadata?.contractSymbol}
                totalListings={collectionStats?.totalListings || 0}
                totalVolume={collectionStats?.totalVolume}
                avgPrice={collectionStats?.avgPrice}
                floorPrice={collectionStats?.minPrice}
                totalViews={collectionStats?.totalViews}
                totalLikes={collectionStats?.totalLikes}
            />

            <div className="pt-[120px] md:pl-16">
                {/* NFT List Area */}
                <div className="pt-20 pb-8">
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
                                        setFilters({ categories: [], rarities: [], searchTerm: '' })
                                        setSort({ field: 'price', direction: 'desc' })
                                    }
                                } : undefined
                            }
                        />
                    )}
                </div>
            </div>
        </>
    )
}

// Removed old right sidebar code - Collection stats now in header


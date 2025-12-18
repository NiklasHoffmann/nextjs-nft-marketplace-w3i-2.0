'use client'

// NFT Collection Page Client Component
// Zeigt alle NFTs einer spezifischen Collection an
// Verwendet von: app/nft/[contractAddress]/page.tsx

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useMarketplaceV2 } from '@/hooks/marketplace/useMarketplaceV2'
import { useCollections } from '@/contexts/collections/CollectionsContext'
import { useNFTFilters } from '@/hooks/nfts/useNFTFilters'
import { NFTFilterSidebar, NFTGallery } from '@/components'
import { StatCard } from '@/app/wallet/components/StatCard'
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
    } = useMarketplaceV2({
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
                    <div className="text-gray-500">Loading collection...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NFTFilterSidebar - wie auf Marketplace */}
            <NFTFilterSidebar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                currentSort={sort}
                totalItems={collectionNFTs.length}
                filteredCount={filteredCount}
            />

            <main className="pt-[66px] md:pl-16">
                {/* Collection Header - Clean design like wallet page */}
                <div className="sticky top-[66px] z-10 bg-white border-b border-gray-200">
                    <div className="px-8 py-6">
                        {/* Back Link */}
                        <Link
                            href="/marketplace"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                            title="Back to Marketplace"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-sm font-medium">Back to Marketplace</span>
                        </Link>

                        <div className="flex items-center justify-between gap-8">
                            {/* Collection Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                        {collectionMetadata?.contractName || 'NFT Collection'}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="font-mono text-xs text-gray-600">
                                            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                                        </p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(contractAddress)}
                                            className="text-gray-500 hover:text-gray-900 transition-colors p-0.5 hover:bg-gray-100 rounded"
                                            title="Copy Address"
                                            aria-label="Copy contract address"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Collection Stats Cards */}
                            <div className="flex-1 max-w-3xl">
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* Total Supply */}
                                    <StatCard
                                        icon={
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                        }
                                        label="Supply"
                                        value={collectionStats?.totalSupply || 'N/A'}
                                        variant="gray"
                                    />

                                    {/* Items Listed */}
                                    <StatCard
                                        icon={
                                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        }
                                        label="Listed"
                                        value={collectionStats?.totalListings || 0}
                                        variant="purple"
                                    />

                                    {/* Floor Price */}
                                    <StatCard
                                        icon={
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        }
                                        label="Floor"
                                        value={collectionStats?.minPrice && collectionStats.minPrice > 0
                                            ? `${collectionStats.minPrice.toFixed(4)} ETH`
                                            : 'N/A'
                                        }
                                        variant="green"
                                    />

                                    {/* Total Volume */}
                                    <StatCard
                                        icon={
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        }
                                        label="Volume"
                                        value={`${collectionStats?.totalVolume.toFixed(3) || '0'} ETH`}
                                        variant="blue"
                                    />

                                    {/* Unique Owners */}
                                    <StatCard
                                        icon={
                                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        }
                                        label="Owners"
                                        value={collectionStats?.uniqueOwners || 0}
                                        variant="purple"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NFT List Area */}
                <div className="py-8">
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
                            emptyMessage="No NFTs found"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="text-6xl mb-4">🖼️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">No NFTs Found</h3>
                            <p className="text-gray-600 mb-4 text-center">
                                {filters.searchTerm || filters.categories.length > 0 || filters.rarities.length > 0
                                    ? 'Try adjusting your filters'
                                    : 'No items listed in this collection'}
                            </p>
                            {(filters.searchTerm || filters.categories.length > 0 || filters.rarities.length > 0) && (
                                <button
                                    onClick={() => {
                                        setFilters({ categories: [], rarities: [], searchTerm: '' })
                                        setSort({ field: 'price', direction: 'desc' })
                                    }}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

// Removed old right sidebar code - Collection stats now in header


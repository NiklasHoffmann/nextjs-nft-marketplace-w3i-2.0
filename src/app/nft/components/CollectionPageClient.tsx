'use client'

// NFT Collection Page Client Component
// Zeigt alle NFTs einer spezifischen Collection an
// Verwendet von: app/nft/[nftAddress]/page.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useActiveItems } from '@/hooks'
import { useNFTFilters } from '@/hooks/nfts/08-utils-useNFTFilters'
import { NFTFilterSidebar, NFTScrollList } from '@/components'
import type { NFTScrollItem } from '@/components/03-marketplace/08-ui-NFTScrollList'
import type { NFTFilters, NFTSortOptions } from '@/components/03-marketplace/05-filters-NFTFilterBar'
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters'

interface CollectionPageClientProps {
    contractAddress: string
}

export default function CollectionPageClient({ contractAddress }: CollectionPageClientProps) {
    // Use the same data source as ActiveItemsList
    const { items: marketplaceItems, loading: graphLoading, error: graphError } = useActiveItems()

    const [isLoading, setIsLoading] = useState(true)

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

    // Filter marketplace items by contract address
    const collectionNFTs = useMemo(() => {
        if (!marketplaceItems || !Array.isArray(marketplaceItems)) {
            return []
        }

        const filtered = marketplaceItems.filter((item: any) =>
            item.nftAddress?.toLowerCase() === contractAddress.toLowerCase()
        )

        return filtered
    }, [marketplaceItems, contractAddress])

    // Convert to filterable format (wie im Marketplace)
    const filterableItems: FilterableNFTItem[] = useMemo(() => {
        return collectionNFTs.map((item: any) => ({
            contractAddress: item.nftAddress,
            nftAddress: item.nftAddress,
            tokenId: item.tokenId,
            price: item.price,
            isListed: item.isListed,
            listingId: item.listingId,
            seller: item.seller,
            buyer: item.buyer,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId,
            name: item.name,
            symbol: item.symbol,
            categories: item.categories || [],
            description: item.description,
            image: item.image,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            averageRating: item.averageRating || 0,
            viewCount: item.viewCount || 0,
            favoriteCount: item.favoriteCount || 0, // Correct field name for sorting
            watchlistCount: item.watchlistCount || 0,
        }))
    }, [collectionNFTs])

    // Apply filters and sorting
    const { filteredItems: filteredNFTs, totalCount, filteredCount } = useNFTFilters(
        filterableItems,
        filters,
        sort
    )

    // Calculate collection statistics
    const collectionStats = useMemo(() => {
        if (!collectionNFTs.length) return null

        const prices = collectionNFTs
            .map((item: any) => parseFloat(item.price || '0'))
            .filter((price: number) => price > 0)

        if (prices.length === 0) return null

        const totalVolume = prices.reduce((sum: number, price: number) => sum + price, 0)
        const avgPrice = totalVolume / prices.length
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        return {
            totalListings: collectionNFTs.length,
            totalVolume: totalVolume / 1e18, // Convert from wei to ETH
            avgPrice: avgPrice / 1e18,
            minPrice: minPrice / 1e18,
            maxPrice: maxPrice / 1e18
        }
    }, [collectionNFTs])

    // Convert NFTs to NFTScrollItem format
    const convertToScrollItems = useCallback((items: any[]): NFTScrollItem[] => {
        return items.map((item: any) => ({
            nftAddress: item.contractAddress || item.nftAddress,
            tokenId: item.tokenId,
            price: item.price,
            isListed: item.isListed,
            listingId: item.listingId,
            seller: item.seller,
            buyer: item.buyer,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId
        }));
    }, []);

    // Update loading state when data is available
    useEffect(() => {
        if (!graphLoading) {
            setIsLoading(false)
        }
    }, [graphLoading])

    if (isLoading || graphLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <div className="flex justify-center items-center min-h-[400px] pt-[66px]">
                    <div className="text-gray-500">Loading collection...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* NFTFilterSidebar - wie auf Marketplace */}
            <NFTFilterSidebar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                currentSort={sort}
                totalItems={collectionNFTs.length}
                filteredCount={filteredCount}
            />

            <main className="flex-1 pt-[66px] md:pl-16">
                {/* Collection Header - Simplified */}
                <div className="border-b border-gray-200 bg-white pr-80">
                    <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                title="Back to Marketplace"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Collection</h1>
                                <p className="font-mono text-xs text-gray-500 mt-1 break-all max-w-xl">
                                    {contractAddress}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NFT List Area */}
                <div className="pr-80">
                    {filteredNFTs.length > 0 ? (
                        <NFTScrollList
                            items={convertToScrollItems(filteredNFTs)}
                            enableInsights={true}
                            showStats={true}
                            priority={false}
                            enableViewAll={true}
                            padding="pl-8 pr-6 pb-4 pt-4"
                            emptyMessage="No NFTs found"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-8">
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

                {/* Error Message */}
                {graphError && (
                    <div className="px-8 pb-8">
                        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg text-sm">
                            Using fallback data: {graphError.message}
                        </div>
                    </div>
                )}
            </main>

            {/* Right Sidebar - Collection Info (Fixed) */}
            <aside className="fixed right-0 top-[66px] bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-50 shadow-xl">
                <div className="p-6 space-y-4">
                    {/* Collection Stats Card */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Collection Stats
                        </h2>

                        {collectionStats ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Total Items</span>
                                    <span className="text-lg font-bold text-gray-900">{collectionStats.totalListings}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Floor Price</span>
                                    <span className="text-lg font-bold text-green-600">{collectionStats.minPrice.toFixed(4)} ETH</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Average Price</span>
                                    <span className="text-lg font-bold text-blue-600">{collectionStats.avgPrice.toFixed(4)} ETH</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Highest Price</span>
                                    <span className="text-lg font-bold text-purple-600">{collectionStats.maxPrice.toFixed(4)} ETH</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Volume</span>
                                    <span className="text-lg font-bold text-indigo-600">{collectionStats.totalVolume.toFixed(3)} ETH</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No stats available</p>
                        )}
                    </div>

                    {/* Contract Info Card */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Contract Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Contract Address</label>
                                <p className="font-mono text-xs text-gray-900 mt-1 break-all bg-white p-2 rounded">
                                    {contractAddress}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(contractAddress)
                                }}
                                className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Address
                            </button>
                        </div>
                    </div>

                    {/* Filter Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Active Filters
                        </h2>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Showing</span>
                                <span className="font-bold text-blue-600">{filteredCount} / {collectionNFTs.length}</span>
                            </div>
                            {filters.searchTerm && (
                                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                                    <span className="text-xs text-gray-500">Search:</span>
                                    <p className="text-sm font-medium text-gray-900 truncate">"{filters.searchTerm}"</p>
                                </div>
                            )}
                            {filters.categories.length > 0 && (
                                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                                    <span className="text-xs text-gray-500">Categories:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {filters.categories.map(cat => (
                                            <span key={cat} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {filters.rarities.length > 0 && (
                                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                                    <span className="text-xs text-gray-500">Rarities:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {filters.rarities.map(rarity => (
                                            <span key={rarity} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded uppercase">
                                                {rarity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}

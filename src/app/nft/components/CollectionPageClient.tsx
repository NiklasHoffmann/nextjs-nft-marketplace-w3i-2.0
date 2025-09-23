'use client'

// NFT Collection Page Client Component
// Zeigt alle NFTs einer spezifischen Collection an
// Verwendet von: app/nft/[nftAddress]/page.tsx

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useActiveItems } from '@/hooks'
import { NFTCard } from '@/components/02-nft'

interface CollectionPageClientProps {
    contractAddress: string
}

export default function CollectionPageClient({ contractAddress }: CollectionPageClientProps) {
    // Use the same data source as ActiveItemsList
    const { items: marketplaceItems, loading: graphLoading, error: graphError } = useActiveItems()

    const [isLoading, setIsLoading] = useState(true)

    // Filter marketplace items by contract address
    const collectionNFTs = useMemo(() => {
        if (!marketplaceItems || !Array.isArray(marketplaceItems)) {
            console.log('🔍 No marketplace items available')
            return []
        }

        const filtered = marketplaceItems.filter((item: any) =>
            item.nftAddress?.toLowerCase() === contractAddress.toLowerCase()
        )

        console.log('🔍 Collection NFTs filter result:', {
            totalItems: marketplaceItems.length,
            filteredItems: filtered.length,
            contractAddress,
            sampleItem: marketplaceItems[0]
        })

        return filtered
    }, [marketplaceItems, contractAddress])

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

    // Update loading state when data is available
    useEffect(() => {
        if (!graphLoading) {
            setIsLoading(false)
        }
    }, [graphLoading])

    console.log('🔍 CollectionPageClient state:', {
        contractAddress,
        isLoading,
        graphLoading,
        graphError: graphError?.message,
        collectionNFTsCount: collectionNFTs.length,
        collectionStats
    })

    if (isLoading || graphLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-gray-500">Loading collection...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Collection Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Collection</h1>
                        <p className="text-gray-600 font-mono text-sm">{contractAddress}</p>
                    </div>
                </div>

                {/* Collection Statistics */}
                {collectionStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{collectionStats.totalListings}</div>
                            <div className="text-sm text-gray-600">Listed NFTs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{collectionStats.minPrice.toFixed(3)}</div>
                            <div className="text-sm text-gray-600">Floor Price (ETH)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{collectionStats.avgPrice.toFixed(3)}</div>
                            <div className="text-sm text-gray-600">Avg Price (ETH)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{collectionStats.totalVolume.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Total Volume (ETH)</div>
                        </div>
                    </div>
                )}

                <p className="text-gray-500">
                    {collectionNFTs.length} NFT{collectionNFTs.length !== 1 ? 's' : ''} listed on marketplace
                </p>

                {graphError && (
                    <div className="text-orange-600 text-sm mt-2">
                        Using fallback data due to: {graphError.message}
                    </div>
                )}
            </div>

            {/* NFTs Grid */}
            {collectionNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collectionNFTs.map((item: any) => (
                        <div key={`${item.nftAddress}-${item.tokenId}`}>
                            <Link
                                href={`/nft/${item.nftAddress}/${item.tokenId}`}
                                className="block hover:scale-105 transition-transform duration-200"
                            >
                                <NFTCard
                                    contractAddress={item.nftAddress || ''}
                                    tokenId={item.tokenId || ''}
                                    listingId={item.listingId}
                                    price={item.price}
                                    seller={item.seller}
                                    buyer={item.buyer}
                                    isListed={item.isListed}
                                    desiredNftAddress={item.desiredNftAddress}
                                    desiredTokenId={item.desiredTokenId}
                                    showStats={true}
                                    priority={false}
                                    enableInsights={true}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-500 text-xl mb-4">
                        No NFTs listed for sale in this collection
                    </div>
                    <p className="text-gray-400">
                        Check back later or browse other collections
                    </p>
                </div>
            )}
        </div>
    )
}

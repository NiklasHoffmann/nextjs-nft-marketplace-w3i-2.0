"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAccount } from "wagmi";
import { useRouter } from 'next/navigation';
import { getAdminAddressesList } from '@/utils';
import { useAllCollections } from '@/hooks';
import { useETHPrice } from "@/contexts/CurrencyContext";
import OptimizedNFTImage from '../02-nft/02-utils-OptimizedNFTImage';
import { ScrollButtons } from './07-ui-ScrollButtons';
import type { NFTSortOptions, NFTFilters } from './05-filters-NFTFilterBar';

interface CollectionData {
    contractAddress: string;
    symbol: string;
    name: string;
    totalSupply: number;
    listedItems: number;
    totalValue: string; // in ETH
    floorPrice: string | null; // in ETH
    averagePrice: string | null; // in ETH
    imageUrl: string | null;
    previewImages: string[]; // Multiple preview images
    totalLikes: number; // Sum of all likes in collection
    totalWatchlist: number; // Sum of all watchlist entries
    items: any[];
}

interface CollectionsTableProps {
    currentSort: NFTSortOptions;
    onSortChange: (sort: NFTSortOptions) => void;
    filters?: NFTFilters;
}

// Price display component for collections
const CollectionPriceDisplay = React.memo(({
    totalValue,
    floorPrice,
    averagePrice
}: {
    totalValue: string;
    floorPrice: string | null;
    averagePrice: string | null;
}) => {
    const ethValue = useMemo(() => parseFloat(totalValue), [totalValue]);
    const { convertedPrice, loading } = useETHPrice(ethValue);

    return (
        <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-900">
                {totalValue} ETH
            </div>
            {loading ? (
                <div className="text-xs text-gray-500">Lädt...</div>
            ) : (
                <div className="text-xs text-gray-600">≈ {convertedPrice}</div>
            )}
            {floorPrice && (
                <div className="text-xs text-blue-600">
                    Floor: {floorPrice} ETH
                </div>
            )}
        </div>
    );
});

CollectionPriceDisplay.displayName = 'CollectionPriceDisplay';

export function CollectionsTable({ currentSort, onSortChange, filters }: CollectionsTableProps) {
    const [isClient, setIsClient] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Scroll state
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Router for navigation
    const router = useRouter();

    // Wait for client-side mounting
    const { address } = useAccount();

    // Check admin status
    useEffect(() => {
        if (address) {
            const adminAddresses = getAdminAddressesList();
            const lowerAddress = address.toLowerCase();
            setIsAdmin(adminAddresses.includes(lowerAddress));
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    // Get all collections data (marketplace + insights)
    const {
        collections,
        loading: collectionsLoading,
        error: collectionsError,
        refresh: refreshCollections,
        totalListedNFTs,
        totalValue
    } = useAllCollections({
        autoFetch: true
    });

    // Sort collections based on sidebar sort
    const sortedCollections = useMemo(() => {
        return [...collections].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (currentSort.field) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'price':
                    // Map price to totalValue for collections
                    aValue = parseFloat(a.totalValue);
                    bValue = parseFloat(b.totalValue);
                    break;
                case 'created':
                    // Map created to totalSupply for collections
                    aValue = a.totalSupply;
                    bValue = b.totalSupply;
                    break;
                case 'rating':
                    // Map rating to totalListedNFTs (Listed)
                    aValue = a.totalListedNFTs;
                    bValue = b.totalListedNFTs;
                    break;
                case 'views':
                    // Map views to unlisted (totalSupply - totalListedNFTs)
                    aValue = a.totalSupply - a.totalListedNFTs;
                    bValue = b.totalSupply - b.totalListedNFTs;
                    break;
                case 'likes':
                    aValue = a.totalLikes;
                    bValue = b.totalLikes;
                    break;
                case 'watchlistCount':
                    aValue = a.totalWatchlist;
                    bValue = b.totalWatchlist;
                    break;
                default:
                    return 0;
            }

            if (currentSort.direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }, [collections, currentSort]);

    // Apply filters to collections
    const filteredCollections = useMemo(() => {
        if (!filters) return sortedCollections;

        return sortedCollections.filter((collection) => {
            // Min Supply filter
            if (filters.minSupply !== undefined && collection.totalSupply < filters.minSupply) {
                return false;
            }

            // Min Listed Items filter
            if (filters.minListedItems !== undefined && collection.totalListedNFTs < filters.minListedItems) {
                return false;
            }

            // Min Floor Price filter
            if (filters.minFloorPrice !== undefined && collection.floorPrice) {
                const floorPrice = parseFloat(collection.floorPrice);
                if (floorPrice < filters.minFloorPrice) {
                    return false;
                }
            }

            return true;
        });
    }, [sortedCollections, filters]);

    // Handle collection click
    const handleCollectionClick = useCallback((contractAddress: string) => {
        router.push(`/nft/${contractAddress}`);
    }, [router]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Check scroll position
    const checkScrollPosition = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
        checkScrollPosition();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            window.addEventListener('resize', checkScrollPosition);
            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
                window.removeEventListener('resize', checkScrollPosition);
            };
        }
    }, [checkScrollPosition, filteredCollections]);

    // Scroll functions
    const scroll = useCallback((direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 400;
        const newScrollLeft = direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount;

        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }, []);

    // Don't render on server
    if (!isClient) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (collectionsLoading && collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (collectionsError && collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center text-red-500">Error loading collections</div>
            </div>
        );
    }

    if (collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center">No collections found</div>
            </div>
        );
    }

    return (
        <div className="pt-8 pb-2 w-full">
            {/* Main Content - mit Left Padding für Sidebar */}
            <div className="md:pl-16 pl-10">
                {/* Page Title */}
                <div className="max-w-7xl mx-auto px-12 mb-6">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Collections
                    </h1>
                    <p className="text-sm text-gray-600 pl-2 mt-2">
                        {filteredCollections.length} {filteredCollections.length === 1 ? 'Collection' : 'Collections'}
                        {filters && filteredCollections.length !== collections.length && (
                            <span className="text-blue-600"> (von {collections.length} total)</span>
                        )}
                    </p>
                </div>

                {/* Collections Grid mit Horizontal Scroll */}
                <div className="relative overflow-visible pb-4">
                    {/* Scroll Buttons */}
                    <ScrollButtons
                        canScrollLeft={canScrollLeft}
                        canScrollRight={canScrollRight}
                        onScrollLeft={() => scroll('left')}
                        onScrollRight={() => scroll('right')}
                    />

                    {/* Scrollbare Collection Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 pb-4 pt-4 scrollbar-hide scroll-smooth pl-8 pr-6"
                        style={{
                            scrollBehavior: 'smooth',
                            paddingBottom: '50px',
                            overflowX: 'auto',
                            overflowY: 'visible',
                        }}
                    >
                        {filteredCollections.map((collection, index) => (
                            <div
                                key={collection.contractAddress || `unknown-${index}`}
                                className="group cursor-pointer transform-gpu flex-shrink-0 w-80"
                                onClick={() => handleCollectionClick(collection.contractAddress)}
                            >
                                <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 ease-out">
                                    {/* Card Header - Symbol & Name */}
                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-gray-900 text-lg truncate flex-1">
                                                {collection.symbol}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate" title={collection.name}>
                                            {collection.name}
                                        </p>
                                    </div>

                                    {/* Card Image - Preview NFTs */}
                                    <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                                        {collection.previewImages && collection.previewImages.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-1 h-full p-2">
                                                {collection.previewImages.slice(0, 4).map((imageUrl: string, imgIndex: number) => (
                                                    <div key={imgIndex} className="rounded-lg overflow-hidden bg-white shadow-sm">
                                                        <OptimizedNFTImage
                                                            imageUrl={imageUrl}
                                                            tokenId={`${collection.contractAddress}-preview-${imgIndex}`}
                                                            alt={`${collection.name} Preview ${imgIndex + 1}`}
                                                            className="w-full h-full object-cover"
                                                            width={150}
                                                            height={150}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Stats */}
                                    <div className="p-4 space-y-3">
                                        {/* Supply & Listed */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Supply:</span>
                                            <span className="font-semibold text-gray-900">{collection.totalSupply}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Listed:</span>
                                            <span className="font-semibold text-green-600">{collection.totalListedNFTs}</span>
                                        </div>

                                        {/* Social Metrics */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                                <span className="font-medium text-gray-900 text-sm">{collection.totalLikes}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="font-medium text-gray-900 text-sm">{collection.totalWatchlist}</span>
                                            </div>
                                        </div>

                                        {/* Price Info */}
                                        {collection.totalListedNFTs > 0 ? (
                                            <div className="pt-2 border-t border-gray-200">
                                                <CollectionPriceDisplay
                                                    totalValue={collection.totalValue}
                                                    floorPrice={collection.floorPrice}
                                                    averagePrice={collection.averagePrice}
                                                />
                                            </div>
                                        ) : (
                                            <div className="pt-2 border-t border-gray-200 text-sm text-gray-500 text-center">
                                                No listings
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS für scrollbar-hide */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

export default CollectionsTable;


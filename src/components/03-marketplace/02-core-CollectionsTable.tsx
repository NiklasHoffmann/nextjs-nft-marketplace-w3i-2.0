"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from "wagmi";
import { useRouter } from 'next/navigation';
import { getAdminAddressesList } from '@/utils';
import { useActiveItems } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';
import { useETHPrice } from "@/contexts/OptimizedCurrencyContext";
import { formatEther } from "@/utils";
import OptimizedNFTImage from '../02-nft/02-utils-OptimizedNFTImage';

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

export function CollectionsTable() {
    const [isClient, setIsClient] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'totalSupply' | 'listedItems' | 'totalValue' | 'totalLikes' | 'totalWatchlist'>('totalValue');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

    // Get marketplace data
    const { marketplaceItems, loading: graphLoading, error: graphError, refetch } = useActiveItems();
    const nftContext = useNFTContext();

    // Process items into collections
    const collections = useMemo(() => {
        if (!marketplaceItems || marketplaceItems.length === 0) return [];

        const collectionMap = new Map<string, CollectionData>();

        marketplaceItems.forEach((item: any) => {
            const contractAddress = item.contractAddress;

            // Get NFT data from context (includes contractInfo)
            const nftData = nftContext.getNFTCardData(contractAddress, item.tokenId);

            // Note: We don't load data here to avoid setState during render
            // Data loading is handled by separate useEffect

            if (!collectionMap.has(contractAddress)) {
                collectionMap.set(contractAddress, {
                    contractAddress,
                    symbol: nftData?.contractInfo?.symbol || `${contractAddress.slice(0, 6)}...`,
                    name: nftData?.contractInfo?.name || 'Unknown Collection',
                    totalSupply: nftData?.contractInfo?.totalSupply
                        ? (typeof nftData.contractInfo.totalSupply === 'bigint'
                            ? Number(nftData.contractInfo.totalSupply)
                            : nftData.contractInfo.totalSupply)
                        : 0,
                    listedItems: 0,
                    totalValue: '0',
                    floorPrice: null,
                    averagePrice: null,
                    imageUrl: null,
                    previewImages: [],
                    totalLikes: 0,
                    totalWatchlist: 0,
                    items: []
                });
            }

            const collection = collectionMap.get(contractAddress)!;
            collection.items.push({ ...item, nftData });

            // Add social metrics from NFT data
            if (nftData) {
                collection.totalLikes += nftData.likeCount || 0;
                collection.totalWatchlist += nftData.watchlistCount || 0;
            }

            // Count listed items and calculate values
            if (item.isListed && item.price) {
                collection.listedItems++;

                const priceInEth = parseFloat(formatEther(item.price));
                const currentTotal = parseFloat(collection.totalValue);
                collection.totalValue = (currentTotal + priceInEth).toFixed(6);

                // Update floor price
                if (!collection.floorPrice || priceInEth < parseFloat(collection.floorPrice)) {
                    collection.floorPrice = priceInEth.toFixed(6);
                }
            }

            // Collect preview images (up to 3 unique images)
            if (nftData?.imageUrl && collection.previewImages.length < 3) {
                if (!collection.previewImages.includes(nftData.imageUrl)) {
                    collection.previewImages.push(nftData.imageUrl);
                }
            }

            // Use first available image as main collection image
            if (!collection.imageUrl && nftData?.imageUrl) {
                collection.imageUrl = nftData.imageUrl;
            }
        });

        // Calculate average prices
        collectionMap.forEach((collection) => {
            if (collection.listedItems > 0) {
                const avgPrice = parseFloat(collection.totalValue) / collection.listedItems;
                collection.averagePrice = avgPrice.toFixed(6);
            }
        });

        return Array.from(collectionMap.values());
    }, [marketplaceItems, nftContext]);

    // Load missing NFT data (separate from useMemo to avoid setState during render)
    useEffect(() => {
        if (!marketplaceItems || marketplaceItems.length === 0) return;

        marketplaceItems.forEach((item: any) => {
            const contractAddress = item.contractAddress;
            const nftData = nftContext.getNFTCardData(contractAddress, item.tokenId);

            // Load data if not available
            if (!nftData && !nftContext.isDataFresh(contractAddress, item.tokenId)) {
                nftContext.loadNFTData(contractAddress, item.tokenId);
            }
        });
    }, [marketplaceItems, nftContext]);

    // Sort collections
    const sortedCollections = useMemo(() => {
        return [...collections].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'totalSupply':
                    aValue = a.totalSupply;
                    bValue = b.totalSupply;
                    break;
                case 'listedItems':
                    aValue = a.listedItems;
                    bValue = b.listedItems;
                    break;
                case 'totalValue':
                    aValue = parseFloat(a.totalValue);
                    bValue = parseFloat(b.totalValue);
                    break;
                case 'totalLikes':
                    aValue = a.totalLikes;
                    bValue = b.totalLikes;
                    break;
                case 'totalWatchlist':
                    aValue = a.totalWatchlist;
                    bValue = b.totalWatchlist;
                    break;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }, [collections, sortBy, sortDirection]);

    // Handle sorting
    const handleSort = useCallback((field: typeof sortBy) => {
        if (sortBy === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('desc');
        }
    }, [sortBy]);

    // Handle collection click
    const handleCollectionClick = useCallback((contractAddress: string) => {
        router.push(`/nft/${contractAddress}`);
    }, [router]);

    // Sort icon component
    const SortIcon = ({ field }: { field: typeof sortBy }) => {
        if (sortBy !== field) {
            return <span className="text-gray-400">↕</span>;
        }
        return (
            <span className="text-blue-600">
                {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    useEffect(() => {
        setIsClient(true);
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

    if (graphLoading && collections.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Collections</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (graphError && collections.length === 0) {
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
        <div className="py-8">
            {/* Header */}
            {isAdmin && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                Collections ({collections.length})
                                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    OVERVIEW
                                </span>
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Collection overview with marketplace statistics
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => refetch?.()}
                                disabled={graphLoading}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm font-medium"
                                title="Refresh collections data"
                            >
                                {graphLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Refreshing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        ↻ Refresh
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collections Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Preview</th>
                                <th
                                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Collection <SortIcon field="name" />
                                    </div>
                                </th>
                                <th
                                    className="text-center py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('totalSupply')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Supply <SortIcon field="totalSupply" />
                                    </div>
                                </th>
                                <th
                                    className="text-center py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('listedItems')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Listed <SortIcon field="listedItems" />
                                    </div>
                                </th>
                                <th
                                    className="text-center py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('totalLikes')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Social <SortIcon field="totalLikes" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('totalValue')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Value <SortIcon field="totalValue" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedCollections.map((collection, index) => (
                                <tr
                                    key={collection.contractAddress}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleCollectionClick(collection.contractAddress)}
                                    style={{
                                        animationName: 'fadeInUp',
                                        animationDuration: '0.5s',
                                        animationTimingFunction: 'ease-out',
                                        animationFillMode: 'forwards',
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    {/* Mini Gallery - 3 Preview Images */}
                                    <td className="py-4 px-4">
                                        <div className="flex gap-1">
                                            {collection.previewImages.slice(0, 3).map((imageUrl, imgIndex) => (
                                                <div key={imgIndex} className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shadow-sm border border-gray-200 flex-shrink-0 hover:shadow-md transition-shadow">
                                                    <OptimizedNFTImage
                                                        imageUrl={imageUrl}
                                                        tokenId={`preview-${collection.contractAddress}-${imgIndex}`}
                                                        className="object-cover w-full h-full"
                                                        fill={false}
                                                        width={48}
                                                        height={48}
                                                        priority={index < 5}
                                                    />
                                                </div>
                                            ))}
                                            {/* Fill empty slots with placeholders */}
                                            {Array.from({ length: 3 - collection.previewImages.length }).map((_, emptyIndex) => (
                                                <div key={`empty-${emptyIndex}`} className="w-12 h-12 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Collection Name & Symbol */}
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col">
                                            <div className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">
                                                {collection.symbol}
                                            </div>
                                            <div className="text-xs text-gray-600 truncate max-w-[150px]" title={collection.name}>
                                                {collection.name}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">
                                                {collection.contractAddress.slice(0, 6)}...{collection.contractAddress.slice(-4)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Total Supply */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="text-sm font-medium text-gray-900">
                                            {collection.totalSupply.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            items
                                        </div>
                                    </td>

                                    {/* Listed Items */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-sm font-medium text-gray-900">
                                                {collection.listedItems}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {collection.totalSupply > 0
                                                    ? `${((collection.listedItems / collection.totalSupply) * 100).toFixed(1)}%`
                                                    : '0%'
                                                }
                                            </div>
                                            {collection.listedItems > 0 && (
                                                <div className="w-12 bg-gray-200 rounded-full h-1 mt-1">
                                                    <div
                                                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min((collection.listedItems / collection.totalSupply) * 100, 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Social Metrics */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {/* Likes */}
                                            <div className="flex items-center gap-1 text-xs">
                                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                                <span className="font-medium text-gray-900">{collection.totalLikes}</span>
                                            </div>
                                            {/* Watchlist */}
                                            <div className="flex items-center gap-1 text-xs">
                                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="font-medium text-gray-900">{collection.totalWatchlist}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Total Value */}
                                    <td className="py-4 px-4 text-right">
                                        {collection.listedItems > 0 ? (
                                            <CollectionPriceDisplay
                                                totalValue={collection.totalValue}
                                                floorPrice={collection.floorPrice}
                                                averagePrice={collection.averagePrice}
                                            />
                                        ) : (
                                            <div className="text-sm text-gray-500">
                                                No listings
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Stats */}
            {isAdmin && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
                    <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 flex items-center gap-2">
                        Summary Stats
                    </h2>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">
                            {collections.length}
                        </div>
                        <div className="text-sm text-gray-600">Collections</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">
                            {collections.reduce((sum, col) => sum + col.totalSupply, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">
                            {collections.reduce((sum, col) => sum + col.listedItems, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Listed</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-red-600">
                            {collections.reduce((sum, col) => sum + col.totalLikes, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Likes</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">
                            {collections.reduce((sum, col) => sum + col.totalWatchlist, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Watchlisted</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="text-2xl font-bold text-orange-600">
                            {collections.reduce((sum, col) => sum + parseFloat(col.totalValue), 0).toFixed(4)} ETH
                        </div>
                        <div className="text-sm text-gray-600">Total Value</div>
                    </div>
                </div>
            )}
            {/* CSS Animation Styles */}
            <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}

export default CollectionsTable;
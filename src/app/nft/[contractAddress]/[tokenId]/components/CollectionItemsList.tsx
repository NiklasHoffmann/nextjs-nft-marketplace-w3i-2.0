'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatEther } from '@/utils';
import { CollectionItemsListProps } from '@/types';
import { formatNFTDisplayName, truncateAddress } from '@/utils';
import { OptimizedNFTImage } from '@/components/nft';
import { LoadingState } from '@/components/core/Loading';

interface CollectionNFT {
    contractAddress: string;
    tokenId: string;
    metadata?: {
        name?: string;
        image?: string;
    };
    marketplace?: {
        price?: string;
        isListed?: boolean;
    };
}

export default function CollectionItemsList({
    collection,
    contractAddress,
    tokenId,
    name,
    price
}: CollectionItemsListProps) {
    const router = useRouter();
    const [collectionItems, setCollectionItems] = useState<CollectionNFT[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCollectionItems() {
            try {
                setLoading(true);
                const response = await fetch(`/api/marketplace/items?contractAddress=${contractAddress}&limit=8`);

                if (!response.ok) {
                    throw new Error('Failed to fetch collection items');
                }

                const result = await response.json();

                if (result.success && result.data?.items) {
                    // Filter out current NFT and get up to 4 items
                    const filtered = result.data.items
                        .filter((item: CollectionNFT) => item.tokenId !== tokenId)
                        .slice(0, 4);
                    setCollectionItems(filtered);
                }
            } catch (error) {
                console.error('Error fetching collection items:', error);
                setCollectionItems([]);
            } finally {
                setLoading(false);
            }
        }

        if (contractAddress) {
            fetchCollectionItems();
        }
    }, [contractAddress, tokenId]);

    const handleItemClick = (item: CollectionNFT) => {
        router.push(`/nft/${item.contractAddress}/${item.tokenId}`);
    };

    const handleViewAll = () => {
        router.push(`/collection/${contractAddress}` as any);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">More from this Collection</h3>
                    <div className="text-sm text-gray-500">
                        {collection || truncateAddress(contractAddress)}
                    </div>
                </div>
                <div className="py-8">
                    <LoadingState size="sm" message="Loading collection items..." />
                </div>
            </div>
        );
    }

    if (collectionItems.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">More from this Collection</h3>
                    <div className="text-sm text-gray-500">
                        {collection || truncateAddress(contractAddress)}
                    </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <p>No other items from this collection available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">More from this Collection</h3>
                <div className="text-sm text-gray-500">
                    {collection || truncateAddress(contractAddress)}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {collectionItems.map((item) => (
                    <div
                        key={`${item.contractAddress}-${item.tokenId}`}
                        className="group cursor-pointer"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 overflow-hidden group-hover:shadow-lg transition-all duration-200">
                            {item.metadata?.image ? (
                                <OptimizedNFTImage
                                    imageUrl={item.metadata.image}
                                    tokenId={item.tokenId}
                                    alt={item.metadata?.name || `#${item.tokenId}`}
                                    className="w-full h-full object-cover"
                                    fill={false}
                                    width={300}
                                    height={300}
                                    priority={false}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-xs">#{item.tokenId}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {item.metadata?.name || formatNFTDisplayName(name, item.tokenId)}
                            </p>
                            {item.marketplace?.isListed && item.marketplace?.price && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Price</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {parseFloat(formatEther(item.marketplace.price)).toFixed(3)} ETH
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Token</span>
                                <span className="text-xs text-gray-600">#{item.tokenId}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <button
                    onClick={handleViewAll}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    View All Collection Items
                </button>
            </div>
        </div>
    );
}

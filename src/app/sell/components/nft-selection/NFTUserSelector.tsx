'use client';

import React from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';

interface NFTUserSelectorProps {
    userNFTs: AggregatedNFT[];
    selectedNFT: AggregatedNFT | null;
    onSelect: (nft: AggregatedNFT | null) => void;
    isLoading: boolean;
}

export function NFTUserSelector({ userNFTs, selectedNFT, onSelect, isLoading }: NFTUserSelectorProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (userNFTs.length === 0) {
        return (
            <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No NFTs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    You don&apos;t have any NFTs in your wallet yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
            {userNFTs.map((nft, index) => {
                const isSelected = selectedNFT?.contractAddress === nft.contractAddress && selectedNFT?.tokenId === nft.tokenId;

                return (
                    <div
                        key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                        onClick={() => onSelect(isSelected ? null : nft)}
                        className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex-shrink-0">
                            <OptimizedNFTImage
                                imageUrl={nft.meta?.image || ''}
                                tokenId={nft.tokenId}
                                alt={nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                                imageVariants={nft.meta?.images}
                                blurDataURL={nft.meta?.blurDataURL}
                                variant="card"
                                disableVisualEffects={true}
                                className="w-20 h-20 rounded-lg object-cover"
                                width={80}
                                height={80}
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Token ID: {nft.tokenId}
                                    </p>
                                    {nft.meta?.description && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {nft.meta.description}
                                        </p>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className="flex-shrink-0 ml-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

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
                    You don't have any NFTs in your wallet yet.
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
                            className="w-16 h-16 rounded-lg object-cover"
                            width={64}
                            height={64}
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
                                <p className="text-xs text-gray-500">
                                    Contract: {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                                </p>
                            </div>

                            <div className="flex flex-col items-end text-right">
                                {nft.listed ? (
                                    <div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Listed
                                        </span>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {nft.listing?.price} ETH
                                        </p>
                                    </div>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Not Listed
                                    </span>
                                )}
                            </div>
                        </div>

                        {nft.meta?.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {nft.meta.description}
                            </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {nft.social?.viewCount !== undefined && nft.social.viewCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{nft.social.viewCount}</span>
                                </div>
                            )}
                            {nft.social?.likeCount !== undefined && nft.social.likeCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{nft.social.likeCount}</span>
                                </div>
                            )}
                            {nft.social?.watchlistCount !== undefined && nft.social.watchlistCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    <span>{nft.social.watchlistCount}</span>
                                </div>
                            )}
                            {nft.social?.averageRating !== undefined && nft.social.averageRating > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <span>{nft.social.averageRating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        {nft.meta?.attributes && nft.meta.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {nft.meta.attributes.slice(0, 3).map((attr, attrIndex) => (
                                    <span
                                        key={attrIndex}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                                    >
                                        {attr.trait_type || 'Unknown'}: {attr.value}
                                    </span>
                                ))}
                                {nft.meta.attributes.length > 3 && (
                                    <span className="text-xs text-gray-400">
                                        +{nft.meta.attributes.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {isSelected && (
                        <div className="flex-shrink-0 self-center">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
}

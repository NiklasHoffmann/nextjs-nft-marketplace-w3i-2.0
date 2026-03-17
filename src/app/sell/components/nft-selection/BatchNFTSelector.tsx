'use client';

import React, { useMemo } from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';

interface BatchNFTSelectorProps {
    userNFTs: AggregatedNFT[];
    selectedNFTs: Set<string>;
    onSelectionChange: (nfts: Set<string>) => void;
    erc1155Quantities: Record<string, string>;
    onQuantityChange: (key: string, quantity: string) => void;
    isLoading: boolean;
}

export function BatchNFTSelector({ userNFTs, selectedNFTs, onSelectionChange, erc1155Quantities, onQuantityChange, isLoading }: BatchNFTSelectorProps) {
    // Group NFTs by collection
    const nftsByCollection = useMemo(() => {
        const groups = new Map<string, AggregatedNFT[]>();
        userNFTs.forEach(nft => {
            const key = nft.contractAddress;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(nft);
        });
        return groups;
    }, [userNFTs]);

    const handleSelectNFT = (nftKey: string) => {
        const newSelected = new Set(selectedNFTs);
        if (newSelected.has(nftKey)) {
            newSelected.delete(nftKey);
        } else {
            newSelected.add(nftKey);
        }
        onSelectionChange(newSelected);
    };

    const handleSelectAllInCollection = (contractAddress: string) => {
        const nftsInCollection = nftsByCollection.get(contractAddress) || [];
        const allSelected = nftsInCollection.every(nft => selectedNFTs.has(nft.key));

        const newSelected = new Set(selectedNFTs);
        nftsInCollection.forEach(nft => {
            if (allSelected) {
                newSelected.delete(nft.key);
            } else {
                newSelected.add(nft.key);
            }
        });
        onSelectionChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedNFTs.size === userNFTs.length) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(userNFTs.map(nft => nft.key)));
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Select All Button */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                    {selectedNFTs.size} von {userNFTs.length} ausgewählt
                </span>
                <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                    {selectedNFTs.size === userNFTs.length ? 'Alle abwählen' : 'Alle auswählen'}
                </button>
            </div>

            {/* NFTs grouped by collection */}
            <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                {Array.from(nftsByCollection.entries()).map(([contractAddress, nfts]) => {
                    if (nfts.length === 0) return null;
                    const collection = nfts[0];
                    if (!collection) return null;
                    const allSelected = nfts.every(nft => selectedNFTs.has(nft.key));

                    return (
                        <div key={contractAddress} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                            {/* Collection Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {collection.core.contractName || collection.core.contractSymbol || 'Unnamed Collection'}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAllInCollection(contractAddress)}
                                    className="ml-2 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                >
                                    {allSelected ? 'Alle abwählen' : `Alle ${nfts.length}`}
                                </button>
                            </div>

                            {/* NFTs Grid */}
                            <div className="grid grid-cols-6 gap-2">
                                {nfts.map((nft) => (
                                    <div
                                        key={nft.key}
                                        onClick={() => handleSelectNFT(nft.key)}
                                        className={`relative w-20 h-20 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedNFTs.has(nft.key)
                                                ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <OptimizedNFTImage
                                            imageUrl={nft.meta?.image || ''}
                                            tokenId={nft.tokenId}
                                            alt={nft.meta?.name || nft.core.name || `NFT #${nft.tokenId}`}
                                            className="w-full h-full object-cover rounded-md"
                                            width={80}
                                            height={80}
                                        />
                                        {selectedNFTs.has(nft.key) && nft.tokenStandard === 'ERC1155' && (
                                            <div
                                                className="absolute top-1 left-1 right-1"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={erc1155Quantities[nft.key] || ''}
                                                    onChange={(event) => onQuantityChange(nft.key, event.target.value)}
                                                    placeholder={nft.balance ? `Max ${nft.balance}` : 'Qty'}
                                                    className="w-full rounded-md border border-white/80 bg-white/90 px-1 py-0.5 text-[10px] font-semibold text-gray-800 shadow-sm focus:border-purple-400 focus:outline-none"
                                                />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 rounded-b-lg">
                                            <p className="text-[10px] text-white font-medium truncate">
                                                #{nft.tokenId}
                                            </p>
                                        </div>
                                        {selectedNFTs.has(nft.key) && (
                                            <div className="absolute top-0.5 right-0.5 bg-purple-500 rounded-full p-0.5">
                                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

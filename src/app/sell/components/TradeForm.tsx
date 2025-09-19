'use client';

import React, { useState } from 'react';
import { NFTDetails } from '@/types/01-core';

interface TradeFormProps {
    selectedNFT: NFTDetails | null;
    onSubmit: (data: {
        tradeType: 'specific' | 'collection' | 'open';
        targetNFT?: NFTDetails;
        targetCollection?: string;
        additionalETH?: string;
        description: string;
        duration: string;
    }) => void;
}

export function TradeForm({ selectedNFT, onSubmit }: TradeFormProps) {
    const [formData, setFormData] = useState({
        tradeType: 'specific' as 'specific' | 'collection' | 'open',
        targetNFTAddress: '',
        targetTokenId: '',
        targetCollection: '',
        additionalETH: '',
        description: '',
        duration: '7'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchResults, setSearchResults] = useState<NFTDetails[]>([]);
    const [selectedTargetNFT, setSelectedTargetNFT] = useState<NFTDetails | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.description.trim()) {
            newErrors.description = 'Please add a description for your trade';
        }

        if (formData.tradeType === 'specific' && !selectedTargetNFT) {
            newErrors.targetNFT = 'Please specify the NFT you want to trade for';
        }

        if (formData.tradeType === 'collection' && !formData.targetCollection.trim()) {
            newErrors.targetCollection = 'Please specify the collection';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedNFT) {
            alert('Please select an NFT first');
            return;
        }

        if (validateForm()) {
            onSubmit({
                tradeType: formData.tradeType,
                targetNFT: selectedTargetNFT || undefined,
                targetCollection: formData.targetCollection || undefined,
                additionalETH: formData.additionalETH || undefined,
                description: formData.description,
                duration: formData.duration
            });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const searchNFT = async () => {
        if (!formData.targetNFTAddress || !formData.targetTokenId) return;

        setIsSearching(true);
        try {
            // Mock search - in real app würde hier eine API-Anfrage stattfinden
            const mockResult: NFTDetails = {
                nftAddress: formData.targetNFTAddress,
                tokenId: formData.targetTokenId,
                metadata: {
                    name: `Target NFT #${formData.targetTokenId}`,
                    description: 'Target NFT for trade',
                    image: '/media/custom-nft-3.jpg'
                },
                imageUrl: '/media/custom-nft-3.jpg',
                owner: '0xOtherUser...'
            };

            setSelectedTargetNFT(mockResult);
            setSearchResults([mockResult]);
        } catch (error) {
            console.error('Error searching NFT:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedNFT && (
                <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="mt-2">Select an NFT to configure trade details</p>
                </div>
            )}

            {selectedNFT && (
                <>
                    {/* Trade Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What are you looking for?
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="specific"
                                    checked={formData.tradeType === 'specific'}
                                    onChange={(e) => handleInputChange('tradeType', e.target.value)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm">Specific NFT</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="collection"
                                    checked={formData.tradeType === 'collection'}
                                    onChange={(e) => handleInputChange('tradeType', e.target.value)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm">Any NFT from a specific collection</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="open"
                                    checked={formData.tradeType === 'open'}
                                    onChange={(e) => handleInputChange('tradeType', e.target.value)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm">Open to any offers</span>
                            </label>
                        </div>
                    </div>

                    {/* Specific NFT Search */}
                    {formData.tradeType === 'specific' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target NFT Contract Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.targetNFTAddress}
                                    onChange={(e) => handleInputChange('targetNFTAddress', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token ID
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.targetTokenId}
                                        onChange={(e) => handleInputChange('targetTokenId', e.target.value)}
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                        placeholder="Token ID"
                                    />
                                    <button
                                        type="button"
                                        onClick={searchNFT}
                                        disabled={!formData.targetNFTAddress || !formData.targetTokenId || isSearching}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                                    >
                                        {isSearching ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                                {errors.targetNFT && (
                                    <p className="mt-1 text-sm text-red-600">{errors.targetNFT}</p>
                                )}
                            </div>

                            {/* Target NFT Preview */}
                            {selectedTargetNFT && (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Target NFT</h4>
                                    <div className="flex gap-3">
                                        <img
                                            src={selectedTargetNFT.imageUrl || '/media/custom-nft-3.jpg'}
                                            alt={selectedTargetNFT.metadata?.name || 'Target NFT'}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div>
                                            <h5 className="font-medium text-gray-900">
                                                {selectedTargetNFT.metadata?.name || `NFT #${selectedTargetNFT.tokenId}`}
                                            </h5>
                                            <p className="text-sm text-gray-600">
                                                Token ID: {selectedTargetNFT.tokenId}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Owner: {selectedTargetNFT.owner?.slice(0, 6)}...{selectedTargetNFT.owner?.slice(-4)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collection Search */}
                    {formData.tradeType === 'collection' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Collection
                            </label>
                            <input
                                type="text"
                                value={formData.targetCollection}
                                onChange={(e) => handleInputChange('targetCollection', e.target.value)}
                                className={`w-full rounded-md border ${errors.targetCollection ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                                placeholder="e.g., CryptoPunks, Bored Ape Yacht Club"
                            />
                            {errors.targetCollection && (
                                <p className="mt-1 text-sm text-red-600">{errors.targetCollection}</p>
                            )}
                        </div>
                    )}

                    {/* Additional ETH */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional ETH (optional)
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.additionalETH}
                                onChange={(e) => handleInputChange('additionalETH', e.target.value)}
                                className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                placeholder="0.00"
                            />
                            <div className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                ETH
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Offer additional ETH if your NFT is worth less than the target
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trade Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className={`w-full rounded-md border ${errors.description ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                            placeholder="Explain what you're looking for and why this trade makes sense..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trade Offer Duration
                        </label>
                        <select
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                        Review Trade Offer
                    </button>
                </>
            )}
        </form>
    );
}
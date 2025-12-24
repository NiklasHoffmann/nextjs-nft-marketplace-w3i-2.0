'use client';

import React from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { useMarketplaceFees, useMarketplaceContracts } from '../../hooks';
import { ButtonSpinner } from '@/components/core/Loading';

interface BatchTransactionData {
    selectedNFTs: AggregatedNFT[];
    pricingType: 'fixed' | 'variable';
    fixedPrice?: string;
    startPrice?: string;
    endPrice?: string;
    currency: 'ETH' | 'USDC';
    description: string;
}

interface BatchTransactionPreviewProps {
    data: BatchTransactionData;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function BatchTransactionPreview({ data, onConfirm, onCancel, isLoading }: BatchTransactionPreviewProps) {
    // Get marketplace address and dynamic fees (using first NFT for fee calculation)
    const { marketplaceAddress } = useMarketplaceContracts();
    const firstNFT = data.selectedNFTs[0];
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: firstNFT?.contractAddress,
        tokenId: firstNFT?.tokenId
    });

    const calculatePrice = (index: number, total: number): string => {
        if (data.pricingType === 'fixed') {
            return data.fixedPrice || '0';
        }
        const start = parseFloat(data.startPrice || '0');
        const end = parseFloat(data.endPrice || '0');
        if (total === 1) return start.toFixed(4);
        const increment = (end - start) / (total - 1);
        return (start + increment * index).toFixed(4);
    };

    const totalValue = data.selectedNFTs.reduce((sum, _, idx) => {
        return sum + parseFloat(calculatePrice(idx, data.selectedNFTs.length));
    }, 0);

    const totalFees = calculateFees(totalValue);

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Batch-Listing überprüfen
                </h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-xl p-5 border border-purple-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Zusammenfassung</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-sm text-purple-700">NFTs</p>
                            <p className="text-2xl font-bold text-purple-900">{data.selectedNFTs.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-purple-700">Strategie</p>
                            <p className="text-lg font-bold text-purple-900">
                                {data.pricingType === 'fixed' ? 'Fest' : 'Variabel'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-purple-700">Gesamt</p>
                            <p className="text-lg font-bold text-purple-900">
                                {totalValue.toFixed(4)} {data.currency}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-5 shadow-md">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Preis-Details
                    </h3>

                    {data.pricingType === 'fixed' ? (
                        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                            <p className="text-sm text-gray-700 mb-2">Fester Preis pro NFT:</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {data.fixedPrice} {data.currency}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Start-Preis</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {data.startPrice} {data.currency}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">End-Preis</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {data.endPrice} {data.currency}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                                <p className="text-xs text-green-700 mb-2">Beispiele:</p>
                                <div className="space-y-1 text-xs text-green-800">
                                    <div className="flex justify-between">
                                        <span>NFT #1:</span>
                                        <span className="font-semibold">{calculatePrice(0, data.selectedNFTs.length)} {data.currency}</span>
                                    </div>
                                    {data.selectedNFTs.length > 2 && (
                                        <div className="flex justify-between">
                                            <span>NFT #{Math.ceil(data.selectedNFTs.length / 2)}:</span>
                                            <span className="font-semibold">
                                                {calculatePrice(Math.floor(data.selectedNFTs.length / 2), data.selectedNFTs.length)} {data.currency}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>NFT #{data.selectedNFTs.length}:</span>
                                        <span className="font-semibold">
                                            {calculatePrice(data.selectedNFTs.length - 1, data.selectedNFTs.length)} {data.currency}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fee Breakdown */}
                    <div className="mt-4 bg-white rounded-lg border border-blue-200 p-4 text-sm space-y-2 shadow-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Gesamt-Listing-Wert:</span>
                            <span>{totalValue.toFixed(4)} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
                            <span>-{totalFees.marketplaceFee.toFixed(4)} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Creator Royalty ({(royaltyFeePercentage * 100).toFixed(2)}%):</span>
                            <span>-{totalFees.royaltyFee.toFixed(4)} {data.currency}</span>
                        </div>
                        <hr className="border-blue-200" />
                        <div className="flex justify-between font-semibold text-green-600 text-base">
                            <span>Sie erhalten insgesamt:</span>
                            <span>{totalFees.youReceive.toFixed(4)} {data.currency}</span>
                        </div>
                    </div>
                </div>

                {/* NFT Preview */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Ausgewählte NFTs ({data.selectedNFTs.length})
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                        {data.selectedNFTs.map((nft, index) => (
                            <div key={nft.key} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                                    <img
                                        src={nft.meta?.image || '/media/custom-nft.jpg'}
                                        alt={`#${nft.tokenId}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg">
                                    <p className="text-xs text-white font-medium truncate">
                                        #{nft.tokenId}
                                    </p>
                                    <p className="text-[10px] text-green-300 font-semibold">
                                        {calculatePrice(index, data.selectedNFTs.length)} {data.currency}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description */}
                {data.description && (
                    <div>
                        <span className="text-sm font-medium text-gray-700">Beschreibung</span>
                        <p className="mt-2 text-sm text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                            {data.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                    Details bearbeiten
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <ButtonSpinner />
                            Wird verarbeitet...
                        </div>
                    ) : (
                        `${data.selectedNFTs.length} NFT${data.selectedNFTs.length > 1 ? 's' : ''} listen`
                    )}
                </button>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import type { ListingMode } from './UnifiedListingForm';
import { useMarketplaceFees } from '../hooks/useMarketplaceFees';
import { useMarketplaceContracts } from '../hooks/useMarketplaceContracts';

interface TransactionData {
    mode: ListingMode;
    selectedNFT: AggregatedNFT | null;
    price?: string;
    currency?: 'ETH' | 'USDC';
    description?: string;
    duration?: string;
    allowOffers?: boolean;
    tradeType?: 'specific' | 'collection' | 'open';
    targetNFT?: AggregatedNFT | null;
    targetCollection?: string;
}

interface TransactionPreviewProps {
    data: TransactionData;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function TransactionPreview({ data, onConfirm, onCancel, isLoading }: TransactionPreviewProps) {
    const { selectedNFT, mode } = data;

    // Get marketplace address and dynamic fees
    const { marketplaceAddress } = useMarketplaceContracts();
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: selectedNFT?.contractAddress,
        tokenId: selectedNFT?.tokenId
    });

    if (!selectedNFT) {
        return null;
    }

    const renderNFTCard = (nft: AggregatedNFT, title: string) => (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
            <div className="flex gap-4">
                <img
                    src={nft.meta?.image || '/media/custom-nft.jpg'}
                    alt={nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                    className="w-24 h-24 rounded-xl object-cover shadow-md hover:shadow-lg transition-shadow duration-300"
                />
                <div>
                    <h4 className="font-medium text-gray-900">
                        {nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                    </h4>
                    <p className="text-sm text-gray-600">Token ID: {nft.tokenId}</p>
                    <p className="text-xs text-gray-500">
                        {nft.contractAddress.slice(0, 8)}...{nft.contractAddress.slice(-6)}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderPriceSection = () => {
        if (!data.price) return null;

        const fees = calculateFees(parseFloat(data.price));

        return (
            <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Preis {mode === 'hybrid' && '(zusätzlich zum NFT)'}
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Verkaufspreis</span>
                        <span className="text-xl font-bold text-blue-600">
                            {data.price} {data.currency}
                        </span>
                    </div>

                    <div className="bg-white rounded-lg border border-blue-200 p-4 text-xs space-y-2 shadow-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Listing-Preis:</span>
                            <span>{data.price} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
                            <span>-{fees.marketplaceFee.toFixed(4)} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Creator Royalty ({(royaltyFeePercentage * 100).toFixed(2)}%):</span>
                            <span>-{fees.royaltyFee.toFixed(4)} {data.currency}</span>
                        </div>
                        <hr className="border-blue-200" />
                        <div className="flex justify-between font-semibold text-green-600">
                            <span>Sie erhalten:</span>
                            <span>{fees.youReceive.toFixed(4)} {data.currency}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTradeSection = () => {
        if (mode === 'sale') return null;

        return (
            <div className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border border-green-200 rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    NFT-Tausch {mode === 'hybrid' && '(zusätzlich zum Preis)'}
                </h3>

                {data.tradeType === 'specific' && data.targetNFT && (
                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                        <p className="text-xs text-gray-600 mb-2">Gewünschter NFT:</p>
                        <div className="flex gap-3">
                            <img
                                src={data.targetNFT.meta?.image || '/media/custom-nft-3.jpg'}
                                alt={data.targetNFT.core.name || data.targetNFT.meta?.name || `NFT #${data.targetNFT.tokenId}`}
                                className="w-20 h-20 rounded-lg object-cover shadow-md hover:shadow-lg transition-shadow duration-300"
                            />
                            <div>
                                <h4 className="font-medium text-gray-900 text-sm">
                                    {data.targetNFT.core.name || data.targetNFT.meta?.name || `NFT #${data.targetNFT.tokenId}`}
                                </h4>
                                <p className="text-xs text-gray-600">Token ID: {data.targetNFT.tokenId}</p>
                                <p className="text-xs text-gray-500">
                                    {data.targetNFT.contractAddress.slice(0, 8)}...{data.targetNFT.contractAddress.slice(-6)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {data.tradeType === 'collection' && data.targetCollection && (
                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Beliebiger NFT aus Collection:</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                            {data.targetCollection}
                        </p>
                    </div>
                )}

                {data.tradeType === 'open' && (
                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Offen für alle Tausch-Angebote</span>
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const getModeInfo = () => {
        switch (mode) {
            case 'sale':
                return {
                    title: 'Verkaufs-Listing',
                    color: 'blue',
                    icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    )
                };
            case 'trade':
                return {
                    title: 'Tausch-Angebot',
                    color: 'green',
                    icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    )
                };
            case 'hybrid':
                return {
                    title: 'Hybrid-Angebot',
                    color: 'purple',
                    icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    )
                };
        }
    };

    const modeInfo = getModeInfo();

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <svg className={`w-6 h-6 text-${modeInfo.color}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {modeInfo.icon}
                    </svg>
                    {modeInfo.title} überprüfen
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
                {/* NFT */}
                {renderNFTCard(selectedNFT, 'Ihr NFT')}

                {/* Price Section (sale & hybrid) */}
                {renderPriceSection()}

                {/* Trade Section (trade & hybrid) */}
                {renderTradeSection()}

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm font-medium text-gray-700">Listing-Dauer</span>
                        <p className="text-sm text-gray-900">
                            {data.duration === '0' ? 'Keine Begrenzung' : `${data.duration} Tag${data.duration === '1' ? '' : 'e'}`}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700">Modus</span>
                        <p className="text-sm text-gray-900 capitalize">
                            {mode === 'sale' ? 'Nur Verkauf' : mode === 'trade' ? 'Nur Tausch' : 'Verkauf + Tausch'}
                        </p>
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
                    className={`flex-1 py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 ${mode === 'sale'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'
                            : mode === 'trade'
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500'
                                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Wird verarbeitet...
                        </div>
                    ) : (
                        `${mode === 'sale' ? 'Listing' : mode === 'trade' ? 'Tausch-Angebot' : 'Hybrid-Angebot'} erstellen`
                    )}
                </button>
            </div>
        </div>
    );
}

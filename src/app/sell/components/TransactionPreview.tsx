'use client';

import React from 'react';
import { NFTDetails } from '@/types/01-core';

interface TransactionData {
    type: 'sell' | 'trade';
    selectedNFT: NFTDetails | null;
    price?: string;
    currency?: 'ETH' | 'USDC';
    description?: string;
    duration?: string;
    allowOffers?: boolean;
    tradeType?: 'specific' | 'collection' | 'open';
    targetNFT?: NFTDetails | null;
    targetCollection?: string;
    additionalETH?: string;
    tradeConditions?: string;
}

interface TransactionPreviewProps {
    data: TransactionData;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function TransactionPreview({ data, onConfirm, onCancel, isLoading }: TransactionPreviewProps) {
    const { selectedNFT, type } = data;

    if (!selectedNFT) {
        return null;
    }

    const renderSellPreview = () => (
        <div className="space-y-6">
            {/* NFT Details */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">NFT to Sell</h3>
                <div className="flex gap-4">
                    <img
                        src={selectedNFT.imageUrl || selectedNFT.metadata?.image || '/media/custom-nft.jpg'}
                        alt={selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
                        className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                        <h4 className="font-medium text-gray-900">
                            {selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
                        </h4>
                        <p className="text-sm text-gray-600">Token ID: {selectedNFT.tokenId}</p>
                        <p className="text-xs text-gray-500">
                            {selectedNFT.nftAddress.slice(0, 8)}...{selectedNFT.nftAddress.slice(-6)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sale Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div>
                        <span className="text-sm font-medium text-gray-700">Price</span>
                        <p className="text-lg font-bold text-green-600">
                            {data.price} {data.currency}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                        <p className="text-sm text-gray-900">
                            {data.duration === '0' ? 'No expiration' : `${data.duration} days`}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700">Offers</span>
                        <p className="text-sm text-gray-900">
                            {data.allowOffers ? 'Accepting offers' : 'Fixed price only'}
                        </p>
                    </div>
                </div>

                {/* Fee Breakdown */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Fee Breakdown</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Listing Price</span>
                            <span>{data.price} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Marketplace Fee (2.5%)</span>
                            <span>-{data.price ? (parseFloat(data.price) * 0.025).toFixed(4) : '0'} {data.currency}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Creator Royalty (7.5%)</span>
                            <span>-{data.price ? (parseFloat(data.price) * 0.075).toFixed(4) : '0'} {data.currency}</span>
                        </div>
                        <hr className="border-yellow-300" />
                        <div className="flex justify-between font-medium text-green-600">
                            <span>You receive</span>
                            <span>{data.price ? (parseFloat(data.price) * 0.9).toFixed(4) : '0'} {data.currency}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {data.description && (
                <div>
                    <span className="text-sm font-medium text-gray-700">Description</span>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                        {data.description}
                    </p>
                </div>
            )}
        </div>
    );

    const renderTradePreview = () => (
        <div className="space-y-6">
            {/* Your NFT */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Your NFT</h3>
                <div className="flex gap-4">
                    <img
                        src={selectedNFT.imageUrl || selectedNFT.metadata?.image || '/media/custom-nft.jpg'}
                        alt={selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
                        className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                        <h4 className="font-medium text-gray-900">
                            {selectedNFT.metadata?.name || `NFT #${selectedNFT.tokenId}`}
                        </h4>
                        <p className="text-sm text-gray-600">Token ID: {selectedNFT.tokenId}</p>
                        <p className="text-xs text-gray-500">
                            {selectedNFT.nftAddress.slice(0, 8)}...{selectedNFT.nftAddress.slice(-6)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Trade Requirements */}
            <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    What You Want
                </h3>

                {data.tradeType === 'specific' && data.targetNFT && (
                    <div className="flex gap-4">
                        <img
                            src={data.targetNFT.imageUrl || data.targetNFT.metadata?.image || '/media/custom-nft-3.jpg'}
                            alt={data.targetNFT.metadata?.name || `NFT #${data.targetNFT.tokenId}`}
                            className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div>
                            <h4 className="font-medium text-gray-900">
                                {data.targetNFT.metadata?.name || `NFT #${data.targetNFT.tokenId}`}
                            </h4>
                            <p className="text-sm text-gray-600">Token ID: {data.targetNFT.tokenId}</p>
                            <p className="text-xs text-gray-500">
                                {data.targetNFT.nftAddress.slice(0, 8)}...{data.targetNFT.nftAddress.slice(-6)}
                            </p>
                        </div>
                    </div>
                )}

                {data.tradeType === 'collection' && (
                    <div>
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Any NFT from:</span> {data.targetCollection}
                        </p>
                    </div>
                )}

                {data.tradeType === 'open' && (
                    <div>
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Open to any offers</span>
                        </p>
                    </div>
                )}

                {data.additionalETH && parseFloat(data.additionalETH) > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Additional ETH offered:</span> {data.additionalETH} ETH
                        </p>
                    </div>
                )}
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <span className="text-sm font-medium text-gray-700">Trade Type</span>
                    <p className="text-sm text-gray-900 capitalize">
                        {data.tradeType === 'specific' ? 'Specific NFT' :
                            data.tradeType === 'collection' ? 'Collection Trade' :
                                'Open Offers'}
                    </p>
                </div>
                <div>
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                    <p className="text-sm text-gray-900">
                        {data.duration} days
                    </p>
                </div>
            </div>

            {/* Description */}
            {data.description && (
                <div>
                    <span className="text-sm font-medium text-gray-700">Trade Description</span>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                        {data.description}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Review {type === 'sell' ? 'Sale' : 'Trade'}
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

            {type === 'sell' ? renderSellPreview() : renderTradePreview()}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                >
                    Edit Details
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${type === 'sell'
                            ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Processing...
                        </div>
                    ) : (
                        `Confirm ${type === 'sell' ? 'Listing' : 'Trade Offer'}`
                    )}
                </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex">
                    <svg className="flex-shrink-0 h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                        <p className="text-sm text-amber-700">
                            {type === 'sell'
                                ? 'Once confirmed, your NFT will be locked in the marketplace contract until sold or you cancel the listing.'
                                : 'Once confirmed, your NFT will be locked in the trade contract until a matching trade is found or you cancel the offer.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
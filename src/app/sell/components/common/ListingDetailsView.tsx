/**
 * ListingDetailsView Component
 * 
 * Reusable component for displaying listing details (mode, price, description, trade info).
 * Used in preview and transaction pages to show consistent listing information.
 * 
 * @module sell/components/common
 */

'use client';

import React from 'react';
import type { ListingMode, TradeType, Currency } from '../../types';
import { AggregatedNFT } from '@/types/core/core-nft-modern';

interface ListingDetailsViewProps {
    mode: ListingMode;
    price?: string;
    currency?: Currency;
    description?: string;
    tradeType?: TradeType;
    targetNFT?: AggregatedNFT | null;
    targetCollection?: string;
    fees?: {
        marketplaceFee: number;
        royaltyFee: number;
        youReceive: number;
    };
}

export function ListingDetailsView({
    mode,
    price,
    currency = 'ETH',
    description,
    tradeType,
    targetNFT,
    targetCollection,
    fees
}: ListingDetailsViewProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Listing Details</h2>

            {/* Grid Layout for Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Listing Mode Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Listing-Typ</h3>
                    <div className="flex items-center gap-2">
                        {mode === 'sale' && (
                            <>
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Verkauf</p>
                                    <p className="text-xs text-gray-600">Direktverkauf für Kryptowährung</p>
                                </div>
                            </>
                        )}
                        {mode === 'trade' && (
                            <>
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Tausch</p>
                                    <p className="text-xs text-gray-600">NFT gegen NFT tauschen</p>
                                </div>
                            </>
                        )}
                        {mode === 'hybrid' && (
                            <>
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Hybrid</p>
                                    <p className="text-xs text-gray-600">Verkauf + Tausch kombiniert</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Description Card */}
                {description && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Beschreibung</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{description}</p>
                    </div>
                )}
            </div>

            {/* Price Section */}
            {price && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Preis-Details
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Listenpreis</span>
                            <span className="text-lg font-semibold text-gray-900">{price} {currency}</span>
                        </div>
                        {fees && (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Marktplatz-Gebühr (2.5%)</span>
                                    <span className="text-gray-900">{fees.marketplaceFee.toFixed(4)} {currency}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Creator Royalties (5%)</span>
                                    <span className="text-gray-900">{fees.royaltyFee.toFixed(4)} {currency}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Du erhältst</span>
                                        <span className="text-xl font-bold text-blue-600">{fees.youReceive.toFixed(4)} {currency}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Trade Info */}
            {(mode === 'trade' || mode === 'hybrid') && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Tausch-Informationen</h3>
                    {tradeType === 'specific' && targetNFT && (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Gewünschtes NFT:</p>
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                {(targetNFT as any).imageUrl && (
                                    <img
                                        src={(targetNFT as any).imageUrl}
                                        alt={(targetNFT as any).displayName || 'Target NFT'}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">{(targetNFT as any).displayName || 'Unnamed'}</p>
                                    <p className="text-xs text-gray-500">Token ID: {targetNFT.core?.tokenId}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {tradeType === 'collection' && targetCollection && (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Gewünschte Collection:</p>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-900">{targetCollection}</p>
                                <p className="text-xs text-gray-500">Akzeptiert alle NFTs aus dieser Collection</p>
                            </div>
                        </div>
                    )}
                    {tradeType === 'open' && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">Offene Tausch-Angebote akzeptiert</p>
                            <p className="text-xs text-gray-500">Empfängt Angebote für beliebige NFTs</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

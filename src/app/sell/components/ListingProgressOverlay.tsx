'use client';

import React from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';

interface ListingProgressOverlayProps {
    nft: AggregatedNFT;
    mode: 'sale' | 'trade' | 'hybrid';
    price?: string;
    currency?: 'ETH' | 'USDC';
    isVisible: boolean;
}

export function ListingProgressOverlay({ nft, mode, price, currency, isVisible }: ListingProgressOverlayProps) {
    if (!isVisible) return null;

    const getModeIcon = () => {
        switch (mode) {
            case 'sale':
                return (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                );
            case 'trade':
                return (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                );
            case 'hybrid':
                return (
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                );
        }
    };

    const getModeText = () => {
        switch (mode) {
            case 'sale': return 'Verkaufs-Listing';
            case 'trade': return 'Tausch-Angebot';
            case 'hybrid': return 'Hybrid-Angebot';
        }
    };

    const getModeClasses = () => {
        switch (mode) {
            case 'sale':
                return {
                    iconBg: 'bg-blue-50 border-blue-200',
                    pulseBorder: 'border-blue-400',
                    priceBox: 'bg-blue-100 text-blue-700',
                    spinner: 'border-blue-200 border-t-blue-500',
                    dot: 'bg-blue-500'
                };
            case 'trade':
                return {
                    iconBg: 'bg-green-50 border-green-200',
                    pulseBorder: 'border-green-400',
                    priceBox: 'bg-green-100 text-green-700',
                    spinner: 'border-green-200 border-t-green-500',
                    dot: 'bg-green-500'
                };
            case 'hybrid':
                return {
                    iconBg: 'bg-purple-50 border-purple-200',
                    pulseBorder: 'border-purple-400',
                    priceBox: 'bg-purple-100 text-purple-700',
                    spinner: 'border-purple-200 border-t-purple-500',
                    dot: 'bg-purple-500'
                };
        }
    };

    const classes = getModeClasses();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* Header with Icon */}
                <div className="flex flex-col items-center mb-6">
                    <div className={`mb-4 p-4 rounded-full border-2 ${classes.iconBg}`}>
                        {getModeIcon()}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        {getModeText()} wird erstellt
                    </h2>
                    <p className="text-sm text-gray-600 text-center">
                        Bitte bestätigen Sie die Transaktion in Ihrer Wallet
                    </p>
                </div>

                {/* NFT Preview Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 mb-6">
                    <div className="flex gap-4">
                        <div className="relative">
                            <img
                                src={nft.meta?.image || '/media/custom-nft.jpg'}
                                alt={nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                                className="w-24 h-24 rounded-xl object-cover shadow-lg"
                            />
                            {/* Pulsing Border Effect */}
                            <div className={`absolute inset-0 rounded-xl border-2 animate-pulse ${classes.pulseBorder}`}></div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                {nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                Token ID: {nft.tokenId}
                            </p>
                            {price && (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${classes.priceBox}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    {price} {currency}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading Animation */}
                <div className="space-y-4">
                    {/* Spinner */}
                    <div className="flex justify-center">
                        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${classes.spinner}`}></div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-700">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${classes.dot}`}></div>
                            <span>Transaktion wird vorbereitet...</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span>Wallet-Bestätigung erforderlich</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span>Blockchain-Bestätigung wird erwartet</span>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-blue-700">
                            Das Fenster schließt sich automatisch nach erfolgreicher Bestätigung. 
                            Bei Problemen können Sie die Transaktion in Ihrer Wallet abbrechen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

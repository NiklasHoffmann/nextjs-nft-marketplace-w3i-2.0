'use client';

import React, { useState } from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { useMarketplaceContracts, useMarketplaceFees } from '../../hooks';
import { useForm } from '@/hooks';

export type ListingMode = 'sale' | 'trade' | 'hybrid';

interface UnifiedListingFormProps {
    selectedNFT: AggregatedNFT | null;
    isFullyApproved?: boolean;
    isWhitelisted?: boolean;
    whitelistStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    approvalStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    onSubmit: (data: {
        mode: ListingMode;
        price?: string;
        currency?: 'ETH' | 'USDC';
        targetNFT?: AggregatedNFT;
        targetCollection?: string;
        tradeType?: 'specific' | 'collection' | 'open';
        description: string;
    }) => void;
}

export function UnifiedListingForm({ selectedNFT, isFullyApproved = false, isWhitelisted = true, whitelistStatus = 'not-started', approvalStatus = 'not-started', onSubmit }: UnifiedListingFormProps) {
    const [mode, setMode] = useState<ListingMode>('sale');
    const [selectedTargetNFT, setSelectedTargetNFT] = useState<AggregatedNFT | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Get marketplace address and dynamic fees
    const { marketplaceAddress } = useMarketplaceContracts();
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: selectedNFT?.contractAddress,
        tokenId: selectedNFT?.tokenId
    });

    // Form management with useForm hook
    const form = useForm({
        initialValues: {
            price: '',
            currency: 'ETH' as 'ETH' | 'USDC',
            tradeType: 'specific' as 'specific' | 'collection' | 'open',
            targetContractAddress: '',
            targetTokenId: '',
            targetCollection: '',
            description: ''
        },
        validate: (values) => {
            const errors: Record<string, string> = {};

            // Validierung basierend auf dem Modus
            if (mode === 'sale' || mode === 'hybrid') {
                if (!values.price || parseFloat(values.price) <= 0) {
                    errors.price = 'Bitte geben Sie einen gültigen Preis ein';
                }
            }

            if (mode === 'trade' || mode === 'hybrid') {
                if (values.tradeType === 'specific' && !selectedTargetNFT) {
                    // Error wird außerhalb des Forms angezeigt, da selectedTargetNFT kein Form-Feld ist
                    errors.targetContractAddress = 'Bitte wählen Sie den gewünschten NFT aus';
                }
                if (values.tradeType === 'collection' && !values.targetCollection.trim()) {
                    errors.targetCollection = 'Bitte geben Sie die Collection an';
                }
            }

            if (!values.description.trim()) {
                errors.description = 'Bitte fügen Sie eine Beschreibung hinzu';
            }

            return errors;
        },
        onSubmit: (values) => {
            if (!selectedNFT) {
                alert('Bitte wählen Sie zuerst einen NFT aus');
                return;
            }

            onSubmit({
                mode,
                price: (mode === 'sale' || mode === 'hybrid') ? values.price : undefined,
                currency: (mode === 'sale' || mode === 'hybrid') ? values.currency : undefined,
                targetNFT: (mode === 'trade' || mode === 'hybrid') ? selectedTargetNFT || undefined : undefined,
                targetCollection: values.targetCollection || undefined,
                tradeType: (mode === 'trade' || mode === 'hybrid') ? values.tradeType : undefined,
                description: values.description
            });
        }
    });

    const searchNFT = async () => {
        if (!form.values.targetContractAddress || !form.values.targetTokenId) return;

        setIsSearching(true);
        try {
            // Mock search - in production würde hier eine API-Anfrage stattfinden
            const mockResult: AggregatedNFT = {
                key: `${form.values.targetContractAddress}-${form.values.targetTokenId}`,
                contractAddress: form.values.targetContractAddress as `0x${string}`,
                tokenId: form.values.targetTokenId,
                listed: false,
                core: {
                    contractAddress: form.values.targetContractAddress as `0x${string}`,
                    tokenId: form.values.targetTokenId,
                    tokenURI: null,
                    name: `Target NFT #${form.values.targetTokenId}`,
                    owner: '0xOtherUser' as `0x${string}`,
                    symbol: 'TEST',
                    contractName: 'Test Collection',
                    contractSymbol: 'TEST'
                },
                meta: {
                    name: `Target NFT #${form.values.targetTokenId}`,
                    description: 'Target NFT for trade',
                    image: '/media/custom-nft-3.jpg'
                },
                lastUpdated: Date.now(),
                sources: {
                    blockchain: true,
                    metadata: true,
                    marketplace: false,
                    social: false,
                    insights: false
                }
            };

            setSelectedTargetNFT(mockResult);
        } catch (error) {
            console.error('Error searching NFT:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Gebühren berechnen (nur für Verkauf/Hybrid) - dynamisch vom Contract
    const fees = form.values.price && parseFloat(form.values.price) > 0
        ? calculateFees(parseFloat(form.values.price))
        : { marketplaceFee: 0, royaltyFee: 0, youReceive: 0 };

    return (
        <form onSubmit={form.handleSubmit} className="space-y-6">
            {!selectedNFT && (
                <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mt-2">Wählen Sie einen NFT aus, um fortzufahren</p>
                </div>
            )}

            {selectedNFT && (
                <>
                    {/* Listing-Modus Auswahl */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Wie möchten Sie Ihren NFT anbieten?
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Verkaufen */}
                            <button
                                type="button"
                                onClick={() => setMode('sale')}
                                className={`relative rounded-lg border-2 p-4 transition-all ${mode === 'sale'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                    }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`rounded-full p-2.5 mb-2 ${mode === 'sale' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                                        <svg className={`w-6 h-6 ${mode === 'sale' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${mode === 'sale' ? 'text-blue-900' : 'text-gray-700'}`}>
                                        Verkaufen
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">Gegen Geld</span>
                                </div>
                                {mode === 'sale' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Tauschen */}
                            <button
                                type="button"
                                onClick={() => setMode('trade')}
                                className={`relative rounded-lg border-2 p-4 transition-all ${mode === 'trade'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300 bg-white'
                                    }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`rounded-full p-2.5 mb-2 ${mode === 'trade' ? 'bg-green-600' : 'bg-gray-100'}`}>
                                        <svg className={`w-6 h-6 ${mode === 'trade' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${mode === 'trade' ? 'text-green-900' : 'text-gray-700'}`}>
                                        Tauschen
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">Gegen NFT</span>
                                </div>
                                {mode === 'trade' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Hybrid */}
                            <button
                                type="button"
                                onClick={() => setMode('hybrid')}
                                className={`relative rounded-lg border-2 p-4 transition-all ${mode === 'hybrid'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300 bg-white'
                                    }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`rounded-full p-2.5 mb-2 ${mode === 'hybrid' ? 'bg-purple-600' : 'bg-gray-100'}`}>
                                        <svg className={`w-6 h-6 ${mode === 'hybrid' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${mode === 'hybrid' ? 'text-purple-900' : 'text-gray-700'}`}>
                                        Hybrid
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">NFT + Geld</span>
                                </div>
                                {mode === 'hybrid' && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Preis-Sektion (für Verkauf und Hybrid) */}
                    {(mode === 'sale' || mode === 'hybrid') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Preis {mode === 'hybrid' && '(zusätzlich zum NFT)'}
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verkaufspreis *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...form.getFieldProps('price')}
                                        className={`flex-1 rounded-lg border ${form.hasError('price') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        placeholder="0.00"
                                    />
                                    <select
                                        {...form.getFieldProps('currency')}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="ETH">ETH</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                {form.hasError('price') && (
                                    <p className="mt-1 text-sm text-red-600">{form.getFieldError('price')}</p>
                                )}

                                {/* Gebühren-Übersicht */}
                                {form.values.price && parseFloat(form.values.price) > 0 && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 text-xs space-y-1">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
                                            <span>{fees.marketplaceFee.toFixed(4)} {form.values.currency}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Royalty-Gebühr ({(royaltyFeePercentage * 100).toFixed(2)}%):</span>
                                            <span>{fees.royaltyFee.toFixed(4)} {form.values.currency}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-1 mt-2 flex justify-between font-semibold text-gray-900">
                                            <span>Sie erhalten:</span>
                                            <span>{fees.youReceive.toFixed(4)} {form.values.currency}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tausch-Sektion (für Tausch und Hybrid) */}
                    {(mode === 'trade' || mode === 'hybrid') && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                NFT-Tausch {mode === 'hybrid' && '(zusätzlich zum Preis)'}
                            </h3>

                            {/* Trade Type Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Was suchen Sie?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="specific"
                                            checked={form.values.tradeType === 'specific'}
                                            onChange={(e) => form.setFieldValue('tradeType', e.target.value as any)}
                                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Bestimmter NFT</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="collection"
                                            checked={form.values.tradeType === 'collection'}
                                            onChange={(e) => form.setFieldValue('tradeType', e.target.value as any)}
                                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Beliebiger NFT aus Collection</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="open"
                                            checked={form.values.tradeType === 'open'}
                                            onChange={(e) => form.setFieldValue('tradeType', e.target.value as any)}
                                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Offen für Angebote</span>
                                    </label>
                                </div>
                            </div>

                            {/* Specific NFT */}
                            {form.values.tradeType === 'specific' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contract Address
                                        </label>
                                        <input
                                            type="text"
                                            {...form.getFieldProps('targetContractAddress')}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                            placeholder="0x..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Token ID
                                        </label>
                                        <input
                                            type="text"
                                            {...form.getFieldProps('targetTokenId')}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                            placeholder="1"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={searchNFT}
                                        disabled={isSearching || !form.values.targetContractAddress || !form.values.targetTokenId}
                                        className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
                                    >
                                        {isSearching ? 'Suche...' : 'NFT suchen'}
                                    </button>

                                    {selectedTargetNFT && (
                                        <div className="mt-2 p-3 bg-white border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={selectedTargetNFT.meta?.image || '/media/custom-nft-3.jpg'}
                                                    alt={selectedTargetNFT.meta?.name || 'NFT'}
                                                    className="w-12 h-12 rounded-lg object-cover shadow-sm hover:shadow-md transition-shadow duration-300"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {selectedTargetNFT.meta?.name || `NFT #${selectedTargetNFT.tokenId}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {selectedTargetNFT.core.contractName || selectedTargetNFT.contractAddress}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTargetNFT(null)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Collection */}
                            {form.values.tradeType === 'collection' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Collection Address
                                    </label>
                                    <input
                                        type="text"
                                        {...form.getFieldProps('targetCollection')}
                                        className={`w-full rounded-lg border ${form.hasError('targetCollection') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                                        placeholder="0x..."
                                    />
                                    {form.hasError('targetCollection') && (
                                        <p className="mt-1 text-sm text-red-600">{form.getFieldError('targetCollection')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Beschreibung (für alle Modi) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beschreibung *
                        </label>
                        <textarea
                            {...form.getFieldProps('description')}
                            rows={4}
                            className={`w-full rounded-lg border ${form.hasError('description') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            placeholder={
                                mode === 'sale'
                                    ? 'Warum verkaufen Sie diesen NFT?'
                                    : mode === 'trade'
                                        ? 'Beschreiben Sie Ihre Tauschbedingungen...'
                                        : 'Beschreiben Sie Ihr Angebot...'
                            }
                        />
                        {form.hasError('description') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('description')}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={whitelistStatus !== 'done' || approvalStatus === 'checking' || !form.isValid}
                        className={`w-full px-6 py-3 rounded-lg text-white font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 ${whitelistStatus !== 'done' || approvalStatus === 'checking' || !form.isValid
                            ? 'bg-gray-400 cursor-not-allowed'
                            : mode === 'sale'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : mode === 'trade'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                    >
                        {whitelistStatus === 'failed' ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Collection nicht whitelisted
                            </>
                        ) : whitelistStatus === 'checking' ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Prüfe Whitelist...
                            </>
                        ) : approvalStatus === 'checking' ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Prüfe Approval...
                            </>
                        ) : approvalStatus === 'failed' ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                {mode === 'sale' && 'Approve & List for Sale'}
                                {mode === 'trade' && 'Approve & Create Trade Offer'}
                                {mode === 'hybrid' && 'Approve & Create Hybrid Offer'}
                            </>
                        ) : (
                            <>
                                {mode === 'sale' && 'Listing erstellen'}
                                {mode === 'trade' && 'Tausch-Angebot erstellen'}
                                {mode === 'hybrid' && 'Hybrid-Angebot erstellen'}
                            </>
                        )}
                    </button>
                </>
            )}
        </form>
    );
}
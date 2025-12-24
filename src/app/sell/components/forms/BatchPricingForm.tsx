'use client';

import React, { useState } from 'react';
import { useForm } from '@/hooks/useForm';

interface BatchPricingFormProps {
    selectedCount: number;
    whitelistStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    approvalStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    onSubmit: (data: {
        pricingType: 'fixed' | 'variable';
        fixedPrice?: string;
        startPrice?: string;
        endPrice?: string;
        currency: 'ETH' | 'USDC';
        description: string;
    }) => void;
}

export function BatchPricingForm({ selectedCount, whitelistStatus = 'not-started', approvalStatus = 'not-started', onSubmit }: BatchPricingFormProps) {
    const [pricingType, setPricingType] = useState<'fixed' | 'variable'>('fixed');

    const form = useForm({
        initialValues: {
            fixedPrice: '',
            startPrice: '',
            endPrice: '',
            currency: 'ETH' as 'ETH' | 'USDC',
            description: ''
        },
        validate: (values) => {
            const errors: Record<string, string> = {};

            if (pricingType === 'fixed') {
                if (!values.fixedPrice || parseFloat(values.fixedPrice) <= 0) {
                    errors.fixedPrice = 'Bitte geben Sie einen gültigen Preis ein';
                }
            } else {
                if (!values.startPrice || parseFloat(values.startPrice) <= 0) {
                    errors.startPrice = 'Bitte geben Sie einen gültigen Startpreis ein';
                }
                if (!values.endPrice || parseFloat(values.endPrice) <= 0) {
                    errors.endPrice = 'Bitte geben Sie einen gültigen Endpreis ein';
                }
                if (values.startPrice && values.endPrice && parseFloat(values.startPrice) >= parseFloat(values.endPrice)) {
                    errors.endPrice = 'Endpreis muss höher als Startpreis sein';
                }
            }

            if (!values.description.trim()) {
                errors.description = 'Bitte geben Sie eine Beschreibung ein';
            }

            return errors;
        },
        onSubmit: (values) => {
            onSubmit({
                pricingType,
                fixedPrice: pricingType === 'fixed' ? values.fixedPrice : undefined,
                startPrice: pricingType === 'variable' ? values.startPrice : undefined,
                endPrice: pricingType === 'variable' ? values.endPrice : undefined,
                currency: values.currency,
                description: values.description
            });
        }
    });

    return (
        <form onSubmit={form.handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preis-Konfiguration</h3>

            {/* Pricing Type Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preis-Strategie
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPricingType('fixed')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pricingType === 'fixed'
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md'
                                : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                    >
                        <div className="text-center">
                            <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'fixed' ? 'text-purple-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-10 5h10" />
                            </svg>
                            <span className={`text-sm font-medium ${pricingType === 'fixed' ? 'text-purple-900' : 'text-gray-700'}`}>
                                Fester Preis
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPricingType('variable')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pricingType === 'variable'
                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md'
                                : 'border-gray-200 hover:border-green-300 bg-white'
                        }`}
                    >
                        <div className="text-center">
                            <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'variable' ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <span className={`text-sm font-medium ${pricingType === 'variable' ? 'text-green-900' : 'text-gray-700'}`}>
                                Variable Preise
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Fixed Price */}
            {pricingType === 'fixed' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preis für alle {selectedCount} NFTs *
                    </label>
                    <div className="flex">
                        <input
                            type="number"
                            step="0.0001"
                            {...form.getFieldProps('fixedPrice')}
                            className={`flex-1 rounded-l-lg border ${form.hasError('fixedPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm`}
                            placeholder="0.00"
                        />
                        <select
                            {...form.getFieldProps('currency')}
                            className="rounded-r-lg border border-l-0 border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm"
                        >
                            <option value="ETH">ETH</option>
                            <option value="USDC">USDC</option>
                        </select>
                    </div>
                    {form.hasError('fixedPrice') && (
                        <p className="mt-1 text-sm text-red-600">{form.getFieldError('fixedPrice')}</p>
                    )}
                </div>
            )}

            {/* Variable Price Range */}
            {pricingType === 'variable' && (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Startpreis (niedrigster) *
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                step="0.0001"
                                {...form.getFieldProps('startPrice')}
                                className={`flex-1 rounded-l-lg border ${form.hasError('startPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm`}
                                placeholder="0.00"
                            />
                            <select
                                {...form.getFieldProps('currency')}
                                className="rounded-r-lg border border-l-0 border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm"
                            >
                                <option value="ETH">ETH</option>
                                <option value="USDC">USDC</option>
                            </select>
                        </div>
                        {form.hasError('startPrice') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('startPrice')}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Endpreis (höchster) *
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            {...form.getFieldProps('endPrice')}
                            className={`w-full rounded-lg border ${form.hasError('endPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm`}
                            placeholder="0.00"
                        />
                        {form.hasError('endPrice') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('endPrice')}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Preise werden gleichmäßig zwischen Start und Ende verteilt
                        </p>
                    </div>
                </>
            )}

            {/* Description */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung *
                </label>
                <textarea
                    {...form.getFieldProps('description')}
                    rows={3}
                    className={`w-full rounded-xl border ${form.hasError('description') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm`}
                    placeholder="Beschreiben Sie Ihre Batch-Listings..."
                />
                {form.hasError('description') && (
                    <p className="mt-1 text-sm text-red-600">{form.getFieldError('description')}</p>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={whitelistStatus !== 'done' || approvalStatus === 'checking'}
                className={`w-full px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 transform flex items-center justify-center gap-2 ${
                    whitelistStatus !== 'done' || approvalStatus === 'checking'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105'
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
                        Approve & List {selectedCount} NFT{selectedCount > 1 ? 's' : ''}
                    </>
                ) : (
                    `${selectedCount} NFT${selectedCount > 1 ? 's' : ''} listen`
                )}
            </button>
        </form>
    );
}

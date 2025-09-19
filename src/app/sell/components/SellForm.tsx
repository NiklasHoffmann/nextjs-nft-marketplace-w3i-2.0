'use client';

import React, { useState } from 'react';
import { NFTDetails } from '@/types/01-core';

interface SellFormProps {
    selectedNFT: NFTDetails | null;
    onSubmit: (data: {
        price: string;
        currency: 'ETH' | 'USDC';
        description: string;
        duration: string;
        allowOffers: boolean;
    }) => void;
}

export function SellForm({ selectedNFT, onSubmit }: SellFormProps) {
    const [formData, setFormData] = useState({
        price: '',
        currency: 'ETH' as 'ETH' | 'USDC',
        description: '',
        duration: '7', // days
        allowOffers: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Please enter a valid price';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Please add a description';
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
            onSubmit(formData);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Estimate marketplace fees
    const marketplaceFee = formData.price ? (parseFloat(formData.price) * 0.025).toFixed(4) : '0';
    const royaltyFee = formData.price ? (parseFloat(formData.price) * 0.075).toFixed(4) : '0';
    const youReceive = formData.price ? (parseFloat(formData.price) * 0.9).toFixed(4) : '0';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedNFT && (
                <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mt-2">Select an NFT to configure sale details</p>
                </div>
            )}

            {selectedNFT && (
                <>
                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price *
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', e.target.value)}
                                className={`flex-1 rounded-l-md border ${errors.price ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                                placeholder="0.00"
                            />
                            <select
                                value={formData.currency}
                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            >
                                <option value="ETH">ETH</option>
                                <option value="USDC">USDC</option>
                            </select>
                        </div>
                        {errors.price && (
                            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className={`w-full rounded-md border ${errors.description ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                            placeholder="Describe why you're selling this NFT..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Listing Duration
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
                            <option value="0">No expiration</option>
                        </select>
                    </div>

                    {/* Allow Offers */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="allowOffers"
                            checked={formData.allowOffers}
                            onChange={(e) => handleInputChange('allowOffers', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowOffers" className="ml-2 text-sm text-gray-700">
                            Allow offers below asking price
                        </label>
                    </div>

                    {/* Fee Breakdown */}
                    {formData.price && parseFloat(formData.price) > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Fee Breakdown</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Listing Price</span>
                                    <span className="font-medium">{formData.price} {formData.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Marketplace Fee (2.5%)</span>
                                    <span className="text-red-600">-{marketplaceFee} {formData.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Creator Royalty (7.5%)</span>
                                    <span className="text-red-600">-{royaltyFee} {formData.currency}</span>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-900">You receive</span>
                                    <span className="text-green-600">{youReceive} {formData.currency}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                        Review Listing
                    </button>
                </>
            )}
        </form>
    );
}
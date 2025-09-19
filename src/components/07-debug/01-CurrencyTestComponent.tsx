"use client";

import { useState } from 'react';
import { useETHPrice, useCurrency } from '@/contexts/OptimizedCurrencyContext';
import { formatEther } from '@/utils';

/**
 * Debug component to test currency conversions
 * Remove this component in production
 */
export function CurrencyTestComponent() {
    const [testAmount, setTestAmount] = useState<string>('1');
    const { selectedCurrency, setCurrency, currencies } = useCurrency();

    const ethAmount = parseFloat(testAmount) || 0;
    const { convertedPrice, loading } = useETHPrice(ethAmount);

    // Test with Wei values
    const testWeiValues = [
        '1000000000000000000',    // 1 ETH
        '500000000000000000',     // 0.5 ETH  
        '100000000000000000',     // 0.1 ETH
        '10000000000000000',      // 0.01 ETH
        '1000000000000000',       // 0.001 ETH
    ];

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Currency Conversion Test</h2>

            {/* Currency Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Currency:
                </label>
                <select
                    value={selectedCurrency.code}
                    onChange={(e) => {
                        const currency = currencies.find(c => c.code === e.target.value);
                        if (currency) setCurrency(currency);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2"
                >
                    {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.name} ({currency.symbol})
                        </option>
                    ))}
                </select>
            </div>

            {/* ETH Amount Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ETH Amount:
                </label>
                <input
                    type="number"
                    step="0.0001"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    placeholder="Enter ETH amount"
                />
            </div>

            {/* Conversion Result */}
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <h3 className="font-semibold text-blue-900 mb-2">Conversion Result:</h3>
                <div className="text-lg">
                    <span className="font-mono">{ethAmount} ETH</span>
                    <span className="mx-2">→</span>
                    {loading ? (
                        <span className="text-gray-500">Converting...</span>
                    ) : (
                        <span className="font-bold text-blue-600">{convertedPrice}</span>
                    )}
                </div>
            </div>

            {/* Wei Conversion Tests */}
            <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Wei → ETH Conversion Tests:</h3>
                <div className="space-y-2">
                    {testWeiValues.map((weiValue, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm text-gray-600">
                                {weiValue} Wei
                            </span>
                            <span className="font-semibold">
                                {formatEther(weiValue)} ETH
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-gray-500 mt-4">
                <p>Current Currency: {selectedCurrency.code}</p>
                <p>Open browser console for detailed conversion logs</p>
            </div>
        </div>
    );
}
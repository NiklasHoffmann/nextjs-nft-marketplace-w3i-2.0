'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, Currency } from '@/contexts/CurrencyContext';

export default function CurrencySelector() {
    const { selectedCurrency, setCurrency, currencies } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    const handleCurrencySelect = (currency: Currency) => {
        setCurrency(currency);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Currency Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 h-10"
                aria-label="Select Currency"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-base">{selectedCurrency.flag}</span>
                <span className="font-medium text-gray-700">{selectedCurrency.code}</span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-48 max-h-60 overflow-y-auto">
                    <div className="py-1" role="listbox">
                        {currencies.map((currency: Currency) => (
                            <button
                                key={currency.code}
                                onClick={() => handleCurrencySelect(currency)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center gap-3 ${selectedCurrency.code === currency.code
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700'
                                    }`}
                                role="option"
                                aria-selected={selectedCurrency.code === currency.code}
                            >
                                <span className="text-lg">{currency.flag}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{currency.code}</span>
                                        <span className="text-sm text-gray-500">{currency.symbol}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-0.5">{currency.name}</div>
                                </div>
                                {selectedCurrency.code === currency.code && (
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

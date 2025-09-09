'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    flag: string;
}

export const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
];

interface CurrencyContextType {
    selectedCurrency: Currency;
    setCurrency: (currency: Currency) => void;
    currencies: Currency[];
    // Helper functions for currency conversion
    formatPrice: (price: number) => string;
    convertFromETH: (ethPrice: number) => Promise<number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Simple exchange rate API (you can replace with your preferred API)
const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
    try {
        // Using CoinGecko API for ETH price and exchange rates
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=${toCurrency.toLowerCase()}`);
        const data = await response.json();

        console.log('CoinGecko API Response:', data); // Debug log

        const rate = data?.ethereum?.[toCurrency.toLowerCase()];
        console.log(`ETH to ${toCurrency} rate:`, rate); // Debug log

        if (rate && rate > 0) {
            return rate;
        }

        // Fallback rates if API fails
        const fallbackRates: { [key: string]: number } = {
            'USD': 2500,
            'EUR': 2300,
            'GBP': 2000,
            'JPY': 380000,
            'CHF': 2250,
            'CAD': 3400
        };

        return fallbackRates[toCurrency] || 2500;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);

        // Fallback rates if API fails
        const fallbackRates: { [key: string]: number } = {
            'USD': 2500,
            'EUR': 2300,
            'GBP': 2000,
            'JPY': 380000,
            'CHF': 2250,
            'CAD': 3400
        };

        return fallbackRates[toCurrency] || 2500;
    }
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
    const [isClient, setIsClient] = useState(false);

    // Handle client-side mounting
    useEffect(() => {
        setIsClient(true);

        // Load from localStorage on client side
        const savedCurrency = localStorage.getItem('selectedCurrency');
        if (savedCurrency) {
            try {
                const parsed = JSON.parse(savedCurrency);
                const found = currencies.find(c => c.code === parsed.code);
                if (found) {
                    setSelectedCurrency(found);
                }
            } catch (error) {
                console.error('Error loading saved currency:', error);
            }
        }
    }, []);

    const setCurrency = (currency: Currency) => {
        setSelectedCurrency(currency);
        if (isClient) {
            try {
                localStorage.setItem('selectedCurrency', JSON.stringify(currency));
            } catch (error) {
                console.error('Error saving currency:', error);
            }
        }
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(price);
    };

    const convertFromETH = async (ethPrice: number): Promise<number> => {
        if (selectedCurrency.code === 'ETH') return ethPrice;

        try {
            // Get current ETH price in the selected currency
            const ethToFiat = await getExchangeRate('ethereum', selectedCurrency.code);
            return ethPrice * ethToFiat;
        } catch (error) {
            console.error('Error converting currency:', error);
            return ethPrice * 2000; // Fallback conversion
        }
    };

    const contextValue: CurrencyContextType = {
        selectedCurrency,
        setCurrency,
        currencies,
        formatPrice,
        convertFromETH,
    };

    return (
        <CurrencyContext.Provider value={contextValue}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

// Helper hook for converting ETH prices
export function useETHPrice(ethAmount: number) {
    const { selectedCurrency, formatPrice } = useCurrency();
    const [convertedPrice, setConvertedPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const convert = async () => {
            setLoading(true);
            try {
                // Static exchange rates for now - can be replaced with API later
                const ethToFiatRates: { [key: string]: number } = {
                    'USD': 2500,  // 1 ETH = $2500
                    'EUR': 2300,  // 1 ETH = €2300
                    'GBP': 2000,  // 1 ETH = £2000
                    'JPY': 380000, // 1 ETH = ¥380,000
                    'CHF': 2250,  // 1 ETH = CHF 2250
                    'CAD': 3400   // 1 ETH = C$3400
                };

                const rate = ethToFiatRates[selectedCurrency.code] || 2500;
                const convertedAmount = ethAmount * rate;

                console.log(`Converting ${ethAmount} ETH to ${selectedCurrency.code}: ${convertedAmount} (rate: ${rate})`);

                setConvertedPrice(formatPrice(convertedAmount));
            } catch (error) {
                console.error('Error converting price:', error);
                setConvertedPrice(`${ethAmount} ETH`);
            } finally {
                setLoading(false);
            }
        };

        convert();
    }, [ethAmount, selectedCurrency, formatPrice]);

    return { convertedPrice, loading };
}

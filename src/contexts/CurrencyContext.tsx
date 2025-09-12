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
    // Manual cache management
    refreshExchangeRates: () => Promise<void>;
    getCacheInfo: () => { status: string; lastUpdate: string | null };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Configuration from environment variables
const API_CONFIG = {
    coinbaseUrl: process.env.NEXT_PUBLIC_COINBASE_API_URL || 'https://api.coinbase.com/v2/exchange-rates',
    cryptoCompareUrl: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_URL || 'https://min-api.cryptocompare.com/data/pricemulti',
    coinbaseApiKey: process.env.NEXT_PUBLIC_COINBASE_API_KEY,
    cryptoCompareApiKey: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY,
    cacheHours: parseInt(process.env.NEXT_PUBLIC_EXCHANGE_RATE_CACHE_HOURS || '24'),
    updateIntervalHours: parseInt(process.env.NEXT_PUBLIC_EXCHANGE_RATE_UPDATE_INTERVAL_HOURS || '6'),
    debugMode: process.env.NEXT_PUBLIC_CURRENCY_DEBUG_MODE === 'true',
};

// Simple exchange rate API with multiple providers and auto-updating fallbacks
const getExchangeRate = async (_fromCurrency: string, toCurrency: string): Promise<number> => {
    try {
        // Primary API: Coinbase
        const coinbaseRate = await getCoinbaseRate(toCurrency);
        if (coinbaseRate && coinbaseRate > 0) {
            console.log(`Using Coinbase rate for ETH → ${toCurrency}: ${coinbaseRate}`);
            updateFallbackRates(toCurrency, coinbaseRate);
            return coinbaseRate;
        }

        // Fallback API: CryptoCompare
        const cryptoCompareRate = await getCryptoCompareRate(toCurrency);
        if (cryptoCompareRate && cryptoCompareRate > 0) {
            console.log(`Using CryptoCompare rate for ETH → ${toCurrency}: ${cryptoCompareRate}`);
            updateFallbackRates(toCurrency, cryptoCompareRate);
            return cryptoCompareRate;
        }

        // Use stored fallback rates
        const fallbackRate = getFallbackRate(toCurrency);
        console.log(`Using fallback rate for ETH → ${toCurrency}: ${fallbackRate}`);
        return fallbackRate;

    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return getFallbackRate(toCurrency);
    }
};

// Coinbase API implementation
const getCoinbaseRate = async (toCurrency: string): Promise<number | null> => {
    try {
        const url = `${API_CONFIG.coinbaseUrl}?currency=ETH`;
        const headers: HeadersInit = {
            'Accept': 'application/json',
        };

        // Add API key if available
        if (API_CONFIG.coinbaseApiKey) {
            headers['Authorization'] = `Bearer ${API_CONFIG.coinbaseApiKey}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Coinbase API error: ${response.status}`);
        }

        const data = await response.json();

        if (API_CONFIG.debugMode) {
            console.log('Coinbase API Response:', data);
        }

        const rate = data?.data?.rates?.[toCurrency];
        return rate ? parseFloat(rate) : null;

    } catch (error) {
        console.error('Coinbase API error:', error);
        return null;
    }
};

// CryptoCompare API implementation
const getCryptoCompareRate = async (toCurrency: string): Promise<number | null> => {
    try {
        // Map all our supported currencies for the API call
        const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD'].join(',');
        const url = `${API_CONFIG.cryptoCompareUrl}?fsyms=ETH&tsyms=${supportedCurrencies}`;

        const headers: HeadersInit = {
            'Accept': 'application/json',
        };

        // Add API key if available
        if (API_CONFIG.cryptoCompareApiKey) {
            headers['Authorization'] = `Apikey ${API_CONFIG.cryptoCompareApiKey}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`CryptoCompare API error: ${response.status}`);
        }

        const data = await response.json();

        if (API_CONFIG.debugMode) {
            console.log('CryptoCompare API Response:', data);
        }

        const rate = data?.ETH?.[toCurrency];
        return rate ? parseFloat(rate) : null;

    } catch (error) {
        console.error('CryptoCompare API error:', error);
        return null;
    }
};

// Fallback rates management with localStorage caching
const FALLBACK_STORAGE_KEY = 'eth_exchange_rates_fallback';
const FALLBACK_EXPIRY_KEY = 'eth_exchange_rates_expiry';

// Get cached fallback rate
const getFallbackRate = (toCurrency: string): number => {
    try {
        const cached = localStorage.getItem(FALLBACK_STORAGE_KEY);
        const expiry = localStorage.getItem(FALLBACK_EXPIRY_KEY);

        if (cached && expiry) {
            const expiryTime = parseInt(expiry);
            const now = Date.now();

            if (now < expiryTime) {
                const rates = JSON.parse(cached);
                if (rates[toCurrency]) {
                    return rates[toCurrency];
                }
            }
        }
    } catch (error) {
        console.error('Error reading cached fallback rates:', error);
    }

    // Default fallback rates (updated September 2025)
    const defaultRates: { [key: string]: number } = {
        'USD': 3500,   // 1 ETH = $3500
        'EUR': 3200,   // 1 ETH = €3200  
        'GBP': 2800,   // 1 ETH = £2800
        'JPY': 520000, // 1 ETH = ¥520,000
        'CHF': 3100,   // 1 ETH = CHF 3100
        'CAD': 4700    // 1 ETH = C$4700
    };

    return defaultRates[toCurrency] || 3500;
};

// Update fallback rates in localStorage
const updateFallbackRates = (currency: string, rate: number): void => {
    try {
        const cached = localStorage.getItem(FALLBACK_STORAGE_KEY);
        let rates: { [key: string]: number } = {};

        if (cached) {
            try {
                rates = JSON.parse(cached);
            } catch (e) {
                console.error('Error parsing cached rates:', e);
            }
        }

        rates[currency] = rate;

        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(rates));
        localStorage.setItem(FALLBACK_EXPIRY_KEY, (Date.now() + (API_CONFIG.cacheHours * 60 * 60 * 1000)).toString());

        console.log(`Updated fallback rate for ${currency}: ${rate}`);
    } catch (error) {
        console.error('Error updating fallback rates:', error);
    }
};

// Get cache status for debugging
const getCacheStatus = (): string => {
    try {
        const expiry = localStorage.getItem(FALLBACK_EXPIRY_KEY);
        if (!expiry) return 'No cache';

        const expiryTime = parseInt(expiry);
        const now = Date.now();

        if (now < expiryTime) {
            const hoursLeft = Math.round((expiryTime - now) / (1000 * 60 * 60));
            return `Fresh (${hoursLeft}h left)`;
        } else {
            return 'Expired';
        }
    } catch {
        return 'Error';
    }
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
    const [isClient, setIsClient] = useState(false);

    // Handle client-side mounting and initialize fallback update system
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

        // Initialize automatic fallback rate updates
        initializeFallbackUpdateSystem();
    }, []);

    // Auto-update fallback rates system
    const initializeFallbackUpdateSystem = () => {
        const updateAllFallbackRates = async () => {
            console.log('🔄 Updating fallback exchange rates...');

            const currencyCodes = currencies.map(c => c.code);

            for (const currencyCode of currencyCodes) {
                try {
                    // Try to get fresh rate from APIs
                    const rate = await getExchangeRate('ethereum', currencyCode);
                    if (rate > 0) {
                        console.log(`✅ Updated ${currencyCode}: ${rate}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to update ${currencyCode}:`, error);
                }

                // Small delay between requests to be nice to APIs
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log('🎉 Fallback rate update cycle completed');
        };

        // Update immediately if cache is expired
        const checkAndUpdate = () => {
            const expiry = localStorage.getItem(FALLBACK_EXPIRY_KEY);
            if (!expiry || Date.now() > parseInt(expiry)) {
                updateAllFallbackRates();
            }
        };

        // Check on load
        checkAndUpdate();

        // Set up interval for regular updates (configurable hours)
        const interval = setInterval(checkAndUpdate, API_CONFIG.updateIntervalHours * 60 * 60 * 1000);

        // Cleanup
        return () => clearInterval(interval);
    };

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
        // Dynamic decimal places based on value size
        let minimumFractionDigits = 2;
        let maximumFractionDigits = 2;

        if (selectedCurrency.code === 'JPY') {
            // Japanese Yen typically doesn't use decimals
            minimumFractionDigits = 0;
            maximumFractionDigits = 0;
        } else if (price < 1) {
            // For small values, show more decimals
            minimumFractionDigits = 4;
            maximumFractionDigits = 6;
        } else if (price < 10) {
            // For values less than 10, show 4 decimals
            minimumFractionDigits = 2;
            maximumFractionDigits = 4;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency.code,
            minimumFractionDigits,
            maximumFractionDigits,
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

    // Manual refresh function
    const refreshExchangeRates = async (): Promise<void> => {
        console.log('🔄 Manually refreshing exchange rates...');
        const currencyCodes = currencies.map(c => c.code);

        for (const currencyCode of currencyCodes) {
            try {
                const rate = await getExchangeRate('ethereum', currencyCode);
                if (rate > 0) {
                    console.log(`✅ Refreshed ${currencyCode}: ${rate}`);
                }
            } catch (error) {
                console.error(`❌ Failed to refresh ${currencyCode}:`, error);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('🎉 Manual refresh completed');
    };

    // Get cache info
    const getCacheInfo = () => {
        const status = getCacheStatus();
        const expiry = localStorage.getItem(FALLBACK_EXPIRY_KEY);
        const lastUpdate = expiry ? new Date(parseInt(expiry) - (API_CONFIG.cacheHours * 60 * 60 * 1000)).toLocaleString() : null;

        return { status, lastUpdate };
    };

    const contextValue: CurrencyContextType = {
        selectedCurrency,
        setCurrency,
        currencies,
        formatPrice,
        convertFromETH,
        refreshExchangeRates,
        getCacheInfo,
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
                // Use the same getExchangeRate function for consistency
                const rate = await getExchangeRate('ethereum', selectedCurrency.code);
                const convertedAmount = ethAmount * rate;

                console.log(`[Currency Conversion Debug]`);
                console.log(`- ETH Amount: ${ethAmount}`);
                console.log(`- Target Currency: ${selectedCurrency.code}`);
                console.log(`- Exchange Rate: ${rate}`);
                console.log(`- Converted Amount: ${convertedAmount}`);
                console.log(`- Formatted Result: ${formatPrice(convertedAmount)}`);
                console.log(`- Cache Status: ${getCacheStatus()}`);

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

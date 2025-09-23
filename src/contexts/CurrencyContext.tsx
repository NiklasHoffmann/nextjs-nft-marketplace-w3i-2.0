'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';

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
    formatPrice: (price: number) => string;
    convertFromETH: (ethPrice: number) => Promise<number>;
    refreshExchangeRates: () => Promise<void>;
    getCacheInfo: () => { status: string; lastUpdate: string | null };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Enhanced cache management
const EXCHANGE_RATE_CACHE_KEY = 'eth_exchange_rates_optimized';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

class ExchangeRateCache {
    private cache: Map<string, { rate: number; timestamp: number }> = new Map();
    private inFlightRequests: Map<string, Promise<number>> = new Map();

    async getRate(currency: string): Promise<number> {
        const cacheKey = `ETH_${currency}`;

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.rate;
        }

        // Check if request is already in flight
        const inFlight = this.inFlightRequests.get(cacheKey);
        if (inFlight) {
            return inFlight;
        }

        // Make new request
        const requestPromise = this.fetchRate(currency);
        this.inFlightRequests.set(cacheKey, requestPromise);

        try {
            const rate = await requestPromise;
            this.cache.set(cacheKey, { rate, timestamp: Date.now() });
            this.saveToLocalStorage();
            return rate;
        } finally {
            this.inFlightRequests.delete(cacheKey);
        }
    }

    private async fetchRate(currency: string): Promise<number> {
        try {
            // Try Coinbase first
            const coinbaseRate = await this.fetchCoinbaseRate(currency);
            if (coinbaseRate > 0) return coinbaseRate;

            // Fallback to CryptoCompare
            const cryptoCompareRate = await this.fetchCryptoCompareRate(currency);
            if (cryptoCompareRate > 0) return cryptoCompareRate;

            // Use default fallback
            return this.getDefaultRate(currency);
        } catch (error) {
            console.error(`Error fetching rate for ${currency}:`, error);
            return this.getDefaultRate(currency);
        }
    }

    private async fetchCoinbaseRate(currency: string): Promise<number> {
        try {
            const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=ETH`);
            if (!response.ok) throw new Error(`Coinbase API error: ${response.status}`);

            const data = await response.json();
            const rate = data?.data?.rates?.[currency];
            return rate ? parseFloat(rate) : 0;
        } catch {
            return 0;
        }
    }

    private async fetchCryptoCompareRate(currency: string): Promise<number> {
        try {
            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH&tsyms=${currency}`);
            if (!response.ok) throw new Error(`CryptoCompare API error: ${response.status}`);

            const data = await response.json();
            const rate = data?.ETH?.[currency];
            return rate ? parseFloat(rate) : 0;
        } catch {
            return 0;
        }
    }

    private getDefaultRate(currency: string): number {
        const defaultRates: { [key: string]: number } = {
            'USD': 3500,
            'EUR': 3200,
            'GBP': 2800,
            'JPY': 520000,
            'CHF': 3100,
            'CAD': 4700
        };
        return defaultRates[currency] || 3500;
    }

    loadFromLocalStorage() {
        try {
            const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                this.cache = new Map(data.entries);
            }
        } catch (error) {
            console.error('Error loading cache from localStorage:', error);
        }
    }

    private saveToLocalStorage() {
        try {
            const data = {
                entries: Array.from(this.cache.entries())
            };
            localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving cache to localStorage:', error);
        }
    }

    getCacheStatus(): string {
        if (this.cache.size === 0) return 'Empty';

        const oldestEntry = Math.min(...Array.from(this.cache.values()).map(v => v.timestamp));
        const age = Date.now() - oldestEntry;
        const minutesAge = Math.floor(age / (1000 * 60));

        return `${this.cache.size} entries, oldest: ${minutesAge}m`;
    }

    async refresh() {
        this.cache.clear();
        this.inFlightRequests.clear();

        // Pre-warm cache with all currencies
        const refreshPromises = currencies.map(currency =>
            this.getRate(currency.code).catch(console.error)
        );

        await Promise.allSettled(refreshPromises);
    }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
    const [isClient, setIsClient] = useState(false);
    const cacheRef = useRef<ExchangeRateCache>(new ExchangeRateCache());

    useEffect(() => {
        setIsClient(true);

        // Load saved currency
        const savedCurrency = localStorage.getItem('selectedCurrency');
        if (savedCurrency) {
            try {
                const parsed = JSON.parse(savedCurrency);
                const found = currencies.find(c => c.code === parsed.code);
                if (found) setSelectedCurrency(found);
            } catch (error) {
                console.error('Error loading saved currency:', error);
            }
        }

        // Load cache from localStorage
        cacheRef.current.loadFromLocalStorage();

        // Pre-warm cache on startup
        cacheRef.current.getRate(selectedCurrency.code);
    }, [selectedCurrency.code]);

    const setCurrency = (currency: Currency) => {
        setSelectedCurrency(currency);
        if (isClient) {
            try {
                localStorage.setItem('selectedCurrency', JSON.stringify(currency));
                // Pre-warm cache for new currency
                cacheRef.current.getRate(currency.code);
            } catch (error) {
                console.error('Error saving currency:', error);
            }
        }
    };

    const formatPrice = useMemo(() => (price: number): string => {
        let minimumFractionDigits = 2;
        let maximumFractionDigits = 2;

        if (selectedCurrency.code === 'JPY') {
            minimumFractionDigits = 0;
            maximumFractionDigits = 0;
        } else if (price < 1) {
            minimumFractionDigits = 4;
            maximumFractionDigits = 6;
        } else if (price < 10) {
            minimumFractionDigits = 2;
            maximumFractionDigits = 4;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency.code,
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(price);
    }, [selectedCurrency.code]);

    const convertFromETH = async (ethPrice: number): Promise<number> => {
        if (selectedCurrency.code === 'ETH') return ethPrice;

        try {
            const rate = await cacheRef.current.getRate(selectedCurrency.code);
            return ethPrice * rate;
        } catch (error) {
            console.error('Error converting currency:', error);
            return ethPrice * 3500; // Fallback
        }
    };

    const refreshExchangeRates = async (): Promise<void> => {
        await cacheRef.current.refresh();
    };

    const getCacheInfo = () => {
        const status = cacheRef.current.getCacheStatus();
        return {
            status,
            lastUpdate: new Date().toLocaleString()
        };
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

// Optimized hook for ETH price conversion
export function useETHPrice(ethAmount: number) {
    const { selectedCurrency, formatPrice, convertFromETH } = useCurrency();
    const [convertedPrice, setConvertedPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef<Map<string, { price: string; timestamp: number }>>(new Map());

    useEffect(() => {
        const cacheKey = `${ethAmount}_${selectedCurrency.code}`;

        // Check cache first (5 minute cache per price)
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            setConvertedPrice(cached.price);
            setLoading(false);
            return;
        }

        const convert = async () => {
            setLoading(true);
            try {
                const convertedAmount = await convertFromETH(ethAmount);
                const formatted = formatPrice(convertedAmount);

                // Cache the result
                cacheRef.current.set(cacheKey, {
                    price: formatted,
                    timestamp: Date.now()
                });

                setConvertedPrice(formatted);
            } catch (error) {
                console.error('Error converting price:', error);
                setConvertedPrice(`${ethAmount} ETH`);
            } finally {
                setLoading(false);
            }
        };

        convert();
    }, [ethAmount, selectedCurrency, formatPrice, convertFromETH]);

    return { convertedPrice, loading };
}
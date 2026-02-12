'use client';

/**
 * Shopping Cart Context for Batch NFT Purchases (Hybrid Storage)
 * 
 * Storage Strategy:
 * - Connected wallet: MongoDB (cross-device sync)
 * - Not connected: localStorage (fallback)
 * - Optimistic updates: UI updates instantly, DB syncs in background
 * - Migration: localStorage → DB when wallet connects
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { devLog } from '@/utils';
import { SyncQueue } from '@/utils/SyncQueue';
import { useContextDevtools } from '@/hooks/useContextDevtools';
import type { ActiveItem } from '@/types';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { formatUnits } from 'viem';

interface CartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    currency?: string | null;
    name?: string;
    imageUrl?: string;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    totalPrice: bigint;
    totalPriceDisplay: string;
    totalPriceByToken: Array<{ symbol: string; total: number }>;
    addToCart: (item: ActiveItem) => void;
    removeFromCart: (listingId: string) => void;
    clearCart: () => void;
    isInCart: (listingId: string) => boolean;
    updateCartItem: (listingId: string, updates: Partial<CartItem>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nft-marketplace-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync queue for failed DB operations (with retry)
    const syncQueueRef = useRef<SyncQueue<{ walletAddress: string; items: CartItem[] }> | null>(null);

    // Initialize sync queue
    if (!syncQueueRef.current) {
        syncQueueRef.current = new SyncQueue(
            async (payload) => {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Wallet-Address': payload.walletAddress
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Sync failed: ${response.status}`);
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Sync failed');
                }
            },
            { maxRetries: 3, baseDelay: 1000 }
        );
    }

    // Load cart on mount or when wallet connects
    useEffect(() => {
        const loadCart = async () => {
            if (isConnected && address) {
                // Load from MongoDB
                try {
                    devLog.info('cart', '📡 Loading cart from MongoDB for:', address);
                    const response = await fetch(`/api/cart?walletAddress=${address}`);
                    const data = await response.json();

                    if (data.success && data.data.items) {
                        devLog.info('cart', '✅ Loaded from DB:', data.data.items.length, 'items');
                        setItems(data.data.items);

                        // Also update localStorage as cache
                        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.data.items));
                    }
                } catch (error) {
                    devLog.error('cart', '❌ Failed to load from DB, using localStorage:', error);
                    // Fallback to localStorage
                    loadFromLocalStorage();
                }
            } else {
                // Load from localStorage
                loadFromLocalStorage();
            }

            setIsLoaded(true);
        };

        loadCart();
    }, [address, isConnected]);

    // Helper: Load from localStorage
    const loadFromLocalStorage = () => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                devLog.info('cart', '💾 Loaded from localStorage:', parsedCart.length, 'items');
                setItems(parsedCart);
            }
        } catch (error) {
            devLog.error('cart', '❌ Failed to load from localStorage:', error);
        }
    };

    // Sync cart to storage (localStorage + MongoDB if connected)
    const syncCart = useCallback((updatedItems: CartItem[]) => {
        if (!isLoaded) return;

        // Always save to localStorage (instant cache)
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
            devLog.info('cart', '💾 Saved to localStorage:', updatedItems.length, 'items');
        } catch (error) {
            devLog.error('cart', '❌ Failed to save to localStorage:', error);
        }

        // Queue DB sync (if connected) - with retry mechanism
        if (isConnected && address) {
            // Clear previous timeout
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }

            // Debounce DB sync (500ms)
            syncTimeoutRef.current = setTimeout(() => {
                devLog.info('cart', '📡 Queuing DB sync for:', address);
                syncQueueRef.current?.enqueue(
                    `cart-${address}`,
                    { walletAddress: address, items: updatedItems }
                );
            }, 500);
        }
    }, [isLoaded, isConnected, address]);

    // Auto-sync when items change
    useEffect(() => {
        syncCart(items);

        // Cleanup timeout on unmount to prevent memory leak
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [items, syncCart]);

    const addToCart = useCallback(async (item: ActiveItem) => {
        // Check if item already in cart
        if (items.some(cartItem => cartItem.listingId === item.listingId)) {
            devLog.info('cart', 'Item already in cart:', item.listingId);
            return;
        }

        // Fetch metadata from MongoDB
        try {
            devLog.info('cart', 'Fetching metadata for:', item.contractAddress, item.tokenId);
            const response = await fetch(`/api/nft/detail?contractAddress=${item.contractAddress}&tokenId=${item.tokenId}`);
            const data = await response.json();
            devLog.info('cart', 'API Response:', data);

            const cartItem: CartItem = {
                listingId: item.listingId,
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                price: item.price,
                seller: item.seller,
                currency: item.currency,
                name: data.metadata?.name || data.name || undefined,
                imageUrl: data.metadata?.image || data.image || undefined
            };

            devLog.info('cart', 'Added to cart with metadata:', cartItem.name, cartItem.imageUrl);
            setItems(prev => [...prev, cartItem]);
        } catch (error) {
            devLog.error('cart', 'Failed to fetch NFT metadata:', error);

            // Add without metadata as fallback
            const cartItem: CartItem = {
                listingId: item.listingId,
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                price: item.price,
                seller: item.seller,
                currency: item.currency,
                name: undefined,
                imageUrl: undefined
            };

            setItems(prev => [...prev, cartItem]);
        }
    }, [items]);

    const removeFromCart = useCallback((listingId: string) => {
        setItems(prev => prev.filter(item => item.listingId !== listingId));
    }, []);

    const clearCart = useCallback(async () => {
        setItems([]);

        // Also clear from DB if connected
        if (isConnected && address) {
            try {
                await fetch(`/api/cart?walletAddress=${address}`, {
                    method: 'DELETE'
                });
                devLog.info('cart', '🗑️ Cleared cart in DB for:', address);
            } catch (error) {
                devLog.error('cart', '❌ Failed to clear cart in DB:', error);
            }
        }
    }, [isConnected, address]);

    const isInCart = useCallback((listingId: string) => {
        return items.some(item => item.listingId === listingId);
    }, [items]);

    const updateCartItem = useCallback((listingId: string, updates: Partial<CartItem>) => {
        setItems(prev => prev.map(item =>
            item.listingId === listingId
                ? { ...item, ...updates }
                : item
        ));
    }, []);

    // Calculate total price
    const totalPrice = items.reduce((sum, item) => {
        try {
            return sum + BigInt(item.price);
        } catch {
            return sum;
        }
    }, BigInt(0));

    const totalPriceByToken = useMemo(() => {
        const totals = new Map<string, number>();

        items.forEach((item) => {
            try {
                const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                const amount = parseFloat(formatUnits(BigInt(item.price), decimals));

                totals.set(symbol, (totals.get(symbol) || 0) + amount);
            } catch {
                // Ignore parse errors for malformed items
            }
        });

        return Array.from(totals.entries()).map(([symbol, total]) => ({ symbol, total }));
    }, [items, chainId]);

    const totalPriceDisplay = useMemo(() => {
        if (totalPriceByToken.length === 0) return '0';
        return totalPriceByToken
            .map((entry) => `${entry.total.toFixed(4)} ${entry.symbol}`)
            .join(' + ');
    }, [totalPriceByToken]);

    // DevTools (development only)
    useContextDevtools('Cart', {
        items,
        itemCount: items.length,
        totalPrice: totalPriceDisplay,
        isLoaded,
        syncQueueStatus: syncQueueRef.current?.getStatus()
    });

    const value: CartContextType = React.useMemo(() => ({
        items,
        itemCount: items.length,
        totalPrice,
        totalPriceDisplay,
        totalPriceByToken,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        updateCartItem
    }), [items, totalPrice, totalPriceDisplay, totalPriceByToken, addToCart, removeFromCart, clearCart, isInCart, updateCartItem]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

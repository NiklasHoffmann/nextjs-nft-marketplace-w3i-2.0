'use client';

/**
 * Shopping Cart Context for Batch NFT Purchases
 * 
 * Allows users to add multiple NFTs to cart and purchase them in one transaction
 * to save on gas fees.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { devLog } from '@/utils/devLog';
import type { ActiveItem } from '@/types';

interface CartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    name?: string;
    imageUrl?: string;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    totalPrice: bigint;
    totalPriceFormatted: string;
    addToCart: (item: ActiveItem) => void;
    removeFromCart: (listingId: string) => void;
    clearCart: () => void;
    isInCart: (listingId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nft-marketplace-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setItems(parsedCart);
            }
        } catch (error) {
            devLog.error('cart', 'Failed to load cart from localStorage:', error);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            devLog.error('cart', 'Failed to save cart to localStorage:', error);
        }
    }, [items]);

    const addToCart = useCallback((item: ActiveItem) => {
        setItems(prev => {
            // Check if item already in cart
            if (prev.some(cartItem => cartItem.listingId === item.listingId)) {
                devLog.info('cart', 'Item already in cart:', item.listingId);
                return prev;
            }

            const cartItem: CartItem = {
                listingId: item.listingId,
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                price: item.price,
                seller: item.seller,
                // These fields might not exist on ActiveItem - will be enhanced later
                name: undefined,
                imageUrl: undefined
            };

            return [...prev, cartItem];
        });
    }, []);

    const removeFromCart = useCallback((listingId: string) => {
        setItems(prev => prev.filter(item => item.listingId !== listingId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const isInCart = useCallback((listingId: string) => {
        return items.some(item => item.listingId === listingId);
    }, [items]);

    // Calculate total price
    const totalPrice = items.reduce((sum, item) => {
        try {
            return sum + BigInt(item.price);
        } catch {
            return sum;
        }
    }, BigInt(0));

    // Format total price to ETH
    const totalPriceFormatted = (Number(totalPrice) / 1e18).toFixed(4);

    const value: CartContextType = {
        items,
        itemCount: items.length,
        totalPrice,
        totalPriceFormatted,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

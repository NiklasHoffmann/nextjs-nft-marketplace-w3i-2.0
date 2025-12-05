'use client';

/**
 * Add to Cart Button Component
 * 
 * Reusable button to add NFTs to shopping cart for batch purchase
 */

import React from 'react';
import { useCart } from '@/contexts';
import type { ActiveItem } from '@/types';

interface AddToCartButtonProps {
    item: ActiveItem;
    variant?: 'icon' | 'button' | 'compact';
    className?: string;
    showLabel?: boolean;
}

export function AddToCartButton({
    item,
    variant = 'button',
    className = '',
    showLabel = true
}: AddToCartButtonProps) {
    const { addToCart, isInCart, removeFromCart } = useCart();
    const inCart = isInCart(item.listingId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (inCart) {
            removeFromCart(item.listingId);
        } else {
            addToCart(item);
        }
    };

    // Icon only variant (for compact displays)
    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                className={`p-2 rounded-lg transition-colors ${inCart
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${className}`}
                title={inCart ? 'Remove from cart' : 'Add to cart'}
            >
                {inCart ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                )}
            </button>
        );
    }

    // Compact variant (small button with icon and optional text)
    if (variant === 'compact') {
        return (
            <button
                onClick={handleClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inCart
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } ${className}`}
            >
                {inCart ? (
                    <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {showLabel && 'In Cart'}
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {showLabel && 'Add to Cart'}
                    </>
                )}
            </button>
        );
    }

    // Full button variant (default)
    return (
        <button
            onClick={handleClick}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${inCart
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                } ${className}`}
        >
            {inCart ? (
                <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {showLabel && 'In Cart'}
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {showLabel && 'Add to Cart'}
                </>
            )}
        </button>
    );
}

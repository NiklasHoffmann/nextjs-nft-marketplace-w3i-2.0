"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CartStats } from './CartStats';

interface CartHeaderProps {
    itemCount: number;
    totalValue: string;
}

export function CartHeader({ itemCount, totalValue }: CartHeaderProps) {
    return (
        <PageHeader
            backLink={{
                href: "/marketplace",
                label: "Continue Shopping"
            }}
            icon={{
                type: "svg",
                svgContent: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                ),
                gradientFrom: "from-blue-500",
                gradientTo: "to-cyan-600"
            }}
            title="Shopping Cart"
            subtitle={
                itemCount === 0
                    ? 'Your cart is empty'
                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for batch purchase`
            }
            rightContent={
                <CartStats
                    itemCount={itemCount}
                    totalValue={totalValue}
                />
            }
        />
    );
}

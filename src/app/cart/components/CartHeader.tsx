"use client";

import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/app/wallet/components/StatCard';

interface CartHeaderProps {
    itemCount: number;
    totalValue: string;
}

export function CartHeader({ itemCount, totalValue }: CartHeaderProps) {
    return (
        <div className="sticky top-[66px] z-10 bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
                {/* Back Link */}
                <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2 sm:mb-3"
                    title="Continue Shopping"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Continue Shopping</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8">
                    {/* Page Info */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight truncate">Shopping Cart</h1>
                            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 truncate">
                                {itemCount === 0
                                    ? 'Your cart is empty'
                                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for batch purchase`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Cart Stats */}
                    <div className="w-full md:flex-1 md:max-w-md">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {/* Items Count */}
                            <StatCard
                                icon={
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                }
                                label="Items"
                                value={itemCount}
                                variant="blue"
                            />

                            {/* Total Value */}
                            <StatCard
                                icon={
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                                label="Total Value"
                                value={`${totalValue} ETH`}
                                variant="green"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

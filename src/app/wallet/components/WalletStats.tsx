"use client";

import React from 'react';
import { StatCard } from './StatCard';

interface WalletStatsProps {
    listedCount: number;
    unlistedCount: number;
    totalListedValue: number;
    totalValueUSD: string | null;
    ethPriceLoading: boolean;
}

export function WalletStats({
    listedCount,
    unlistedCount,
    totalListedValue,
    totalValueUSD,
    ethPriceLoading
}: WalletStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Listed NFTs */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                label="Listed"
                value={listedCount || 0}
                variant="green"
            />

            {/* Not Listed NFTs */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                }
                label="Not Listed"
                value={unlistedCount || 0}
                variant="gray"
            />

            {/* Total NFTs */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                }
                label="Total"
                value={(listedCount || 0) + (unlistedCount || 0)}
                variant="purple"
            />

            {/* Total Value */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                label="Total Value"
                value={`${totalListedValue > 0 ? totalListedValue.toFixed(4) : '0.0000'} ETH`}
                secondaryValue={!ethPriceLoading && totalValueUSD && totalListedValue > 0 ? totalValueUSD : undefined}
                variant="blue"
            />
        </div>
    );
}

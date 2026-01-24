"use client";

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';

interface SellStatsProps {
    totalNFTs: number;
    listedCount: number;
    unlistedCount: number;
    selectedCount: number;
}

export function SellStats({ totalNFTs, listedCount, unlistedCount, selectedCount }: SellStatsProps) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {/* Selected NFTs - ganz links */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                }
                label="Ausgewählt"
                value={selectedCount}
                variant="blue"
                hideSecondaryPlaceholder
            />

            {/* Unlisted NFTs */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                }
                label="Ungelistet"
                value={unlistedCount}
                variant="gray"
                hideSecondaryPlaceholder
            />

            {/* Listed NFTs */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                label="Gelistet"
                value={listedCount}
                variant="green"
                hideSecondaryPlaceholder
            />

            {/* Total NFTs - ganz rechts */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                }
                label="Gesamt"
                value={totalNFTs}
                variant="purple"
                hideSecondaryPlaceholder
            />
        </div>
    );
}

"use client";

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';

interface CartStatsProps {
    itemCount: number;
    totalValue: string;
    isCompact?: boolean;
}

export function CartStats({ itemCount, totalValue, isCompact = false }: CartStatsProps) {
    return (
        <div className={isCompact ? "flex flex-wrap gap-2 justify-end" : "grid grid-cols-2 gap-4"}>
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
                isCompact={isCompact}
            />

            {/* Total Value */}
            <StatCard
                icon={
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                label="Total Value"
                value={totalValue}
                variant="green"
                isCompact={isCompact}
            />
        </div>
    );
}

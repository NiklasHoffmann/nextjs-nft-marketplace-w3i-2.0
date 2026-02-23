"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { WalletStats } from './WalletStats';

interface WalletHeaderProps {
    address: string;
    listedCount: number;
    unlistedCount: number;
    totalValueDisplay: string;
    ethPriceLoading: boolean;
}

export function WalletHeader({
    address,
    listedCount,
    unlistedCount,
    totalValueDisplay,
    ethPriceLoading
}: WalletHeaderProps) {
    return (
        <PageHeader
            backLink={{
                href: "/marketplace",
                label: "Back to Marketplace"
            }}
            icon={{
                type: "svg",
                svgContent: (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                ),
                gradientFrom: "from-green-500",
                gradientTo: "to-emerald-600"
            }}
            title="My Wallet"
            subtitle={{
                address,
                displayFormat: "short"
            }}
            rightContent={
                <WalletStats
                    listedCount={listedCount}
                    unlistedCount={unlistedCount}
                    totalValueDisplay={totalValueDisplay}
                    ethPriceLoading={ethPriceLoading}
                />
            }
            hasSidebar={true}
        />
    );
}

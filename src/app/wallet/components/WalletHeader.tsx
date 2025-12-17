"use client";

import React from 'react';
import Link from 'next/link';
import { WalletStats } from './WalletStats';

interface WalletHeaderProps {
    address: string;
    listedCount: number;
    unlistedCount: number;
    totalListedValue: number;
    totalValueUSD: string | null;
    ethPriceLoading: boolean;
}

export function WalletHeader({
    address,
    listedCount,
    unlistedCount,
    totalListedValue,
    totalValueUSD,
    ethPriceLoading
}: WalletHeaderProps) {
    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
    };

    return (
        <div className="sticky top-[66px] z-10 bg-white border-b border-gray-200">
            <div className="px-8 py-6">
                {/* Back Link */}
                <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    title="Back to Marketplace"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-medium">Back to Marketplace</span>
                </Link>

                <div className="flex items-center justify-between gap-8">
                    {/* Wallet Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">My Wallet</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="font-mono text-xs text-gray-600">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </p>
                                <button
                                    onClick={handleCopyAddress}
                                    className="text-gray-500 hover:text-gray-900 transition-colors p-0.5 hover:bg-gray-100 rounded"
                                    title="Copy Address"
                                    aria-label="Copy wallet address"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* NFT Collection Stats */}
                    <div className="flex-1 max-w-3xl">
                        <WalletStats
                            listedCount={listedCount}
                            unlistedCount={unlistedCount}
                            totalListedValue={totalListedValue}
                            totalValueUSD={totalValueUSD}
                            ethPriceLoading={ethPriceLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

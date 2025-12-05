"use client";

import React from 'react';
import type { UseBalanceReturnType } from 'wagmi';
import { formatEther } from 'viem';

interface WalletBalanceCardProps {
    balance: UseBalanceReturnType['data'];
    balanceLoading: boolean;
    balanceError: Error | null;
    balancePrice: string | null;
    balancePriceLoading: boolean;
    onRefresh: () => void;
}

export function WalletBalanceCard({
    balance,
    balanceLoading,
    balanceError,
    balancePrice,
    balancePriceLoading,
    onRefresh
}: WalletBalanceCardProps) {
    const formatBalance = (bal: any, precision: number = 6) => {
        if (!bal) return '0';
        const value = parseFloat(formatEther(bal.value));
        return value.toFixed(precision);
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Wallet Balance
                </h2>
                <button
                    onClick={onRefresh}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="Refresh"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {balanceLoading ? (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : balanceError ? (
                <p className="text-red-600 text-sm">Error loading balance</p>
            ) : (
                <div className="space-y-3">
                    <div className="text-center py-2 bg-white rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">
                            {formatBalance(balance, 6)} ETH
                        </p>
                        {!balancePriceLoading && balancePrice && (
                            <p className="text-sm text-gray-600 mt-1">
                                ˜ {balancePrice}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

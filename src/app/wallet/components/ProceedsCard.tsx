"use client";

import React from 'react';

interface ProceedsCardProps {
    proceeds: string;
    proceedsLoading: boolean;
    proceedsError: string | null;
    proceedsPrice: string | null;
    proceedsPriceLoading: boolean;
    isWithdrawing: boolean;
    onRefresh: () => void;
    onWithdraw: () => void;
}

export function ProceedsCard({
    proceeds,
    proceedsLoading,
    proceedsError,
    proceedsPrice,
    proceedsPriceLoading,
    isWithdrawing,
    onRefresh,
    onWithdraw
}: ProceedsCardProps) {
    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sales Proceeds
                </h2>
                <button
                    onClick={onRefresh}
                    className="text-green-600 hover:text-green-700 transition-colors"
                    title="Refresh"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {proceedsLoading ? (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
            ) : proceedsError ? (
                <p className="text-red-600 text-sm">{proceedsError}</p>
            ) : (
                <div className="space-y-3">
                    <div className="text-center py-2 bg-white rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                            {proceeds} ETH
                        </p>
                        {!proceedsPriceLoading && proceedsPrice && parseFloat(proceeds) > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                ˜ {proceedsPrice}
                            </p>
                        )}
                    </div>

                    {parseFloat(proceeds) > 0 && (
                        <button
                            onClick={onWithdraw}
                            disabled={isWithdrawing}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                        >
                            {isWithdrawing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Withdrawing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Withdraw Proceeds
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

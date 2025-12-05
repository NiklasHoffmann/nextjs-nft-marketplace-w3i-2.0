"use client";

import React from 'react';

interface QuickActionsCardProps {
    address: string;
    onRefreshAll: () => void;
}

export function QuickActionsCard({ address, onRefreshAll }: QuickActionsCardProps) {
    return (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
            </h2>
            <div className="space-y-2">
                <button
                    onClick={onRefreshAll}
                    className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh All
                </button>
                <button
                    onClick={() => navigator.clipboard.writeText(address || '')}
                    className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Address
                </button>
            </div>
        </div>
    );
}

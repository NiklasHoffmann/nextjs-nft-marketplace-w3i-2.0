/**
 * NFT Performance Dashboard - Zeigt die Verbesserungen durch den NFTContext
 * @deprecated This component uses legacy useNFTPerformance hook which is a stub.
 * Should be updated to use proper performance metrics or removed.
 */
"use client";

import React from 'react';
// @deprecated - useNFTPerformance is a legacy stub
import { useNFTPerformance } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';

/**
 * @deprecated This component uses legacy performance tracking
 */
export function NFTPerformanceDashboard() {
    const {
        total: count,
        fresh,
        stale,
        loadingCount
    } = useNFTPerformance();

    // These are not available in the current useNFTPerformance hook
    const withMetadata = 0;
    const withInsights = 0;
    const listed = 0;

    const { clearCache } = useNFTContext();

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    NFT Performance Monitor
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={clearCache}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-blue-800">Cached NFTs</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{fresh}</div>
                    <div className="text-sm text-green-800">Fresh Cache</div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stale}</div>
                    <div className="text-sm text-yellow-800">Stale Cache</div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{listed}</div>
                    <div className="text-sm text-purple-800">Listed Items</div>
                </div>
            </div>

            {/* Cache Stats */}
            <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Cache Statistics:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="text-xs bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">With Metadata:</div>
                        <div className="font-bold">{withMetadata}</div>
                    </div>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">With Insights:</div>
                        <div className="font-bold">{withInsights}</div>
                    </div>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Currently Loading:</div>
                        <div className="font-bold">{loadingCount}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NFTPerformanceDashboard;
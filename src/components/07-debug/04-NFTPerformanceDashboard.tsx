// NFT Performance Dashboard - Zeigt die Verbesserungen durch den NFTContext
"use client";

import React from 'react';
import { useNFTPerformance } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';

export function NFTPerformanceDashboard() {
    const {
        size: count,
        memoryUsage,
        loadingCount,
        globalLoading,
        cacheKeys
    } = useNFTPerformance();

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
                        disabled={globalLoading}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 text-sm"
                    >
                        Clear Cache
                    </button>
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
                    <div className="text-2xl font-bold text-green-600">{memoryUsage}</div>
                    <div className="text-sm text-green-800">Memory Usage</div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{loadingCount}</div>
                    <div className="text-sm text-yellow-800">Currently Loading</div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                        {globalLoading ? 'YES' : 'NO'}
                    </div>
                    <div className="text-sm text-purple-800">Global Loading</div>
                </div>
            </div>

            {/* Cache Keys Preview */}
            {cacheKeys.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Cached NFTs (showing first 10):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(cacheKeys as string[]).slice(0, 10).map((key) => {
                            const [contractAddress, tokenId] = key.split(':');
                            return (
                                <div
                                    key={key}
                                    className="text-xs bg-gray-50 p-2 rounded font-mono"
                                >
                                    <div className="text-gray-600">Contract:</div>
                                    <div className="truncate">{contractAddress}</div>
                                    <div className="text-gray-600 mt-1">Token ID: {tokenId}</div>
                                </div>
                            );
                        })}
                    </div>
                    {cacheKeys.length > 10 && (
                        <div className="text-sm text-gray-500 mt-2">
                            ...and {cacheKeys.length - 10} more
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NFTPerformanceDashboard;
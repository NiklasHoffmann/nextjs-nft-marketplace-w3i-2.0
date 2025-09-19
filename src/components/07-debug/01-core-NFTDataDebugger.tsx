"use client";

import React, { useState } from 'react';
import type { FilterableNFTItem } from '@/hooks/nfts/08-utils-useNFTFilters';

interface NFTDataDebuggerProps {
    items: FilterableNFTItem[];
    filteredItems: FilterableNFTItem[];
    currentFilters: any;
    sortOptions: any;
}

export function NFTDataDebugger({
    items,
    filteredItems,
    currentFilters,
    sortOptions
}: NFTDataDebuggerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

    if (!isExpanded) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
                >
                    🔍 Debug NFT Data ({filteredItems.length}/{items.length})
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-4 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">NFT Data Debugger</h2>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                    ✕ Close
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {/* Summary */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold mb-2">Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Total Items:</strong> {items.length}
                        </div>
                        <div>
                            <strong>Filtered Items:</strong> {filteredItems.length}
                        </div>
                        <div>
                            <strong>Active Filters:</strong> {Object.entries(currentFilters).filter(([_, value]) => value !== '' && value !== null && value !== false).length}
                        </div>
                        <div>
                            <strong>Sort By:</strong> {sortOptions.field} ({sortOptions.direction})
                        </div>
                    </div>
                </div>

                {/* Data Source Analysis */}
                <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-bold mb-2">Data Source Analysis</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="font-semibold text-orange-700">Test/Fallback Data:</div>
                            <div>Marketplace: {items.filter(item =>
                                item.contractAddress === "0x41655ae49482de69eec8f6875c34a8ada01965e2" ||
                                item.contractAddress === "0x2c9d7f070d03d83588e22c23fe858aa71274ad2a"
                            ).length} items</div>
                            <div>Generated Stats: {items.filter(item =>
                                !item.name || item.name.startsWith('NFT #')
                            ).length} items</div>
                        </div>
                        <div>
                            <div className="font-semibold text-green-700">Real Data:</div>
                            <div>Real Metadata: {items.filter(item =>
                                item.name && !item.name.startsWith('NFT #')
                            ).length} items</div>
                            <div>Real Stats: Varies per item</div>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                        ⚠️ Test data is used when The Graph returns no marketplace items or NFT metadata is missing
                    </div>
                </div>

                {/* Current Filters */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-bold mb-2">Current Filters</h3>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(currentFilters, null, 2)}
                    </pre>
                </div>

                {/* NFT Items List */}
                <div className="space-y-4">
                    <h3 className="font-bold">Filtered NFT Items</h3>
                    {filteredItems.map((item, index) => (
                        <div key={`${item.contractAddress}_${item.tokenId}`} className="border rounded-lg">
                            <button
                                onClick={() => setSelectedItemIndex(selectedItemIndex === index ? null : index)}
                                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <strong>{item.name || `NFT #${item.tokenId}`}</strong>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {item.contractAddress.slice(0, 8)}...#{item.tokenId}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        ❤️ {item.favoriteCount} | ⭐ {item.averageRating?.toFixed(1)} ({item.ratingCount}) | 👁️ {item.viewCount}
                                    </div>
                                </div>
                            </button>

                            {selectedItemIndex === index && (
                                <div className="p-4 bg-gray-50">
                                    {/* Data Source Indicators */}
                                    <div className="mb-4 p-3 bg-white border rounded">
                                        <h4 className="font-semibold mb-2 text-purple-700">Data Source Indicators</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className={`px-2 py-1 rounded text-white ${item.contractAddress === "0x41655ae49482de69eec8f6875c34a8ada01965e2" ||
                                                        item.contractAddress === "0x2c9d7f070d03d83588e22c23fe858aa71274ad2a"
                                                        ? 'bg-orange-500' : 'bg-green-500'
                                                    }`}>
                                                    {item.contractAddress === "0x41655ae49482de69eec8f6875c34a8ada01965e2" ||
                                                        item.contractAddress === "0x2c9d7f070d03d83588e22c23fe858aa71274ad2a"
                                                        ? 'FALLBACK DATA' : 'REAL MARKETPLACE'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-1 rounded text-white ${!item.name || item.name.startsWith('NFT #')
                                                        ? 'bg-orange-500' : 'bg-green-500'
                                                    }`}>
                                                    {!item.name || item.name.startsWith('NFT #')
                                                        ? 'GENERATED METADATA' : 'REAL METADATA'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-600">
                                            🔍 Stats (likes, ratings, views) können echt oder generiert sein - abhängig von Datenbankeinträgen
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold mb-2">Basic Info</h4>
                                            <div><strong>Name:</strong> {item.name}</div>
                                            <div><strong>Category:</strong> {item.category}</div>
                                            <div><strong>Rarity:</strong> {item.rarity}</div>
                                            <div><strong>Price:</strong> {item.price} ETH</div>
                                            <div><strong>Listed:</strong> {item.isListed ? 'Yes' : 'No'}</div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Stats</h4>
                                            <div><strong>Favorites:</strong> {item.favoriteCount}</div>
                                            <div><strong>Rating:</strong> {item.averageRating?.toFixed(2)} ({item.ratingCount} votes)</div>
                                            <div><strong>Watchlist:</strong> {item.watchlistCount}</div>
                                            <div><strong>Views:</strong> {item.viewCount}</div>
                                        </div>
                                    </div>

                                    {item.tags && item.tags.length > 0 && (
                                        <div className="mt-3">
                                            <strong>Tags:</strong> {item.tags.join(', ')}
                                        </div>
                                    )}

                                    <details className="mt-3">
                                        <summary className="cursor-pointer font-semibold">Raw Data</summary>
                                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                                            {JSON.stringify(item, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No items match the current filters</p>
                        <button
                            onClick={() => console.log('All items:', items)}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline"
                        >
                            Log all items to console
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
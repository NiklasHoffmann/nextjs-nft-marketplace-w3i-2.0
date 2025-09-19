"use client";

import React, { useState } from 'react';

export function TestDataController() {
    const [showInfo, setShowInfo] = useState(false);

    if (!showInfo) {
        return (
            <div className="fixed top-4 left-4 z-50">
                <button
                    onClick={() => setShowInfo(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg"
                >
                    ⚠️ Test Data Info
                </button>
            </div>
        );
    }

    return (
        <div className="fixed top-4 left-4 w-96 bg-white border-2 border-orange-300 rounded-lg shadow-2xl z-50">
            {/* Header */}
            <div className="bg-orange-100 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-orange-800">Test Data Controller</h2>
                <button
                    onClick={() => setShowInfo(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Current Situation */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-bold text-yellow-800 mb-2">🚨 Current Situation</h3>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <div>• Du siehst Fallback-Testdaten wenn keine echten Marketplace-Daten vorhanden sind</div>
                        <div>• Stats (Likes, Ratings, Views) werden teilweise generiert</div>
                        <div>• NFT-Metadaten werden als "NFT #123" angezeigt wenn keine echten Daten da sind</div>
                    </div>
                </div>

                {/* Test Data Sources */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-800">📋 Test Data Sources:</h3>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-semibold text-blue-800">1. Marketplace Fallback Data</h4>
                        <div className="text-sm text-blue-700 mt-1">
                            <div><strong>File:</strong> <code>src/hooks/nfts/01-core-nft-hooks.ts</code></div>
                            <div><strong>Function:</strong> <code>createFallbackMarketplaceData()</code></div>
                            <div><strong>When:</strong> Wenn The Graph keine Items zurückgibt</div>
                        </div>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <h4 className="font-semibold text-green-800">2. Generated Stats</h4>
                        <div className="text-sm text-green-700 mt-1">
                            <div><strong>Functions:</strong> <code>generateConsistentRating()</code>, <code>generateConsistentCount()</code></div>
                            <div><strong>When:</strong> Wenn keine echten Stats in der Datenbank sind</div>
                        </div>
                    </div>
                </div>

                {/* Solutions */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <h3 className="font-bold text-purple-800 mb-2">🔧 So bekommst du echte Daten:</h3>
                    <div className="text-sm text-purple-700 space-y-2">
                        <div><strong>1. The Graph Setup:</strong> Konfiguriere echte Subgraph-Daten</div>
                        <div><strong>2. NFT Metadata:</strong> Lade echte NFT-Metadaten von IPFS/API</div>
                        <div><strong>3. User Stats:</strong> Verwende die echten User-Interaction APIs</div>
                        <div><strong>4. Testdaten entfernen:</strong> Lösche <code>createFallbackMarketplaceData()</code></div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-3 border-t">
                    <h3 className="font-bold text-gray-800 mb-2">⚡ Quick Actions:</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                console.log('=== MARKETPLACE DATA CHECK ===');
                                console.log('Check if The Graph is returning real data or if fallback is being used');
                                console.log('Look for log: "Fallback test data for development"');
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                        >
                            Check Console for Data Source
                        </button>

                        <button
                            onClick={() => {
                                localStorage.setItem('debug_data_sources', 'true');
                                alert('Debug logging aktiviert! Schaue in die Browser-Konsole für detaillierte Data-Source Infos.');
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
                        >
                            Aktiviere Debug Logging
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
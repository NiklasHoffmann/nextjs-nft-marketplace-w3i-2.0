"use client";

import React, { useState, useEffect } from 'react';
import { debugCurrentDataSources, clearAllFallbackData, FALLBACK_DATA_SOURCES, DATA_FLOW_ANALYSIS } from './03-core-FallbackDataAnalysis';

export function FallbackDataAnalyzer() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const runAnalysis = () => {
        // Run analysis
        const result = {
            timestamp: new Date().toLocaleTimeString(),
            localStorage: {
                nftKeys: Object.keys(localStorage).filter(k => k.includes('nft_') || k.includes('stats_')),
                debugFlags: {
                    debug_data_sources: localStorage.getItem('debug_data_sources')
                }
            },
            suspiciousData: {
                fallbackContracts: [
                    '0x41655ae49482de69eec8f6875c34a8ada01965e2',
                    '0x2c9d7f070d03d83588e22c23fe858aa71274ad2a'
                ],
                generatedNames: 'Names starting with "NFT #"',
                consistentStats: 'Same stats for same NFT across reloads'
            }
        };

        setAnalysis(result);
        debugCurrentDataSources();
    };

    useEffect(() => {
        if (isExpanded && !analysis) {
            runAnalysis();
        }
    }, [isExpanded, analysis]);

    if (!isExpanded) {
        return (
            <div className="fixed bottom-20 right-4 z-50">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse"
                >
                    🚨 Fallback Data Analyzer
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-4 bg-white border-2 border-red-300 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-red-100 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-red-800">🚨 Fallback Data Analyzer</h2>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                    ✕ Close
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">

                {/* Current Analysis */}
                {analysis && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-bold text-yellow-800 mb-2">📊 Current Data Analysis</h3>
                        <div className="text-sm space-y-2">
                            <div><strong>Analysis Time:</strong> {analysis.timestamp}</div>
                            <div><strong>localStorage NFT Entries:</strong> {analysis.localStorage.nftKeys.length}</div>
                            <div><strong>Debug Mode:</strong> {analysis.localStorage.debugFlags.debug_data_sources || 'OFF'}</div>
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer font-semibold">Raw Analysis Data</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                                {JSON.stringify(analysis, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Known Fallback Sources */}
                <div className="space-y-4">
                    <h3 className="font-bold text-red-800">🎯 Known Fallback Data Sources</h3>

                    {/* Marketplace Fallback */}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">1. Marketplace Fallback Data</h4>
                        <div className="text-sm text-orange-700 space-y-1">
                            <div><strong>File:</strong> <code>{FALLBACK_DATA_SOURCES.marketplace.file}</code></div>
                            <div><strong>Function:</strong> <code>{FALLBACK_DATA_SOURCES.marketplace.function}</code></div>
                            <div><strong>Triggered:</strong> {FALLBACK_DATA_SOURCES.marketplace.triggered}</div>
                            <div><strong>Test Contracts:</strong></div>
                            <ul className="ml-4 space-y-1">
                                {FALLBACK_DATA_SOURCES.marketplace.testItems.map(item => (
                                    <li key={item} className="font-mono text-xs bg-orange-100 px-2 py-1 rounded">{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Generated Stats */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">2. Generated Stats (MAIN PROBLEM)</h4>
                        <div className="text-sm text-red-700 space-y-1">
                            <div><strong>File:</strong> <code>{FALLBACK_DATA_SOURCES.generatedStats.file}</code></div>
                            <div><strong>Functions:</strong> {FALLBACK_DATA_SOURCES.generatedStats.functions.join(', ')}</div>
                            <div><strong>Triggered:</strong> {FALLBACK_DATA_SOURCES.generatedStats.triggered}</div>
                            <div><strong>Algorithm:</strong> {FALLBACK_DATA_SOURCES.generatedStats.algorithm}</div>
                            <div><strong>Ranges:</strong></div>
                            <div className="grid grid-cols-2 gap-2 ml-4">
                                {Object.entries(FALLBACK_DATA_SOURCES.generatedStats.ranges).map(([key, value]) => (
                                    <div key={key} className="text-xs bg-red-100 px-2 py-1 rounded">
                                        <strong>{key}:</strong> {value as string}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* API Fallback Stats */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">3. API Fallback Stats</h4>
                        <div className="text-sm text-purple-700 space-y-1">
                            <div><strong>File:</strong> <code>{FALLBACK_DATA_SOURCES.apiStats.file}</code></div>
                            <div><strong>Function:</strong> <code>{FALLBACK_DATA_SOURCES.apiStats.function}</code></div>
                            <div><strong>Triggered:</strong> {FALLBACK_DATA_SOURCES.apiStats.triggered}</div>
                            <div><strong>Algorithm:</strong> {FALLBACK_DATA_SOURCES.apiStats.algorithm}</div>
                            <div className="bg-purple-100 p-2 rounded mt-2">
                                <strong>⚠️ Diese Stats ändern sich bei jedem Reload!</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Flow */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">🔄 Stats Loading Priority</h3>
                    <ol className="text-sm text-blue-700 space-y-1">
                        {DATA_FLOW_ANALYSIS.statsLoadingPriority.map((step, index) => (
                            <li key={index} className="flex items-start">
                                <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded mr-2">{index + 1}</span>
                                {step.replace(/^\d+\.\s*/, '')}
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Problem Indicators */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">🔍 Problem Indicators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {Object.entries(DATA_FLOW_ANALYSIS.problemIndicators).map(([type, indicator]) => (
                            <div key={type} className="bg-white p-2 rounded border">
                                <div className="font-semibold capitalize">{type}:</div>
                                <div className="text-gray-600">{indicator as string}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={runAnalysis}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        🔍 Re-run Analysis
                    </button>

                    <button
                        onClick={() => {
                            localStorage.setItem('debug_data_sources', 'true');
                            alert('Debug logging aktiviert! Reload die Seite und schaue in die Konsole.');
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                        🔧 Enable Debug Mode
                    </button>

                    <button
                        onClick={() => {
                            clearAllFallbackData();
                            alert('Fallback data cleared! Reload die Seite für clean loading.');
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        🧹 Clear Cache
                    </button>
                </div>
            </div>
        </div>
    );
}
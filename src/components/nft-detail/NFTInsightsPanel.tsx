import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useNFTInsights } from '@/hooks/useNFTInsights';
import { canEditInsights } from '@/utils/insights-access';
import Link from 'next/link';

interface NFTInsightsPanelProps {
    contractAddress: string;
    tokenId: string;
}

export default function NFTInsightsPanel({ contractAddress, tokenId }: NFTInsightsPanelProps) {
    const { address, isConnected } = useAccount();
    const { insights, loading, error, refetch } = useNFTInsights({
        contractAddress,
        tokenId
    });

    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Check access permissions
    const canEdit = canEditInsights(address);
    // const canView = canViewInsights(address);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Show compact version if no insights or not connected
    if (!isConnected) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                    <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">NFT Insights</h3>
                    <p className="text-xs text-blue-600 mb-3">Connect your wallet to view or add insights for this NFT</p>
                    <Link
                        href="/insights"
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-gray-700">Loading insights...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">Error loading insights</span>
                </div>
                <button
                    onClick={refetch}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!insights) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-center">
                    <svg className="w-8 h-8 text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">No Insights Yet</h3>
                    <p className="text-xs text-yellow-600 mb-3">
                        {canEdit
                            ? 'Add detailed insights and analysis for this NFT'
                            : 'No insights available for this NFT'
                        }
                    </p>
                    {canEdit && (
                        <Link
                            href={`/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`}
                            className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                        >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Insights
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">NFT Insights</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status indicators */}
                        {insights.isFavorite && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ❤️ Favorite
                            </span>
                        )}
                        {insights.isWatchlisted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                👁️ Watched
                            </span>
                        )}
                        {insights.isForSale && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                💰 For Sale
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Info Row */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {insights.personalRating && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Rating</div>
                            <div className="flex justify-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        className={`text-sm ${star <= insights.personalRating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {insights.rarity && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Rarity</div>
                            <div className={`text-sm font-medium capitalize ${insights.rarity === 'legendary' ? 'text-purple-600' :
                                insights.rarity === 'epic' ? 'text-red-600' :
                                    insights.rarity === 'rare' ? 'text-blue-600' :
                                        insights.rarity === 'uncommon' ? 'text-green-600' :
                                            'text-gray-600'
                                }`}>
                                {insights.rarity}
                            </div>
                        </div>
                    )}
                    {insights.strategy && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Strategy</div>
                            <div className="text-sm font-medium capitalize text-gray-800">
                                {insights.strategy}
                            </div>
                        </div>
                    )}
                    {insights.quality && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Quality</div>
                            <div className="text-sm font-medium text-gray-800">
                                {insights.quality}/10
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Sections */}
            <div className="divide-y divide-gray-200">
                {/* Investment Data */}
                {(insights.purchasePrice || insights.targetSellPrice || insights.marketAnalysis) && (
                    <div>
                        <button
                            onClick={() => toggleSection('investment')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">Investment Analysis</span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'investment' ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        {expandedSection === 'investment' && (
                            <div className="px-4 pb-3 space-y-2">
                                {insights.purchasePrice && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Purchase Price:</span>
                                        <span className="font-medium">{insights.purchasePrice} ETH</span>
                                    </div>
                                )}
                                {insights.targetSellPrice && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Target Price:</span>
                                        <span className="font-medium text-green-600">{insights.targetSellPrice} ETH</span>
                                    </div>
                                )}
                                {insights.purchasePrice && insights.targetSellPrice && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Potential Gain:</span>
                                        <span className={`font-medium ${insights.targetSellPrice > insights.purchasePrice ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {((insights.targetSellPrice - insights.purchasePrice) / insights.purchasePrice * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                {insights.marketAnalysis && (
                                    <div className="mt-3">
                                        <div className="text-xs text-gray-500 mb-1">Market Analysis:</div>
                                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                                            {insights.marketAnalysis}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tags and Category */}
                {(insights.tags?.length > 0 || insights.category) && (
                    <div>
                        <button
                            onClick={() => toggleSection('classification')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">Classification</span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'classification' ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        {expandedSection === 'classification' && (
                            <div className="px-4 pb-3 space-y-3">
                                {insights.category && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Category:</div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {insights.category}
                                        </span>
                                    </div>
                                )}
                                {insights.tags && insights.tags.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-2">Tags:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {insights.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Personal Notes */}
                {(insights.description || insights.investmentGoal) && (
                    <div>
                        <button
                            onClick={() => toggleSection('notes')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">Personal Notes</span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'notes' ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        {expandedSection === 'notes' && (
                            <div className="px-4 pb-3 space-y-3">
                                {insights.description && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Description:</div>
                                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                                            {insights.description}
                                        </div>
                                    </div>
                                )}
                                {insights.investmentGoal && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Investment Goal:</div>
                                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                                            {insights.investmentGoal}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        Updated {new Date(insights.updatedAt).toLocaleDateString()}
                    </div>
                    {canEdit && (
                        <Link
                            href={`/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Edit Insights →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
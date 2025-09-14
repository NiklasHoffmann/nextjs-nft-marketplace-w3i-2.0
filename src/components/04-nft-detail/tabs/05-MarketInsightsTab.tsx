import { PublicNFTInsights } from '@/types';

interface MarketInsightsTabProps {
    contractAddress: string;
    tokenId: string;
    publicInsights?: PublicNFTInsights | null;
    loading?: boolean;
}

export default function MarketInsightsTab({
    contractAddress,
    tokenId,
    publicInsights,
    loading
}: MarketInsightsTabProps) {

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading market insights...</p>
            </div>
        );
    }

    if (!publicInsights) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Market Insights Available</h3>
                <p className="text-gray-600">Market insights for this NFT haven't been created yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Market & Community Insights
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    Professional analysis, utilities, and market data for this NFT
                </p>
            </div>

            {/* NFT Classification */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Classification & Properties
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{publicInsights.category || 'Unclassified'}</div>
                        <div className="text-sm text-gray-600 mt-1">Category</div>
                    </div>

                    {/* Rarity */}
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600 capitalize">{publicInsights.rarity || 'Unknown'}</div>
                        <div className="text-sm text-gray-600 mt-1">Rarity</div>
                    </div>

                    {/* Quality Score */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{publicInsights.quality ? `${publicInsights.quality}/10` : 'N/A'}</div>
                        <div className="text-sm text-gray-600 mt-1">Quality Score</div>
                    </div>
                </div>
            </div>

            {/* Utilities & Functions */}
            {(publicInsights.utilities?.length || publicInsights.functions?.length) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Utilities & Functions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Utilities */}
                        {publicInsights.utilities?.length && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Utilities</h4>
                                <div className="space-y-2">
                                    {publicInsights.utilities.map((utility, index) => (
                                        <div key={index} className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{utility}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Functions */}
                        {publicInsights.functions?.length && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Functions</h4>
                                <div className="space-y-2">
                                    {publicInsights.functions.map((func, index) => (
                                        <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{func}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tags */}
            {publicInsights.tags?.length && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags & Features
                    </h3>

                    <div className="flex flex-wrap gap-2">
                        {publicInsights.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Market Analysis */}
            {publicInsights.marketAnalysis && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Market Analysis
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {publicInsights.marketAnalysis.rarityRank && (
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-xl font-bold text-green-600">#{publicInsights.marketAnalysis.rarityRank}</div>
                                <div className="text-sm text-gray-600">Rarity Rank</div>
                            </div>
                        )}

                        {publicInsights.marketAnalysis.rarityScore && (
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-xl font-bold text-blue-600">{publicInsights.marketAnalysis.rarityScore}</div>
                                <div className="text-sm text-gray-600">Rarity Score</div>
                            </div>
                        )}

                        {publicInsights.marketAnalysis.liquidityScore && (
                            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-xl font-bold text-purple-600">{publicInsights.marketAnalysis.liquidityScore}/10</div>
                                <div className="text-sm text-gray-600">Liquidity Score</div>
                            </div>
                        )}

                        {publicInsights.marketAnalysis.marketCap && (
                            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-xl font-bold text-yellow-600">{publicInsights.marketAnalysis.marketCap} ETH</div>
                                <div className="text-sm text-gray-600">Market Cap</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Community Metrics */}
            {publicInsights.communityMetrics && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Community Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {publicInsights.communityMetrics.communityRating && (
                            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {publicInsights.communityMetrics.communityRating.toFixed(1)}/5 ⭐
                                </div>
                                <div className="text-sm text-gray-600">Community Rating</div>
                                {publicInsights.communityMetrics.totalRatings && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        ({publicInsights.communityMetrics.totalRatings} ratings)
                                    </div>
                                )}
                            </div>
                        )}

                        {publicInsights.communityMetrics.holderCount && (
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-2xl font-bold text-blue-600">{publicInsights.communityMetrics.holderCount}</div>
                                <div className="text-sm text-gray-600">Unique Holders</div>
                            </div>
                        )}

                        {publicInsights.communityMetrics.socialMentions && (
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{publicInsights.communityMetrics.socialMentions}</div>
                                <div className="text-sm text-gray-600">Social Mentions</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Technical Information */}
            {publicInsights.technicalMetrics && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Technical Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {publicInsights.technicalMetrics.tokenStandard && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Token Standard:</span>
                                <span className="font-medium text-gray-900">{publicInsights.technicalMetrics.tokenStandard}</span>
                            </div>
                        )}

                        {publicInsights.technicalMetrics.royaltyPercentage !== undefined && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Royalty:</span>
                                <span className="font-medium text-gray-900">{publicInsights.technicalMetrics.royaltyPercentage}%</span>
                            </div>
                        )}

                        {publicInsights.technicalMetrics.totalSupply && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Total Supply:</span>
                                <span className="font-medium text-gray-900">{publicInsights.technicalMetrics.totalSupply}</span>
                            </div>
                        )}

                        {publicInsights.technicalMetrics.mintDate && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Mint Date:</span>
                                <span className="font-medium text-gray-900">{new Date(publicInsights.technicalMetrics.mintDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Verification Status */}
            {publicInsights.isVerified && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 font-medium">Verified NFT Insights</span>
                        {publicInsights.verificationDate && (
                            <span className="text-green-600 text-sm ml-2">
                                (Verified on {new Date(publicInsights.verificationDate).toLocaleDateString()})
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

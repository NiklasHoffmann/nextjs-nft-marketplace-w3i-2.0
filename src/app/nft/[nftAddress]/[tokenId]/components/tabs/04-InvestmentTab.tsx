import { formatEther } from '@/utils';
import { NFTInsights } from '@/types';
import { PublicNFTInsights } from '@/types';
import { RoyaltyInfo } from '@/types';

interface InvestmentTabProps {
    price: string;
    isListed: boolean;
    totalSupply?: number | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    supportsRoyalty?: boolean;
    royaltyInfo?: RoyaltyInfo | null;
    insights?: NFTInsights | PublicNFTInsights | null;
    blockchain: string;
    tokenStandard: string;
}

export default function InvestmentTab({
    price,
    isListed,
    totalSupply,
    rarityRank,
    rarityScore,
    supportsRoyalty,
    royaltyInfo,
    insights,
    blockchain,
    tokenStandard
}: InvestmentTabProps) {
    const currentPriceNum = parseFloat(formatEther(price));

    return (
        <div className="space-y-6">
            {/* Price Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{formatEther(price)}</div>
                    <div className="text-sm text-blue-800 font-medium">Current Listing Price</div>
                    <div className="text-xs text-blue-600 mt-1">
                        {isListed ? '💰 Listed for Sale' : '🔒 Not Listed'}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">1.8</div>
                    <div className="text-sm text-green-800 font-medium">Collection Floor</div>
                    <div className="text-xs text-green-600 mt-1">ETH</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">2.8</div>
                    <div className="text-sm text-purple-800 font-medium">Collection High</div>
                    <div className="text-xs text-purple-600 mt-1">ETH</div>
                </div>
            </div>

            {/* General Market Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Market Performance Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="text-md font-medium text-gray-900 mb-2">24h Price Movement</h4>
                            <div className="text-2xl font-bold text-green-600 mb-1">+12.5%</div>
                            <div className="text-sm text-gray-600">↗ Trending Up</div>
                            <div className="text-xs text-green-600 mt-1">Volume: 45.2 ETH</div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-md font-medium text-gray-900 mb-2">7-Day Performance</h4>
                            <div className="text-2xl font-bold text-blue-600 mb-1">+3.2%</div>
                            <div className="text-sm text-gray-600">📈 Stable Growth</div>
                            <div className="text-xs text-blue-600 mt-1">Avg. Volume: 124.8 ETH</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="text-md font-medium text-gray-900 mb-2">30-Day Trend</h4>
                            <div className="text-2xl font-bold text-purple-600 mb-1">+28.7%</div>
                            <div className="text-sm text-gray-600">🚀 Strong Momentum</div>
                            <div className="text-xs text-purple-600 mt-1">Peak: 2.8 ETH</div>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h4 className="text-md font-medium text-gray-900 mb-2">Collection Floor</h4>
                            <div className="text-2xl font-bold text-orange-600 mb-1">1.8 ETH</div>
                            <div className="text-sm text-gray-600">📊 Floor Price</div>
                            <div className="text-xs text-orange-600 mt-1">24h change: +5.2%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Market Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-medium text-gray-900">Scarcity Factor</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                {totalSupply && totalSupply < 1000
                                    ? `🔥 High scarcity - Only ${totalSupply.toLocaleString()} items in collection`
                                    : totalSupply && totalSupply < 10000
                                        ? `⭐ Medium scarcity - ${totalSupply.toLocaleString()} items in collection`
                                        : totalSupply && totalSupply >= 10000
                                            ? `📈 Large collection - ${totalSupply.toLocaleString()} items`
                                            : "📊 Collection size affects scarcity value"
                                }
                            </p>
                            {rarityRank && totalSupply && (
                                <div className="text-xs text-blue-600 mt-1">
                                    Rarity: Top {((rarityRank / totalSupply) * 100).toFixed(1)}% of collection
                                </div>
                            )}
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                            <h4 className="font-medium text-gray-900">Utility & Standards</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                ✅ {tokenStandard} standard ensures broad compatibility
                            </p>
                            <p className="text-sm text-gray-600">
                                🌐 Built on {blockchain} for security and decentralization
                            </p>
                        </div>

                        {supportsRoyalty && (
                            <div className="border-l-4 border-yellow-500 pl-4">
                                <h4 className="font-medium text-gray-900">Creator Economy</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    💰 EIP-2981 royalties ensure ongoing creator compensation
                                </p>
                                <p className="text-sm text-gray-600">
                                    📊 {royaltyInfo?.percentage?.toFixed(1)}% royalty on secondary sales
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {insights?.marketAnalysis && (
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Market Analysis Report</h4>
                                <p className="text-sm text-blue-800">
                                    {typeof insights.marketAnalysis === 'string'
                                        ? insights.marketAnalysis
                                        : JSON.stringify(insights.marketAnalysis, null, 2)
                                    }
                                </p>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Market Sentiment</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Community Confidence:</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium text-green-600">72%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Trading Activity:</span>
                                    <span className="text-sm font-medium text-blue-600">High</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Market Outlook:</span>
                                    <span className="text-sm font-medium text-green-600">Bullish</span>
                                </div>
                            </div>
                        </div>

                        {!insights?.marketAnalysis && (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">General market analysis available</p>
                                <p className="text-xs text-gray-500">Based on community and trading data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Investment Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Key Investment Metrics
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{formatEther(price)}</div>
                        <div className="text-xs text-gray-600">Current Price (ETH)</div>
                    </div>

                    {totalSupply && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">{totalSupply.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">Total Supply</div>
                        </div>
                    )}

                    {rarityRank && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">#{rarityRank}</div>
                            <div className="text-xs text-gray-600">Rarity Rank</div>
                        </div>
                    )}

                    {supportsRoyalty && royaltyInfo && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-xl font-bold text-gray-900">{royaltyInfo.percentage?.toFixed(1)}%</div>
                            <div className="text-xs text-gray-600">Royalty Rate</div>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Liquidity</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Listed Status:</span>
                                <span className={isListed ? 'text-green-600' : 'text-gray-500'}>
                                    {isListed ? 'Active' : 'Not Listed'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Standard:</span>
                                <span className="text-green-600">{tokenStandard}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Blockchain:</span>
                                <span>{blockchain}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Market Quality Indicators</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            {insights?.quality && (
                                <div className="flex justify-between">
                                    <span>Community Quality Score:</span>
                                    <span className="font-medium">{insights.quality}/10</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Community Rating:</span>
                                <span className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className="text-xs text-yellow-400">★</span>
                                    ))}
                                    <span className="ml-1 text-xs">4.2/5</span>
                                </span>
                            </div>
                            {rarityScore && (
                                <div className="flex justify-between">
                                    <span>Rarity Score:</span>
                                    <span className="font-medium">{rarityScore}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Market Confidence:</span>
                                <span className="font-medium text-green-600">High</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

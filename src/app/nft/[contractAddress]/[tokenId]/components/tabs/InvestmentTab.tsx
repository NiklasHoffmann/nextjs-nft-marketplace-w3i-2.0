import { formatUnits } from 'viem';
import { NFTInsights } from '@/types';
import { PublicNFTInsights } from '@/types';
import { RoyaltyInfo } from '@/types';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';

interface InvestmentTabProps {
    price: string;
    currency?: string | null;
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
    currency,
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
    const chainId = useChainId();
    const tokenDecimals = getTokenDecimalsByAddress(chainId, currency);
    const currencySymbol = getCurrencySymbolByAddress(chainId, currency);
    const formattedPrice = formatUnits(BigInt(price), tokenDecimals);

    return (
        <div className="space-y-6">
            {/* Price Overview */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{formattedPrice} {currencySymbol}</div>
                    <div className="text-sm text-blue-800 font-medium">Current Listing Price</div>
                    <div className="text-xs text-blue-600 mt-1">
                        {isListed ? '💰 Listed for Sale' : '🔒 Not Listed'}
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

                        {!insights?.marketAnalysis && (
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">No market analysis available</p>
                                <p className="text-xs text-gray-500">Market insights are created by the community</p>
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
                        <div className="text-xl font-bold text-gray-900">{formattedPrice}</div>
                        <div className="text-xs text-gray-600">Current Price ({currencySymbol})</div>
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
                            {rarityScore && (
                                <div className="flex justify-between">
                                    <span>Rarity Score:</span>
                                    <span className="font-medium">{rarityScore}</span>
                                </div>
                            )}
                            {!insights?.quality && !rarityScore && (
                                <div className="text-center py-2">
                                    <p className="text-xs text-gray-500">No quality indicators available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

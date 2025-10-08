import { formatEther } from '@/utils';
import { TokenomicsTabProps } from '@/types';

export default function TokenomicsTab({
    price,
    totalSupply,
    rarityRank,
    supportsRoyalty,
    royaltyInfo,
    tokenStandard,
    blockchain,
    currentOwner
}: TokenomicsTabProps) {
    return (
        <div className="space-y-6">
            {/* Coming Soon Notice */}
            <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Tokenomics Analysis Coming Soon</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Advanced tokenomics analysis including supply distribution, market dynamics,
                    and economic modeling will be available in a future update.
                </p>
            </div>

            {/* Basic Economic Info - What we DO have */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Economic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Current Price</span>
                            <span className="text-sm text-gray-900 font-bold">{formatEther(price)} ETH</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Token Standard</span>
                            <span className="text-sm text-gray-900 font-semibold">{tokenStandard}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Blockchain</span>
                            <span className="text-sm text-gray-900">{blockchain}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Collection Size</span>
                            <span className="text-sm text-gray-900">{totalSupply?.toLocaleString() || 'Unknown'} items</span>
                        </div>

                        {rarityRank && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Rarity Rank</span>
                                <span className="text-sm text-gray-900">#{rarityRank}</span>
                            </div>
                        )}

                        {supportsRoyalty && royaltyInfo && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Creator Royalty</span>
                                <span className="text-sm text-gray-900">{royaltyInfo.percentage?.toFixed(2) || '0'}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

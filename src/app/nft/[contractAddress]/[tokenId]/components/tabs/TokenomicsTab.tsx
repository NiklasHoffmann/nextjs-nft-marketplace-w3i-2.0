import { formatUnits } from 'viem';
import { TokenomicsTabProps } from '@/types';
import { EmptyState } from '@/components/core/Empty';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';

export default function TokenomicsTab({
    price,
    currency,
    totalSupply,
    rarityRank,
    supportsRoyalty,
    royaltyInfo,
    tokenStandard,
    blockchain,
    currentOwner
}: TokenomicsTabProps) {
    const chainId = useChainId();
    const tokenDecimals = getTokenDecimalsByAddress(chainId, currency);
    const currencySymbol = getCurrencySymbolByAddress(chainId, currency);
    const formattedPrice = formatUnits(BigInt(price), tokenDecimals);

    return (
        <div className="space-y-6">
            {/* Coming Soon Notice */}
            <EmptyState
                icon="📊"
                title="Tokenomics Analysis Coming Soon"
                description="Advanced tokenomics analysis including supply distribution, market dynamics, and economic modeling will be available in a future update."
                size="sm"
            />

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
                            <span className="text-sm text-gray-900 font-bold">{formattedPrice} {currencySymbol}</span>
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

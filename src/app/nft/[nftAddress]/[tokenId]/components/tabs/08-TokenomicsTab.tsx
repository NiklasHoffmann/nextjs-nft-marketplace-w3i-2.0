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
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tokenomics & Economics</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatEther(price)}</div>
                    <div className="text-sm text-blue-800">Current Price (ETH)</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{totalSupply?.toLocaleString() || 'N/A'}</div>
                    <div className="text-sm text-green-800">Total Supply</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{rarityRank || 'N/A'}</div>
                    <div className="text-sm text-purple-800">Rarity Rank</div>
                </div>

                {supportsRoyalty && royaltyInfo && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{royaltyInfo.percentage?.toFixed(1) || '0'}%</div>
                        <div className="text-sm text-yellow-800">Royalty Rate</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">Economic Details</h4>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Token Standard</span>
                            <span className="text-sm text-gray-900 font-semibold">{tokenStandard}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Blockchain</span>
                            <span className="text-sm text-gray-900">{blockchain}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Collection Size</span>
                            <span className="text-sm text-gray-900">{totalSupply?.toLocaleString() || 'Unknown'} items</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Listing Price</span>
                            <span className="text-sm text-gray-900 font-bold">{formatEther(price)} ETH</span>
                        </div>

                        {supportsRoyalty && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Creator Royalty</span>
                                <span className="text-sm text-gray-900">{royaltyInfo?.percentage?.toFixed(2) || '0'}%</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">Market Analysis</h4>

                    <div className="border-l-4 border-blue-500 pl-4 mb-4">
                        <h5 className="font-medium text-gray-900">Scarcity</h5>
                        <p className="text-sm text-gray-600 mt-1">
                            {totalSupply && totalSupply < 10000
                                ? `Limited collection of ${totalSupply.toLocaleString()} items`
                                : totalSupply && totalSupply >= 10000
                                    ? `Large collection of ${totalSupply.toLocaleString()} items`
                                    : "Collection size determining uniqueness value"
                            }
                        </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 mb-4">
                        <h5 className="font-medium text-gray-900">Utility</h5>
                        <p className="text-sm text-gray-600 mt-1">
                            {tokenStandard} standard ensures broad wallet and marketplace compatibility
                        </p>
                    </div>

                    {supportsRoyalty && (
                        <div className="border-l-4 border-yellow-500 pl-4">
                            <h5 className="font-medium text-gray-900">Creator Economy</h5>
                            <p className="text-sm text-gray-600 mt-1">
                                Built-in royalty system ensures ongoing creator compensation at {royaltyInfo?.percentage?.toFixed(1)}% per sale
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ownership Economics */}
            <div className="border-t pt-6 mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Ownership Economics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Current Owner</h5>
                        <p className="text-xs font-mono text-gray-600 break-all">
                            {currentOwner || 'Loading...'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Verified on-chain ownership
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Transfer Rights</h5>
                        <p className="text-sm text-gray-600">
                            Full ownership transfer rights via {tokenStandard} standard
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Economic Value</h5>
                        <p className="text-sm text-gray-600">
                            Market-determined value through trading and scarcity
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { truncateAddress } from '@/utils';
import { NFTAttribute } from '@/types/features/nft-detail';
import { NFTInsights } from '@/types';
import { PublicNFTInsights } from '@/types';
import { InvalidListingWarning } from '../InvalidListingWarning';

interface OverviewTabProps {
    contractAddress: string;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    description?: string | null;
    price: string;
    isListed: boolean;
    currentOwner?: string | null;
    creator?: string | null;
    seller: string;
    attributes?: NFTAttribute[];
    insights?: NFTInsights | PublicNFTInsights | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    totalSupply?: number | null;
    blockchain: string;
    tokenStandard: string;
    // Validation fields
    isValid?: boolean;
    invalidReasons?: string[] | null;
    invalidatedAt?: Date | null;
    // v2 marketplace details
    nftDetails?: any;
}

export default function OverviewTab({ contractAddress,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    description,
    price,
    isListed,
    currentOwner,
    creator,
    seller,
    attributes,
    insights,
    rarityRank,
    rarityScore,
    totalSupply,
    blockchain,
    tokenStandard,
    isValid,
    invalidReasons,
    invalidatedAt,
    nftDetails
}: OverviewTabProps) {
    // Name priority: contractName (collection) > collection > fallback
    // Note: customTitle was removed from NFTInsights schema
    const displayName = contractName || collection || 'Unknown NFT';

    // Description priority: metadata description > fallback
    const displayDescription = description || 'No description available';

    return (
        <div className="space-y-6">
            {/* Invalid Listing Warning */}
            <InvalidListingWarning
                isValid={isValid ?? true}
                invalidReasons={invalidReasons ?? null}
                invalidatedAt={invalidatedAt ? invalidatedAt.toISOString() : null}
                owner={currentOwner ?? null}
                seller={seller}
            />

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {insights && 'personalRating' in insights && insights.personalRating && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                        <div className="flex justify-center mb-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`text-lg ${star <= insights.personalRating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <div className="text-sm text-yellow-800">Personal Rating</div>
                    </div>
                )}

                {(rarityRank || insights?.rarity) && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {rarityRank ? `#${rarityRank}` : insights?.rarity ? (insights.rarity.charAt(0).toUpperCase() + insights.rarity.slice(1)) : 'N/A'}
                        </div>
                        <div className="text-sm text-purple-800">Rarity</div>
                    </div>
                )}

                {totalSupply && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{totalSupply.toLocaleString()}</div>
                        <div className="text-sm text-green-800">Collection Size</div>
                    </div>
                )}
            </div>

            {/* Main Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About this NFT
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-sm text-gray-900 font-medium">{displayName}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Collection</label>
                            <p className="text-sm text-gray-900">{contractName || collection || 'Unknown'}</p>
                            {contractSymbol && (
                                <p className="text-xs text-gray-500">Symbol: {contractSymbol}</p>
                            )}
                        </div>

                        {displayDescription && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Description</label>
                                <p className="text-sm text-gray-900 mt-1 leading-relaxed">
                                    {displayDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ownership & Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Ownership & Status
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Current Owner</label>
                            <p className="text-sm font-mono text-gray-900">
                                {currentOwner ? truncateAddress(currentOwner) : 'Loading...'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Listed By</label>
                            <p className="text-sm font-mono text-gray-900">{truncateAddress(seller)}</p>
                        </div>

                        {creator && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Creator</label>
                                <p className="text-sm font-mono text-gray-900">{truncateAddress(creator)}</p>
                            </div>
                        )}

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isListed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {isListed ? '💰 Listed for Sale' : '🔒 Not Listed'}
                            </span>

                            {insights && 'isFavorite' in insights && insights.isFavorite && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ❤️ Favorite
                                </span>
                            )}

                            {insights && 'isWatchlisted' in insights && insights.isWatchlisted && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    👁️ Watchlisted
                                </span>
                            )}

                            {insights && 'strategy' in insights && insights.strategy && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    📈 {insights.strategy.charAt(0).toUpperCase() + insights.strategy.slice(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Attributes */}
            {attributes && attributes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Key Attributes ({attributes.length})
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {attributes.slice(0, 8).map((attr, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {attr.trait_type}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {attr.value}
                                </div>
                                {attr.display_type && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {attr.display_type}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {attributes.length > 8 && (
                        <div className="text-center mt-4">
                            <span className="text-sm text-gray-500">
                                +{attributes.length - 8} more attributes in Technical tab
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Marketplace v2 Information */}
            {nftDetails && isListed && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Marketplace Details (v2)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Listing Type */}
                        {nftDetails.listingType && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Listing Type</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {nftDetails.listingType === 'PURE_ETH' && '💰 ETH Only'}
                                    {nftDetails.listingType === 'SWAP_AND_ETH' && '🔄 Swap + ETH'}
                                    {nftDetails.listingType === 'PURE_SWAP' && '🔁 Pure Swap'}
                                </p>
                            </div>
                        )}

                        {/* Status */}
                        {nftDetails.status && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {nftDetails.status === 'LISTED' && '✅ Listed'}
                                    {nftDetails.status === 'PARTIALLY_FILLED' && '⏳ Partially Filled'}
                                    {nftDetails.status === 'SOLD_OUT' && '✔️ Sold Out'}
                                    {nftDetails.status === 'CANCELED' && '❌ Canceled'}
                                    {nftDetails.status === 'INVALIDATED' && '⚠️ Invalidated'}
                                </p>
                            </div>
                        )}

                        {/* Token Standard */}
                        <div className="bg-white rounded-lg p-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Token Standard</label>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{nftDetails.tokenStandard || tokenStandard}</p>
                        </div>

                        {/* ERC1155 Quantity (if applicable) */}
                        {nftDetails.tokenStandard === 'ERC1155' && nftDetails.erc1155QuantityListed && (
                            <>
                                <div className="bg-white rounded-lg p-3">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Listed Quantity</label>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{nftDetails.erc1155QuantityListed}</p>
                                </div>
                                {nftDetails.remainingQuantity && (
                                    <div className="bg-white rounded-lg p-3">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</label>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">{nftDetails.remainingQuantity}</p>
                                    </div>
                                )}
                                {nftDetails.unitPrice && (
                                    <div className="bg-white rounded-lg p-3">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</label>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            {(parseFloat(nftDetails.unitPrice) / 1e18).toFixed(4)} ETH
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Fee Rate */}
                        {nftDetails.feeRate && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Marketplace Fee</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {(parseFloat(nftDetails.feeRate) / 1000).toFixed(2)}%
                                </p>
                            </div>
                        )}

                        {/* Buyer Whitelist */}
                        {nftDetails.buyerWhitelistEnabled !== undefined && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer Whitelist</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {nftDetails.buyerWhitelistEnabled ? '🔒 Enabled' : '🔓 Disabled'}
                                </p>
                            </div>
                        )}

                        {/* Partial Buy (ERC1155) */}
                        {nftDetails.partialBuyEnabled !== undefined && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Partial Buy</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {nftDetails.partialBuyEnabled ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                            </div>
                        )}

                        {/* Chain ID */}
                        {nftDetails.chainId && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chain ID</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {nftDetails.chainId === 11155111 ? 'Sepolia' : nftDetails.chainId}
                                </p>
                            </div>
                        )}

                        {/* Created At */}
                        {nftDetails.createdAt && (
                            <div className="bg-white rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Listed On</label>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                    {new Date(parseInt(nftDetails.createdAt) * 1000).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Swap Target (if applicable) */}
                    {(nftDetails.listingType === 'SWAP_AND_ETH' || nftDetails.listingType === 'PURE_SWAP') &&
                        (nftDetails.desiredTokenAddress || nftDetails.desiredContractAddress) && (
                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-2">🔄 Swap Requirements</h4>
                                <div className="space-y-1 text-xs text-yellow-800">
                                    <p><span className="font-medium">Desired NFT:</span> {nftDetails.desiredTokenAddress || nftDetails.desiredContractAddress}</p>
                                    {nftDetails.desiredTokenId && (
                                        <p><span className="font-medium">Token ID:</span> {nftDetails.desiredTokenId}</p>
                                    )}
                                    {nftDetails.desiredErc1155Quantity && (
                                        <p><span className="font-medium">Quantity:</span> {nftDetails.desiredErc1155Quantity}</p>
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* Quick Investment Overview */}
            {insights && 'purchasePrice' in insights && (insights.purchasePrice || insights.targetSellPrice) && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Investment Overview
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {'purchasePrice' in insights && insights.purchasePrice && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{insights.purchasePrice}</div>
                                <div className="text-sm text-green-800">Purchase Price (ETH)</div>
                            </div>
                        )}

                        {'targetSellPrice' in insights && insights.targetSellPrice && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{insights.targetSellPrice}</div>
                                <div className="text-sm text-blue-800">Target Price (ETH)</div>
                            </div>
                        )}

                        {'purchasePrice' in insights && 'targetSellPrice' in insights && insights.purchasePrice && insights.targetSellPrice && (
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${insights.targetSellPrice > insights.purchasePrice ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {((insights.targetSellPrice - insights.purchasePrice) / insights.purchasePrice * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-800">Potential Gain</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

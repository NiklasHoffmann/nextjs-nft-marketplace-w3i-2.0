interface RoyaltyInfo {
    percentage?: number | null;
    receiver?: string;
    amount?: string;
}

interface FunctionalitiesTabProps {
    attributes?: any[] | null;
    blockchain: string;
    tokenStandard: string;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
}

export default function FunctionalitiesTab({
    attributes,
    blockchain,
    tokenStandard,
    supportsRoyalty,
    royaltyInfo
}: FunctionalitiesTabProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT Functionalities</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">Tradeable</h4>
                    </div>
                    <p className="text-sm text-gray-600">This NFT can be traded on various marketplaces</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">Metadata</h4>
                    </div>
                    <p className="text-sm text-gray-600">Rich metadata with {attributes?.length || 0} attributes and properties</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a3 3 0 003 3h2a3 3 0 003-3V3a2 2 0 012 2v6h-3a3 3 0 00-3 3v3H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">Provenance</h4>
                    </div>
                    <p className="text-sm text-gray-600">Immutable ownership history on {blockchain} blockchain</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">{tokenStandard} Smart Contract</h4>
                    </div>
                    <p className="text-sm text-gray-600">Powered by verified {tokenStandard} smart contract technology</p>
                </div>

                {supportsRoyalty && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="font-medium text-gray-900">EIP-2981 Royalties</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Supports automatic creator royalties ({royaltyInfo?.percentage?.toFixed(2) || '0'}%)
                            {royaltyInfo?.receiver && (
                                <span className="block mt-1 text-xs font-mono">
                                    Recipient: {royaltyInfo.receiver.slice(0, 6)}...{royaltyInfo.receiver.slice(-4)}
                                </span>
                            )}
                        </p>
                    </div>
                )}

                <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">Interoperability</h4>
                    </div>
                    <p className="text-sm text-gray-600">Compatible with all {tokenStandard} supporting platforms and wallets</p>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900">Transparency</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                        All contract interactions are publicly verifiable on the blockchain
                    </p>
                </div>
            </div>

            {/* Contract Functions Information */}
            <div className="border-t pt-6 mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Available Contract Functions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Standard Functions</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Transfer</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Approve</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metadata URI</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Owner Query</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Extended Functions</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Royalty Info (EIP-2981)</span>
                                <span className={supportsRoyalty ? "text-green-600" : "text-gray-400"}>
                                    {supportsRoyalty ? "✓ Supported" : "✗ Not Supported"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Collection Info</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Supply</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Token Exists</span>
                                <span className="text-green-600">✓ Supported</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
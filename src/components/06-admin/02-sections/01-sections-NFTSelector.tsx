"use client";

/**
 * NFT Selector Component
 * 
 * Features:
 * - 📍 Contract Address Input mit Validation
 * - 🔢 Token ID Input  
 * - ✅ Address Format Validation
 * - 🔍 Visual Feedback
 */

interface NFTSelectorProps {
    contractAddress: string;
    tokenId: string;
    onContractAddressChange: (value: string) => void;
    onTokenIdChange: (value: string) => void;
}

export default function NFTSelector({
    contractAddress,
    tokenId,
    onContractAddressChange,
    onTokenIdChange
}: NFTSelectorProps) {

    const isValidAddress = (address: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const isValidTokenId = (id: string): boolean => {
        return id.trim().length > 0 && /^\d+$/.test(id.trim());
    };

    return (
        <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">NFT Selection</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contract Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Address *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={contractAddress}
                            onChange={(e) => onContractAddressChange(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 pr-10 ${contractAddress.length === 0
                                ? 'border-gray-300 focus:ring-blue-500'
                                : isValidAddress(contractAddress)
                                    ? 'border-green-300 focus:ring-green-500 bg-green-50'
                                    : 'border-red-300 focus:ring-red-500 bg-red-50'
                                }`}
                            placeholder="0x..."
                            required
                        />

                        {/* Validation Icon */}
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {contractAddress.length > 0 && (
                                isValidAddress(contractAddress) ? (
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )
                            )}
                        </div>
                    </div>

                    {contractAddress.length > 0 && !isValidAddress(contractAddress) && (
                        <p className="mt-1 text-sm text-red-600">
                            Ungültige Ethereum-Adresse. Format: 0x + 40 Hex-Zeichen
                        </p>
                    )}
                </div>

                {/* Token ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Token ID *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={tokenId}
                            onChange={(e) => onTokenIdChange(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 pr-10 ${tokenId.length === 0
                                ? 'border-gray-300 focus:ring-blue-500'
                                : isValidTokenId(tokenId)
                                    ? 'border-green-300 focus:ring-green-500 bg-green-50'
                                    : 'border-red-300 focus:ring-red-500 bg-red-50'
                                }`}
                            placeholder="z.B. 1234"
                            required
                        />

                        {/* Validation Icon */}
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {tokenId.length > 0 && (
                                isValidTokenId(tokenId) ? (
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )
                            )}
                        </div>
                    </div>

                    {tokenId.length > 0 && !isValidTokenId(tokenId) && (
                        <p className="mt-1 text-sm text-red-600">
                            Token ID muss eine Zahl sein
                        </p>
                    )}
                </div>
            </div>

            {/* NFT Summary */}
            {isValidAddress(contractAddress) && isValidTokenId(tokenId) && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">
                            NFT Selected: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)} #{tokenId}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
'use client';

import React, { useMemo } from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { useChainId } from 'wagmi';
import { NFTCard } from '@/components/nft/NFTCard';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import { CheckCircleIcon } from '@/components/icons';
import { getCurrencySymbolByAddress, ZERO_ADDRESS } from '@/config/tokens';

interface ListingProgressInlineProps {
    nft: AggregatedNFT;
    mode: 'sale' | 'trade' | 'hybrid';
    price?: string;
    currency?: string;
    
    currentStep?: 'whitelist' | 'approval' | 'approved' | 'signing' | 'pending' | 'success' | 'error';
    completedSteps?: string[];
    txHash?: string;
    error?: string;
    onReset?: () => void;
}

export function ListingProgressInline({
    nft,
    mode,
    price,
    currency,
    currentStep = 'whitelist',
    completedSteps = [],
    txHash,
    error,
    onReset
}: ListingProgressInlineProps) {
    const chainId = useChainId();
    const currencySymbol = useMemo(
        () => getCurrencySymbolByAddress(chainId, currency || ZERO_ADDRESS),
        [chainId, currency]
    );

    const steps = [
        {
            id: 'whitelist',
            label: 'Whitelist prüfen',
            description: 'Prüfe Collection-Berechtigung',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            id: 'approval',
            label: 'NFT-Freigabe',
            description: 'Marketplace Zugriff genehmigen',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'signing',
            label: 'Wallet-Signatur',
            description: 'Transaktion signieren',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            )
        },
        {
            id: 'pending',
            label: 'Blockchain-Bestätigung',
            description: 'Warte auf Bestätigung',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    const getStepStatus = (stepId: string) => {
        if (error && stepId === currentStep) return 'error';
        if (completedSteps.includes(stepId)) return 'completed';
        if (stepId === currentStep) return 'active';
        return 'pending';
    };

    const modeInfo = {
        sale: { label: 'Verkaufs-Listing', type: 'Verkauf' },
        trade: { label: 'Tausch-Listing', type: 'Tausch' },
        hybrid: { label: 'Hybrid-Listing', type: 'Verkauf/Tausch' }
    }[mode];

    return (
        <div className="space-y-6">
            {currentStep !== 'success' ? (
                <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
                    {/* Left: Progress Section */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{modeInfo.label} wird erstellt</h2>
                            <p className="text-gray-600">Bitte folgen Sie den Schritten und bestätigen Sie die Transaktion</p>
                        </div>

                        {/* Progress Steps - Vertical */}
                        <div className="space-y-4 mb-6">
                            {steps.map((step) => {
                                const status = getStepStatus(step.id);
                                return (
                                    <div key={step.id} className="flex items-start gap-4">
                                        {/* Step Circle */}
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 transition-all duration-300
                                            ${status === 'completed' ? 'bg-green-500 text-white shadow-lg' : ''}
                                            ${status === 'active' ? 'bg-blue-500 text-white shadow-lg animate-pulse' : ''}
                                            ${status === 'error' ? 'bg-red-500 text-white shadow-lg' : ''}
                                            ${status === 'pending' ? 'bg-gray-200 text-gray-400' : ''}
                                        `}>
                                            {status === 'completed' && (
                                                <CheckCircleIcon className="w-7 h-7 text-white" />
                                            )}
                                            {status === 'error' && (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            {status === 'active' && step.icon}
                                            {status === 'pending' && <div className="opacity-50">{step.icon}</div>}
                                        </div>

                                        {/* Step Content */}
                                        <div className="flex-1 pt-2">
                                            <p className={`text-base font-semibold mb-1 ${status === 'active' ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {step.label}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Current Step Info */}
                        {!error && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-700">
                                        {currentStep === 'whitelist' && 'Prüfe ob die Collection für den Marketplace freigeschaltet ist...'}
                                        {currentStep === 'approval' && 'Bitte genehmigen Sie den Zugriff auf Ihren NFT in Ihrer Wallet.'}
                                        {currentStep === 'signing' && 'Bitte bestätigen Sie die Transaktion in Ihrer Wallet.'}
                                        {currentStep === 'pending' && 'Die Transaktion wird auf der Blockchain verarbeitet. Dies kann einige Sekunden dauern.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Transaction Hash */}
                        {txHash && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-xs font-medium text-gray-600 mb-2">Transaction Hash:</p>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all hover:underline"
                                >
                                    {txHash}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right: NFT Card & Listing Info */}
                    <div className="space-y-4">
                        {/* NFT Preview */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ihr NFT</h3>
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 mb-4 relative">
                                <OptimizedNFTImage
                                    imageUrl={nft.meta?.image || '/placeholder-nft.png'}
                                    tokenId={nft.core.tokenId}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 truncate">{nft.meta?.name || 'Unnamed NFT'}</h4>
                                <p className="text-sm text-gray-500">Token ID: {nft.core.tokenId}</p>
                                <p className="text-xs text-gray-400 truncate">{nft.core.contractName || 'Unknown Collection'}</p>
                            </div>
                        </div>

                        {/* Listing Details */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Listing-Typ</p>
                                    <p className="font-semibold text-gray-900">{modeInfo.label}</p>
                                </div>
                                {price && (
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Preis</p>
                                        <p className="text-2xl font-bold text-blue-600">{price} {currencySymbol}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Success State - Compact Version
                <div className="space-y-6">
                    {/* Success Header - Horizontal */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Erfolgreich gelistet!</h2>
                                <p className="text-gray-600">Ihr NFT ist jetzt auf dem Marketplace verfügbar</p>
                            </div>
                        </div>
                    </div>

                    {/* NFT Presentation */}
                    <div className="grid md:grid-cols-[240px,1fr] gap-6">
                        {/* Left: NFT Card - Same width as gallery (w-60 = 240px) */}
                        <div className="space-y-4">
                            <div className="w-60 p-2">
                                <NFTCard nft={nft} priority showStats={false} />
                            </div>

                            {/* View Button */}
                            <a
                                href={`/nft/${nft.core.contractAddress}/${nft.core.tokenId}`}
                                className="block w-60 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl text-center transition-all transform hover:scale-105 shadow-lg"
                            >
                                NFT Details ansehen →
                            </a>

                            {/* New Listing Button */}
                            {onReset && (
                                <button
                                    onClick={onReset}
                                    className="block w-60 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 rounded-xl text-center transition-all transform hover:scale-105 shadow-lg"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Neues NFT listen
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Right: Listing Details */}
                        <div className="space-y-4">
                            {/* NFT Info and Listing Info - Side by Side */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* NFT Info */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Name</p>
                                            <p className="font-semibold text-gray-900">{nft.meta?.name || 'Unnamed NFT'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Token ID</p>
                                            <p className="font-mono text-sm text-gray-700">{nft.core.tokenId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Collection</p>
                                            <p className="text-sm text-gray-700">{nft.core.contractName || 'Unknown Collection'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Listing Info */}
                                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Listing Informationen
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Listing-Typ</p>
                                            <p className="font-semibold text-gray-900">{modeInfo.label}</p>
                                        </div>
                                        {price && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Preis</p>
                                                <p className="text-2xl font-bold text-green-600">{price} {currency || 'ETH'}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Status</p>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Aktiv gelistet
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Info - Full Width Below */}
                            {txHash && (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction</h3>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">Transaction Hash:</p>
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all hover:underline flex items-center gap-2"
                                        >
                                            <span className="truncate">{txHash}</span>
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

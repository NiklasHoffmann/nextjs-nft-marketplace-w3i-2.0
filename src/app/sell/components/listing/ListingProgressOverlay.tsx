'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { NFTCard } from '@/components/nft/NFTCard';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import { useChainId } from 'wagmi';
import { getCurrencySymbolByAddress, ZERO_ADDRESS } from '@/config/tokens';

interface ListingProgressOverlayProps {
    nft: AggregatedNFT;
    mode: 'sale' | 'trade' | 'hybrid';
    price?: string;
    currency?: string;
    isVisible: boolean;
    currentStep?: 'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error';
    completedSteps?: string[];
    txHash?: string;
    error?: string;
}

export function ListingProgressOverlay({
    nft,
    mode,
    price,
    currency,
    isVisible,
    currentStep = 'whitelist',
    completedSteps = [],
    txHash,
    error
}: ListingProgressOverlayProps) {
    const chainId = useChainId();

    if (!isVisible) return null;

    const steps = [
        { id: 'whitelist', label: 'Whitelist pruefen', icon: '🔍' },
        { id: 'approval', label: 'NFT-Freigabe', icon: '✅' },
        { id: 'signing', label: 'Wallet-Signatur', icon: '✍️' },
        { id: 'pending', label: 'Blockchain-Bestaetigung', icon: '⏳' },
        { id: 'success', label: 'Erfolgreich gelistet!', icon: '🎉' }
    ];

    const contractAddress = nft.core?.contractAddress || nft.contractAddress;
    const tokenId = nft.core?.tokenId || nft.tokenId;

    const getStepStatus = (stepId: string) => {
        if (error && stepId === currentStep) return 'error';
        if (completedSteps.includes(stepId)) return 'completed';
        if (stepId === currentStep) return 'active';
        return 'pending';
    };

    const getModeIcon = () => {
        switch (mode) {
            case 'sale':
                return (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                );
            case 'trade':
                return (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                );
            case 'hybrid':
                return (
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                );
        }
    };

    const getModeText = () => {
        switch (mode) {
            case 'sale':
                return 'Verkaufs-Listing';
            case 'trade':
                return 'Tausch-Angebot';
            case 'hybrid':
                return 'Hybrid-Angebot';
        }
    };

    const getModeClasses = () => {
        switch (mode) {
            case 'sale':
                return {
                    iconBg: 'bg-blue-50 border-blue-200',
                    pulseBorder: 'border-blue-400',
                    priceBox: 'bg-blue-100 text-blue-700',
                    spinner: 'border-blue-200 border-t-blue-500',
                    dot: 'bg-blue-500'
                };
            case 'trade':
                return {
                    iconBg: 'bg-green-50 border-green-200',
                    pulseBorder: 'border-green-400',
                    priceBox: 'bg-green-100 text-green-700',
                    spinner: 'border-green-200 border-t-green-500',
                    dot: 'bg-green-500'
                };
            case 'hybrid':
                return {
                    iconBg: 'bg-purple-50 border-purple-200',
                    pulseBorder: 'border-purple-400',
                    priceBox: 'bg-purple-100 text-purple-700',
                    spinner: 'border-purple-200 border-t-purple-500',
                    dot: 'bg-purple-500'
                };
        }
    };

    const classes = getModeClasses();
    const currencySymbol = useMemo(
        () => getCurrencySymbolByAddress(chainId, currency || ZERO_ADDRESS),
        [chainId, currency]
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in slide-in-from-bottom-4 duration-500">
                {currentStep !== 'success' && (
                    <>
                        <div className="flex flex-col items-center mb-6">
                            <div className={`mb-4 p-4 rounded-full border-2 ${classes.iconBg}`}>
                                {getModeIcon()}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                {getModeText()} wird erstellt
                            </h2>
                            <p className="text-sm text-gray-600 text-center">
                                Bitte bestaetigen Sie die Transaktion in Ihrer Wallet
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 mb-6">
                            <div className="flex gap-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg relative">
                                        <OptimizedNFTImage
                                            imageUrl={nft.meta?.image || '/media/custom-nft.jpg'}
                                            tokenId={String(nft.tokenId)}
                                            alt={nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                                            className="object-cover"
                                            fill={true}
                                        />
                                    </div>
                                    <div className={`absolute inset-0 rounded-xl border-2 animate-pulse ${classes.pulseBorder}`}></div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                        {nft.core.name || nft.meta?.name || `NFT #${nft.tokenId}`}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">Token ID: {nft.tokenId}</p>
                                    {price && (
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${classes.priceBox}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            {price} {currencySymbol}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-4">
                    <div className="space-y-3">
                        {steps.map((step) => {
                            const status = getStepStatus(step.id);
                            return (
                                <div key={step.id} className="flex items-center gap-3">
                                    {status === 'completed' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {status === 'active' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                    {status === 'error' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    )}
                                    {status === 'pending' && (
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        </div>
                                    )}

                                    <span
                                        className={`text-sm font-medium ${status === 'active'
                                            ? 'text-gray-900'
                                            : status === 'completed'
                                                ? 'text-green-600'
                                                : status === 'error'
                                                    ? 'text-red-600'
                                                    : 'text-gray-500'
                                            }`}
                                    >
                                        {step.icon} {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {txHash && currentStep !== 'success' && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all"
                            >
                                {txHash}
                            </a>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {!error && currentStep !== 'success' && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-blue-700">
                                {currentStep === 'approval' && 'Bitte genehmigen Sie den Zugriff auf Ihren NFT in Ihrer Wallet.'}
                                {currentStep === 'signing' && 'Bitte bestaetigen Sie die Transaktion in Ihrer Wallet.'}
                                {currentStep === 'pending' && 'Die Transaktion wird auf der Blockchain verarbeitet. Dies kann einige Sekunden dauern.'}
                                {currentStep === 'whitelist' && 'Pruefe ob die Collection fuer den Marketplace freigeschaltet ist...'}
                            </p>
                        </div>
                    </div>
                )}

                {currentStep === 'success' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Erfolgreich gelistet!</h3>
                        </div>

                        <Link
                            href={`/nft/${contractAddress}/${tokenId}`}
                            className="cursor-pointer transform transition-all duration-300 hover:scale-[1.02] relative block"
                            style={{
                                animation: 'pulse-border 2s ease-in-out infinite'
                            }}
                        >
                            <style jsx>{`
                                @keyframes pulse-border {
                                    0%, 100% {
                                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                                    }
                                    50% {
                                        box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
                                    }
                                }
                            `}</style>
                            <div className="relative rounded-xl border-2 border-green-400 overflow-hidden max-w-sm mx-auto">
                                <div className="aspect-[3/4]">
                                    <NFTCard nft={nft} />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500/90 to-transparent p-4 text-center pointer-events-none">
                                    <p className="text-white text-sm font-semibold flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                        </svg>
                                        Karte anklicken fuer Details
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-green-900">Listing erfolgreich erstellt!</p>
                                    <p className="text-xs text-green-700 mt-1">Ihr NFT ist jetzt auf dem Marketplace verfuegbar.</p>
                                </div>
                            </div>
                        </div>

                        {txHash && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1 font-medium">Transaction Hash:</p>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all"
                                >
                                    {txHash}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

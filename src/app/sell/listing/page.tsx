'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useListingFlow } from '../contexts/ListingFlowContext';
import { useTransactionService } from '@/services/blockchain';
import { useMarketplaceContracts } from '../hooks/useMarketplaceContracts';
import NFTCard from '@/components/nft/NFTCard';
import { useMarketplaceFees } from '../hooks/useMarketplaceFees';
import Link from 'next/link';

export default function ListingPage() {
    const router = useRouter();
    const { address } = useAccount();
    const { formData, setProgressStep, setCompletedSteps, setTxHash, setError } = useListingFlow();
    const { marketplaceAddress } = useMarketplaceContracts();
    const txService = useTransactionService();
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: formData.selectedNFT?.contractAddress,
        tokenId: formData.selectedNFT?.tokenId
    });

    const [currentStep, setCurrentStep] = useState<'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error'>('signing');
    const [completedSteps, setCompletedStepsLocal] = useState<string[]>([]);
    const [progressTxHash, setProgressTxHash] = useState<string | undefined>();
    const [progressError, setProgressError] = useState<string | undefined>();
    const [isProcessing, setIsProcessing] = useState(false);
    const hasStartedRef = useRef(false);

    // Guard: Redirect if no NFT selected
    useEffect(() => {
        if (!formData.selectedNFT) {
            router.replace('/sell');
        } else {
            setProgressStep('listing', 'whitelist');
        }
    }, [formData.selectedNFT, router, setProgressStep]);

    // Whitelist check function
    const checkWhitelist = useCallback(async (contractAddress: string): Promise<boolean> => {
        try {
            const result = await fetch('/api/marketplace/whitelist-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractAddress, marketplaceAddress })
            });
            const data = await result.json();
            return data.whitelisted === true;
        } catch (error) {
            console.error('Whitelist check failed:', error);
            return false;
        }
    }, [marketplaceAddress]);

    // Approval check (simplified - assumes approval handled before this step)
    const ensureApproval = async (): Promise<boolean> => {
        // In real implementation, check approval status and request if needed
        // For now, we assume approval was handled in previous steps
        return true;
    };

    // Start transaction automatically when page loads
    useEffect(() => {
        if (!formData.selectedNFT || isProcessing || hasStartedRef.current) return;

        hasStartedRef.current = true;

        const startListing = async () => {
            setIsProcessing(true);
            setCurrentStep('signing');
            setProgressStep('listing', 'signing');

            try {
                // Step 1: Check whitelist (already done on /sell page)
                console.log('🔍 Step 1: Whitelist already verified');

                setCompletedStepsLocal(['whitelist', 'approval', 'approved']);
                setCompletedSteps(['whitelist', 'approval', 'approved']);
                setCurrentStep('signing');
                setProgressStep('listing', 'signing');

                // Create listing via TransactionService
                console.log('🔍 Creating listing transaction');

                if (!formData.selectedNFT) {
                    setError('Kein NFT ausgewählt');
                    return;
                }

                const listingParams = {
                    contractAddress: formData.selectedNFT.core.contractAddress,
                    tokenId: formData.selectedNFT.core.tokenId,
                    price: formData.mode === 'sale' || formData.mode === 'hybrid'
                        ? formData.price || '0'
                        : '0',
                    desiredContractAddress: formData.mode === 'trade' || formData.mode === 'hybrid'
                        ? formData.targetNFT?.core?.contractAddress
                        : undefined,
                    desiredTokenId: formData.mode === 'trade' || formData.mode === 'hybrid'
                        ? formData.targetNFT?.core?.tokenId
                        : undefined,
                    onProgress: (step: string) => {
                        console.log('📊 Listing progress:', step);

                        if (step === 'signing') {
                            console.log('🖊️ User is signing transaction...');
                            setCurrentStep('signing');
                            setProgressStep('listing', 'signing');
                        } else if (step === 'pending') {
                            console.log('⏳ Transaction pending on blockchain...');
                            setCurrentStep('pending');
                            setProgressStep('listing', 'pending');
                        } else if (step === 'success') {
                            console.log('✅ Transaction confirmed successful!');
                            // Listing erfolgreich - wechsle zum success Step
                            setProgressStep('success', 'success');
                            setCurrentStep('success');
                            setCompletedStepsLocal(['select', 'whitelist', 'approval', 'form', 'preview', 'listing']);
                            setCompletedSteps(['select', 'whitelist', 'approval', 'form', 'preview', 'listing']);
                        } else if (step === 'error') {
                            console.error('❌ Transaction error!');
                            setCurrentStep('error');
                            setProgressStep('listing', 'error');
                        }
                    },
                    onError: (error: string) => {
                        console.error('❌ Listing error:', error);
                        setProgressError(error);
                        setError(error);
                        setCurrentStep('error');
                        setProgressStep('listing', 'error');
                    },
                    onSuccess: (result: { txHash?: string }) => {
                        console.log('🎉 onSuccess callback triggered!', result);
                        console.log('✅ Listing successful! TxHash:', result.txHash);
                        if (result.txHash) {
                            console.log('💾 Saving txHash to context...');
                            setProgressTxHash(result.txHash);
                            setTxHash(result.txHash);
                            console.log('🚀 Navigating to success page in 1.5s...');
                            // Navigate to success page
                            setTimeout(() => {
                                const successUrl = `/sell/success?tx=${result.txHash}`;
                                console.log('🔗 Navigating to:', successUrl);
                                router.push(successUrl as any);
                            }, 1500);
                        } else {
                            console.warn('⚠️ No txHash in success result!');
                        }
                    }
                };

                await txService.createListing(listingParams);
            } catch (error: any) {
                console.error('Transaction failed:', error);

                // Special handling for ALREADY_LISTED error
                if (error.code === 'ALREADY_LISTED' || error.message === 'ALREADY_LISTED') {
                    console.log('ℹ️ NFT already listed - redirecting to detail page...');
                    // Redirect to NFT detail page instead of showing error
                    if (formData.selectedNFT) {
                        const detailUrl = `/nft/${formData.selectedNFT.core.contractAddress}/${formData.selectedNFT.core.tokenId}`;
                        setTimeout(() => {
                            router.push(detailUrl as any);
                        }, 1500);
                    }
                    return;
                }

                setCurrentStep('error');
                setProgressStep('listing', 'error');
                setProgressError(error.message || 'Transaction failed');
                setError(error.message || 'Transaction failed');
            }
        };

        startListing();
    }, []); // Only run once on mount

    if (!formData.selectedNFT) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Weiterleitung...</p>
                </div>
            </div>
        );
    }

    const fees = formData.price && parseFloat(formData.price) > 0
        ? calculateFees(parseFloat(formData.price))
        : { marketplaceFee: 0, royaltyFee: 0, youReceive: 0 };

    const priceInWei = formData.price
        ? BigInt(Math.floor(parseFloat(formData.price) * 10 ** 18)).toString()
        : '0';

    const previewNFT = {
        ...formData.selectedNFT,
        listed: true,
        listing: {
            listingId: 'preview',
            price: priceInWei,
            currency: formData.currency || 'ETH',
            seller: formData.selectedNFT.core.owner,
            mode: formData.mode || 'sale',
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    };

    return (
        <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Wird gelistet</h2>
                        <p className="text-sm text-gray-600">Transaktion wird ausgeführt...</p>
                    </div>
                    <div className="w-60 mx-auto">
                        <NFTCard
                            nft={formData.selectedNFT}
                            showStats={true}
                            enableInsights={true}
                        />
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Listing-Typ</h3>
                                <div className="flex items-center gap-2">
                                    {formData.mode === 'sale' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Verkauf</p>
                                                <p className="text-xs text-gray-600">Direktverkauf für Kryptowährung</p>
                                            </div>
                                        </>
                                    )}
                                    {formData.mode === 'trade' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Tausch</p>
                                                <p className="text-xs text-gray-600">NFT gegen NFT tauschen</p>
                                            </div>
                                        </>
                                    )}
                                    {formData.mode === 'hybrid' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Hybrid</p>
                                                <p className="text-xs text-gray-600">Verkauf + Tausch kombiniert</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            {formData.description && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Beschreibung</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.description}</p>
                                </div>
                            )}
                        </div>
                        {formData.price && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    Preis-Details
                                </h3>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-700">Verkaufspreis</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {formData.price} {formData.currency}
                                    </span>
                                </div>
                                <div className="bg-white rounded-lg border border-blue-200 p-4 text-xs space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Listing-Preis:</span>
                                        <span>{formData.price} {formData.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
                                        <span>-{fees.marketplaceFee.toFixed(4)} {formData.currency}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Creator Royalty ({(royaltyFeePercentage * 100).toFixed(2)}%):</span>
                                        <span>-{fees.royaltyFee.toFixed(4)} {formData.currency}</span>
                                    </div>
                                    <hr className="border-blue-200" />
                                    <div className="flex justify-between font-semibold text-green-600 text-sm">
                                        <span>Sie erhalten:</span>
                                        <span>{fees.youReceive.toFixed(4)} {formData.currency}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {(formData.mode === 'trade' || formData.mode === 'hybrid') && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Tausch-Details
                                </h3>
                                {formData.tradeType === 'specific' && formData.targetNFT && (
                                    <div className="bg-white rounded-lg border border-green-200 p-4">
                                        <p className="text-xs text-gray-600 mb-2">Gewünschter NFT:</p>
                                        <div className="flex gap-3">
                                            <img
                                                src={formData.targetNFT.meta?.image || '/media/custom-nft-3.jpg'}
                                                alt={formData.targetNFT.core.name || `NFT #${formData.targetNFT.tokenId}`}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm">
                                                    {formData.targetNFT.core.name || `NFT #${formData.targetNFT.tokenId}`}
                                                </h4>
                                                <p className="text-xs text-gray-600">Token ID: {formData.targetNFT.tokenId}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {formData.tradeType === 'collection' && formData.targetCollection && (
                                    <div className="bg-white rounded-lg border border-green-200 p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Collection:</span> {formData.targetCollection}
                                        </p>
                                    </div>
                                )}
                                {formData.tradeType === 'open' && (
                                    <div className="bg-white rounded-lg border border-green-200 p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Offener Tausch:</span> Beliebiger NFT
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status-Anzeige */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                            <div>
                                <p className="font-semibold text-gray-900">Transaktion wird ausgeführt</p>
                                <p className="text-sm text-gray-600">Bitte bestätige die Transaktion in deinem Wallet...</p>
                            </div>
                        </div>
                        {progressTxHash && (
                            <div className="mt-4 text-xs text-gray-600">
                                <p>Transaction Hash:</p>
                                <p className="font-mono truncate">{progressTxHash}</p>
                            </div>
                        )}
                        {progressError && (
                            <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700 font-medium">Fehler</p>
                                <p className="text-xs text-red-600 mt-1">{progressError}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

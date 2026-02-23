'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChainId } from 'wagmi';
import { useListingFlow } from '../contexts/ListingFlowContext';
import { useTransactionService } from '@/services/blockchain';
import { useMarketplaceContracts, useMarketplaceFees } from '@/hooks/marketplace';
import NFTCard from '@/components/nft/NFTCard';
import Link from 'next/link';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress, ZERO_ADDRESS } from '@/config/tokens';
import { formatTokenDisplay } from '../utils';
import { devLog } from '@/utils';

export default function ListingPage() {
    const router = useRouter();
    const chainId = useChainId();
    const { formData, setProgressStep, setCompletedSteps, setTxHash, setError } = useListingFlow();
    const { marketplaceAddress } = useMarketplaceContracts();
    const txService = useTransactionService();
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: formData.selectedNFT?.contractAddress,
        tokenId: formData.selectedNFT?.tokenId
    });

    const isBatch = !!formData.selectedNFTs?.length && !formData.selectedNFT;
    const batchNFTs = formData.selectedNFTs || [];

    // Get currency symbol for display (address → symbol)
    const currencySymbol = getCurrencySymbolByAddress(chainId, formData.currency || ZERO_ADDRESS);

    const [progressTxHash, setProgressTxHash] = useState<string | undefined>();
    const [progressError, setProgressError] = useState<string | undefined>();
    const [isProcessing, setIsProcessing] = useState(false);
    const hasStartedRef = useRef(false);

    // Guard: Redirect if no NFT selected
    useEffect(() => {
        if (!formData.selectedNFT && !formData.selectedNFTs?.length) {
            router.replace('/sell');
        } else {
            setProgressStep('listing', 'whitelist');
        }
    }, [formData.selectedNFT, formData.selectedNFTs, router, setProgressStep]);

    const calculateBatchPrice = (index: number, total: number): string => {
        if (formData.pricingType === 'fixed') {
            return formData.fixedPrice || '0';
        }
        const start = parseFloat(formData.startPrice || '0');
        const end = parseFloat(formData.endPrice || '0');
        if (total <= 1) return start.toFixed(4);
        const step = (end - start) / (total - 1);
        return (start + step * index).toFixed(4);
    };

    // Start transaction automatically when page loads
    useEffect(() => {
        if (isProcessing || hasStartedRef.current) return;

        if (!formData.selectedNFT && !formData.selectedNFTs?.length) return;

        hasStartedRef.current = true;

        const startSingleListing = async () => {
            setIsProcessing(true);
            setProgressError(undefined);
            setProgressStep('listing', 'signing');

            try {
                // Step 1: Check whitelist (already done on /sell page)
                devLog.info('🔍 Step 1: Whitelist already verified');

                setCompletedSteps(['whitelist', 'approval', 'approved']);

                // Create listing via TransactionService
                devLog.info('🔍 Creating listing transaction');

                if (!formData.selectedNFT) {
                    setError('Kein NFT ausgewählt');
                    return;
                }

                if (formData.selectedNFT.tokenStandard === 'ERC1155') {
                    const requestedQty = Number(formData.erc1155Quantity || '0');
                    const availableQty = Number(formData.selectedNFT.balance || '0');

                    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
                        throw new Error('Ungültige ERC1155-Menge. Bitte mindestens 1 angeben.');
                    }

                    if (Number.isFinite(availableQty) && requestedQty > availableQty) {
                        throw new Error(`Nicht genügend ERC1155-Balance. Angefordert: ${requestedQty}, verfügbar: ${availableQty}.`);
                    }
                }

                const listingParams = {
                    contractAddress: formData.selectedNFT.core.contractAddress,
                    tokenId: formData.selectedNFT.core.tokenId,
                    price: formData.mode === 'sale' || formData.mode === 'hybrid'
                        ? formData.price || '0'
                        : '0',
                    currency: formData.mode === 'sale' || formData.mode === 'hybrid'
                        ? formData.currency
                        : ZERO_ADDRESS,
                    tokenStandard: formData.selectedNFT.tokenStandard,
                    erc1155Quantity: formData.erc1155Quantity,
                    partialBuyEnabled: formData.partialBuyEnabled,
                    desiredContractAddress: formData.mode === 'trade' || formData.mode === 'hybrid'
                        ? formData.targetNFT?.core?.contractAddress
                        : undefined,
                    desiredTokenId: formData.mode === 'trade' || formData.mode === 'hybrid'
                        ? formData.targetNFT?.core?.tokenId
                        : undefined,
                    buyerWhitelistEnabled: formData.buyerWhitelistEnabled || false,
                    allowedBuyers: formData.allowedBuyers || [],
                    onProgress: (step: string) => {
                        devLog.info('📊 Listing progress:', step);

                        if (step === 'signing') {
                            devLog.info('🖊️ User is signing transaction...');
                            setProgressStep('listing', 'signing');
                        } else if (step === 'pending') {
                            devLog.info('⏳ Transaction pending on blockchain...');
                            setProgressStep('listing', 'pending');
                        } else if (step === 'success') {
                            devLog.info('✅ Transaction confirmed successful!');
                            // Listing erfolgreich - wechsle zum success Step
                            setProgressStep('success', 'success');
                            setCompletedSteps(['select', 'whitelist', 'approval', 'form', 'preview', 'listing']);
                        } else if (step === 'error') {
                            devLog.error('❌ Transaction error!');
                            setProgressStep('listing', 'error');
                            setIsProcessing(false);
                        }
                    },
                    onError: (error: string) => {
                        devLog.error('❌ Listing error:', error);
                        setProgressError(error);
                        setError(error);
                        setProgressStep('listing', 'error');
                        setIsProcessing(false);
                    },
                    onSuccess: (result: { txHash?: string }) => {
                        devLog.info('🎉 onSuccess callback triggered!', result);
                        devLog.info('✅ Listing successful! TxHash:', result.txHash);
                        if (result.txHash) {
                            devLog.info('💾 Saving txHash to context...');
                            setProgressTxHash(result.txHash);
                            setTxHash(result.txHash);
                            devLog.info('🚀 Navigating to success page in 1.5s...');
                            // Navigate to success page
                            setTimeout(() => {
                                const successUrl = `/sell/success?tx=${result.txHash}`;
                                devLog.info('🔗 Navigating to:', successUrl);
                                router.push(successUrl as any);
                            }, 1500);
                        } else {
                            devLog.warn('⚠️ No txHash in success result!');
                        }
                    }
                };

                devLog.info('🔍 [LISTING PAGE] Listing params being sent to TransactionService:');
                devLog.info('   contractAddress:', listingParams.contractAddress);
                devLog.info('   tokenId:', listingParams.tokenId);
                devLog.info('   price:', listingParams.price);
                devLog.info('   currency:', listingParams.currency);
                devLog.info('   desiredContractAddress:', listingParams.desiredContractAddress);
                devLog.info('   desiredTokenId:', listingParams.desiredTokenId);
                devLog.info('   buyerWhitelistEnabled:', listingParams.buyerWhitelistEnabled);
                devLog.info('   allowedBuyers:', listingParams.allowedBuyers);
                devLog.info('   formData.currency from context:', formData.currency);

                await txService.createListing(listingParams);
            } catch (error: any) {
                devLog.error('Transaction failed:', error);

                // Special handling for ALREADY_LISTED error
                if (error.code === 'ALREADY_LISTED' || error.message === 'ALREADY_LISTED') {
                    devLog.info('ℹ️ NFT already listed - redirecting to detail page...');
                    // Redirect to NFT detail page instead of showing error
                    if (formData.selectedNFT) {
                        const detailUrl = `/nft/${formData.selectedNFT.core.contractAddress}/${formData.selectedNFT.core.tokenId}`;
                        setTimeout(() => {
                            router.push(detailUrl as any);
                        }, 1500);
                    }
                    return;
                }

                setProgressStep('listing', 'error');
                setProgressError(error.message || 'Transaction failed');
                setError(error.message || 'Transaction failed');
                setIsProcessing(false);
            }
        };

        const startBatchListing = async () => {
            if (batchNFTs.length === 0) return;

            setIsProcessing(true);
            setProgressError(undefined);
            setProgressStep('listing', 'signing');

            try {
                setCompletedSteps(['whitelist', 'approval', 'approved']);

                let lastHash: string | undefined;
                for (let i = 0; i < batchNFTs.length; i += 1) {
                    const nft = batchNFTs[i];
                    if (!nft) continue;

                    const price = calculateBatchPrice(i, batchNFTs.length);
                    const requestedQuantity = formData.erc1155Quantities?.[nft.key] || nft.balance;

                    if (nft.tokenStandard === 'ERC1155') {
                        const requestedQty = Number(requestedQuantity || '0');
                        const availableQty = Number(nft.balance || '0');

                        if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
                            throw new Error(`Ungültige ERC1155-Menge für Token ${nft.core.tokenId}. Bitte mindestens 1 angeben.`);
                        }

                        if (Number.isFinite(availableQty) && requestedQty > availableQty) {
                            throw new Error(`Nicht genügend ERC1155-Balance für Token ${nft.core.tokenId}. Angefordert: ${requestedQty}, verfügbar: ${availableQty}.`);
                        }
                    }

                    await txService.createListing({
                        contractAddress: nft.core.contractAddress,
                        tokenId: nft.core.tokenId,
                        price,
                        currency: formData.currency || ZERO_ADDRESS,
                        tokenStandard: nft.tokenStandard,
                        erc1155Quantity: requestedQuantity,
                        partialBuyEnabled: formData.partialBuyEnabled,
                        desiredContractAddress: ZERO_ADDRESS,
                        desiredTokenId: '0',
                        onProgress: (step: string) => {
                            if (step === 'signing') {
                                setProgressStep('listing', 'signing');
                            } else if (step === 'pending') {
                                setProgressStep('listing', 'pending');
                            } else if (step === 'error') {
                                setProgressStep('listing', 'error');
                                setIsProcessing(false);
                            }
                        },
                        onSuccess: (result: { txHash?: string }) => {
                            if (result.txHash) {
                                lastHash = result.txHash;
                                setProgressTxHash(result.txHash);
                                setTxHash(result.txHash);
                            }
                        },
                        onError: (errorMessage: string) => {
                            setProgressError(errorMessage);
                            setError(errorMessage);
                            setIsProcessing(false);
                        }
                    });
                }

                setProgressStep('success', 'success');
                setCompletedSteps(['select', 'whitelist', 'approval', 'form', 'preview', 'listing']);

                if (lastHash) {
                    setTimeout(() => {
                        const successUrl = `/sell/success?tx=${lastHash}`;
                        router.push(successUrl as any);
                    }, 1500);
                } else {
                    router.push('/sell/success' as any);
                }
            } catch (error: any) {
                setProgressStep('listing', 'error');
                setProgressError(error.message || 'Batch transaction failed');
                setError(error.message || 'Batch transaction failed');
                setIsProcessing(false);
            }
        };

        if (isBatch) {
            startBatchListing();
        } else {
            startSingleListing();
        }
    }, []); // Only run once on mount

    if (!formData.selectedNFT && !formData.selectedNFTs?.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Weiterleitung...</p>
                </div>
            </div>
        );
    }

    const rawPrice = formData.price ? parseFloat(formData.price) : 0;
    const tokenDecimals = getTokenDecimalsByAddress(chainId, formData.currency || ZERO_ADDRESS);
    const displayPrice = rawPrice > 0
        ? formatTokenDisplay(rawPrice, tokenDecimals)
        : '0';

    const fees = rawPrice > 0
        ? calculateFees(rawPrice)
        : {
            marketplaceFee: 0,
            royaltyFee: 0,
            totalFees: 0,
            youReceive: 0,
            marketplaceFeePercentage: 0,
            royaltyFeePercentage: 0
        };

    if (isBatch) {
        const totalValue = batchNFTs.reduce((sum, _, idx) => sum + parseFloat(calculateBatchPrice(idx, batchNFTs.length)), 0);
        const priceRange = formData.pricingType === 'variable'
            ? `${formData.startPrice || '0'} - ${formData.endPrice || '0'}`
            : (formData.fixedPrice || '0');

        return (
            <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Batch wird gelistet</h2>
                            <p className="text-sm text-gray-600">Transaktionen werden ausgefuehrt...</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                            <p className="text-sm text-gray-600">NFTs</p>
                            <p className="text-2xl font-bold text-gray-900">{batchNFTs.length}</p>
                            <p className="text-sm text-gray-600">Preis</p>
                            <p className="text-lg font-semibold text-blue-600">
                                {priceRange} {currencySymbol}
                            </p>
                            <p className="text-sm text-gray-600">Gesamtwert</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {totalValue.toFixed(4)} {currencySymbol}
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Listing-Typ</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Batch-Verkauf</p>
                                            <p className="text-xs text-gray-600">Nur Verkauf gegen Geld</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Preis</h3>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {priceRange} {currencySymbol}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`${progressError ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'} rounded-xl border p-6`}>
                            <div className="flex items-center gap-3">
                                {progressError ? (
                                    <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-900">{progressError ? 'Batch-Transaktion fehlgeschlagen' : 'Batch-Transaktionen laufen'}</p>
                                    <p className="text-sm text-gray-600">{progressError ? 'Bitte prüfen Sie die Fehlermeldung und starten Sie den Vorgang erneut.' : 'Bitte bestaetige jede Transaktion in deiner Wallet.'}</p>
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

    return (
        <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Wird gelistet</h2>
                        <p className="text-sm text-gray-600">Transaktion wird ausgeführt...</p>
                    </div>
                    <div className="w-60 mx-auto">
                        {formData.selectedNFT && (
                            <NFTCard
                                nft={formData.selectedNFT}
                                showStats={true}
                                enableInsights={true}
                            />
                        )}
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
                                        {displayPrice} {currencySymbol}
                                    </span>
                                </div>
                                <div className="bg-white rounded-lg border border-blue-200 p-4 text-xs space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Listing-Preis:</span>
                                        <span>{displayPrice} {currencySymbol}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Marketplace-Gebühr ({fees.marketplaceFeePercentage.toFixed(2)}%):</span>
                                        <span>-{fees.marketplaceFee.toFixed(4)} {currencySymbol}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Creator Royalty ({fees.royaltyFeePercentage.toFixed(2)}%):</span>
                                        <span>-{fees.royaltyFee.toFixed(4)} {currencySymbol}</span>
                                    </div>
                                    <hr className="border-blue-200" />
                                    <div className="flex justify-between font-semibold text-green-600 text-sm">
                                        <span>Sie erhalten:</span>
                                        <span>{fees.youReceive.toFixed(4)} {currencySymbol}</span>
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
                    <div className={`${progressError ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'} rounded-xl border p-6`}>
                        <div className="flex items-center gap-3">
                            {progressError ? (
                                <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">{progressError ? 'Transaktion fehlgeschlagen' : 'Transaktion wird ausgeführt'}</p>
                                <p className="text-sm text-gray-600">{progressError ? 'Bitte prüfen Sie die Fehlermeldung und starten Sie den Vorgang erneut.' : 'Bitte bestätige die Transaktion in deinem Wallet...'}</p>
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

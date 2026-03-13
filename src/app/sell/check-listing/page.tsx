'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChainId } from 'wagmi';
import { useListingFlow } from '../contexts/ListingFlowContext';
import NFTCard from '@/components/nft/NFTCard';
import { useMarketplaceContracts, useMarketplaceFees } from '@/hooks/marketplace';
import { FEATURES } from '@/config';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress, ZERO_ADDRESS } from '@/config/tokens';
import { parseUnits } from 'viem';
import { BatchTransactionPreview } from '../components/preview';
import { formatTokenDisplay } from '../utils';
import { convertIpfsToHttp } from '@/utils';

export default function CheckListingPage() {
    const router = useRouter();
    const { formData, setProgressStep } = useListingFlow();
    const chainId = useChainId();
    const { marketplaceAddress } = useMarketplaceContracts();
    const { calculateFees } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: formData.selectedNFT?.contractAddress,
        tokenId: formData.selectedNFT?.tokenId
    });

    // Convert currency address to symbol
    const currencySymbol = useMemo(() =>
        getCurrencySymbolByAddress(chainId, formData.currency || ZERO_ADDRESS),
        [chainId, formData.currency]
    );

    const isBatch = !!formData.selectedNFTs?.length && !formData.selectedNFT;
    const isBatchListingEnabled = FEATURES.SELL_BATCH_LISTING;

    // Guard: Redirect if no NFT selected
    useEffect(() => {
        if (!formData.selectedNFT && !formData.selectedNFTs?.length) {
            router.replace('/sell');
        } else if ((formData.mode === 'trade' || formData.mode === 'hybrid') && !formData.targetNFT) {
            router.replace('/sell');
        } else if (isBatch && !isBatchListingEnabled) {
            router.replace('/sell');
        } else {
            // Only set progressStep once when component mounts
            setProgressStep('preview');
        }
    }, [formData.mode, formData.selectedNFT, formData.selectedNFTs, formData.targetNFT, isBatch, isBatchListingEnabled, router, setProgressStep]);

    if (isBatch && !isBatchListingEnabled) {
        return null;
    }

    const handleConfirm = () => {
        router.push('/sell/listing');
    };

    const handleCancel = () => {
        router.back();
    };

    if (isBatch) {
        const batchData = {
            selectedNFTs: formData.selectedNFTs || [],
            pricingType: formData.pricingType || 'fixed',
            fixedPrice: formData.fixedPrice,
            startPrice: formData.startPrice,
            endPrice: formData.endPrice,
            currency: formData.currency || ZERO_ADDRESS,
            priceMode: formData.priceMode,
            description: formData.description || ''
        };

        return (
            <BatchTransactionPreview
                data={batchData}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={false}
            />
        );
    }

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

    // Convert token price to units for the mock listing
    const priceInWei = rawPrice > 0
        ? parseUnits(rawPrice.toString(), tokenDecimals).toString()
        : '0';

    // Create a mock listed NFT for preview
    const previewNFT = {
        ...formData.selectedNFT,
        listed: true,
        listing: {
            listingId: 'preview',
            contractAddress: formData.selectedNFT.contractAddress,
            tokenId: formData.selectedNFT.tokenId,
            price: priceInWei,
            currency: formData.currency || '0x0000000000000000000000000000000000000000',
            seller: formData.selectedNFT.core.owner || '0x0000000000000000000000000000000000000000',
            mode: formData.mode || 'sale',
            status: 'LISTED',
            isListed: true,
            buyer: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tokenStandard: formData.selectedNFT.tokenStandard || 'ERC721',
            erc1155QuantityListed: formData.erc1155Quantity,
            remainingQuantity: formData.erc1155Quantity,
            unitPrice: null,
            partialBuyEnabled: formData.partialBuyEnabled,
            desiredContractAddress: formData.targetNFT?.contractAddress || '0x0000000000000000000000000000000000000000',
            desiredTokenId: formData.targetNFT?.tokenId || null
        }
    };

    const targetNFTPreviewImage = useMemo(() => {
        const rawImage =
            formData.targetNFT?.meta?.image
            || (formData.targetNFT as any)?.metadata?.image
            || (formData.targetNFT as any)?.image
            || '';

        if (!rawImage) {
            return '/media/custom-nft-3.jpg';
        }

        return convertIpfsToHttp(rawImage);
    }, [formData.targetNFT]);

    return (
        <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Vorschau</h2>
                        <p className="text-sm text-gray-600">So wird dein Listing angezeigt</p>
                    </div>
                    <div className="w-60 mx-auto">
                        <NFTCard
                            nft={previewNFT}
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
                            {formData.buyerWhitelistEnabled && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Buyer-Whitelist</h3>
                                    <p className="text-sm text-gray-600">
                                        Aktiviert ({formData.allowedBuyers?.length || 0} Adresse{(formData.allowedBuyers?.length || 0) === 1 ? '' : 'n'})
                                    </p>
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
                        {formData.erc1155Quantity && (
                            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl border border-purple-200 p-6 mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    ERC1155 Details
                                </h3>
                                <div className="flex justify-between text-sm text-gray-700">
                                    <span>Menge gelistet</span>
                                    <span className="font-semibold text-purple-700">{formData.erc1155Quantity}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-700 mt-2">
                                    <span>Teilkauf</span>
                                    <span className="font-semibold text-purple-700">{formData.partialBuyEnabled ? 'Aktiviert' : 'Deaktiviert'}</span>
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
                                                src={targetNFTPreviewImage}
                                                alt={formData.targetNFT.core.name || `NFT #${formData.targetNFT.tokenId}`}
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = '/media/custom-nft-3.jpg';
                                                }}
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
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Zurück
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Listing erstellen
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

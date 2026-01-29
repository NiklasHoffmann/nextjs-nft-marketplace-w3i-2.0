'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useListingFlow } from '../contexts/ListingFlowContext';
import NFTCard from '@/components/nft/NFTCard';
import Link from 'next/link';
import { useMarketplaceItems } from '@/contexts/marketplace-items';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { formatEther } from 'viem';
import type { AggregatedNFT } from '@/types/core/core-nft-modern';
import { invalidateAfterListing } from '@/services/validation';

export default function SuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { formData, progressData, reset, setProgressStep, setFormData, setNftDataLoaded } = useListingFlow();
    const { invalidateCache } = useMarketplaceItems();
    const { refresh: refreshWalletNFTs } = useWalletNFTs();

    const [listedNFT, setListedNFT] = useState<AggregatedNFT | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const txHash = searchParams.get('tx') || progressData.txHash;

    // Update progress step
    useEffect(() => {
        setProgressStep('success', 'success');
    }, [setProgressStep]);

    // Load the listed NFT from DB
    useEffect(() => {
        const loadListedNFT = async () => {
            if (!formData.selectedNFT || !txHash) return;

            setIsLoading(true);
            setNftDataLoaded(false);

            try {
                console.log('🔄 Invalidating caches after successful listing...');

                // Invalidate marketplace cache (will reload on next visit to /marketplace)
                invalidateCache();

                // Emit invalidation event (triggers auto-refresh in WalletNFTs and MarketplaceItems)
                if (formData.selectedNFT) {
                    const contractAddr = formData.selectedNFT.core?.contractAddress || formData.selectedNFT.contractAddress;
                    const tokenIdStr = formData.selectedNFT.core?.tokenId || formData.selectedNFT.tokenId;
                    console.log('🔄 Emitting invalidation event for:', contractAddr, tokenIdStr);
                    invalidateAfterListing(
                        contractAddr,
                        tokenIdStr
                    );

                    // Manual refresh with minimal delay to ensure stats are updated
                    // (WalletNFTsContext will also auto-refresh via event listener)
                    console.log('⏱️ Scheduling refresh in 1s for stats update...');
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    console.log('🔄 Manual refresh for stats update...');
                    await refreshWalletNFTs();
                    console.log('✅ Stats should be updated now');
                }

                console.log('📡 Querying TheGraph for fresh listing data...');

                // Query TheGraph directly for this specific listing
                const graphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/nft-marketplace';
                const graphQuery = {
                    query: `
                        query GetListing($tokenAddress: String!, $tokenId: String!) {
                            items(
                                where: {
                                    tokenAddress: $tokenAddress,
                                    tokenId: $tokenId,
                                    active: true
                                },
                                first: 1,
                                orderBy: createdAt,
                                orderDirection: desc
                            ) {
                                id
                                listingId
                                tokenAddress
                                tokenId
                                price
                                seller
                                active
                                desiredTokenAddress
                                desiredTokenId
                                createdAt
                                updatedAt
                            }
                        }
                    `,
                    variables: {
                        tokenAddress: formData.selectedNFT.core.contractAddress.toLowerCase(),
                        tokenId: formData.selectedNFT.core.tokenId
                    }
                };

                const graphResponse = await fetch(graphUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(graphQuery)
                });

                let listingData = null;
                if (graphResponse.ok) {
                    const graphResult = await graphResponse.json();
                    if (graphResult.data?.items?.length > 0) {
                        listingData = graphResult.data.items[0];
                        console.log('✅ Found listing in TheGraph:', listingData);
                    } else {
                        console.warn('⚠️ No listing found in TheGraph yet (sync pending)');
                    }
                } else {
                    console.warn('⚠️ TheGraph query failed');
                }

                // Fetch NFT metadata from DB (might not have listing data yet)
                const nftResponse = await fetch(
                    `/api/nft?contractAddress=${formData.selectedNFT.core.contractAddress}&tokenId=${formData.selectedNFT.core.tokenId}`
                );

                let baseNFT = formData.selectedNFT;
                if (nftResponse.ok) {
                    const nftData = await nftResponse.json();
                    console.log('✅ Loaded NFT metadata from DB');
                    baseNFT = nftData;
                }

                // Enrich with listing data (from Graph or formData)
                if (listingData) {
                    // Use Graph data (most accurate)
                    const enrichedNFT: AggregatedNFT = {
                        ...baseNFT,
                        listed: true,
                        listing: {
                            listingId: listingData.listingId,
                            contractAddress: listingData.tokenAddress as `0x${string}`,
                            tokenId: listingData.tokenId,
                            isListed: true,
                            price: listingData.price,
                            seller: listingData.seller as `0x${string}`,
                            buyer: null,
                            desiredContractAddress: listingData.desiredTokenAddress as `0x${string}`,
                            desiredTokenId: listingData.desiredTokenId
                        }
                    };
                    setListedNFT(enrichedNFT);
                } else {
                    // Fallback: Use formData for optimistic display
                    console.log('⚡ Using optimistic listing data from form');
                    const enrichedNFT: AggregatedNFT = {
                        ...baseNFT,
                        listed: true,
                        listing: {
                            listingId: 'pending',
                            contractAddress: baseNFT.core.contractAddress,
                            tokenId: baseNFT.core.tokenId,
                            isListed: true,
                            price: formData.price ? BigInt(Math.floor(parseFloat(formData.price) * 10 ** 18)).toString() : '0',
                            seller: baseNFT.core.owner || '0x0' as `0x${string}`,
                            buyer: null,
                            desiredContractAddress: '0x0' as `0x${string}`,
                            desiredTokenId: null
                        }
                    };
                    setListedNFT(enrichedNFT);
                }
            } catch (error) {
                console.error('❌ Error loading listed NFT:', error);
                // Fallback to form data with optimistic listing
                if (formData.selectedNFT) {
                    const enrichedNFT: AggregatedNFT = {
                        ...formData.selectedNFT,
                        listed: true,
                        listing: {
                            listingId: 'pending',
                            contractAddress: formData.selectedNFT.contractAddress,
                            tokenId: formData.selectedNFT.tokenId,
                            isListed: true,
                            price: formData.price || '0',
                            seller: formData.selectedNFT.core.owner || '0x0' as `0x${string}`,
                            buyer: null,
                            desiredContractAddress: '0x0' as `0x${string}`,
                            desiredTokenId: null
                        }
                    };
                    setListedNFT(enrichedNFT);
                }
            } finally {
                setIsLoading(false);
                setNftDataLoaded(true);
            }
        };

        loadListedNFT();
    }, [formData.selectedNFT, txHash, invalidateCache, setNftDataLoaded]);

    // Guard: Redirect if no NFT or no tx hash
    useEffect(() => {
        if (!formData.selectedNFT || !txHash) {
            router.replace('/sell');
        }
    }, [formData.selectedNFT, txHash, router]);

    if (!formData.selectedNFT || !txHash) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Laden...</p>
                </div>
            </div>
        );
    }

    const handleCreateAnother = () => {
        reset();
        router.push('/sell');
    };

    const displayNFT = listedNFT || formData.selectedNFT;
    const listing = displayNFT?.listing;
    const priceInEth = listing?.price ? formatEther(BigInt(listing.price)) : formData.price;

    // Derive mode from listing data
    // Check if desiredContractAddress is set and not a zero address
    const hasTradeTarget = listing?.desiredContractAddress &&
        listing.desiredContractAddress !== '0x0000000000000000000000000000000000000000' &&
        listing.desiredContractAddress !== '0x0' &&
        listing.desiredContractAddress.toLowerCase() !== '0x0000000000000000000000000000000000000000';

    const hasPrice = listing?.price && BigInt(listing.price) > BigInt(0);

    const listingMode = hasTradeTarget
        ? (hasPrice ? 'hybrid' : 'trade')
        : 'sale';

    return (
        <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 NFT erfolgreich gelistet!
                </h2>
                <p className="text-gray-700">
                    Dein NFT ist jetzt auf dem Marketplace live
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: NFT Card */}
                <div className="lg:col-span-1">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Gelisteter NFT</h2>
                        <p className="text-sm text-gray-600">
                            {isLoading ? 'Lade Listing-Daten...' : 'Live auf dem Marketplace'}
                        </p>
                    </div>
                    {isLoading ? (
                        <div className="w-60 mx-auto flex items-center justify-center h-80 bg-gray-100 rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="w-60 mx-auto">
                            <NFTCard
                                nft={displayNFT}
                                showStats={true}
                                enableInsights={true}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Details</h2>

                        {/* Listing Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Listing-Typ</h3>
                                <div className="flex items-center gap-2">
                                    {listingMode === 'sale' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Verkauf</p>
                                                <p className="text-xs text-gray-600">Direktverkauf</p>
                                            </div>
                                        </>
                                    )}
                                    {listingMode === 'trade' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Tausch</p>
                                                <p className="text-xs text-gray-600">NFT gegen NFT</p>
                                            </div>
                                        </>
                                    )}
                                    {listingMode === 'hybrid' && (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Hybrid</p>
                                                <p className="text-xs text-gray-600">Verkauf + Tausch</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {priceInEth && parseFloat(priceInEth) > 0 && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Preis</h3>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {priceInEth} ETH
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Transaction Hash */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Transaction Hash
                            </h3>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 font-mono break-all hover:underline block"
                            >
                                {txHash}
                            </a>
                        </div>

                        {/* Status Info */}
                        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 mb-1">NFT ist jetzt live!</p>
                                    <p className="text-sm text-gray-600">
                                        Dein NFT ist auf dem Marketplace sichtbar und kann von anderen Nutzern gekauft oder getauscht werden.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Link
                            href={`/nft/${displayNFT.core.contractAddress}/${displayNFT.core.tokenId}`}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            NFT ansehen
                        </Link>

                        <button
                            onClick={handleCreateAnother}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Weiteres NFT listen
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

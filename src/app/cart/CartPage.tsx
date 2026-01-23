'use client';

/**
 * Shopping Cart Page
 * 
 * Allows users to review and purchase multiple NFTs in a single batch transaction
 * to save on gas fees.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCart } from '@/contexts';
import { formatEther } from '@/utils';
import Link from 'next/link';
import { ButtonSpinner } from '@/components/core/Loading';
import { EmptyState } from '@/components/core/Empty';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';

interface EnrichedCartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    name?: string;
    imageUrl?: string;
}

export function CartPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { items, itemCount, totalPrice, totalPriceFormatted, removeFromCart, clearCart, updateCartItem } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);
    const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);

    // Enrich cart items with metadata from MongoDB
    useEffect(() => {
        const enrichItems = async () => {
            const enriched = await Promise.all(
                items.map(async (item) => {
                    // If already has metadata, use it
                    if (item.imageUrl) {
                        console.log('📦 Cart item already has metadata:', item.name, item.imageUrl);
                        return item;
                    }

                    // Fetch metadata from API
                    try {
                        console.log('🔄 Fetching metadata for:', item.contractAddress, item.tokenId);
                        const response = await fetch(`/api/nft/detail?contractAddress=${item.contractAddress}&tokenId=${item.tokenId}`);
                        const data = await response.json();
                        console.log('📡 API Response:', data);

                        const name = data.metadata?.name || data.name || item.name;
                        const imageUrl = data.metadata?.image || data.image || item.imageUrl;

                        // Update cart item with metadata (persists to localStorage)
                        updateCartItem(item.listingId, { name, imageUrl });

                        const enrichedItem = {
                            ...item,
                            name,
                            imageUrl
                        };

                        console.log('✅ Enriched item:', enrichedItem.name, enrichedItem.imageUrl);
                        return enrichedItem;
                    } catch (error) {
                        console.error('❌ Failed to enrich cart item:', error);
                        return item;
                    }
                })
            );

            console.log('🎯 Final enriched items:', enriched);
            setEnrichedItems(enriched);
        };

        if (items.length > 0) {
            enrichItems();
        } else {
            setEnrichedItems([]);
        }
    }, [items, updateCartItem]);

    // Calculate estimated gas savings
    const estimatedGasSavings = useMemo(() => {
        if (itemCount <= 1) return '0';
        // Rough estimate: Individual buys would cost ~0.003 ETH each in gas
        // Batch buy costs ~0.005 ETH total
        const individualGasCost = 0.003 * itemCount;
        const batchGasCost = 0.005;
        const savings = individualGasCost - batchGasCost;
        return savings > 0 ? savings.toFixed(4) : '0';
    }, [itemCount]);

    const handleBatchPurchase = async () => {
        if (!isConnected || itemCount === 0) return;

        setIsProcessing(true);
        try {
            // TODO: Implement batch purchase contract call
            console.log('🛒 Batch Purchase:', {
                items: items.map(item => ({
                    listingId: item.listingId,
                    contractAddress: item.contractAddress,
                    tokenId: item.tokenId,
                    price: item.price
                })),
                totalPrice: totalPrice.toString()
            });

            // Simulate transaction
            await new Promise(resolve => setTimeout(resolve, 2000));

            alert('Batch purchase successful! (Mock)');
            clearCart();
            router.push('/wallet');

        } catch (error) {
            console.error('Batch purchase failed:', error);
            alert('Batch purchase failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Not connected state
    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-16">
                <EmptyState
                    icon="🔒"
                    title="Wallet Connection Required"
                    description="Please connect your wallet to view your shopping cart."
                />
            </div>
        );
    }

    // Empty cart state
    if (itemCount === 0) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-16">
                <EmptyState
                    icon="🛒"
                    title="Your cart is empty"
                    description="Add some NFTs to your cart to get started with batch purchasing!"
                    action={{
                        label: 'Browse Marketplace',
                        onClick: () => router.push('/marketplace')
                    }}
                />
            </div>
        );
    }

    // Cart with items
    return (
        <div className="max-w-6xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                                {itemCount > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {enrichedItems.map((item) => (
                                <div key={item.listingId} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4">
                                        {/* NFT Image */}
                                        <div className="flex-shrink-0">
                                            {item.contractAddress && item.imageUrl ? (
                                                <Link href={`/nft/${item.contractAddress}/${item.tokenId}`}>
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden relative">
                                                        <OptimizedNFTImage
                                                            imageUrl={item.imageUrl}
                                                            tokenId={item.tokenId}
                                                            alt={item.name || `NFT #${item.tokenId}`}
                                                            className="object-cover rounded-lg"
                                                            width={80}
                                                            height={80}
                                                        />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden">
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                        {item.contractAddress ? 'Loading...' : 'Invalid NFT'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* NFT Details */}
                                        <div className="flex-1 min-w-0">
                                            {item.contractAddress ? (
                                                <Link href={`/nft/${item.contractAddress}/${item.tokenId}`}>
                                                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                                                        {item.name || `NFT #${item.tokenId}`}
                                                    </h3>
                                                </Link>
                                            ) : (
                                                <h3 className="text-sm font-medium text-gray-500 truncate">
                                                    {item.name || `NFT #${item.tokenId}`} (Invalid)
                                                </h3>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Token ID: {item.tokenId}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {item.contractAddress ? `${item.contractAddress.slice(0, 6)}...${item.contractAddress.slice(-4)}` : 'Invalid Address'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Seller: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                                            </p>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="flex flex-col items-end justify-between">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatEther(item.price)} ETH
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.listingId)}
                                                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items ({itemCount})</span>
                                    <span className="font-medium text-gray-900">{totalPriceFormatted} ETH</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Estimated Gas</span>
                                    <span className="font-medium text-gray-900">~0.005 ETH</span>
                                </div>

                                {itemCount > 1 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Gas Savings</span>
                                        <span className="font-medium text-green-600">-{estimatedGasSavings} ETH</span>
                                    </div>
                                )}

                                <hr className="border-gray-200" />

                                <div className="flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {(parseFloat(totalPriceFormatted) + 0.005).toFixed(4)} ETH
                                    </span>
                                </div>
                            </div>

                            {/* Benefits */}
                            {itemCount > 1 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="font-medium text-green-800">Batch Purchase Benefits</p>
                                            <ul className="mt-2 text-green-700 space-y-1">
                                                <li>• Save ~{estimatedGasSavings} ETH in gas fees</li>
                                                <li>• Single transaction approval</li>
                                                <li>• Faster checkout process</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Purchase Button */}
                            <button
                                onClick={handleBatchPurchase}
                                disabled={isProcessing || itemCount === 0}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <ButtonSpinner className="-ml-1 mr-3" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Complete Batch Purchase
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Your wallet will prompt you to confirm the transaction
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
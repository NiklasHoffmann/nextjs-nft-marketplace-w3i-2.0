'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { NFTUserSelector } from './components/NFTUserSelector';
import { SellForm } from './components/SellForm';
import { TradeForm } from './components/TradeForm';
import { TransactionPreview } from './components/TransactionPreview';
import { NFTDetails } from '@/types/01-core';

type Tab = 'sell' | 'trade';

interface TransactionData {
    type: 'sell' | 'trade';
    selectedNFT: NFTDetails | null;
    price?: string;
    currency?: 'ETH' | 'USDC';
    description?: string;
    targetNFT?: NFTDetails | null;
    tradeConditions?: string;
}

export function SellTradePage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [activeTab, setActiveTab] = useState<Tab>('sell');
    const [userNFTs, setUserNFTs] = useState<NFTDetails[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<NFTDetails | null>(null);
    const [transactionData, setTransactionData] = useState<TransactionData>({
        type: 'sell',
        selectedNFT: null
    });
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load user's NFTs when connected
    useEffect(() => {
        if (isConnected && address) {
            loadUserNFTs();
        }
    }, [isConnected, address]);

    const loadUserNFTs = async () => {
        setIsLoading(true);
        try {
            // Mock data für Demo - später mit echten API-Calls ersetzen
            const mockUserNFTs: NFTDetails[] = [
                {
                    nftAddress: "0x123456789abcdef123456789abcdef123456789a",
                    tokenId: "123",
                    metadata: {
                        name: "Mein CryptoPunk #123",
                        description: "Ein seltener CryptoPunk aus meiner Sammlung",
                        image: "/media/custom-nft.jpg",
                        attributes: [
                            { trait_type: "Type", value: "Male" },
                            { trait_type: "Hair", value: "Blonde" }
                        ]
                    },
                    imageUrl: "/media/custom-nft.jpg",
                    price: "2.5",
                    isListed: true,
                    seller: address || "",
                    owner: address || ""
                },
                {
                    nftAddress: "0x456789abcdef123456789abcdef123456789abcd",
                    tokenId: "456",
                    metadata: {
                        name: "Bored Ape #456",
                        description: "Bored Ape mit besonderen Eigenschaften",
                        image: "/media/custom-nft-2.jpg",
                        attributes: [
                            { trait_type: "Background", value: "Blue" },
                            { trait_type: "Eyes", value: "Laser Eyes" }
                        ]
                    },
                    imageUrl: "/media/custom-nft-2.jpg",
                    price: "5.0",
                    isListed: false,
                    seller: address || "",
                    owner: address || ""
                }
            ];
            setUserNFTs(mockUserNFTs);
        } catch (error) {
            console.error('Error loading user NFTs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNFTSelect = (nft: NFTDetails) => {
        setSelectedNFT(nft);
        setTransactionData(prev => ({
            ...prev,
            selectedNFT: nft,
            type: activeTab
        }));
    };

    const handleFormSubmit = (data: Partial<TransactionData>) => {
        setTransactionData(prev => ({
            ...prev,
            ...data,
            selectedNFT: selectedNFT,
            type: activeTab
        }));
        setShowPreview(true);
    };

    const handleTransactionConfirm = async () => {
        try {
            setIsLoading(true);
            // Hier würde die echte Blockchain-Transaktion stattfinden
            console.log('Processing transaction:', transactionData);

            if (transactionData.type === 'sell') {
                // List NFT for sale
                await listNFTForSale();
            } else {
                // Create trade offer
                await createTradeOffer();
            }

            // Reset form nach erfolgreicher Transaktion
            setShowPreview(false);
            setSelectedNFT(null);
            setTransactionData({ type: activeTab, selectedNFT: null });

        } catch (error) {
            console.error('Transaction failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const listNFTForSale = async () => {
        // Marketplace contract interaction
        console.log('Listing NFT for sale...');
    };

    const createTradeOffer = async () => {
        // Trade contract interaction
        console.log('Creating trade offer...');
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Wallet Connection Required</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Please connect your wallet to sell or trade NFTs.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Sell & Trade NFTs</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        List your NFTs for sale or trade them with other collectors
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                        <button
                            onClick={() => setActiveTab('sell')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sell'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Sell for ETH
                        </button>
                        <button
                            onClick={() => setActiveTab('trade')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'trade'
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Trade NFTs
                        </button>
                    </div>
                </div>

                {showPreview ? (
                    <TransactionPreview
                        data={transactionData}
                        onConfirm={handleTransactionConfirm}
                        onCancel={() => setShowPreview(false)}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* NFT Selection */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Select Your NFT
                            </h2>

                            <NFTUserSelector
                                userNFTs={userNFTs}
                                selectedNFT={selectedNFT}
                                onSelect={handleNFTSelect}
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Form */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                {activeTab === 'sell' ? (
                                    <>
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Sale Details
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Trade Details
                                    </>
                                )}
                            </h2>

                            {activeTab === 'sell' ? (
                                <SellForm
                                    selectedNFT={selectedNFT}
                                    onSubmit={handleFormSubmit}
                                />
                            ) : (
                                <TradeForm
                                    selectedNFT={selectedNFT}
                                    onSubmit={handleFormSubmit}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
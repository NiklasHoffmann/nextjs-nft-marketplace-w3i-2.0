'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { NFTUserSelector } from './components/NFTUserSelector';
import { SellForm } from './components/SellForm';
import { TradeForm } from './components/TradeForm';
import { TransactionPreview } from './components/TransactionPreview';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

type Tab = 'sell' | 'trade';

interface TransactionData {
    type: 'sell' | 'trade';
    selectedNFT: AggregatedNFT | null;
    price?: string;
    currency?: 'ETH' | 'USDC';
    description?: string;
    targetNFT?: AggregatedNFT | null;
    tradeConditions?: string;
}

/**
 * Adapter function to convert WalletNFT to AggregatedNFT for sell components
 */
function walletNFTToAggregatedNFT(nft: WalletNFT): AggregatedNFT {
    return {
        key: `${nft.contractAddress}-${nft.tokenId}`,
        contractAddress: nft.contractAddress as `0x${string}`,
        tokenId: nft.tokenId,
        listed: nft.isListed || false,
        listing: nft.isListed ? {
            listingId: nft.listingId || '',
            contractAddress: nft.contractAddress as `0x${string}`,
            tokenId: nft.tokenId,
            isListed: true,
            price: nft.listingPrice || '0',
            seller: (nft.seller as `0x${string}`) || '0x0000000000000000000000000000000000000000',
            buyer: null,
            desiredContractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Default for sell listings
            desiredTokenId: null
        } : undefined,
        core: {
            contractAddress: nft.contractAddress as `0x${string}`,
            tokenId: nft.tokenId,
            tokenURI: null,
            name: nft.contractName || null,
            owner: null, // WalletNFT doesn't have owner info
            symbol: nft.contractSymbol || null,
            contractName: nft.contractName || null,
            contractSymbol: nft.contractSymbol || null
        },
        meta: nft.name || nft.description || nft.image ? {
            name: nft.name,
            description: nft.description,
            image: nft.image,
            animationUrl: nft.animationUrl
        } : undefined,
        lastUpdated: Date.now(),
        sources: {
            blockchain: true,
            metadata: true,
            marketplace: nft.hasMarketplaceData,
            social: false,
            insights: nft.hasInsightsData
        },
        insight: nft.insights ? {
            contractAddress: nft.contractAddress as `0x${string}`,
            customTitle: nft.insights.customTitle,
            category: nft.insights.category,
            tags: [],
            cardDescription: nft.insights.cardDescriptions,
            rarity: nft.insights.rarity,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        } : undefined
    };
}

export function SellTradePage() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    // Use WalletNFTsContext
    const walletNFTsContext = useWalletNFTs();
    const walletNFTs = walletNFTsContext.nfts;
    const nftsLoading = walletNFTsContext.loading;
    const nftsError = walletNFTsContext.error;

    const [activeTab, setActiveTab] = useState<Tab>('sell');
    const [selectedNFT, setSelectedNFT] = useState<AggregatedNFT | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyUnlisted, setShowOnlyUnlisted] = useState(true); // Default: only show unlisted NFTs
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'likes' | 'views' | 'rating' | 'watchlist' | 'recent'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [transactionData, setTransactionData] = useState<TransactionData>({
        type: 'sell',
        selectedNFT: null
    });
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Use walletNFTs directly (they are already AggregatedNFT[])
    const allUserNFTs: AggregatedNFT[] = walletNFTs.map(walletNFTToAggregatedNFT);

    // Sort function for NFTs
    const sortNFTs = (nfts: AggregatedNFT[]): AggregatedNFT[] => {
        return [...nfts].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.core.name || a.meta?.name || `NFT #${a.tokenId}`;
                    bValue = b.core.name || b.meta?.name || `NFT #${b.tokenId}`;
                    break;
                case 'price':
                    aValue = a.listed && a.listing?.price ? parseFloat(a.listing.price) : 0;
                    bValue = b.listed && b.listing?.price ? parseFloat(b.listing.price) : 0;
                    break;
                case 'likes':
                    aValue = a.social?.likeCount || 0;
                    bValue = b.social?.likeCount || 0;
                    break;
                case 'views':
                    aValue = a.social?.viewCount || 0;
                    bValue = b.social?.viewCount || 0;
                    break;
                case 'rating':
                    aValue = a.social?.averageRating || 0;
                    bValue = b.social?.averageRating || 0;
                    break;
                case 'watchlist':
                    aValue = a.social?.watchlistCount || 0;
                    bValue = b.social?.watchlistCount || 0;
                    break;
                case 'recent':
                    aValue = a.lastUpdated;
                    bValue = b.lastUpdated;
                    break;
                default:
                    return 0;
            }

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortOrder === 'asc' ? comparison : -comparison;
            }

            // Handle numeric comparison
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                const comparison = aValue - bValue;
                return sortOrder === 'asc' ? comparison : -comparison;
            }

            // Handle date comparison
            if (sortBy === 'recent') {
                const aDate = new Date(aValue).getTime();
                const bDate = new Date(bValue).getTime();
                const comparison = aDate - bDate;
                return sortOrder === 'asc' ? comparison : -comparison;
            }

            return 0;
        });
    };

    // Filter and sort NFTs
    const userNFTs = sortNFTs(
        allUserNFTs.filter(nft => {
            // Filter by listing status
            if (showOnlyUnlisted && nft.listed) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchesName = nft.meta?.name?.toLowerCase().includes(search);
                const matchesTokenId = nft.tokenId?.toLowerCase().includes(search);
                const matchesAddress = nft.contractAddress?.toLowerCase().includes(search);

                return matchesName || matchesTokenId || matchesAddress;
            }

            return true;
        })
    );

    const handleNFTSelect = (nft: AggregatedNFT) => {
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

    };

    const createTradeOffer = async () => {
        // Trade contract interaction

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
                                {!nftsLoading && allUserNFTs.length > 0 && (
                                    <span className="ml-auto text-sm font-normal text-gray-500">
                                        {userNFTs.length} / {allUserNFTs.length} NFT{allUserNFTs.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </h2>

                            {/* Search and Filters */}
                            {!nftsLoading && allUserNFTs.length > 0 && (
                                <div className="mb-4 space-y-3">
                                    {/* Search Bar and Sort Controls */}
                                    <div className="flex gap-3">
                                        {/* Search Bar */}
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by name, token ID, or address..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Sort Controls */}
                                        <div className="flex gap-2">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                            >
                                                <option value="name">Name</option>
                                                <option value="price">Price</option>
                                                <option value="likes">Likes</option>
                                                <option value="views">Views</option>
                                                <option value="rating">Rating</option>
                                                <option value="watchlist">Watchlist</option>
                                                <option value="recent">Recently Added</option>
                                            </select>

                                            <button
                                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                            >
                                                <svg className={`w-4 h-4 text-gray-600 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filter Toggle */}
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showOnlyUnlisted}
                                                onChange={(e) => setShowOnlyUnlisted(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Show only unlisted NFTs
                                            </span>
                                        </label>
                                        {showOnlyUnlisted && (
                                            <span className="text-xs text-gray-500">
                                                {allUserNFTs.filter(nft => !nft.listed).length} unlisted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {nftsError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-red-800">Error Loading NFTs</h3>
                                            <p className="text-sm text-red-700 mt-1">
                                                {nftsError || 'Failed to load your NFTs. Please try refreshing the page.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <NFTUserSelector
                                userNFTs={userNFTs}
                                selectedNFT={selectedNFT}
                                onSelect={handleNFTSelect}
                                isLoading={nftsLoading}
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

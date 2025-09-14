"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { formatEther as formatEtherViem } from 'viem';
import Link from 'next/link';
import Image from 'next/image';
import { useETHPrice } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMarketplaceUser } from '@/hooks';
import { getMarketplaceAddress } from '@/utils';

// Force dynamic rendering for this page to prevent SSG issues
export const dynamic = 'force-dynamic';

// Debug mode - set to false in production
const DEBUG_MODE = true;

interface UserNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    image?: string;
    contractName?: string;
}

export default function WalletDashboard() {
    const [mounted, setMounted] = useState(false);

    // Only render after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading wallet dashboard...</p>
                </div>
            </div>
        );
    }

    return <WalletDashboardContent />;
}

function WalletDashboardContent() {
    const router = useRouter();
    const { address, isConnected, chainId } = useAccount();
    const { data: balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useBalance({
        address: address,
        query: {
            enabled: !!address && !!isConnected,
            refetchInterval: 30000, // Refetch every 30 seconds
        }
    });

    // Get marketplace address for current chain
    const marketplaceAddress = getMarketplaceAddress(chainId);

    // Marketplace proceeds
    const {
        proceeds,
        proceedsWei,
        proceedsLoading,
        error: proceedsError,
        isWithdrawing: isWithdrawingProceeds,
        withdrawProceeds,
        refetchProceeds
    } = useMarketplaceUser(marketplaceAddress || '');

    const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
    const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Get converted price for balance
    const ethAmount = balance ? parseFloat(formatEtherViem(balance.value)) : 0;
    const proceedsAmount = parseFloat(proceeds);
    const { convertedPrice: balancePrice, loading: balancePriceLoading } = useETHPrice(ethAmount);
    const { convertedPrice: proceedsPrice, loading: proceedsPriceLoading } = useETHPrice(proceedsAmount);

    // Currency context for debug info
    const { selectedCurrency, refreshExchangeRates, getCacheInfo } = useCurrency();
    const cacheInfo = getCacheInfo();

    // Redirect if not connected
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    // Format balance with more precision
    const formatBalance = (bal: any, precision: number = 6) => {
        if (!bal) return '0';
        const value = parseFloat(formatEtherViem(bal.value));
        return value.toFixed(precision);
    };

    // Format address for display
    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    // Mock function to fetch user's NFTs
    // In a real app, you'd use a service like Alchemy, Moralis, or OpenSea API
    const fetchUserNFTs = async () => {
        if (!address) return;

        setIsLoadingNFTs(true);
        try {
            // Mock NFT data - replace with actual API call
            const mockNFTs: UserNFT[] = [
                {
                    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
                    tokenId: "1",
                    name: "Cool NFT #1",
                    image: "/media/Logo-w3i-marketplace.png",
                    contractName: "Cool Collection"
                },
                {
                    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
                    tokenId: "2",
                    name: "Cool NFT #2",
                    image: "/media/Logo-w3i-marketplace.png",
                    contractName: "Cool Collection"
                },
                {
                    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
                    tokenId: "5",
                    name: "Awesome NFT #5",
                    image: "/media/Logo-w3i-marketplace.png",
                    contractName: "Awesome Collection"
                }
            ];

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUserNFTs(mockNFTs);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
        } finally {
            setIsLoadingNFTs(false);
        }
    };

    // Handle withdrawal (mock function)
    const handleWithdraw = async () => {
        if (!balance || !address) return;

        setIsWithdrawing(true);
        try {
            // In a real app, you'd call your withdrawal contract here
            console.log('Withdrawing balance:', formatEtherViem(balance.value), 'ETH');

            // Mock withdrawal process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Refresh balance after withdrawal
            await refetchBalance();

            alert('Withdrawal initiated successfully!');
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert('Withdrawal failed. Please try again.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    // Load user's NFTs on component mount
    useEffect(() => {
        if (isConnected && address) {
            fetchUserNFTs();
        }
    }, [isConnected, address]);

    // Auto-refresh balance every 30 seconds
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            refetchBalance();
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected, refetchBalance]);

    if (!isConnected || !address) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Wallet not connected</h1>
                    <p className="text-gray-600 mb-6">Please connect your wallet to view your dashboard.</p>
                    <Link
                        href="/"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Dashboard</h1>
                    <p className="text-gray-600">Manage your balance and view your NFT collection</p>
                </div>

                {/* Balance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Wallet Balance Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Wallet Balance</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-sm text-green-600 font-medium">Live</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* ETH Balance */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-gray-900">
                                    {balanceLoading ? (
                                        <span className="animate-pulse">Loading...</span>
                                    ) : balanceError ? (
                                        <span className="text-red-500 text-sm">Error loading balance</span>
                                    ) : (
                                        `${formatBalance(balance, 6)} ETH`
                                    )}
                                </span>
                                <button
                                    onClick={() => refetchBalance()}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    title="Refresh Balance"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>

                            {/* Converted Price */}
                            {!balancePriceLoading && !balanceError && balance && parseFloat(formatEtherViem(balance.value)) > 0 && (
                                <p className="text-xl text-gray-600">
                                    ≈ {balancePrice}
                                </p>
                            )}

                            {/* Withdraw Button */}
                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing || !balance || parseFloat(formatEtherViem(balance.value)) === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isWithdrawing ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Withdraw Balance
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Marketplace Proceeds Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Marketplace Proceeds</h2>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${proceedsLoading ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                <span className={`text-sm font-medium ${proceedsLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {proceedsLoading ? 'Loading' : 'Live'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Proceeds Balance */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-gray-900">
                                    {proceedsLoading ? (
                                        <span className="animate-pulse">Loading...</span>
                                    ) : proceedsError ? (
                                        <span className="text-red-500 text-sm">Error loading proceeds</span>
                                    ) : !marketplaceAddress ? (
                                        <span className="text-gray-500 text-sm">Network not supported</span>
                                    ) : (
                                        `${proceeds} ETH`
                                    )}
                                </span>
                                <button
                                    onClick={() => refetchProceeds()}
                                    disabled={proceedsLoading || !marketplaceAddress}
                                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                                    title="Refresh Proceeds"
                                >
                                    <svg className={`w-5 h-5 ${proceedsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>

                            {/* Converted Price */}
                            {!proceedsPriceLoading && proceedsAmount > 0 && (
                                <p className="text-xl text-gray-600">
                                    ≈ {proceedsPrice}
                                </p>
                            )}

                            {/* Error Display */}
                            {proceedsError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-600">{proceedsError}</p>
                                </div>
                            )}

                            {/* Withdraw Proceeds Button */}
                            <button
                                onClick={withdrawProceeds}
                                disabled={isWithdrawingProceeds || proceedsLoading || proceedsAmount === 0 || !!proceedsError}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isWithdrawingProceeds ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Withdrawing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Withdraw Proceeds
                                    </>
                                )}
                            </button>

                            {proceedsAmount === 0 && !proceedsLoading && !proceedsError && (
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    No proceeds available
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Total Portfolio Value</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="text-sm text-blue-600 font-medium">Combined</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                            <p className="text-2xl font-bold text-gray-900">{formatBalance(balance, 4)} ETH</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Marketplace Proceeds</p>
                            <p className="text-2xl font-bold text-gray-900">{proceedsLoading ? '...' : proceeds} ETH</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Total Value</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {proceedsLoading ? '...' : (ethAmount + proceedsAmount).toFixed(4)} ETH
                            </p>
                        </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-sm text-gray-900">{address}</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(address || '')}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="Copy Address"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* NFT Collection */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Your NFT Collection</h2>
                        <button
                            onClick={fetchUserNFTs}
                            disabled={isLoadingNFTs}
                            className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${isLoadingNFTs ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {isLoadingNFTs ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-gray-200 rounded-xl aspect-square animate-pulse" />
                            ))}
                        </div>
                    ) : userNFTs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {userNFTs.map((nft) => (
                                <Link
                                    key={`${nft.contractAddress}-${nft.tokenId}`}
                                    href={`/nft/${nft.contractAddress}/${nft.tokenId}`}
                                    className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="aspect-square bg-gray-100 relative">
                                        <Image
                                            src={nft.image || '/media/Logo-w3i-marketplace.png'}
                                            alt={nft.name || `NFT #${nft.tokenId}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                                            {nft.name || `NFT #${nft.tokenId}`}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {nft.contractName || formatAddress(nft.contractAddress)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Token ID: {nft.tokenId}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs found</h3>
                            <p className="text-gray-600 mb-4">You don't have any NFTs in your wallet yet.</p>
                            <Link
                                href="/"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Browse NFTs
                            </Link>
                        </div>
                    )}
                </div>

                {/* Debug Information - Remove in production */}
                {DEBUG_MODE && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-yellow-800">🐛 Debug Information</h2>
                            <button
                                onClick={refreshExchangeRates}
                                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md text-sm hover:bg-yellow-300 transition-colors"
                            >
                                🔄 Refresh Rates
                            </button>
                        </div>

                        {/* Connection and Network Status */}
                        <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                            <h3 className="font-semibold text-yellow-700 mb-2">Connection & Network Status</h3>
                            <div className="text-sm space-y-1">
                                <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
                                <p>Address: {address || 'Not connected'}</p>
                                <p>Chain ID: {chainId || 'Unknown'}</p>
                                <p>Marketplace Address: {marketplaceAddress || 'Not available'}</p>
                                <p>Balance Loading: {balanceLoading ? 'Yes' : 'No'}</p>
                                <p>Balance Error: {balanceError?.message || 'None'}</p>
                                <p>Proceeds Loading: {proceedsLoading ? 'Yes' : 'No'}</p>
                                <p>Proceeds Error: {proceedsError || 'None'}</p>
                            </div>
                        </div>

                        {/* API Status */}
                        <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                            <h3 className="font-semibold text-yellow-700 mb-2">Exchange Rate APIs</h3>
                            <div className="text-sm space-y-1">
                                <p>Selected Currency: {selectedCurrency.name} ({selectedCurrency.code})</p>
                                <p>Cache Status: {cacheInfo.status}</p>
                                <p>Last Update: {cacheInfo.lastUpdate || 'Never'}</p>
                                <p>API Priority: Coinbase → CryptoCompare → Cached Fallback</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-yellow-700">Wallet Balance:</h3>
                                <p>Raw Wei: {balance?.value?.toString() || 'N/A'}</p>
                                <p>Formatted ETH: {balance ? formatEtherViem(balance.value) : 'N/A'}</p>
                                <p>Parsed ETH: {ethAmount}</p>
                                <p>Converted Price: {balancePrice}</p>
                                <p>Loading: {balancePriceLoading ? 'Yes' : 'No'}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-yellow-700">Marketplace Proceeds:</h3>
                                <p>Raw Wei: {proceedsWei?.toString() || 'N/A'}</p>
                                <p>Formatted ETH: {proceeds}</p>
                                <p>Parsed ETH: {proceedsAmount}</p>
                                <p>Converted Price: {proceedsPrice}</p>
                                <p>Loading: {proceedsPriceLoading ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-yellow-600">
                            <p>📊 Open browser console for detailed API logs</p>
                            <p>⚙️ Set DEBUG_MODE = false to hide this section</p>
                            <p>🔄 Rates auto-update every 6 hours or use refresh button</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
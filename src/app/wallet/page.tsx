"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { formatEther as formatEtherViem } from 'viem';
import Link from 'next/link';
import { useETHPrice } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMarketplaceUser } from '@/hooks';
import { getMarketplaceAddress } from '@/utils';
import { WalletNFTsList, NFTFilterSidebar } from '@/components';
import type { NFTFilters, NFTSortOptions } from '@/components/marketplace/NFTFilterBar';

// Force dynamic rendering for this page to prevent SSG issues
export const dynamic = 'force-dynamic';

// Debug mode - set to false in production
const DEBUG_MODE = true;

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

    // Filter and Sort State
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
        searchTerm: '',
    });
    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    const { data: balance, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useBalance({
        address: address,
        query: {
            enabled: !!address && !!isConnected,
            refetchInterval: false, // DISABLED: Auto-refresh verursacht 429 Errors
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
        return `${(addr || '').slice(0, 8)}...${(addr || '').slice(-6)}`;
    };

    // Handle withdrawal (mock function)
    const handleWithdraw = async () => {
        if (!balance || !address) return;

        setIsWithdrawing(true);
        try {
            // In a real app, you'd call your withdrawal contract here

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

    const handleWithdrawProceeds = async () => {
        try {
            await withdrawProceeds();
            await refetchProceeds();
        } catch (error) {
            console.error('Withdraw proceeds error:', error);
        }
    };

    // REMOVED: Duplicate auto-refresh interval (already handled by useBalance refetchInterval)
    // This was causing 429 errors by making redundant requests

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
        <div className="min-h-screen bg-gray-50">
            {/* NFTFilterSidebar - Left Sidebar */}
            <NFTFilterSidebar
                onFiltersChange={setFilters}
                onSortChange={setSort}
                currentSort={sort}
                totalItems={0}
                filteredCount={0}
            />

            <main className="flex-1 pt-[66px] md:pl-16">
                {/* Wallet Header - Simplified */}
                <div className="border-b border-gray-200 bg-white pr-80">
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="font-mono text-sm text-gray-500">{address}</p>
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
                    </div>
                </div>

                {/* NFT Lists Area */}
                <div className="pr-80 pl-8 pt-8">
                    <WalletNFTsList
                        walletAddress={address}
                        title="Your NFT Collection"
                        includeContext={true}
                        autoFetch={true}
                        separateSections={true}
                        filters={filters}
                        sort={sort}
                    />
                </div>
            </main>

            {/* Right Sidebar - Wallet Info (Fixed) */}
            <aside className="fixed right-0 top-[66px] bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-50 shadow-xl">
                <div className="p-6 space-y-4">
                    {/* Wallet Balance Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Wallet Balance
                            </h2>
                            <button
                                onClick={() => refetchBalance()}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="Refresh"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {balanceLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : balanceError ? (
                            <p className="text-red-600 text-sm">Error loading balance</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-center py-2 bg-white rounded-lg">
                                    <p className="text-3xl font-bold text-blue-600">
                                        {formatBalance(balance, 6)} ETH
                                    </p>
                                    {!balancePriceLoading && balancePrice && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            ˜ {balancePrice}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Marketplace Proceeds Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Sales Proceeds
                            </h2>
                            <button
                                onClick={() => refetchProceeds()}
                                className="text-green-600 hover:text-green-700 transition-colors"
                                title="Refresh"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {proceedsLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            </div>
                        ) : proceedsError ? (
                            <p className="text-red-600 text-sm">{proceedsError}</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-center py-2 bg-white rounded-lg">
                                    <p className="text-3xl font-bold text-green-600">
                                        {proceeds} ETH
                                    </p>
                                    {!proceedsPriceLoading && proceedsPrice && parseFloat(proceeds) > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            ˜ {proceedsPrice}
                                        </p>
                                    )}
                                </div>

                                {parseFloat(proceeds) > 0 && (
                                    <button
                                        onClick={handleWithdrawProceeds}
                                        disabled={isWithdrawingProceeds}
                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                    >
                                        {isWithdrawingProceeds ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Withdrawing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Withdraw Proceeds
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    refetchBalance();
                                    refetchProceeds();
                                }}
                                className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh All
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(address || '')}
                                className="w-full px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Address
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}

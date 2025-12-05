"use client";

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { formatEther as formatEtherViem } from 'viem';
import Link from 'next/link';
import { useETHPrice } from '@/contexts/CurrencyContext';
import { useMarketplaceUser } from '@/hooks';
import { getMarketplaceAddress } from '@/services/blockchain';
import { WalletNFTsList } from './WalletNFTsList';
import { NFTFilterSidebar } from '@/components';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';
import { WalletBalanceCard } from './WalletBalanceCard';
import { ProceedsCard } from './ProceedsCard';
import { QuickActionsCard } from './QuickActionsCard';

export function WalletDashboard() {
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

    // Get converted price for balance
    const ethAmount = balance ? parseFloat(formatEtherViem(balance.value)) : 0;
    const proceedsAmount = parseFloat(proceeds);
    const { convertedPrice: balancePrice, loading: balancePriceLoading } = useETHPrice(ethAmount);
    const { convertedPrice: proceedsPrice, loading: proceedsPriceLoading } = useETHPrice(proceedsAmount);

    const handleWithdrawProceeds = async () => {
        try {
            await withdrawProceeds();
            await refetchProceeds();
        } catch (error) {
            console.error('Withdraw proceeds error:', error);
        }
    };

    const handleRefreshAll = () => {
        refetchBalance();
        refetchProceeds();
    };

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
                        title="Your NFT Collection"
                        separateSections={true}
                        filters={filters}
                        sort={sort}
                    />
                </div>
            </main>

            {/* Right Sidebar - Wallet Info (Fixed) */}
            <aside className="fixed right-0 top-[66px] bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-50 shadow-xl">
                <div className="p-6 space-y-4">
                    <WalletBalanceCard
                        balance={balance}
                        balanceLoading={balanceLoading}
                        balanceError={balanceError}
                        balancePrice={balancePrice}
                        balancePriceLoading={balancePriceLoading}
                        onRefresh={refetchBalance}
                    />

                    <ProceedsCard
                        proceeds={proceeds}
                        proceedsLoading={proceedsLoading}
                        proceedsError={proceedsError}
                        proceedsPrice={proceedsPrice}
                        proceedsPriceLoading={proceedsPriceLoading}
                        isWithdrawing={isWithdrawingProceeds}
                        onRefresh={refetchProceeds}
                        onWithdraw={handleWithdrawProceeds}
                    />

                    <QuickActionsCard
                        address={address}
                        onRefreshAll={handleRefreshAll}
                    />
                </div>
            </aside>
        </div>
    );
}

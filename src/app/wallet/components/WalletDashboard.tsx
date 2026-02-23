"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { WalletNFTsList } from './WalletNFTsList';
import { useWalletLayout } from '../context';
import { useWalletNFTsV2 } from '@/hooks/wallet/useWalletNFTsV2';
import { LoadingState } from '@/components/core/Loading';

export function WalletDashboard() {
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();
    const { filters, sort, setFilteredCount } = useWalletLayout();

    // Simple data fetching without filters
    const { nfts, loading, error } = useWalletNFTsV2({
        walletAddress: address,
        autoFetch: true
    });

    // Show loading while wallet is connecting/reconnecting
    if (isConnecting || isReconnecting) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <LoadingState size="lg" variant="centered" message="Connecting wallet..." />
            </div>
        );
    }

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
        <div className="md:pl-16 py-8">
            <WalletNFTsList
                nfts={nfts}
                loading={loading || isConnecting || isReconnecting}
                error={error}
                title="Your NFT Collection"
                separateSections={true}
                filters={filters}
                sort={sort}
                onFilteredCountChange={setFilteredCount}
            />
        </div>
    );
}

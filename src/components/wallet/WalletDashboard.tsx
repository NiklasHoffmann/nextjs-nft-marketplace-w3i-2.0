"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { WalletNFTsList } from './WalletNFTsList';
import { useWalletNFTsV2 } from '@/hooks/wallet/useWalletNFTsV2';

export function WalletDashboard() {
    const { address, isConnected } = useAccount();

    // Simple data fetching without filters
    const { nfts, loading, error } = useWalletNFTsV2({
        walletAddress: address,
        autoFetch: true
    });

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
        <div className="py-8">
            <WalletNFTsList
                nfts={nfts}
                loading={loading}
                error={error}
                title="Your NFT Collection"
                separateSections={true}
            />
        </div>
    );
}

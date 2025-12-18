"use client";

import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/app/wallet/components/StatCard';

interface SellHeaderProps {
    listingType: 'single' | 'batch';
    nftCount?: number;
    listedCount?: number;
    unlistedCount?: number;
}

export function SellHeader({ listingType, nftCount = 0, listedCount = 0, unlistedCount = 0 }: SellHeaderProps) {
    return (
        <div className="sticky top-[66px] z-10 bg-white border-b border-gray-200">
            <div className="px-8 py-4">
                {/* Back Link */}
                <Link
                    href="/wallet"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
                    title="Back to Wallet"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-medium">Back to Wallet</span>
                </Link>

                <div className="flex items-center justify-between gap-8">
                    {/* Page Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                {listingType === 'batch' ? 'Batch Listing' : 'Sell & Trade NFTs'}
                            </h1>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {listingType === 'batch'
                                    ? `List multiple NFTs at once • ${nftCount} NFT${nftCount !== 1 ? 's' : ''} available`
                                    : 'List your NFTs for sale or trade with other collectors'
                                }
                            </p>
                        </div>
                    </div>

                    {/* NFT Stats */}
                    <div className="flex-1 max-w-2xl">
                        <div className="grid grid-cols-3 gap-3">
                            {/* Listed NFTs */}
                            <StatCard
                                icon={
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                                label="Listed"
                                value={listedCount}
                                variant="green"
                            />

                            {/* Not Listed NFTs */}
                            <StatCard
                                icon={
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                }
                                label="Not Listed"
                                value={unlistedCount}
                                variant="gray"
                            />

                            {/* Total NFTs */}
                            <StatCard
                                icon={
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                }
                                label="Total"
                                value={nftCount}
                                variant="purple"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

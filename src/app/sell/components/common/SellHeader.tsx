"use client";

import React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { SellStats } from './SellStats';

type StepStatus = 'not-started' | 'checking' | 'done' | 'failed';

interface StepState {
    whitelist?: StepStatus;
    approval?: StepStatus;
    signing?: StepStatus;
    pending?: StepStatus;
}

interface SellHeaderProps {
    listingType?: 'single' | 'batch';
    setListingType?: (type: 'single' | 'batch') => void;
    showToggle?: boolean;
    nftCount?: number;
    filteredCount?: number;

    // Progress tracking
    showProgress?: boolean;
    stepStates?: StepState;
    title?: string;
    subtitle?: string;
    icon?: 'sell' | 'check' | 'progress' | 'success';
    backUrl?: Route | string;
    backLabel?: string;

    // Stats for header
    totalNFTs?: number;
    listedCount?: number;
    unlistedCount?: number;
    selectedCount?: number;
}

const steps = [
    { id: 'whitelist', label: 'Whitelist', icon: '🔍' },
    { id: 'approval', label: 'Approval', icon: '✓' },
    { id: 'signing', label: 'Signieren', icon: '✍️' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
];

export function SellHeader({
    listingType,
    setListingType,
    showToggle = false,
    nftCount = 0,
    filteredCount,
    showProgress = true,
    stepStates = {},
    title,
    subtitle,
    icon = 'sell',
    backUrl = '/wallet',
    backLabel = 'Back to Wallet',
    totalNFTs = 0,
    listedCount = 0,
    unlistedCount = 0,
    selectedCount = 0
}: SellHeaderProps) {

    const getStepStatus = (stepId: string): StepStatus => {
        return (stepStates as any)[stepId] || 'not-started';
    };

    const getStepLabel = (stepId: string, status: StepStatus) => {
        if (status === 'checking') return 'Checking';
        if (status === 'done') return 'Done';
        if (status === 'failed') return 'Not Whitelisted';
        return '';
    };

    const getHeaderIcon = () => {
        switch (icon) {
            case 'check':
                return (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'progress':
                return (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const iconBgColor = icon === 'success' ? 'from-green-500 to-emerald-600' : 'from-purple-500 to-indigo-600';

    return (
        <div className="fixed top-[66px] left-0 right-0 z-10 bg-white border-b border-gray-200">
            <div className="px-8 py-2.5">
                <div className="flex items-center justify-between gap-8">
                    {/* Page Info */}
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Back Link */}
                        <Link
                            href={backUrl as Route}
                            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
                            title={backLabel}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-xs font-medium">{backLabel}</span>
                        </Link>
                        
                        <div className="w-px h-8 bg-gray-200" />
                        
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                                {getHeaderIcon()}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                                    {title || (listingType === 'batch' ? 'Batch Listing' : 'Sell & Trade NFTs')}
                                </h1>
                                <p className="text-[11px] text-gray-600 truncate leading-tight">
                                    {subtitle || (listingType === 'batch'
                                        ? 'List multiple NFTs at once'
                                        : 'List your NFTs for sale or trade with other collectors'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NFT Stats */}
                    <div className="flex-1 max-w-2xl">
                        <SellStats
                            totalNFTs={totalNFTs}
                            listedCount={listedCount}
                            unlistedCount={unlistedCount}
                            selectedCount={selectedCount}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

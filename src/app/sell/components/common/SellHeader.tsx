"use client";

import React from 'react';
import type { Route } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
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

export function SellHeader({
    listingType,
    setListingType: _setListingType,
    showToggle: _showToggle = false,
    nftCount: _nftCount = 0,
    filteredCount: _filteredCount,
    showProgress: _showProgress = true,
    stepStates: _stepStates = {},
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

    const getHeaderIcon = () => {
        switch (icon) {
            case 'check':
                return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'progress':
                return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    const getGradientColors = () => {
        switch (icon) {
            case 'success':
                return { from: 'from-green-500', to: 'to-emerald-600' };
            case 'check':
                return { from: 'from-blue-500', to: 'to-cyan-600' };
            case 'progress':
                return { from: 'from-orange-500', to: 'to-amber-600' };
            default:
                return { from: 'from-purple-500', to: 'to-indigo-600' };
        }
    };

    const gradientColors = getGradientColors();

    return (
        <PageHeader
            backLink={{
                href: backUrl,
                label: backLabel
            }}
            icon={{
                type: "svg",
                svgContent: getHeaderIcon(),
                gradientFrom: gradientColors.from,
                gradientTo: gradientColors.to
            }}
            title={title || (listingType === 'batch' ? 'Batch Listing' : 'Sell & Trade NFTs')}
            subtitle={subtitle || (listingType === 'batch'
                ? 'List multiple NFTs at once'
                : 'List your NFTs for sale or trade with other collectors'
            )}
            rightContent={
                <SellStats
                    totalNFTs={totalNFTs}
                    listedCount={listedCount}
                    unlistedCount={unlistedCount}
                    selectedCount={selectedCount}
                />
            }
        />
    );
}

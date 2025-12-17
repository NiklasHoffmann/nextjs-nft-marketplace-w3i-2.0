/**
 * Main Sell/Trade Page Component (Refactored)
 * 
 * Clean, modular architecture with separated concerns:
 * - Business logic in /lib
 * - UI components in /components
 * - Custom hooks in /hooks
 * - Types in /types
 * - Utilities in /utils
 */

'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useUserNFTs, useListingForm } from './hooks';
import { TransactionData, BatchTransactionData, ListingType } from './types';

// UI Components
import { EmptyState } from './components/EmptyState';
import { PageHeader } from './components/PageHeader';
import { BatchListingInfoBanner } from './components/BatchListingInfoBanner';
import { NFTSearchFilter } from './components/NFTSearchFilter';
import { ErrorDisplay } from './components/ErrorDisplay';
import { NFTUserSelector } from './components/NFTUserSelector';
import { UnifiedListingForm } from './components/UnifiedListingForm';
import { BatchListingForm } from './components/BatchListingForm';
import { TransactionPreview } from './components/TransactionPreview';
import { BatchTransactionPreview } from './components/BatchTransactionPreview';

export function SellTradePage() {
    const { isConnected } = useAccount();

    // Custom hooks for state management
    const {
        allNFTs,
        filteredNFTs,
        filterOptions,
        updateFilter,
        loading: nftsLoading,
        error: nftsError
    } = useUserNFTs();

    const {
        selectedNFT,
        setSelectedNFT,
        showPreview,
        setShowPreview,
        isLoading,
        setIsLoading,
        resetForm
    } = useListingForm();

    // Local state
    const [listingType, setListingType] = useState<ListingType>('single');
    const [transactionData, setTransactionData] = useState<TransactionData>({
        mode: 'sale',
        selectedNFT: null
    });
    const [batchTransactionData, setBatchTransactionData] = useState<BatchTransactionData | null>(null);

    // Event handlers
    const handleNFTSelect = (nft: any) => {
        setSelectedNFT(nft);
        setTransactionData(prev => ({
            ...prev,
            selectedNFT: nft
        }));
    };

    const handleFormSubmit = (data: Partial<TransactionData>) => {
        setTransactionData(prev => ({
            ...prev,
            ...data,
            selectedNFT: selectedNFT
        }));
        setShowPreview(true);
    };

    const handleBatchFormSubmit = (data: BatchTransactionData) => {
        setBatchTransactionData(data);
        setShowPreview(true);
    };

    const handleTransactionConfirm = async () => {
        try {
            setIsLoading(true);

            // TODO: Implement transaction handling with ListingService
            console.log('Transaction confirm:', { listingType, transactionData, batchTransactionData });

            // Reset after successful transaction
            resetForm();
            setTransactionData({ mode: 'sale', selectedNFT: null });
            setBatchTransactionData(null);
        } catch (error) {
            console.error('Transaction failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Early return if not connected
    if (!isConnected) {
        return (
            <EmptyState
                title="Wallet Connection Required"
                description="Please connect your wallet to sell or trade NFTs."
            />
        );
    }

    // Render main content
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with listing type toggle */}
                <PageHeader
                    listingType={listingType}
                    onListingTypeChange={setListingType}
                    showToggle={!showPreview}
                />

                {/* Preview Mode */}
                {showPreview ? (
                    listingType === 'batch' && batchTransactionData ? (
                        <BatchTransactionPreview
                            data={batchTransactionData}
                            onConfirm={handleTransactionConfirm}
                            onCancel={() => setShowPreview(false)}
                            isLoading={isLoading}
                        />
                    ) : (
                        <TransactionPreview
                            data={transactionData}
                            onConfirm={handleTransactionConfirm}
                            onCancel={() => setShowPreview(false)}
                            isLoading={isLoading}
                        />
                    )
                ) : listingType === 'batch' ? (
                    /* Batch Listing Mode */
                    <BatchListingForm
                        userNFTs={filteredNFTs}
                        onSubmit={handleBatchFormSubmit}
                        onBack={() => setListingType('single')}
                        marketplaceAddress={process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || ''}
                    />
                ) : (
                    /* Single Listing Mode */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Batch Listing Info Banner */}
                        <BatchListingInfoBanner onBatchClick={() => setListingType('batch')} />

                        {/* NFT Selection Panel */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Wählen Sie Ihren NFT
                                {!nftsLoading && allNFTs.length > 0 && (
                                    <span className="ml-auto text-sm font-normal text-gray-500">
                                        {filteredNFTs.length} / {allNFTs.length} NFT{allNFTs.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </h2>

                            {/* Search and Filters */}
                            {!nftsLoading && allNFTs.length > 0 && (
                                <NFTSearchFilter
                                    filterOptions={filterOptions}
                                    onFilterChange={updateFilter}
                                    unlistedCount={allNFTs.filter((nft: any) => !nft.listed).length}
                                />
                            )}

                            {/* Error Display */}
                            {nftsError && <ErrorDisplay error={nftsError} />}

                            {/* NFT Selector */}
                            <NFTUserSelector
                                userNFTs={filteredNFTs}
                                selectedNFT={selectedNFT}
                                onSelect={handleNFTSelect}
                                isLoading={nftsLoading}
                            />
                        </div>

                        {/* Listing Form Panel */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Listing-Details
                            </h2>

                            <UnifiedListingForm
                                selectedNFT={selectedNFT}
                                onSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

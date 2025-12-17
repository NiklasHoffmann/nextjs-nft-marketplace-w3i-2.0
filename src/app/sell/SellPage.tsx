/**
 * Sell Page Component
 * 
 * Clean, modular architecture with separated concerns:
 * - Business logic in /lib (ListingService)
 * - UI components in /components
 * - Custom hooks in /hooks
 * - Types in /types
 * - Utilities in /utils
 * 
 * Supports single and batch NFT listings with sale, trade, and hybrid modes.
 * Includes smart NFT approval checking and whitelist validation.
 */

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { useUserNFTs, useListingForm, useMarketplaceContracts, useNFTApproval } from './hooks';
import { useNotifications } from '@/contexts/notifications';
import { TransactionData, BatchTransactionData, ListingType } from './types';
import { ListingService } from './lib/listing-service';
import marketplaceAbi from '@/constants/marketplace.abi.json';

// UI Components
import { EmptyState } from './components/EmptyState';
import { PageHeader } from './components/PageHeader';
import { SellHeader } from './components/SellHeader';
import { BatchListingInfoBanner } from './components/BatchListingInfoBanner';
import { NFTSearchFilter } from './components/NFTSearchFilter';
import { ErrorDisplay } from './components/ErrorDisplay';
import { NFTUserSelector } from './components/NFTUserSelector';
import { UnifiedListingForm } from './components/UnifiedListingForm';
import { BatchListingForm } from './components/BatchListingForm';
import { TransactionPreview } from './components/TransactionPreview';
import { BatchTransactionPreview } from './components/BatchTransactionPreview';
import { ApprovalDialog } from './components/ApprovalDialog';
import { WhitelistWarning } from './components/WhitelistWarning';
import { ListingProgressOverlay } from './components/ListingProgressOverlay';

export function SellPage() {
    const { isConnected } = useAccount();
    const notifications = useNotifications();
    const searchParams = useSearchParams();

    // Get NFT from URL params (if coming from detail page)
    const urlContract = searchParams?.get('contract');
    const urlTokenId = searchParams?.get('tokenId');

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

    const {
        marketplaceAddress,
        createListing,
        isSuccess: listingSuccess,
        txHash: listingTxHash,
        error: listingError
    } = useMarketplaceContracts();

    const {
        ensureApproval,
        isFullyApproved,
        approveSingle,
        approveAll
    } = useNFTApproval({
        nftContractAddress: selectedNFT?.core.contractAddress || '0x0',
        tokenId: selectedNFT?.core.tokenId || '0',
        marketplaceAddress,
        enabled: !!selectedNFT
    });


    // Local state
    const [listingType, setListingType] = useState<ListingType>('single');
    const [transactionData, setTransactionData] = useState<TransactionData>({
        mode: 'sale',
        selectedNFT: null
    });
    const [batchTransactionData, setBatchTransactionData] = useState<BatchTransactionData | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showWhitelistWarning, setShowWhitelistWarning] = useState(false);
    const [showListingProgress, setShowListingProgress] = useState(false);
    
    // Ref to prevent showing same error multiple times
    const lastErrorRef = useRef<string | null>(null);

    // Auto-select NFT from URL parameters (when coming from detail page)
    useEffect(() => {
        if (urlContract && urlTokenId && allNFTs.length > 0 && !selectedNFT) {
            const nftToSelect = allNFTs.find(
                nft => nft.contractAddress.toLowerCase() === urlContract.toLowerCase() && 
                       nft.tokenId === urlTokenId
            );
            if (nftToSelect) {
                handleNFTSelect(nftToSelect);
            }
        }
    }, [urlContract, urlTokenId, allNFTs, selectedNFT]);

    // Watch for successful listing confirmation
    useEffect(() => {
        if (listingSuccess && listingTxHash) {
            console.log('✅ Transaction confirmed on blockchain!', listingTxHash);
            
            // Clear all pending notifications (removes "Transaction Pending" info notification)
            notifications.clearAll();
            
            notifications.success(
                'Listing Created!',
                `Your NFT is now listed on the marketplace`,
                {
                    txHash: listingTxHash,
                    duration: 8000
                }
            );

            // Reset form after successful confirmation
            resetForm();
            setTransactionData({ mode: 'sale', selectedNFT: null });
            setBatchTransactionData(null);
            setShowPreview(false);
            setShowListingProgress(false);
        }
    }, [listingSuccess, listingTxHash, resetForm]); // ← FIX: Removed notifications from dependencies

    // Watch for transaction errors (user rejection or blockchain error)
    useEffect(() => {
        if (listingError) {
            // Create unique error identifier to prevent duplicate notifications
            const errorId = listingError.message + ((listingError as any).details || '') + Date.now();
            
            // Only show error if it's different from the last one
            if (lastErrorRef.current !== errorId) {
                lastErrorRef.current = errorId;
                
                console.error('🔴 [SellPage] Transaction error detected:', listingError);
                
                // Clear all pending notifications (removes "Transaction Pending" info notification)
                notifications.clearAll();
                
                // Extract error details
                const errorMessage = listingError.message || (listingError as any).shortMessage || 'Failed to create listing';
                const errorDetails = (listingError as any).details || '';
                const errorName = listingError.name || '';
                
                // Determine error type for user-friendly messaging
                const isUserRejection = 
                    errorMessage.toLowerCase().includes('user rejected') || 
                    errorMessage.toLowerCase().includes('user denied') ||
                    errorMessage.toLowerCase().includes('user cancelled') ||
                    errorName === 'UserRejectedRequestError';
                
                const isGasError = 
                    errorMessage.toLowerCase().includes('gas') ||
                    errorMessage.toLowerCase().includes('insufficient funds');
                
                const isContractRevert = 
                    errorMessage.toLowerCase().includes('revert') ||
                    errorMessage.toLowerCase().includes('execution reverted');
                
                let title = 'Transaction Failed';
                let message = errorMessage;
                
                if (isUserRejection) {
                    title = 'Transaction Cancelled';
                    message = 'You cancelled the transaction in your wallet';
                } else if (isContractRevert) {
                    title = 'Contract Rejected Transaction';
                    message = 'The smart contract rejected the transaction. Check console for details.';
                } else if (isGasError) {
                    title = 'Gas Error';
                    message = `Gas-related error: ${errorMessage}`;
                }
                
                console.error('🔴 Error Type:', {
                    title,
                    message,
                    isUserRejection,
                    isGasError,
                    isContractRevert,
                    rawError: listingError
                });
                
                notifications.error(title, message, { duration: 10000 });
                
                // Hide listing progress overlay on error
                setShowListingProgress(false);
            }
        } else {
            // Reset when error is cleared
            lastErrorRef.current = null;
        }
    }, [listingError]); // ← FIX: Removed notifications from dependencies

    // Create ListingService instance with proper checkWhitelist function
    const listingService = useMemo(() => {
        console.log('🏗️ [SellPage] Creating ListingService with:', {
            marketplaceAddress,
            hasCreateListing: !!createListing,
            hasEnsureApproval: !!ensureApproval,
            ensureApprovalType: typeof ensureApproval,
            selectedNFT: selectedNFT ? {
                contractAddress: selectedNFT.core?.contractAddress || selectedNFT.contractAddress,
                tokenId: selectedNFT.core?.tokenId || selectedNFT.tokenId
            } : null
        });
        
        const checkWhitelist = async (address: string): Promise<boolean> => {
            try {
                // Create a one-time API call for whitelist check
                const result = await fetch('/api/marketplace/whitelist-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        marketplaceAddress,
                        collectionAddress: address 
                    })
                });
                
                if (!result.ok) return false;
                const data = await result.json();
                return data.isWhitelisted || false;
            } catch (error) {
                console.error('Whitelist check failed:', error);
                return false;
            }
        };
        
        return new ListingService(
            marketplaceAddress,
            createListing,
            ensureApproval,
            checkWhitelist,
            notifications
        );
    }, [marketplaceAddress, createListing, ensureApproval, notifications]);

    // Event handlers
    const handleNFTSelect = async (nft: any) => {
        setSelectedNFT(nft);
        setTransactionData(prev => ({
            ...prev,
            selectedNFT: nft
        }));

        // If NFT is deselected, hide whitelist warning
        if (!nft) {
            setShowWhitelistWarning(false);
            return;
        }

        // Check whitelist status via API (pessimistic approach)
        try {
            const response = await fetch('/api/marketplace/whitelist-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    marketplaceAddress,
                    collectionAddress: nft.core.contractAddress 
                })
            });

            if (response.ok) {
                const data = await response.json();
                setShowWhitelistWarning(!data.isWhitelisted);
            } else {
                // Development: Bei Fehler annehmen dass whitelisted (optimistisch)
                console.warn('⚠️ Whitelist check failed (assuming whitelisted for development):', response.status);
                setShowWhitelistWarning(false);
            }
        } catch (error) {
            // Development: Bei Fehler annehmen dass whitelisted (optimistisch)
            console.warn('⚠️ Whitelist check error (assuming whitelisted for development):', error);
            setShowWhitelistWarning(false);
        }
    };

    const handleFormSubmit = async (data: Partial<TransactionData>) => {
        setTransactionData(prev => ({
            ...prev,
            ...data,
            selectedNFT: selectedNFT
        }));

        // Check if approval is needed
        if (!isFullyApproved) {
            setShowApprovalDialog(true);
        } else {
            setShowPreview(true);
        }
    };

    const handleBatchFormSubmit = (data: BatchTransactionData) => {
        setBatchTransactionData(data);
        // For batch, always request ApproveAll
        setShowApprovalDialog(true);
    };

    const handleApproveSingle = async () => {
        setShowApprovalDialog(false);
        try {
            await approveSingle();
            setShowPreview(true);
        } catch (error) {
            // Error already shown by hook
            console.error('Approval cancelled or failed:', error);
        }
    };

    const handleApproveAll = async () => {
        setShowApprovalDialog(false);
        try {
            await approveAll();
            setShowPreview(true);
        } catch (error) {
            // Error already shown by hook
            console.error('Approval cancelled or failed:', error);
        }
    };

    const handleTransactionConfirm = async () => {
        try {
            setIsLoading(true);
            // Hide preview and show progress overlay
            setShowPreview(false);
            setShowListingProgress(true);

            if (listingType === 'batch' && batchTransactionData) {
                await listingService.createBatchListings(batchTransactionData);
            } else {
                if (transactionData.mode === 'sale') {
                    await listingService.listNFTForSale(transactionData);
                } else if (transactionData.mode === 'trade') {
                    await listingService.createTradeOffer(transactionData);
                } else if (transactionData.mode === 'hybrid') {
                    await listingService.createHybridOffer(transactionData);
                }
            }

            // Note: Reset and overlay hiding is handled by success/error useEffects
        } catch (error) {
            console.error('Transaction failed:', error);
            // Error handling and overlay hiding is handled by error useEffect
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

    // Calculate listed/unlisted counts
    const listedCount = allNFTs.filter(nft => nft.listed).length;
    const unlistedCount = allNFTs.filter(nft => !nft.listed).length;

    // Render main content
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Header */}
            <SellHeader 
                listingType={listingType}
                nftCount={allNFTs.length}
                listedCount={listedCount}
                unlistedCount={unlistedCount}
            />

            <main className="pt-[66px]">
                <div className="max-w-6xl mx-auto px-8 py-8">
                    {/* Header with listing type toggle */}
                    <PageHeader
                        listingType={listingType}
                        onListingTypeChange={setListingType}
                        showToggle={!showPreview}
                    />

                {/* Approval Dialog */}
                {showApprovalDialog && selectedNFT && (
                    <ApprovalDialog
                        nft={selectedNFT}
                        isBatchMode={listingType === 'batch'}
                        onApproveSingle={handleApproveSingle}
                        onApproveAll={handleApproveAll}
                        onCancel={() => setShowApprovalDialog(false)}
                    />
                )}

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
                        marketplaceAddress={marketplaceAddress}
                    />
                ) : (
                    /* Single Listing Mode */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Batch Listing Info Banner */}
                        <BatchListingInfoBanner onBatchClick={() => setListingType('batch')} />

                        {/* NFT Selection Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
                                    unlistedCount={allNFTs.filter((nft) => !nft.listed).length}
                                />
                            )}

                            {/* Whitelist Warning */}
                            {showWhitelistWarning && selectedNFT && (
                                <div className="mb-4">
                                    <WhitelistWarning
                                        collectionName={selectedNFT.core.contractName || undefined}
                                        collectionAddress={selectedNFT.core.contractAddress}
                                        onClose={() => setShowWhitelistWarning(false)}
                                    />
                                </div>
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Listing-Details
                            </h2>

                            <UnifiedListingForm
                                selectedNFT={selectedNFT}
                                isFullyApproved={isFullyApproved}
                                onSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                )}
                </div>
            </main>

            {/* Listing Progress Overlay */}
            {showListingProgress && transactionData.selectedNFT && (
                <ListingProgressOverlay
                    nft={transactionData.selectedNFT}
                    mode={transactionData.mode}
                    price={transactionData.price}
                    currency={transactionData.currency}
                    isVisible={showListingProgress}
                />
            )}
        </div>
    );
}

/**
 * SellPage Component
 *
 * Main sell page with NFT selection and listing configuration.
 * 
 * Flow:
 * 1. /sell - NFT selection & form (this page)
 * 2. /sell/check-listing - Preview
 * 3. /sell/listing - Transaction
 * 4. /sell/success - Confirmation
 * 
 * @module sell
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams, useRouter } from 'next/navigation';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { useListingFlow } from '../contexts/ListingFlowContext';
import { useMarketplaceContracts, useMarketplaceData } from '@/hooks/marketplace';
import { useNFTApproval } from '@/hooks/nfts';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { walletNFTToAggregatedNFT, sortNFTs, filterNFTs } from '../utils';
import type { StepStatus, ListingType, NFTFilterOptions } from '../types';

// UI Components
import {
    EmptyState,
    ErrorDisplay,
    NFTSearchFilter,
    NFTUserSelector,
    BatchNFTSelector,
    UnifiedListingForm,
    BatchPricingForm,
    ApprovalDialog
} from '.';

export function SellPage() {
    const { isConnected, address } = useAccount();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setFormData, setProgressStep, setWhitelistStatus: setWhitelistStatusContext, setApprovalStatus: setApprovalStatusContext } = useListingFlow();
    const { marketplaceAddress } = useMarketplaceContracts();
    const { useCollectionWhitelist } = useMarketplaceData(marketplaceAddress || '0x0000000000000000000000000000000000000000');

    const urlContract = searchParams?.get('contract');
    const urlTokenId = searchParams?.get('tokenId');

    // Direct context usage instead of wrapper hook
    const walletNFTsContext = useWalletNFTs();

    // Local filter state
    const [filterOptions, setFilterOptions] = useState<NFTFilterOptions>({
        searchTerm: '',
        showOnlyUnlisted: true,
        sortBy: 'name',
        sortOrder: 'asc'
    });

    // Convert wallet NFTs to aggregated format
    const allNFTs = useMemo(
        () => walletNFTsContext.nfts.map(walletNFTToAggregatedNFT),
        [walletNFTsContext.nfts]
    );

    // Apply filters and sorting
    const filteredNFTs = useMemo(() => {
        const filtered = filterNFTs(allNFTs, {
            searchTerm: filterOptions.searchTerm,
            showOnlyUnlisted: filterOptions.showOnlyUnlisted
        });
        return sortNFTs(filtered, filterOptions.sortBy, filterOptions.sortOrder);
    }, [allNFTs, filterOptions]);

    const updateFilter = (updates: Partial<NFTFilterOptions>) => {
        setFilterOptions(prev => ({ ...prev, ...updates }));
    };

    // Local form state
    const [selectedNFT, setSelectedNFT] = useState<AggregatedNFT | null>(null);

    const [listingType, setListingType] = useState<ListingType>('single');
    const [batchSelectedNFTs, setBatchSelectedNFTs] = useState<Set<string>>(new Set());
    const [whitelistStatus, setWhitelistStatus] = useState<StepStatus>('not-started');
    const [approvalStatus, setApprovalStatus] = useState<StepStatus>('not-started');
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);

    // NFT Approval Hook
    const nftApproval = useNFTApproval({
        nftContractAddress: (selectedNFT?.contractAddress || '') as `0x${string}`,
        tokenId: selectedNFT?.tokenId || '0',
        marketplaceAddress: marketplaceAddress || '0x0000000000000000000000000000000000000000',
        enabled: !!selectedNFT && !!marketplaceAddress
    });

    // Sync userNFTs to context
    useEffect(() => {
        setFormData({ userNFTs: allNFTs });
    }, [allNFTs, setFormData]);

    // Sync status to context
    useEffect(() => {
        setWhitelistStatusContext(whitelistStatus);
    }, [whitelistStatus, setWhitelistStatusContext]);

    useEffect(() => {
        setApprovalStatusContext(approvalStatus);
    }, [approvalStatus, setApprovalStatusContext]);

    // Zeige ApprovalDialog nur wenn Whitelist durch ist und Approval explizit fehlt (failed)
    useEffect(() => {
        if (whitelistStatus === 'done' && approvalStatus === 'failed' && (selectedNFT || batchSelectedNFTs.size > 0)) {
            setShowApprovalDialog(true);
        } else {
            setShowApprovalDialog(false);
        }
    }, [whitelistStatus, approvalStatus, selectedNFT, batchSelectedNFTs]);

    // Intelligente Step-Bestimmung basierend auf Check-Status
    useEffect(() => {
        // Wenn NFT ausgewählt ist und Checks laufen
        if (selectedNFT || batchSelectedNFTs.size > 0) {
            // Whitelist wird geprüft
            if (whitelistStatus === 'checking') {
                setProgressStep('whitelist');
                return;
            }
            // Whitelist fertig, Approval wird geprüft
            if (whitelistStatus === 'done' && approvalStatus === 'checking') {
                setProgressStep('approval');
                return;
            }
            // Beide Checks erfolgreich -> Form wird aktiv
            if (whitelistStatus === 'done' && approvalStatus === 'done') {
                setProgressStep('form');
                return;
            }
            // Checks fehlgeschlagen -> bleibe bei select
            if (whitelistStatus === 'failed' || approvalStatus === 'failed') {
                setProgressStep('select');
                return;
            }
        } else {
            // Keine NFT ausgewählt -> select ist aktiv
            setProgressStep('select');
        }
    }, [selectedNFT, batchSelectedNFTs, whitelistStatus, approvalStatus, setProgressStep]);

    useEffect(() => {
        if (urlContract && urlTokenId && allNFTs.length > 0 && !selectedNFT) {
            const nftToSelect = allNFTs.find(
                nft => nft.contractAddress.toLowerCase() === urlContract.toLowerCase() &&
                    nft.tokenId === urlTokenId
            );
            if (nftToSelect) {
                setSelectedNFT(nftToSelect);
            }
        }
    }, [urlContract, urlTokenId, allNFTs, selectedNFT, setSelectedNFT]);

    useEffect(() => {
        const checkApproval = async (contractAddress: string, tokenId: string, ownerAddress: string) => {
            if (!marketplaceAddress || !ownerAddress) return;

            try {
                setApprovalStatus('checking');
                const { createPublicClient, http } = await import('viem');
                const { sepolia } = await import('viem/chains');
                const publicClient = createPublicClient({
                    chain: sepolia,
                    transport: http()
                });

                const isApproved = await publicClient.readContract({
                    address: contractAddress as `0x${string}`,
                    abi: [
                        {
                            name: 'isApprovedForAll',
                            type: 'function',
                            stateMutability: 'view',
                            inputs: [
                                { name: 'owner', type: 'address' },
                                { name: 'operator', type: 'address' }
                            ],
                            outputs: [{ name: '', type: 'bool' }]
                        }
                    ],
                    functionName: 'isApprovedForAll',
                    args: [ownerAddress as `0x${string}`, marketplaceAddress as `0x${string}`]
                });

                setApprovalStatus(isApproved ? 'done' : 'failed');
            } catch (error) {
                console.error('Approval check failed:', error);
                setApprovalStatus('failed');
            }
        };

        if (whitelistStatus === 'done' && address) {
            if (listingType === 'single' && selectedNFT) {
                checkApproval(selectedNFT.contractAddress, selectedNFT.tokenId, address);
                return;
            }

            if (listingType === 'batch' && batchSelectedNFTs.size > 0) {
                const firstKey = Array.from(batchSelectedNFTs)[0];
                if (!firstKey) {
                    setApprovalStatus('not-started');
                    return;
                }
                const [contract, tokenId] = firstKey.split('-');
                if (contract && tokenId) {
                    checkApproval(contract, tokenId, address);
                    return;
                }
            }
        }

        setApprovalStatus('not-started');
    }, [selectedNFT, batchSelectedNFTs, listingType, marketplaceAddress, address, whitelistStatus]);

    // Get contract address to check
    const contractToCheck = listingType === 'single' && selectedNFT
        ? selectedNFT.contractAddress
        : listingType === 'batch' && batchSelectedNFTs.size > 0
            ? Array.from(batchSelectedNFTs)[0]?.split('-')[0]
            : null;

    // Direct hook call for whitelist check (reactive, auto-cached)
    const { data: isWhitelisted, isLoading: isWhitelistLoading, isError: isWhitelistError } = useCollectionWhitelist(
        contractToCheck || '0x0000000000000000000000000000000000000000'
    );

    // Update whitelist status based on hook result
    useEffect(() => {
        if (!contractToCheck) {
            setWhitelistStatus('not-started');
            return;
        }

        if (isWhitelistLoading) {
            setWhitelistStatus('checking');
        } else if (isWhitelistError) {
            setWhitelistStatus('failed');
        } else if (isWhitelisted) {
            setWhitelistStatus('done');
        } else {
            setWhitelistStatus('failed');
        }
    }, [contractToCheck, isWhitelisted, isWhitelistLoading, isWhitelistError]);

    const handleNFTSelect = (nft: AggregatedNFT | null) => {
        setSelectedNFT(nft);
        setFormData({ selectedNFT: nft });
    };

    const handleFormSubmit = (data: any) => {
        setFormData({
            ...data,
            selectedNFT: selectedNFT || data.selectedNFT
        });
        router.push('/sell/check-listing');
    };

    const handleBatchFormSubmit = (data: any) => {
        setFormData(data);
        router.push('/sell/check-listing');
    };

    const handleBatchPricingSubmit = (data: any) => {
        const selectedNFTsList = Array.from(batchSelectedNFTs)
            .map(key => {
                const [contract, tokenId] = key.split('-');
                return allNFTs.find(
                    nft => nft.contractAddress === contract && nft.tokenId === tokenId
                );
            })
            .filter(Boolean) as AggregatedNFT[];

        handleBatchFormSubmit({
            selectedNFTs: selectedNFTsList,
            ...data
        });
    };

    // Approval Dialog Handlers
    const handleApproveSingle = async () => {
        try {
            setApprovalStatus('checking');
            await nftApproval.approveSingle();
            // Status wird automatisch durch useEffect aktualisiert
        } catch (error) {
            console.error('Approval failed:', error);
            setApprovalStatus('failed');
            setShowApprovalDialog(false);
        }
    };

    const handleApproveAll = async () => {
        try {
            setApprovalStatus('checking');
            await nftApproval.approveAll();
            // Status wird automatisch durch useEffect aktualisiert
        } catch (error) {
            console.error('Approval failed:', error);
            setApprovalStatus('failed');
            setShowApprovalDialog(false);
        }
    };

    const handleCancelApproval = () => {
        setShowApprovalDialog(false);
        setSelectedNFT(null);
        setBatchSelectedNFTs(new Set());
        setWhitelistStatus('not-started');
        setApprovalStatus('not-started');
    };

    if (!isConnected) {
        return (
            <EmptyState
                title="Wallet nicht verbunden"
                description="Bitte verbinde deine Wallet, um NFTs zu listen."
                icon="wallet"
            />
        );
    }

    if (walletNFTsContext.error) {
        return <ErrorDisplay error={walletNFTsContext.error} />;
    }

    if (walletNFTsContext.loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Lade deine NFTs...</p>
                </div>
            </div>
        );
    }

    if (!walletNFTsContext.loading && allNFTs.length === 0) {
        return (
            <EmptyState
                title="Keine NFTs gefunden"
                description="Du besitzt aktuell keine NFTs, die gelistet werden können."
                icon="nft"
            />
        );
    }

    return (
        <>
            <section className="space-y-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex-1">
                        <NFTSearchFilter
                            filterOptions={filterOptions}
                            onFilterChange={updateFilter}
                            unlistedCount={filteredNFTs.filter(nft => !nft.listing).length}
                        />
                    </div>
                    <div className="flex-1 justify-center flex">
                        <div className="inline-flex w-full max-w-md rounded-xl bg-white border border-gray-300 overflow-hidden">
                            <button
                                onClick={() => setListingType('single')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-r border-gray-200 ${listingType === 'single'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                Einzeln
                            </button>
                            <button
                                onClick={() => setListingType('batch')}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${listingType === 'batch'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Batch
                                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Neu</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            {listingType === 'single' ? (
                                <NFTUserSelector
                                    userNFTs={filteredNFTs}
                                    selectedNFT={selectedNFT}
                                    onSelect={handleNFTSelect}
                                    isLoading={walletNFTsContext.loading}
                                />
                            ) : (
                                <BatchNFTSelector
                                    userNFTs={filteredNFTs}
                                    selectedNFTs={batchSelectedNFTs}
                                    onSelectionChange={setBatchSelectedNFTs}
                                    isLoading={walletNFTsContext.loading}
                                />
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="min-h-[360px] bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            {listingType === 'single' ? (
                                !selectedNFT ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">NFT auswählen</h3>
                                            <p className="text-gray-600">Wählen Sie links einen NFT aus Ihrer Kollektion, um fortzufahren.</p>
                                        </div>
                                        <div className="space-y-3 text-left">
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-blue-600">1</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">NFT auswählen</p>
                                                    <p className="text-xs text-gray-500">Klicken Sie auf einen NFT in der Liste.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-blue-600">2</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Preis festlegen</p>
                                                    <p className="text-xs text-gray-500">Konfigurieren Sie Ihr Listing.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-blue-600">3</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Listing erstellen</p>
                                                    <p className="text-xs text-gray-500">Bestätigen und signieren Sie die Transaktion.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : whitelistStatus !== 'done' ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
                                            {whitelistStatus === 'checking' ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                                            ) : (
                                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {whitelistStatus === 'checking' ? 'Whitelist wird geprüft...' : 'Whitelist Check fehlgeschlagen'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {whitelistStatus === 'checking'
                                                    ? 'Bitte warten Sie, während wir die Collection prüfen.'
                                                    : 'Diese Collection ist nicht für den Marketplace zugelassen.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <UnifiedListingForm
                                        selectedNFT={selectedNFT}
                                        whitelistStatus={whitelistStatus}
                                        approvalStatus={approvalStatus}
                                        onSubmit={handleFormSubmit}
                                    />
                                )
                            ) : (
                                batchSelectedNFTs.size === 0 ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">NFTs auswählen</h3>
                                            <p className="text-gray-600">Wähle mehrere NFTs, um sie gemeinsam zu listen.</p>
                                        </div>
                                        <div className="space-y-3 text-left">
                                            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-purple-600">1</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">NFTs auswählen</p>
                                                    <p className="text-xs text-gray-500">Nutze die Checkboxen in der Liste.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-purple-600">2</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Preise festlegen</p>
                                                    <p className="text-xs text-gray-500">Lege feste oder flexible Preise fest.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-purple-600">3</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Batch-Listing abschließen</p>
                                                    <p className="text-xs text-gray-500">Alle Listings werden in einer Transaktion angelegt.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : whitelistStatus !== 'done' ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
                                            {whitelistStatus === 'checking' ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                                            ) : (
                                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {whitelistStatus === 'checking' ? 'Whitelist wird geprüft...' : 'Whitelist Check fehlgeschlagen'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {whitelistStatus === 'checking'
                                                    ? 'Bitte warten Sie, während wir die Collection prüfen.'
                                                    : 'Diese Collection ist nicht für den Marketplace zugelassen.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <BatchPricingForm
                                        selectedCount={batchSelectedNFTs.size}
                                        whitelistStatus={whitelistStatus}
                                        approvalStatus={approvalStatus}
                                        onSubmit={handleBatchPricingSubmit}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Approval Dialog Modal */}
            {showApprovalDialog && selectedNFT && (
                <ApprovalDialog
                    nft={selectedNFT}
                    isBatchMode={listingType === 'batch'}
                    onApproveSingle={handleApproveSingle}
                    onApproveAll={handleApproveAll}
                    onCancel={handleCancelApproval}
                    isLoading={nftApproval.isLoading || nftApproval.isConfirming}
                />
            )}
        </>
    );
}

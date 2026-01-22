'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import { useForm } from '@/hooks';

interface BatchListingFormProps {
    userNFTs: AggregatedNFT[];
    selectedNFTs?: Set<string>;
    onSelectedNFTsChange?: (nfts: Set<string>) => void;
    onSubmit: (data: {
        selectedNFTs: AggregatedNFT[];
        pricingType: 'fixed' | 'variable';
        fixedPrice?: string;
        startPrice?: string;
        endPrice?: string;
        currency: 'ETH' | 'USDC';
        description: string;
    }) => void;
    onBack: () => void;
    marketplaceAddress: string;
}

export function BatchListingForm({ 
    userNFTs, 
    selectedNFTs: externalSelectedNFTs,
    onSelectedNFTsChange,
    onSubmit, 
    onBack, 
    marketplaceAddress 
}: BatchListingFormProps) {
    const [contractFilter, setContractFilter] = useState('');
    const [internalSelectedNFTs, setInternalSelectedNFTs] = useState<Set<string>>(new Set());
    const selectedNFTs = externalSelectedNFTs ?? internalSelectedNFTs;
    const setSelectedNFTs = (nfts: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        const newNFTs = typeof nfts === 'function' ? nfts(selectedNFTs) : nfts;
        if (onSelectedNFTsChange) {
            onSelectedNFTsChange(newNFTs);
        } else {
            setInternalSelectedNFTs(newNFTs);
        }
    };
    const [pricingType, setPricingType] = useState<'fixed' | 'variable'>('fixed');
    const [notWhitelistedCollections, setNotWhitelistedCollections] = useState<Array<{ address: string, name?: string }>>([]);

    const form = useForm({
        initialValues: {
            fixedPrice: '',
            startPrice: '',
            endPrice: '',
            currency: 'ETH' as 'ETH' | 'USDC',
            description: ''
        },
        validate: (values) => {
            const errors: Record<string, string> = {};

            if (selectedNFTs.size === 0) {
                errors.selection = 'Bitte wählen Sie mindestens einen NFT aus';
            }

            if (pricingType === 'fixed') {
                if (!values.fixedPrice || parseFloat(values.fixedPrice) <= 0) {
                    errors.fixedPrice = 'Bitte geben Sie einen gültigen Preis ein';
                }
            } else {
                if (!values.startPrice || parseFloat(values.startPrice) <= 0) {
                    errors.startPrice = 'Bitte geben Sie einen Start-Preis ein';
                }
                if (!values.endPrice || parseFloat(values.endPrice) <= 0) {
                    errors.endPrice = 'Bitte geben Sie einen End-Preis ein';
                }
                if (values.startPrice && values.endPrice && parseFloat(values.endPrice) <= parseFloat(values.startPrice)) {
                    errors.endPrice = 'End-Preis muss höher als Start-Preis sein';
                }
            }

            if (!values.description.trim()) {
                errors.description = 'Bitte fügen Sie eine Beschreibung hinzu';
            }

            return errors;
        },
        onSubmit: (values) => {
            const selected = userNFTs.filter(nft => selectedNFTs.has(nft.key));
            onSubmit({
                selectedNFTs: selected,
                pricingType,
                fixedPrice: pricingType === 'fixed' ? values.fixedPrice : undefined,
                startPrice: pricingType === 'variable' ? values.startPrice : undefined,
                endPrice: pricingType === 'variable' ? values.endPrice : undefined,
                currency: values.currency,
                description: values.description
            });
        }
    });

    // Filter NFTs by contract address
    const filteredNFTs = useMemo(() => {
        if (!contractFilter.trim()) return userNFTs;
        const filter = contractFilter.toLowerCase();
        return userNFTs.filter(nft =>
            nft.contractAddress.toLowerCase().includes(filter) ||
            nft.core.contractName?.toLowerCase().includes(filter) ||
            nft.core.contractSymbol?.toLowerCase().includes(filter)
        );
    }, [userNFTs, contractFilter]);

    // Group NFTs by collection
    const nftsByCollection = useMemo(() => {
        const groups = new Map<string, AggregatedNFT[]>();
        filteredNFTs.forEach(nft => {
            const key = nft.contractAddress;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(nft);
        });
        return groups;
    }, [filteredNFTs]);

    const handleSelectNFT = (nftKey: string) => {
        const newSelected = new Set(selectedNFTs);
        if (newSelected.has(nftKey)) {
            newSelected.delete(nftKey);
        } else {
            newSelected.add(nftKey);
        }
        setSelectedNFTs(newSelected);
    };

    const handleSelectAllInCollection = (contractAddress: string) => {
        const nftsInCollection = nftsByCollection.get(contractAddress) || [];
        const allSelected = nftsInCollection.every(nft => selectedNFTs.has(nft.key));

        const newSelected = new Set(selectedNFTs);
        nftsInCollection.forEach(nft => {
            if (allSelected) {
                newSelected.delete(nft.key);
            } else {
                newSelected.add(nft.key);
            }
        });
        setSelectedNFTs(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedNFTs.size === filteredNFTs.length) {
            setSelectedNFTs(new Set());
        } else {
            setSelectedNFTs(new Set(filteredNFTs.map(nft => nft.key)));
        }
    };

    // Check whitelist status for selected NFTs
    useEffect(() => {
        const checkWhitelist = async () => {
            const selectedNFTsList = Array.from(selectedNFTs)
                .map(key => userNFTs.find(nft => nft.key === key))
                .filter(Boolean) as AggregatedNFT[];

            console.log('🔍 Checking whitelist for selected NFTs:', selectedNFTsList.length);

            // Get unique collections
            const uniqueCollections = new Map<string, string | undefined>();
            selectedNFTsList.forEach(nft => {
                uniqueCollections.set(nft.contractAddress, nft.core.contractName || undefined);
            });

            console.log('📋 Unique collections to check:', Array.from(uniqueCollections.keys()));

            // Check each collection
            const notWhitelisted: Array<{ address: string, name?: string }> = [];
            for (const [address, name] of uniqueCollections) {
                try {
                    console.log('🔎 Checking collection:', address, name);
                    const response = await fetch('/api/marketplace/whitelist-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            marketplaceAddress,
                            collectionAddress: address
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Full response for', address, ':', JSON.stringify(result, null, 2));
                        console.log('✅ result.data:', result.data);
                        console.log('✅ result.data?.isWhitelisted:', result.data?.isWhitelisted);
                        console.log('✅ result.isWhitelisted:', result.isWhitelisted);

                        // API returns { success: true, data: { isWhitelisted: boolean } }
                        const isWhitelisted = result.data?.isWhitelisted ?? result.isWhitelisted;
                        console.log('✅ Final isWhitelisted value:', isWhitelisted, 'Type:', typeof isWhitelisted);

                        if (!isWhitelisted) {
                            console.log('❌ Adding to notWhitelisted:', address);
                            notWhitelisted.push({ address, name });
                        } else {
                            console.log('✅ Collection IS whitelisted, skipping:', address);
                        }
                    } else {
                        // Development: Bei Fehler annehmen dass whitelisted (optimistisch)
                        console.warn('⚠️ Whitelist check failed (assuming whitelisted for development):', response.status);
                        // Skip - assume whitelisted
                    }
                } catch (error) {
                    // Development: Bei Fehler annehmen dass whitelisted (optimistisch)
                    console.warn('⚠️ Whitelist check error (assuming whitelisted for development):', error);
                    // Skip - assume whitelisted
                }
            }

            console.log('⚠️ Not whitelisted collections:', notWhitelisted);
            console.log('⚠️ Setting notWhitelistedCollections state to:', notWhitelisted.length, 'items');
            setNotWhitelistedCollections(notWhitelisted);
        };

        if (selectedNFTs.size > 0) {
            console.log('🚀 Starting whitelist check for', selectedNFTs.size, 'NFTs');
            checkWhitelist();
        } else {
            console.log('🚀 No NFTs selected, clearing whitelist warnings');
            setNotWhitelistedCollections([]);
        }
    }, [selectedNFTs, userNFTs, marketplaceAddress]);

    // Calculate price for each NFT based on pricing strategy
    const calculatePrice = (index: number, total: number): string => {
        if (pricingType === 'fixed') {
            return form.values.fixedPrice;
        }
        const start = parseFloat(form.values.startPrice) || 0;
        const end = parseFloat(form.values.endPrice) || 0;
        if (total === 1) return start.toFixed(4);
        const increment = (end - start) / (total - 1);
        return (start + increment * index).toFixed(4);
    };

    const selectedNFTsList = useMemo(() => {
        return userNFTs
            .filter(nft => selectedNFTs.has(nft.key))
            .sort((a, b) => {
                // Sort by contract address first, then by tokenId
                if (a.contractAddress !== b.contractAddress) {
                    return a.contractAddress.localeCompare(b.contractAddress);
                }
                return BigInt(a.tokenId) > BigInt(b.tokenId) ? 1 : -1;
            });
    }, [userNFTs, selectedNFTs]);

    return (
        <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Batch-Listing
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Wählen Sie mehrere NFTs aus und listen Sie sie gleichzeitig
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    ← Zurück
                </button>
            </div>

            {/* Whitelist Warning */}
            {notWhitelistedCollections.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-yellow-900">
                                {notWhitelistedCollections.length} Collection(s) Not Whitelisted
                            </h3>
                            <p className="text-sm text-yellow-800 mt-1">
                                The following collections are not approved for listing on the marketplace:
                            </p>
                            <ul className="mt-2 text-xs text-yellow-700 space-y-2">
                                {notWhitelistedCollections.map(({ address, name }) => (
                                    <li key={address} className="flex items-center gap-2">
                                        <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                                            {address.slice(0, 8)}...{address.slice(-6)}
                                        </span>
                                        {name && <span className="font-medium">({name})</span>}
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(address);
                                                alert('Collection address copied!');
                                            }}
                                            className="text-yellow-900 hover:text-yellow-700 underline"
                                        >
                                            Copy
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-yellow-700 mt-3">
                                Only verified collections can be listed for security reasons. Please remove these NFTs from your selection or contact the marketplace admin to request approval.
                            </p>
                            <div className="mt-3">
                                <a
                                    href="/admin/marketplace"
                                    className="text-xs font-medium text-yellow-900 hover:text-yellow-700 underline"
                                >
                                    Go to Admin Panel
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NFT Selection */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT-Auswahl</h3>

                    {/* Collection Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nach Collection filtern
                        </label>
                        <input
                            type="text"
                            value={contractFilter}
                            onChange={(e) => setContractFilter(e.target.value)}
                            placeholder="Contract-Adresse, Name oder Symbol..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm"
                        />
                    </div>

                    {/* Select All Button */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                            {selectedNFTs.size} von {filteredNFTs.length} ausgewählt
                        </span>
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {selectedNFTs.size === filteredNFTs.length ? 'Alle abwählen' : 'Alle auswählen'}
                        </button>
                    </div>

                    {(form.errors as any).selection && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {(form.errors as any).selection}
                        </div>
                    )}

                    {/* NFTs grouped by collection */}
                    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                        {Array.from(nftsByCollection.entries()).map(([contractAddress, nfts]) => {
                            if (nfts.length === 0) return null;
                            const collection = nfts[0];
                            if (!collection) return null;
                            const allSelected = nfts.every(nft => selectedNFTs.has(nft.key));
                            const someSelected = nfts.some(nft => selectedNFTs.has(nft.key));

                            return (
                                <div key={contractAddress} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                                    {/* Collection Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">
                                                {collection.core.contractName || collection.core.contractSymbol || 'Unnamed Collection'}
                                            </h4>
                                            <p className="text-xs text-gray-500 truncate">
                                                {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllInCollection(contractAddress)}
                                            className="ml-2 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            {allSelected ? 'Alle abwählen' : `Alle ${nfts.length}`}
                                        </button>
                                    </div>

                                    {/* NFTs Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {nfts.map((nft) => (
                                            <div
                                                key={nft.key}
                                                onClick={() => handleSelectNFT(nft.key)}
                                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedNFTs.has(nft.key)
                                                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                                                    : 'border-transparent hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="aspect-square bg-gray-200">
                                                    <OptimizedNFTImage
                                                        imageUrl={nft.meta?.image || ''}
                                                        tokenId={nft.tokenId}
                                                        alt={nft.meta?.name || `#${nft.tokenId}`}
                                                        className="w-full h-full object-cover"
                                                        width={100}
                                                        height={100}
                                                    />
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                    <p className="text-xs text-white font-medium truncate">
                                                        #{nft.tokenId}
                                                    </p>
                                                </div>
                                                {selectedNFTs.has(nft.key) && (
                                                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pricing Configuration - Only show when NFTs are selected */}
                {selectedNFTs.size > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preis-Konfiguration</h3>

                    {/* Pricing Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Preis-Strategie
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPricingType('fixed')}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${pricingType === 'fixed'
                                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                    }`}
                            >
                                <div className="text-center">
                                    <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'fixed' ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-10 5h10" />
                                    </svg>
                                    <span className={`text-sm font-medium ${pricingType === 'fixed' ? 'text-blue-900' : 'text-gray-700'}`}>
                                        Fester Preis
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPricingType('variable')}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${pricingType === 'variable'
                                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md'
                                    : 'border-gray-200 hover:border-green-300 bg-white'
                                    }`}
                            >
                                <div className="text-center">
                                    <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'variable' ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${pricingType === 'variable' ? 'text-green-900' : 'text-gray-700'}`}>
                                        Variable Preise
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Fixed Price */}
                    {pricingType === 'fixed' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preis für alle NFTs *
                            </label>
                            <div className="flex">
                                <input
                                    type="number"
                                    step="0.0001"
                                    {...form.getFieldProps('fixedPrice')}
                                    className={`flex-1 rounded-l-lg border ${form.hasError('fixedPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm`}
                                    placeholder="0.00"
                                />
                                <select
                                    {...form.getFieldProps('currency')}
                                    className="rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm"
                                >
                                    <option value="ETH">ETH</option>
                                    <option value="USDC">USDC</option>
                                </select>
                            </div>
                            {form.hasError('fixedPrice') && (
                                <p className="mt-1 text-sm text-red-600">{form.getFieldError('fixedPrice')}</p>
                            )}
                        </div>
                    )}

                    {/* Variable Price */}
                    {pricingType === 'variable' && (
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start-Preis (Erster NFT) *
                                </label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...form.getFieldProps('startPrice')}
                                        className={`flex-1 rounded-l-lg border ${form.hasError('startPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm`}
                                        placeholder="1.00"
                                    />
                                    <select
                                        {...form.getFieldProps('currency')}
                                        className="rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm"
                                    >
                                        <option value="ETH">ETH</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                {form.hasError('startPrice') && (
                                    <p className="mt-1 text-sm text-red-600">{form.getFieldError('startPrice')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End-Preis (Letzter NFT) *
                                </label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...form.getFieldProps('endPrice')}
                                        className={`flex-1 rounded-l-lg border ${form.hasError('endPrice') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm`}
                                        placeholder="10.00"
                                    />
                                    <div className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                        {form.values.currency}
                                    </div>
                                </div>
                                {form.hasError('endPrice') && (
                                    <p className="mt-1 text-sm text-red-600">{form.getFieldError('endPrice')}</p>
                                )}
                            </div>

                            {/* Price Preview */}
                            {form.values.startPrice && form.values.endPrice && selectedNFTs.size > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 rounded-lg p-3 border">
                                    <p className="text-xs font-medium text-green-900 mb-2">Preis-Vorschau:</p>
                                    <div className="space-y-1 text-xs text-green-800">
                                        {/* NFT List with individual prices */}
                                        <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                                            {selectedNFTsList.map((nft, idx) => (
                                                <div key={nft.key} className="flex justify-between items-center py-0.5">
                                                    <span className="truncate flex-1">
                                                        {nft.meta?.name || `NFT #${nft.tokenId}`}
                                                    </span>
                                                    <span className="font-semibold ml-2">
                                                        {calculatePrice(idx, selectedNFTsList.length)} {form.values.currency}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 border-t border-green-300 flex justify-between font-semibold">
                                            <span>Gesamt ({selectedNFTs.size} NFTs):</span>
                                            <span>
                                                {selectedNFTsList.reduce((sum, _, idx) => {
                                                    return sum + parseFloat(calculatePrice(idx, selectedNFTsList.length));
                                                }, 0).toFixed(4)} {form.values.currency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beschreibung *
                        </label>
                        <textarea
                            {...form.getFieldProps('description')}
                            rows={3}
                            className={`w-full rounded-xl border ${form.hasError('description') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm`}
                            placeholder="Beschreiben Sie Ihre Batch-Listings..."
                        />
                        {form.hasError('description') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('description')}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={selectedNFTs.size === 0}
                        className="w-full px-6 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {selectedNFTs.size > 0
                            ? `${selectedNFTs.size} NFT${selectedNFTs.size > 1 ? 's' : ''} listen`
                            : 'NFTs auswählen'
                        }
                    </button>
                </div>
                )}
            </div>
        </form>
    );
}

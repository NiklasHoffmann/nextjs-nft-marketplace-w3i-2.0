"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminNFTInsight, AdminCollectionInsight } from '@/types';
import {
    useNFTInsights,
    useCollectionInsights,
    useAdminNFTInsights,
    useAdminCollectionInsights
} from '@/hooks/nfts/04-detail-useNFTInsights';
import { canEditInsights, getInsightsAccessMessage, getAdminAddressesList } from '@/utils/insights-access';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Predefined options (moved outside component to avoid re-creation)
const CATEGORIES = [
    'Art', 'Gaming', 'Music', 'Sports', 'Collectibles',
    'Photography', 'Utility', 'Metaverse', 'PFP', 'Other'
];

const COMMON_TAGS = [
    'Blue Chip', 'Emerging', 'Utility Token', 'Gaming', 'Metaverse',
    'Art', 'Music', 'Sports', 'Limited Edition', 'Collaboration',
    'Animated', 'High Quality', 'Community Driven', 'Roadmap Strong'
];

interface FormData {
    // NFT Identification
    contractAddress: string;
    tokenId: string;

    // Basic Information
    title: string;
    description: string;

    // Project/Product Information  
    projectName: string;
    projectDescription: string;
    projectWebsite: string;
    projectTwitter: string;
    projectDiscord: string;

    // Partnerships
    partnerships: string[];
    partnershipDetails: string;

    // Classification
    category: string;
    tags: string[];

    // Ratings
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | '';
}

export default function InsightsPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-32">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading insights dashboard...</p>
                </div>
            </div>
        );
    }

    return <InsightsPageContent />;
}

function InsightsPageContent() {
    const { address, isConnected } = useAccount();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'nft' | 'collection'>('nft');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [insightsId, setInsightsId] = useState<string | null>(null);

    // Check access permissions
    const canEdit = canEditInsights(address);
    const accessMessage = getInsightsAccessMessage(address);
    const adminAddresses = getAdminAddressesList();

    const [formData, setFormData] = useState<FormData>({
        contractAddress: '',
        tokenId: '',
        title: '',
        description: '',
        projectName: '',
        projectDescription: '',
        projectWebsite: '',
        projectTwitter: '',
        projectDiscord: '',
        partnerships: [],
        partnershipDetails: '',
        category: '',
        tags: [],
        rarity: ''
    });

    // Use hooks for insights data and admin operations
    const {
        insights: nftInsights,
        loading: nftLoading,
        refetch: refetchNftInsights
    } = useNFTInsights({
        contractAddress: formData.contractAddress,
        tokenId: formData.tokenId,
        autoFetch: activeTab === 'nft' && !!formData.contractAddress && !!formData.tokenId
    });

    const {
        insights: collectionInsights,
        loading: collectionLoading,
        refetch: refetchCollectionInsights
    } = useCollectionInsights({
        contractAddress: formData.contractAddress,
        autoFetch: activeTab === 'collection' && !!formData.contractAddress
    });

    // Admin operations hooks
    const { create: createNFTInsights, update: updateNFTInsights } = useAdminNFTInsights();
    const { create: createCollectionInsights, update: updateCollectionInsights } = useAdminCollectionInsights();

    // Combine loading states and insights
    const insightsLoading = activeTab === 'nft' ? nftLoading : collectionLoading;
    const adminInsights = activeTab === 'nft' ? nftInsights : collectionInsights;

    // Pre-fill form from URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const contractAddress = urlParams.get('contractAddress');
            const tokenId = urlParams.get('tokenId');

            if (contractAddress || tokenId) {
                setFormData(prev => ({
                    ...prev,
                    contractAddress: contractAddress || prev.contractAddress,
                    tokenId: tokenId || prev.tokenId
                }));
            }
        }
    }, []);

    // Load existing admin insights into form when insights are fetched
    useEffect(() => {
        if (adminInsights && !insightsLoading) {
            setIsEditMode(true);
            setInsightsId(adminInsights._id?.toString() || null);

            setFormData(prev => ({
                ...prev,
                title: adminInsights.title || '',
                description: adminInsights.description || '',
                category: adminInsights.category || '',
                tags: adminInsights.tags || [],
                rarity: adminInsights.rarity || '',
                // Project/Product Information
                projectName: adminInsights.projectName || '',
                projectDescription: adminInsights.projectDescription || '',
                projectWebsite: adminInsights.projectWebsite || '',
                projectTwitter: adminInsights.projectTwitter || '',
                projectDiscord: adminInsights.projectDiscord || '',
                // Partnerships
                partnerships: adminInsights.partnerships || [],
                partnershipDetails: adminInsights.partnershipDetails || ''
            }));

            setSuccessMessage('');
            setErrorMessage('');
        } else if (!insightsLoading && formData.contractAddress && (activeTab === 'collection' || formData.tokenId)) {
            // No existing admin insights found, ensure we're in create mode
            setIsEditMode(false);
            setInsightsId(null);
        }
    }, [adminInsights, insightsLoading, formData.contractAddress, formData.tokenId]);

    // No need for manual fetch useEffect since hooks handle auto-fetch
    // The hooks will automatically refetch when contractAddress/tokenId change

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTagToggle = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const handlePartnershipToggle = (partnership: string) => {
        setFormData(prev => ({
            ...prev,
            partnerships: prev.partnerships.includes(partnership)
                ? prev.partnerships.filter(p => p !== partnership)
                : [...prev.partnerships, partnership]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            if (activeTab === 'nft') {
                if (!formData.contractAddress || !formData.tokenId) {
                    throw new Error('Contract address and token ID are required');
                }

                if (isEditMode && insightsId) {
                    // Update existing insights using hook
                    const updateData = {
                        contractAddress: formData.contractAddress,
                        tokenId: formData.tokenId,
                        title: formData.title || undefined,
                        description: formData.description || undefined,
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        projectName: formData.projectName || undefined,
                        projectDescription: formData.projectDescription || undefined,
                        projectWebsite: formData.projectWebsite || undefined,
                        projectTwitter: formData.projectTwitter || undefined,
                        projectDiscord: formData.projectDiscord || undefined,
                        partnerships: formData.partnerships,
                        partnershipDetails: formData.partnershipDetails || undefined
                    };

                    await updateNFTInsights(updateData);
                    setSuccessMessage('Admin NFT insights updated successfully!');

                } else {
                    // Create new insights using hook
                    const requestData = {
                        contractAddress: formData.contractAddress.toLowerCase(),
                        tokenId: formData.tokenId,
                        title: formData.title || '',
                        description: formData.description || '',
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        projectName: formData.projectName || undefined,
                        projectDescription: formData.projectDescription || undefined,
                        projectWebsite: formData.projectWebsite || undefined,
                        projectTwitter: formData.projectTwitter || undefined,
                        projectDiscord: formData.projectDiscord || undefined,
                        partnerships: formData.partnerships,
                        partnershipDetails: formData.partnershipDetails || undefined,
                        createdBy: address || ''
                    };

                    await createNFTInsights(requestData);
                    setSuccessMessage('Admin NFT insights created successfully!');
                }
            } else if (activeTab === 'collection') {
                // Collection insights logic using hooks
                if (!formData.contractAddress) {
                    throw new Error('Contract address is required for collection insights');
                }

                if (isEditMode && insightsId) {
                    // Update existing collection insights using hook
                    const updateData = {
                        contractAddress: formData.contractAddress,
                        title: formData.title || undefined,
                        description: formData.description || undefined,
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        projectName: formData.projectName || undefined,
                        projectDescription: formData.projectDescription || undefined,
                        projectWebsite: formData.projectWebsite || undefined,
                        projectTwitter: formData.projectTwitter || undefined,
                        projectDiscord: formData.projectDiscord || undefined,
                        partnerships: formData.partnerships,
                        partnershipDetails: formData.partnershipDetails || undefined
                    };

                    await updateCollectionInsights(updateData);
                    setSuccessMessage('Collection insights updated successfully!');

                } else {
                    // Create new collection insights using hook
                    const requestData = {
                        contractAddress: formData.contractAddress.toLowerCase(),
                        title: formData.title || undefined,
                        description: formData.description || undefined,
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        projectName: formData.projectName || undefined,
                        projectDescription: formData.projectDescription || undefined,
                        projectWebsite: formData.projectWebsite || undefined,
                        projectTwitter: formData.projectTwitter || undefined,
                        projectDiscord: formData.projectDiscord || undefined,
                        partnerships: formData.partnerships,
                        partnershipDetails: formData.partnershipDetails || undefined,
                        createdBy: address || ''
                    };

                    await createCollectionInsights(requestData);
                    setSuccessMessage('Collection insights created successfully!');
                }
            }

            // Only reset form after successful creation, not after update
            if (!isEditMode) {
                setFormData({
                    contractAddress: '',
                    tokenId: '',
                    title: '',
                    description: '',
                    projectName: '',
                    projectDescription: '',
                    projectWebsite: '',
                    projectTwitter: '',
                    projectDiscord: '',
                    partnerships: [],
                    partnershipDetails: '',
                    category: '',
                    tags: [],
                    rarity: ''
                });
                setIsEditMode(false);
                setInsightsId(null);
                // Clear data by re-triggering hooks with empty contract address
                // The hooks will automatically clear their state when the contractAddress changes
            }

        } catch (error) {
            console.error('Submit error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-32">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Wallet not connected</h1>
                    <p className="text-gray-600 mb-6">Please connect your wallet to access NFT insights.</p>
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

    // Show access denied message if user cannot edit
    if (!canEdit) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT Insights</h1>
                        <p className="text-gray-600">Add detailed information and analysis for your NFTs and collections</p>
                    </div>

                    {/* Access Denied Card */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-yellow-800 mb-4">Access Restricted</h2>
                        <p className="text-yellow-700 mb-6 max-w-2xl mx-auto">
                            {accessMessage}
                        </p>

                        <div className="bg-yellow-100 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Authorized Addresses:</h3>
                            <div className="space-y-1">
                                {adminAddresses.length > 0 ? (
                                    adminAddresses.map((addr, index) => (
                                        <div key={index} className="font-mono text-xs text-yellow-700 bg-yellow-200 rounded px-2 py-1">
                                            {addr}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-yellow-600">No authorized addresses configured</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Browse NFTs
                            </Link>
                            <Link
                                href="/wallet"
                                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                View Wallet
                            </Link>
                        </div>

                        {/* Contact Information */}
                        <div className="mt-8 pt-6 border-t border-yellow-300">
                            <p className="text-sm text-yellow-600">
                                Need access? Contact the administrator or check your wallet permissions.
                            </p>
                            <p className="text-xs text-yellow-500 mt-2">
                                Your address: <span className="font-mono">{address}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">NFT Insights</h1>
                    <p className="text-gray-600">Add detailed information and analysis for your NFTs and collections</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
                    <button
                        onClick={() => {
                            setActiveTab('nft');
                            // Clear form when switching modes
                            setFormData(prev => ({ ...prev, tokenId: '' }));
                            // Hooks will automatically refetch data when needed
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'nft'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        NFT Insights
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('collection');
                            // Clear form when switching modes
                            setFormData(prev => ({ ...prev, tokenId: '' }));
                            // Hooks will automatically refetch data when needed
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'collection'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Collection Analysis
                    </button>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="ml-3 text-sm text-green-700">{successMessage}</p>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="ml-3 text-sm text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-lg">
                    {/* Form Header with Action Buttons */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {isEditMode ? `Edit ${activeTab === 'nft' ? 'NFT' : 'Collection'} Insights` : `Add New ${activeTab === 'nft' ? 'NFT' : 'Collection'} Insights`}
                                </h2>
                                {isEditMode && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Editing existing insights for {formData.contractAddress}
                                        {activeTab === 'nft' && formData.tokenId && ` - Token #${formData.tokenId}`}
                                    </p>
                                )}
                            </div>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Reset to create new mode
                                        setFormData({
                                            contractAddress: '',
                                            tokenId: '',
                                            title: '',
                                            description: '',
                                            projectName: '',
                                            projectDescription: '',
                                            projectWebsite: '',
                                            projectTwitter: '',
                                            projectDiscord: '',
                                            partnerships: [],
                                            partnershipDetails: '',
                                            category: '',
                                            tags: [],
                                            rarity: ''
                                        });
                                        setIsEditMode(false);
                                        setInsightsId(null);
                                        // Hooks will automatically handle data refresh
                                        setSuccessMessage('');
                                        setErrorMessage('');
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Create New Entry
                                </button>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* NFT/Collection Identification */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {activeTab === 'nft' ? 'NFT Identification' : 'Collection Identification'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contract Address *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contractAddress}
                                        onChange={(e) => handleInputChange('contractAddress', e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                {activeTab === 'nft' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Token ID *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tokenId}
                                            onChange={(e) => handleInputChange('tokenId', e.target.value)}
                                            placeholder="123"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            {activeTab === 'collection' && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Collection insights apply to all NFTs in this collection
                                </p>
                            )}
                        </div>

                        {/* Basic Information */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Admin title for this NFT"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Admin description about this NFT..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Project/Product Information */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Projekt & Produkt</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Projektname
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.projectName}
                                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                                        placeholder="Name des Projekts oder Produkts"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Projekt Beschreibung
                                    </label>
                                    <textarea
                                        value={formData.projectDescription}
                                        onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                                        placeholder="Detaillierte Beschreibung des Projekts..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.projectWebsite}
                                            onChange={(e) => handleInputChange('projectWebsite', e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Twitter
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.projectTwitter}
                                            onChange={(e) => handleInputChange('projectTwitter', e.target.value)}
                                            placeholder="https://twitter.com/username"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Discord
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.projectDiscord}
                                            onChange={(e) => handleInputChange('projectDiscord', e.target.value)}
                                            placeholder="https://discord.gg/invite"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Partnerships */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🤝 Partnerschaften</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Partner
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {['OpenSea', 'Coinbase', 'Binance', 'FTX', 'Rarible', 'SuperRare', 'Foundation', 'LooksRare', 'Magic Eden', 'Blur', 'Nike', 'Adidas', 'Puma', 'Louis Vuitton', 'Gucci', 'Disney', 'Warner Bros', 'Universal', 'Sony', 'Microsoft', 'Meta', 'Google', 'Apple', 'Other'].map(partner => (
                                            <label key={partner} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.partnerships.includes(partner)}
                                                    onChange={() => handlePartnershipToggle(partner)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                                />
                                                <span className="text-sm text-gray-700">{partner}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Partnership Details
                                    </label>
                                    <textarea
                                        value={formData.partnershipDetails}
                                        onChange={(e) => handleInputChange('partnershipDetails', e.target.value)}
                                        placeholder="Details zu den Partnerschaften und Kooperationen..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map((category: string) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {COMMON_TAGS.map((tag: string) => (
                                            <label key={tag} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tags.includes(tag)}
                                                    onChange={() => handleTagToggle(tag)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                                />
                                                <span className="text-sm text-gray-700">{tag}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ratings and Assessment */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings & Assessment</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rarity
                                    </label>
                                    <select
                                        value={formData.rarity}
                                        onChange={(e) => handleInputChange('rarity', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select rarity</option>
                                        <option value="common">Common</option>
                                        <option value="uncommon">Uncommon</option>
                                        <option value="rare">Rare</option>
                                        <option value="epic">Epic</option>
                                        <option value="legendary">Legendary</option>
                                    </select>
                                </div>
                            </div>
                        </div>


                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.contractAddress || (activeTab === 'nft' && !formData.tokenId)}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        {activeTab === 'nft' ? 'Saving NFT Insights...' : 'Saving Collection Insights...'}
                                    </>
                                ) : (
                                    activeTab === 'nft' ? 'Save NFT Insights' : 'Save Collection Insights'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/wallet"
                            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">View Wallet</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Browse NFTs</span>
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Reset Form</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
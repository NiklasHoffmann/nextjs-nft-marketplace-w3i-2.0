"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    CreateNFTInsightsRequest,
    UpdateNFTInsightsRequest
} from '@/types/insights';
import { useNFTInsights } from '@/hooks/useNFTInsights';
import { canEditInsights, getInsightsAccessMessage, getAdminAddressesList } from '@/utils/insights-access';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

interface FormData {
    // NFT Identification
    contractAddress: string;
    tokenId: string;

    // Basic Information
    title: string;
    description: string;
    customName: string;

    // Classification
    category: string;
    tags: string[];

    // Ratings
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | '';
    quality: number;
    personalRating: number;

    // Investment Data
    purchasePrice: string;
    purchaseDate: string;
    targetSellPrice: string;
    marketAnalysis: string;

    // Flags
    isWatchlisted: boolean;
    isFavorite: boolean;
    isForSale: boolean;
    isPrivate: boolean;

    // Strategy
    strategy: 'hold' | 'flip' | 'trade' | 'collect' | '';
    investmentGoal: string;
    riskLevel: 'low' | 'medium' | 'high' | '';
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
    // const canView = canViewInsights(address);
    const accessMessage = getInsightsAccessMessage(address);
    const adminAddresses = getAdminAddressesList();

    const [formData, setFormData] = useState<FormData>({
        contractAddress: '',
        tokenId: '',
        title: '',
        description: '',
        customName: '',
        category: '',
        tags: [],
        rarity: '',
        quality: 5,
        personalRating: 3,
        purchasePrice: '',
        purchaseDate: '',
        targetSellPrice: '',
        marketAnalysis: '',
        isWatchlisted: false,
        isFavorite: false,
        isForSale: false,
        isPrivate: false,
        strategy: '',
        investmentGoal: '',
        riskLevel: ''
    });

    // Load existing insights when contractAddress and tokenId are available
    const { insights, loading: insightsLoading, update } = useNFTInsights({
        contractAddress: formData.contractAddress || undefined,
        tokenId: formData.tokenId || undefined,
        autoFetch: !!(formData.contractAddress && formData.tokenId)
    });

    // Predefined options
    const categories = [
        'Art', 'Gaming', 'Music', 'Sports', 'Collectibles',
        'Photography', 'Utility', 'Metaverse', 'PFP', 'Other'
    ];

    const commonTags = [
        'Blue Chip', 'Emerging', 'Utility Token', 'Gaming', 'Metaverse',
        'Art', 'Music', 'Sports', 'Limited Edition', 'Collaboration',
        'Animated', 'High Quality', 'Community Driven', 'Roadmap Strong'
    ];

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

    // Load existing insights into form when insights are fetched
    useEffect(() => {
        if (insights && !insightsLoading) {
            setIsEditMode(true);
            setInsightsId(insights._id?.toString() || null);

            setFormData(prev => ({
                ...prev,
                title: insights.title || '',
                description: insights.description || '',
                customName: insights.customName || '',
                category: insights.category || '',
                tags: insights.tags || [],
                rarity: insights.rarity || '',
                quality: insights.quality || 5,
                personalRating: insights.personalRating || 3,
                purchasePrice: insights.purchasePrice?.toString() || '',
                purchaseDate: insights.purchaseDate ? new Date(insights.purchaseDate).toISOString().split('T')[0] : '',
                targetSellPrice: insights.targetSellPrice?.toString() || '',
                marketAnalysis: insights.marketAnalysis || '',
                isWatchlisted: insights.isWatchlisted || false,
                isFavorite: insights.isFavorite || false,
                isForSale: insights.isForSale || false,
                isPrivate: insights.isPrivate || false,
                strategy: insights.strategy || '',
                investmentGoal: insights.investmentGoal || '',
                riskLevel: insights.riskLevel || ''
            }));

            setSuccessMessage('');
            setErrorMessage('');
        } else if (!insightsLoading && formData.contractAddress && formData.tokenId) {
            // No existing insights found, ensure we're in create mode
            setIsEditMode(false);
            setInsightsId(null);
        }
    }, [insights, insightsLoading, formData.contractAddress, formData.tokenId]);

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
                    // Update existing insights
                    const updateData: UpdateNFTInsightsRequest = {
                        _id: insightsId,
                        title: formData.title || undefined,
                        description: formData.description || undefined,
                        customName: formData.customName || undefined,
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        quality: formData.quality,
                        personalRating: formData.personalRating,
                        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
                        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                        targetSellPrice: formData.targetSellPrice ? parseFloat(formData.targetSellPrice) : undefined,
                        marketAnalysis: formData.marketAnalysis || undefined,
                        isWatchlisted: formData.isWatchlisted,
                        isFavorite: formData.isFavorite,
                        isForSale: formData.isForSale,
                        isPrivate: formData.isPrivate,
                        strategy: formData.strategy || undefined,
                        investmentGoal: formData.investmentGoal || undefined,
                        riskLevel: formData.riskLevel || undefined,
                        updatedBy: address
                    };

                    // Use the update function from the hook
                    await update(updateData);
                    setSuccessMessage('NFT insights updated successfully!');

                } else {
                    // Create new insights
                    const requestData: CreateNFTInsightsRequest = {
                        contractAddress: formData.contractAddress,
                        tokenId: formData.tokenId,
                        title: formData.title || undefined,
                        description: formData.description || undefined,
                        customName: formData.customName || undefined,
                        category: formData.category || undefined,
                        tags: formData.tags,
                        rarity: formData.rarity || undefined,
                        quality: formData.quality,
                        personalRating: formData.personalRating,
                        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
                        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                        targetSellPrice: formData.targetSellPrice ? parseFloat(formData.targetSellPrice) : undefined,
                        marketAnalysis: formData.marketAnalysis || undefined,
                        isWatchlisted: formData.isWatchlisted,
                        isFavorite: formData.isFavorite,
                        isForSale: formData.isForSale,
                        isPrivate: formData.isPrivate,
                        strategy: formData.strategy || undefined,
                        investmentGoal: formData.investmentGoal || undefined,
                        riskLevel: formData.riskLevel || undefined,
                        createdBy: address
                    };

                    const response = await fetch('/api/insights/nft', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestData)
                    });

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.error || 'Failed to save insights');
                    }

                    setSuccessMessage('NFT insights created successfully!');
                }

                // Reset form
                setFormData({
                    contractAddress: '',
                    tokenId: '',
                    title: '',
                    description: '',
                    customName: '',
                    category: '',
                    tags: [],
                    rarity: '',
                    quality: 5,
                    personalRating: 3,
                    purchasePrice: '',
                    purchaseDate: '',
                    targetSellPrice: '',
                    marketAnalysis: '',
                    isWatchlisted: false,
                    isFavorite: false,
                    isForSale: false,
                    isPrivate: false,
                    strategy: '',
                    investmentGoal: '',
                    riskLevel: ''
                });
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
                        onClick={() => setActiveTab('nft')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'nft'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        NFT Insights
                    </button>
                    <button
                        onClick={() => setActiveTab('collection')}
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
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* NFT Identification */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT Identification</h3>
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
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Your custom title for this NFT"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.customName}
                                        onChange={(e) => handleInputChange('customName', e.target.value)}
                                        placeholder="Alternative name for this NFT"
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
                                        placeholder="Your personal notes about this NFT..."
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
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {commonTags.map(tag => (
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quality (1-10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.quality}
                                        onChange={(e) => handleInputChange('quality', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-center text-sm text-gray-600 mt-1">
                                        {formData.quality}/10
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Personal Rating (1-5)
                                    </label>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => handleInputChange('personalRating', rating)}
                                                className={`text-2xl ${rating <= formData.personalRating
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Investment Data */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Data</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Purchase Price (ETH)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={formData.purchasePrice}
                                        onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                        placeholder="0.05"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Sell Price (ETH)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={formData.targetSellPrice}
                                        onChange={(e) => handleInputChange('targetSellPrice', e.target.value)}
                                        placeholder="0.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Strategy
                                    </label>
                                    <select
                                        value={formData.strategy}
                                        onChange={(e) => handleInputChange('strategy', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select strategy</option>
                                        <option value="hold">Hold Long-term</option>
                                        <option value="flip">Quick Flip</option>
                                        <option value="trade">Active Trading</option>
                                        <option value="collect">Collection Building</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Market Analysis
                                </label>
                                <textarea
                                    value={formData.marketAnalysis}
                                    onChange={(e) => handleInputChange('marketAnalysis', e.target.value)}
                                    placeholder="Your market analysis and investment thesis..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Flags and Settings */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flags & Settings</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isWatchlisted}
                                        onChange={(e) => handleInputChange('isWatchlisted', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    <span className="text-sm text-gray-700">Watchlisted</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isFavorite}
                                        onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    <span className="text-sm text-gray-700">Favorite</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isForSale}
                                        onChange={(e) => handleInputChange('isForSale', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    <span className="text-sm text-gray-700">For Sale</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPrivate}
                                        onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    <span className="text-sm text-gray-700">Private</span>
                                </label>
                            </div>
                        </div>

                        {/* Investment Goal */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Goal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Investment Goal
                                    </label>
                                    <textarea
                                        value={formData.investmentGoal}
                                        onChange={(e) => handleInputChange('investmentGoal', e.target.value)}
                                        placeholder="Your investment goal for this NFT..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Risk Level
                                    </label>
                                    <select
                                        value={formData.riskLevel}
                                        onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select risk level</option>
                                        <option value="low">Low Risk</option>
                                        <option value="medium">Medium Risk</option>
                                        <option value="high">High Risk</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.contractAddress || !formData.tokenId}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Saving Insights...
                                    </>
                                ) : (
                                    'Save NFT Insights'
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
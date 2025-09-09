"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import OptimizedNFTImage from '@/components/OptimizedNFTImage';
import { formatEther } from '@/utils/formatters';
import { useETHPrice, useCurrency } from '@/contexts/CurrencyContext';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

interface NFTDetails {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    buyer?: string;
    desiredNftAddress: string;
    desiredTokenId: string;
    metadata?: NFTMetadata;
}

export default function NFTDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedCurrency } = useCurrency();

    const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeTab, setActiveTab] = useState<'project' | 'functionalities' | 'tokenomics'>('project');

    const nftAddress = params.nftAddress as string;
    const tokenId = params.tokenId as string;

    // Use the extended NFT metadata hook
    const {
        data: extendedData,
        name,
        description,
        imageUrl,
        attributes,
        categories,
        tags,
        animationUrl,
        audioUrl,
        videoUrl,
        externalUrl,
        websiteUrl,
        twitterUrl,
        creator,
        collection,
        rarityRank,
        rarityScore,
        contractAddress,
        tokenStandard,
        blockchain,
        loading: metadataLoading,
        error: metadataError,
        // New contract-specific data
        contractName,
        contractSymbol,
        currentOwner,
        totalSupply,
        supportsRoyalty,
        royaltyInfo
    } = useNFTMetadata(nftAddress, tokenId);

    // Get converted price
    const ethPrice = nftDetails ? parseFloat(formatEther(nftDetails.price)) : 0;
    const { convertedPrice, loading: priceLoading } = useETHPrice(ethPrice);

    useEffect(() => {
        const fetchListingData = async () => {
            if (!nftAddress || !tokenId) return;

            try {
                setLoading(true);

                // For now, create mock listing data
                // In a real app, you'd fetch this from your marketplace contract
                const mockNFTDetails: NFTDetails = {
                    listingId: `${nftAddress}-${tokenId}`,
                    nftAddress,
                    tokenId,
                    isListed: true,
                    price: "50000000000000000", // 0.05 ETH in Wei
                    seller: "0x742d35Cc6634C0532925a3b8D0C1C4C9C68F82D4",
                    desiredNftAddress: "0x0000000000000000000000000000000000000000",
                    desiredTokenId: "0"
                };

                setNftDetails(mockNFTDetails);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load NFT details');
            } finally {
                setLoading(false);
            }
        };

        fetchListingData();
    }, [nftAddress, tokenId]);

    const handleBack = () => {
        router.back();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: name || 'NFT',
                    text: description || 'Check out this NFT',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
        // In a real app, you'd save this to a database or local storage
    };

    if (loading || metadataLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading NFT details...</p>
                </div>
            </div>
        );
    }

    if (error || metadataError || !nftDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading NFT</h2>
                    <p className="text-gray-600 mb-4">{error || metadataError || 'NFT not found'}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            {/* Header */}
            <div className="bg-white shadow-sm border-b fixed top-16 left-0 right-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Go back"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {name || `NFT #${tokenId}`}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {contractName || collection || `${nftAddress.slice(0, 6)}...${nftAddress.slice(-4)}`}
                                    {contractSymbol && ` (${contractSymbol})`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleFavorite}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {isFavorited ? (
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Share NFT"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Pills - TEST VERSION */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-8">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Show actual categories if they exist */}
                    {categories.map((cat, index) => (
                        <span key={`cat-${index}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            🏷️ {cat}
                        </span>
                    ))}
                    {tags.map((tag, index) => (
                        <span key={`tag-${index}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            # {tag}
                        </span>
                    ))}

                    {/* Show test categories to verify layout */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        🧪 Test Category
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        📊 Debug: Categories={categories.length}, Tags={tags.length}
                    </span>

                    {/* Like Count */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        ❤️ 23 Likes
                    </span>

                    {/* External Links */}
                    {externalUrl && (
                        <a
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                            🌐 External
                        </a>
                    )}
                    {websiteUrl && (
                        <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                        >
                            🏠 Website
                        </a>
                    )}
                    {twitterUrl && (
                        <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                        >
                            🐦 Twitter
                        </a>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - NFT Information & Details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* NFT Info with Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('project')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'project'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Project
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('functionalities')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'functionalities'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Functionalities
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('tokenomics')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tokenomics'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Tokenomics
                                    </button>
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'project' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Contract Address</label>
                                                <p className="text-sm font-mono text-gray-900 break-all">{nftAddress}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Token ID</label>
                                                <p className="text-sm font-mono text-gray-900">{tokenId}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Collection Name</label>
                                                <p className="text-sm text-gray-900">{contractName || collection || 'Unknown'}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Collection Symbol</label>
                                                <p className="text-sm text-gray-900">{contractSymbol || 'N/A'}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Token Standard</label>
                                                <p className="text-sm text-gray-900">{tokenStandard}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Blockchain</label>
                                                <p className="text-sm text-gray-900">{blockchain}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Total Supply</label>
                                                <p className="text-sm text-gray-900">{totalSupply?.toLocaleString() || 'Unknown'}</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Current Owner</label>
                                                <p className="text-sm font-mono text-gray-900 break-all">
                                                    {currentOwner ? `${currentOwner.slice(0, 6)}...${currentOwner.slice(-4)}` : 'Loading...'}
                                                </p>
                                            </div>

                                            {creator && (
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium text-gray-500">Creator</label>
                                                    <p className="text-sm font-mono text-gray-900 break-all">{creator}</p>
                                                </div>
                                            )}

                                            <div className="md:col-span-2">
                                                <label className="text-sm font-medium text-gray-500">Listed By</label>
                                                <p className="text-sm font-mono text-gray-900 break-all">{nftDetails.seller}</p>
                                            </div>
                                        </div>

                                        {description && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Description</label>
                                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{description}</p>
                                            </div>
                                        )}

                                        {/* Rarity Information */}
                                        {(rarityRank || rarityScore) && (
                                            <div className="border-t pt-4">
                                                <label className="text-sm font-medium text-gray-500">Rarity</label>
                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    {rarityRank && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Rank</p>
                                                            <p className="text-lg font-semibold text-purple-600">#{rarityRank}</p>
                                                        </div>
                                                    )}
                                                    {rarityScore && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Score</p>
                                                            <p className="text-lg font-semibold text-purple-600">{rarityScore}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attributes */}
                                        {attributes && attributes.length > 0 && (
                                            <div className="border-t pt-4">
                                                <label className="text-sm font-medium text-gray-500 mb-3 block">Attributes</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {attributes.map((attr, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                {attr.trait_type}
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-900 mt-1">
                                                                {attr.value}
                                                            </div>
                                                            {attr.display_type && (
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {attr.display_type}
                                                                </div>
                                                            )}
                                                            {attr.max_value && (
                                                                <div className="text-xs text-gray-400">
                                                                    Max: {attr.max_value}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'functionalities' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT Functionalities</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">Tradeable</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">This NFT can be traded on various marketplaces</p>
                                            </div>

                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">Metadata</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">Rich metadata with {attributes?.length || 0} attributes and properties</p>
                                            </div>

                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a3 3 0 003 3h2a3 3 0 003-3V3a2 2 0 012 2v6h-3a3 3 0 00-3 3v3H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">Provenance</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">Immutable ownership history on {blockchain} blockchain</p>
                                            </div>

                                            <div className="bg-orange-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">{tokenStandard} Smart Contract</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">Powered by verified {tokenStandard} smart contract technology</p>
                                            </div>

                                            {supportsRoyalty && (
                                                <div className="bg-yellow-50 rounded-lg p-4">
                                                    <div className="flex items-center mb-2">
                                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="font-medium text-gray-900">EIP-2981 Royalties</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Supports automatic creator royalties ({royaltyInfo?.percentage?.toFixed(2) || '0'}%)
                                                        {royaltyInfo?.receiver && (
                                                            <span className="block mt-1 text-xs font-mono">
                                                                Recipient: {royaltyInfo.receiver.slice(0, 6)}...{royaltyInfo.receiver.slice(-4)}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="bg-indigo-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">Interoperability</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">Compatible with all {tokenStandard} supporting platforms and wallets</p>
                                            </div>

                                            <div className="bg-teal-50 rounded-lg p-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">Transparency</h4>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    All contract interactions are publicly verifiable on the blockchain
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contract Functions Information */}
                                        <div className="border-t pt-6 mt-6">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4">Available Contract Functions</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium text-gray-700">Standard Functions</h5>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span>Transfer</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Approve</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Metadata URI</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Owner Query</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium text-gray-700">Extended Functions</h5>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span>Royalty Info (EIP-2981)</span>
                                                            <span className={supportsRoyalty ? "text-green-600" : "text-gray-400"}>
                                                                {supportsRoyalty ? "✓ Supported" : "✗ Not Supported"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Collection Info</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Total Supply</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Token Exists</span>
                                                            <span className="text-green-600">✓ Supported</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'tokenomics' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tokenomics & Economics</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-blue-600">{formatEther(nftDetails.price)}</div>
                                                <div className="text-sm text-blue-800">Current Price (ETH)</div>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-green-600">{totalSupply?.toLocaleString() || 'N/A'}</div>
                                                <div className="text-sm text-green-800">Total Supply</div>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-purple-600">{rarityRank || 'N/A'}</div>
                                                <div className="text-sm text-purple-800">Rarity Rank</div>
                                            </div>

                                            {supportsRoyalty && royaltyInfo && (
                                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-bold text-yellow-600">{royaltyInfo.percentage?.toFixed(1) || '0'}%</div>
                                                    <div className="text-sm text-yellow-800">Royalty Rate</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="text-md font-semibold text-gray-900">Economic Details</h4>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-600">Token Standard</span>
                                                        <span className="text-sm text-gray-900 font-semibold">{tokenStandard}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-600">Blockchain</span>
                                                        <span className="text-sm text-gray-900">{blockchain}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-600">Collection Size</span>
                                                        <span className="text-sm text-gray-900">{totalSupply?.toLocaleString() || 'Unknown'} items</span>
                                                    </div>

                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm font-medium text-gray-600">Listing Price</span>
                                                        <span className="text-sm text-gray-900 font-bold">{formatEther(nftDetails.price)} ETH</span>
                                                    </div>

                                                    {supportsRoyalty && (
                                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                            <span className="text-sm font-medium text-gray-600">Creator Royalty</span>
                                                            <span className="text-sm text-gray-900">{royaltyInfo?.percentage?.toFixed(2) || '0'}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-md font-semibold text-gray-900">Market Analysis</h4>

                                                <div className="border-l-4 border-blue-500 pl-4 mb-4">
                                                    <h5 className="font-medium text-gray-900">Scarcity</h5>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {totalSupply && totalSupply < 10000
                                                            ? `Limited collection of ${totalSupply.toLocaleString()} items`
                                                            : totalSupply && totalSupply >= 10000
                                                                ? `Large collection of ${totalSupply.toLocaleString()} items`
                                                                : "Collection size determining uniqueness value"
                                                        }
                                                    </p>
                                                </div>

                                                <div className="border-l-4 border-green-500 pl-4 mb-4">
                                                    <h5 className="font-medium text-gray-900">Utility</h5>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {tokenStandard} standard ensures broad wallet and marketplace compatibility
                                                    </p>
                                                </div>

                                                {supportsRoyalty && (
                                                    <div className="border-l-4 border-yellow-500 pl-4">
                                                        <h5 className="font-medium text-gray-900">Creator Economy</h5>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Built-in royalty system ensures ongoing creator compensation at {royaltyInfo?.percentage?.toFixed(1)}% per sale
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ownership Economics */}
                                        <div className="border-t pt-6 mt-6">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4">Ownership Economics</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Current Owner</h5>
                                                    <p className="text-xs font-mono text-gray-600 break-all">
                                                        {currentOwner || 'Loading...'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Verified on-chain ownership
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Transfer Rights</h5>
                                                    <p className="text-sm text-gray-600">
                                                        Full ownership transfer rights via {tokenStandard} standard
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Economic Value</h5>
                                                    <p className="text-sm text-gray-600">
                                                        Market-determined value through trading and scarcity
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Properties (if different from attributes) */}
                        {extendedData?.properties && Object.keys(extendedData.properties).length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
                                <div className="space-y-3">
                                    {Object.entries(extendedData.properties).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                            <span className="text-sm font-medium text-gray-600">{key}</span>
                                            <span className="text-sm text-gray-900">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Swap Target Info */}
                        {nftDetails.desiredNftAddress !== "0x0000000000000000000000000000000000000000" && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-orange-900 mb-4">Swap Target</h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-medium text-orange-700">Desired NFT Address</label>
                                        <p className="text-sm font-mono text-orange-900 break-all">{nftDetails.desiredNftAddress}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-orange-700">Desired Token ID</label>
                                        <p className="text-sm font-mono text-orange-900">#{nftDetails.desiredTokenId}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collection Items List */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">More from this Collection</h3>
                                <div className="text-sm text-gray-500">
                                    {collection || `${nftAddress.slice(0, 6)}...${nftAddress.slice(-4)}`}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Mock collection items - in real app, fetch from API */}
                                {Array.from({ length: 8 }, (_, index) => (
                                    <div key={index} className="group cursor-pointer">
                                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 overflow-hidden group-hover:shadow-lg transition-all duration-200">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="text-center text-gray-400">
                                                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-xs">#{(parseInt(tokenId) + index + 1).toString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {name ? `${name} #${(parseInt(tokenId) + index + 1)}` : `NFT #${(parseInt(tokenId) + index + 1)}`}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Price</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {(parseFloat(formatEther(nftDetails.price)) + (index * 0.01)).toFixed(3)} ETH
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Status</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${index % 3 === 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : index % 3 === 1
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {index % 3 === 0 ? 'Listed' : index % 3 === 1 ? 'Auction' : 'Not Listed'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 text-center">
                                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    View All Collection Items
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Media & Price (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Media Section */}
                        <div className="aspect-square bg-gray-100 rounded-2xl shadow-lg relative p-4 flex items-center justify-center">
                            {animationUrl || videoUrl ? (
                                <div className="bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                                    <video
                                        src={animationUrl || videoUrl || ''}
                                        controls
                                        className="max-w-full max-h-full object-contain rounded-2xl"
                                        poster={imageUrl || undefined}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : imageUrl ? (
                                <div className="bg-white rounded-2xl shadow-lg flex items-center justify-center">
                                    <Image
                                        src={imageUrl}
                                        alt={name || `NFT #${tokenId}`}
                                        width={400}
                                        height={400}
                                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
                                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 30vw"
                                        priority={true}
                                        quality={90}
                                        placeholder="blur"
                                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k="
                                    />
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                                    <div className="text-center text-gray-500">
                                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p>No Media Available</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Price Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Current Price</h2>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${nftDetails.isListed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {nftDetails.isListed ? 'Listed' : 'Not Listed'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {formatEther(nftDetails.price)} ETH
                                    </span>
                                    <span className="text-lg text-gray-500">
                                        ({selectedCurrency.symbol})
                                    </span>
                                </div>
                                {!priceLoading && (
                                    <p className="text-xl text-gray-600">
                                        ≈ {convertedPrice}
                                    </p>
                                )}
                            </div>

                            {nftDetails.isListed && (
                                <div className="mt-6 space-y-3">
                                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                                        Buy Now
                                    </button>
                                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                                        Update
                                    </button>
                                    <button className="w-full border border-red-300 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                                        Cancel Listing
                                    </button>

                                </div>
                            )}
                        </div>

                        {/* Audio Player if available */}
                        {audioUrl && (
                            <div className="bg-white rounded-xl shadow-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Audio</h4>
                                <audio controls className="w-full">
                                    <source src={audioUrl} />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

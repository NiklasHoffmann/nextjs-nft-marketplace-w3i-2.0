"use client";

import React, { useEffect, memo, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';

// Updated imports: Direct NFTContext access
import { useNFTStats, useNFTPriceData, useNFTUserActions } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';

// Validation utilities moved to component level
import { isValidNFTAddress, isValidNFTTokenId } from '@/utils';

import {
    NFTDetailHeader,
    CategoryPills,
    NFTMediaSection,
    NFTPriceCard,
    NewNFTInfoTabs,
    SwapTargetInfo,
    CollectionItemsList,
    LoadingSpinner,
    ManualRefreshControls,
    NFTDetailErrorDisplay
} from '@/components';

// Memoized layout components
const MemoizedNFTDetailHeader = memo(NFTDetailHeader);
const MemoizedCategoryPills = memo(CategoryPills);
const MemoizedNFTMediaSection = memo(NFTMediaSection);
const MemoizedNFTPriceCard = memo(NFTPriceCard);
const MemoizedNewNFTInfoTabs = memo(NewNFTInfoTabs);
const MemoizedSwapTargetInfo = memo(SwapTargetInfo);
const MemoizedCollectionItemsList = memo(CollectionItemsList);

function NFTDetailPage() {
    // SIMPLIFIED: Extract parameters directly in component
    const params = useParams();
    const nftAddress = params.nftAddress as string;
    const tokenId = params.tokenId as string;

    // SIMPLIFIED: Validate parameters directly in component
    const isValidParams = useMemo(() => {
        return isValidNFTAddress(nftAddress) && isValidNFTTokenId(tokenId);
    }, [nftAddress, tokenId]);

    // OPTIMIZED: Use NFTContext directly for insights (no redundant wrapper)
    const nftContext = useNFTContext();
    const nftContextData = nftContext.getNFTDetailData(nftAddress, tokenId);
    const publicInsights = nftContextData?.insights;

    // Load data if not available
    useEffect(() => {
        if (!nftContextData && !nftContext.isDataFresh(nftAddress, tokenId)) {
            nftContext.loadNFTData(nftAddress, tokenId);
        }
    }, [nftContext, nftAddress, tokenId, nftContextData]);

    // OPTIMIZED: Use focused hook only for user actions and UI state
    const {
        activeTab,
        isFavorited,
        isWalletConnected,
        handleBack,
        handleShare,
        toggleFavorite,
        toggleWatchlist,
        setRating,
        handleTabChange,
        userInteractions,
        recordView
    } = useNFTUserActions(nftAddress, tokenId);

    // OPTIMIZED: Get metadata from NFTContext (avoid duplicate calls)
    const metadata = nftContextData?.metadata;
    const imageUrl = nftContextData?.imageUrl;
    const contractInfo = nftContextData?.contractInfo;

    // SIMPLIFIED: Generate mock marketplace data directly with useMemo
    const nftDetails = useMemo(() => {
        if (!isValidParams) return null;
        return {
            listingId: `${nftAddress}-${tokenId}`,
            nftAddress,
            tokenId,
            isListed: true,
            price: nftContextData?.price || null, // 0.05 ETH in Wei
            seller: nftContextData?.owner || null, // Use actual owner from context
            desiredNftAddress: nftContextData?.desiredNftAddress || null,
            desiredTokenId: nftContextData?.desiredTokenId || null
        };
    }, [nftAddress, tokenId, isValidParams]);

    // Use custom hook for price data
    const priceData = useNFTPriceData(nftDetails?.price || null);

    // Use custom hook for NFT stats (Context hook expects 2 parameters)
    const { data: statsData, refresh } = useNFTStats(nftAddress, tokenId);
    const nftStats = {
        stats: statsData?.stats,
        loading: false, // Context handles loading internally
        error: null,
        refetch: refresh // Add refetch function
    };

    // OPTIMIZED: Combined loading and error states
    const isLoading = !nftContextData;
    const error = null; // NFTDetailData doesn't expose errorState - handle via context if needed
    const hasValidData = isValidParams && nftDetails;

    // Debug: Log NFT data sources to identify image loading issues
    console.log('🖼️ Image Loading Debug:', {
        nftContextData: {
            available: !!nftContextData,
            imageUrl: nftContextData?.imageUrl,
            metadata: !!nftContextData?.metadata,
            metadataName: nftContextData?.metadata?.name,
            loading: isLoading
        },
        finalImageUrl: imageUrl,
        isValidParams
    });

    // Use NFTContext data directly
    const finalImageUrl = imageUrl;
    const finalName = metadata?.name || `Token #${tokenId}`;

    // Record view on mount (moved from hook)
    useEffect(() => {
        if (isValidParams && recordView) {
            recordView();
        }
    }, [isValidParams, recordView]);

    // Debug: Log user interactions data (simplified)
    console.log('🐛 NFT Page Debug (Simplified):', {
        nftAddress,
        tokenId,
        userInteractions,
        isWalletConnected,
        hasValidData,
        hasToggleFavorite: !!toggleFavorite,
        hasToggleWatchlist: !!toggleWatchlist,
        hasSetRating: !!setRating
    });

    // Enhanced toggle functions that also update stats
    // NOTE: These are now legacy - NFTStatsContext handles all stats updates automatically
    // Kept for backward compatibility with any remaining legacy components
    const enhancedToggleWatchlist = useCallback(async () => {
        await toggleWatchlist();
        // Force refresh of stats after watchlist change
        await nftStats.refetch();
    }, [toggleWatchlist, nftStats.refetch]);

    const enhancedToggleFavorite = useCallback(async () => {
        await toggleFavorite();
        // Force refresh of stats after favorite change
        await nftStats.refetch();
    }, [toggleFavorite, nftStats.refetch]);

    const enhancedSetRating = useCallback(async (rating: number) => {
        await setRating(rating);
        // Force refresh of stats after rating change
        await nftStats.refetch();
    }, [setRating, nftStats.refetch]);

    // Memoize header props to prevent unnecessary re-renders
    // NOTE: Simplified since NFTDetailHeader now uses NFTStatsContext directly
    const headerProps = useMemo(() => ({
        name: finalName,
        tokenId,
        contractName: contractInfo?.name || null,
        collection: contractInfo?.name || null,
        contractSymbol: contractInfo?.symbol || null,
        nftAddress,
        // Legacy props kept for backward compatibility (context will override these)
        isFavorited: userInteractions?.isFavorite || false,
        onToggleFavorite: enhancedToggleFavorite,
        onShare: handleShare
        // NOTE: Removed individual stats props and user action props
        // NFTDetailHeader now gets all this data from NFTStatsContext
    }), [
        finalName, tokenId, contractInfo?.name,
        contractInfo?.symbol, nftAddress, userInteractions,
        enhancedToggleFavorite, handleShare
    ]);

    // Memoize category pills props with insights
    const categoryPillsProps = useMemo(() => ({
        categories: [], // From NFT metadata - could be enhanced later
        tags: [],
        externalUrl: metadata?.external_url,
        // Use insights data for website/twitter links
        websiteUrl: publicInsights?.projectWebsite || null,
        twitterUrl: publicInsights?.projectTwitter || null,
        // Pass insights for category/tag display
        insights: publicInsights || null,
        insightsLoading: isLoading,
        contractAddress: nftAddress,
        tokenId
    }), [
        metadata?.external_url, nftAddress, tokenId,
        publicInsights, isLoading
    ]);

    // Memoize media section props (FIXED: Better fallback logic for images)
    const mediaSectionProps = useMemo(() => {
        const props = {
            imageUrl: finalImageUrl, // Use consolidated image URL
            animationUrl: metadata?.animation_url, // Use consolidated metadata
            videoUrl: null, // Simplified
            audioUrl: null, // Simplified  
            name: finalName, // Use consolidated name
            tokenId
        };

        // Debug: Log media section props
        console.log('🎬 Media Section Props:', props);

        return props;
    }, [
        finalImageUrl, metadata?.animation_url, finalName, tokenId
    ]);

    // Memoize price card props
    const priceCardProps = useMemo(() => ({
        price: nftDetails?.price || "0",
        isListed: nftDetails?.isListed || false,
        convertedPrice: priceData.convertedPrice,
        priceLoading: priceData.priceLoading,
        selectedCurrencySymbol: priceData.selectedCurrencySymbol
    }), [
        nftDetails?.price, nftDetails?.isListed, priceData.convertedPrice,
        priceData.priceLoading, priceData.selectedCurrencySymbol
    ]);

    // Memoize info tabs props
    const infoTabsProps = useMemo(() => {
        if (!nftDetails) return null;

        return {
            activeTab,
            onTabChange: handleTabChange,
            nftAddress,
            tokenId,
            contractName: contractInfo?.name || null,
            collection: contractInfo?.name || null, // Simplified
            contractSymbol: contractInfo?.symbol || null,
            tokenStandard: 'ERC721', // Simplified
            blockchain: 'Ethereum', // Simplified  
            totalSupply: typeof contractInfo?.totalSupply === 'bigint'
                ? Number(contractInfo.totalSupply)
                : contractInfo?.totalSupply ?? null, // Ensure number | null
            currentOwner: nftContextData?.owner || null, // Use NFTContext owner
            creator: null, // Simplified
            nftDetails,
            description: metadata?.description || '',
            rarityRank: null, // Simplified
            rarityScore: null, // Simplified  
            attributes: metadata?.attributes?.map((attr: { trait_type: string; value: string | number; display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date' }) => ({
                ...attr,
                display_type: attr.display_type as 'boost_number' | 'boost_percentage' | 'number' | 'date' | undefined
            })) || undefined,
            supportsRoyalty: false, // Simplified
            royaltyInfo: null, // Simplified

            // Correct props for NewNFTInfoTabs (with type compatibility)
            publicInsights: publicInsights as any, // Type compatibility: AdminNFTInsight → PublicNFTInsights
            userInteractions: userInteractions as any, // Type compatibility: CombinedUserInteractionData → UserNFTInteractions
            isWalletConnected, // Add wallet connection state
            insightsLoading: isLoading,

            // User action handlers for PersonalTab (legacy compatibility)
            // NOTE: PersonalTab now prefers NFTStatsContext but keeps these for fallback
            onToggleFavorite: enhancedToggleFavorite,
            onToggleWatchlist: enhancedToggleWatchlist,
            onSetRating: enhancedSetRating,

            // Legacy user interaction data (context will override for PersonalTab)
            stats: undefined, // PersonalTab gets stats from NFTStatsContext
            userRating: userInteractions?.rating || 0,
            isWatchlisted: userInteractions?.isWatchlisted || false,
            isFavorited: userInteractions?.isFavorite || false,
            adminInsights: publicInsights, // For tabs that specifically need AdminNFTInsight
            collectionInsights: null, // Not available in simplified structure
            adminInsightsLoading: isLoading
        };
    }, [
        activeTab, handleTabChange, nftAddress, tokenId, contractInfo, metadata, nftDetails,
        userInteractions, publicInsights, isLoading, enhancedToggleFavorite, enhancedToggleWatchlist, enhancedSetRating,
        isWalletConnected, nftContextData?.owner
    ]);

    // Memoize conditional renders (simplified)
    const hasProperties = useMemo(() => {
        return metadata?.attributes && metadata.attributes.length > 0;
    }, [metadata?.attributes]);

    const swapTargetProps = useMemo(() => ({
        desiredNftAddress: nftDetails?.desiredNftAddress || "",
        desiredTokenId: nftDetails?.desiredTokenId || ""
    }), [nftDetails?.desiredNftAddress, nftDetails?.desiredTokenId]);

    const collectionItemsProps = useMemo(() => ({
        collection: contractInfo?.name || null,
        nftAddress,
        tokenId,
        name: finalName,
        price: nftDetails?.price || "0"
    }), [contractInfo?.name, nftAddress, tokenId, finalName, nftDetails?.price]);


    // Early returns for loading and error states
    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !hasValidData) {
        return <NFTDetailErrorDisplay error={error || 'NFT not found'} onBack={handleBack} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            <MemoizedNFTDetailHeader {...headerProps} />

            <MemoizedCategoryPills {...categoryPillsProps} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - NFT Information & Details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {infoTabsProps && (
                            <MemoizedNewNFTInfoTabs {...infoTabsProps} />
                        )}



                        <MemoizedCollectionItemsList {...collectionItemsProps} />
                    </div>

                    {/* Right Side - Media & Price (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <MemoizedNFTMediaSection {...mediaSectionProps} />

                        <MemoizedNFTPriceCard {...priceCardProps} />

                        <MemoizedSwapTargetInfo {...swapTargetProps} />

                        {/* Manual Refresh Controls - Show in development or for admin users */}
                        {process.env.NODE_ENV === 'development' && (
                            <ManualRefreshControls
                                contractAddress={nftAddress}
                                tokenId={tokenId}
                                showCacheStats={true}
                                className="mt-6"
                            />
                        )}

                        {/* Debug Panel for User Interactions */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="bg-gray-100 p-4 rounded-lg mt-6">
                                <h3 className="font-bold mb-2">🐛 User Interactions Debug</h3>
                                <div className="text-sm space-y-1">
                                    <div>Wallet Connected: {isWalletConnected ? 'Yes' : 'No'}</div>
                                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                                    <div>Error: {error || 'None'}</div>
                                    <div>Data: {userInteractions ? 'Loaded' : 'None'}</div>
                                    <div>Is Favorited: {userInteractions?.isFavorite ? 'Yes' : 'No'}</div>
                                    <div>Is Watchlisted: {userInteractions?.isWatchlisted ? 'Yes' : 'No'}</div>
                                    <div>Rating: {userInteractions?.rating || 'None'}</div>
                                    <div className="mt-2">
                                        <button
                                            onClick={toggleFavorite}
                                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
                                        >
                                            Test Favorite
                                        </button>
                                        <button
                                            onClick={toggleWatchlist}
                                            className="bg-green-500 text-white px-2 py-1 rounded text-xs mr-2"
                                        >
                                            Test Watchlist
                                        </button>
                                        <button
                                            onClick={() => setRating(5)}
                                            className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
                                        >
                                            Test Rating (5)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(NFTDetailPage);

"use client";

// NFT Detail Page - Detailansicht für einzelne NFTs
// Zeigt Eigenschaften, Preis, Historie und verwandte NFTs
// Verwendet lokale Components aus ./components/ für bessere Organisation

import React, { useEffect, memo, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';

// Updated imports: Direct NFTContext access und moderne Stats
import { useNFTPriceData, useNFTUserActions } from '@/hooks';
import { useModernNFTContext } from '@/contexts/NFTContext';
import { useNFTUserStats } from '@/contexts/NFTStatsContext';

// Validation utilities moved to component level
import { isValidNFTAddress, isValidNFTTokenId } from '@/utils';

// Lokale NFT Detail Components (nur für diese Seite verwendet)
import {
    NFTDetailHeader,
    CategoryPills,
    NFTMediaSection,
    NFTPriceCard,
    NewNFTInfoTabs,
    SwapTargetInfo,
    CollectionItemsList,
    LoadingSpinner,
    NFTDetailErrorDisplay
} from './components';

// Shared Components die weiterhin zentral genutzt werden
import { ManualRefreshControls } from '@/components';

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

    // OPTIMIZED: Use ModernNFTContext directly for insights
    const nftContext = useModernNFTContext();
    const nftContextData = nftContext.getNFT(nftAddress, tokenId);
    const publicInsights = nftContextData?.insight;

    // Load data if not available
    useEffect(() => {
        if (!nftContextData) {
            nftContext.loadNFT(nftAddress, tokenId);
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

    // OPTIMIZED: Get metadata from AggregatedNFT structure
    const metadata = nftContextData?.meta;
    const imageUrl = nftContextData?.meta?.image;
    const contractInfo = {
        name: nftContextData?.core?.contractName,
        symbol: nftContextData?.core?.contractSymbol,
        totalSupply: nftContextData?.core?.totalSupply
    };

    // SIMPLIFIED: Generate mock marketplace data directly with useMemo
    const nftDetails = useMemo(() => {
        if (!isValidParams) return null;
        return {
            listingId: `${nftAddress}-${tokenId}`,
            nftAddress,
            tokenId,
            isListed: nftContextData?.listed || false,
            price: nftContextData?.listing?.price ?? "0", // Ensure string, never null
            seller: nftContextData?.listing?.seller || nftContextData?.core?.owner || "", // Use listing seller or owner
            desiredNftAddress: nftContextData?.listing?.desiredNftAddress || "", // Always string
            desiredTokenId: nftContextData?.listing?.desiredTokenId !== undefined && nftContextData?.listing?.desiredTokenId !== null
                ? String(nftContextData.listing.desiredTokenId)
                : ""
        };
    }, [nftAddress, tokenId, isValidParams, nftContextData]);

    // Use custom hook for price data
    const priceData = useNFTPriceData(nftDetails?.price || null);

    // MODERNIZED: Use unified NFTUserStats Hook statt separater Hooks
    // Das stellt sicher, dass Stats automatisch aktualisiert werden
    const { address: userAddress } = useAccount();
    const {
        stats: statsData,
        userInteractions: statsUserInteractions,
        toggleFavorite: statsToggleFavorite,
        toggleWatchlist: statsToggleWatchlist,
        setRating: statsSetRating,
        incrementViews
    } = useNFTUserStats(nftAddress, tokenId, userAddress);

    // Legacy compatibility object
    const nftStats = {
        stats: statsData,
        loading: false, // Context handles loading internally
        error: null
        // refetch wird nicht mehr benötigt da automatisch
    };

    // OPTIMIZED: Combined loading and error states
    const isLoading = !nftContextData;
    const error = null; // NFTDetailData doesn't expose errorState - handle via context if needed
    const hasValidData = isValidParams && nftDetails;    // Use NFTContext data directly
    const finalImageUrl = imageUrl;
    const finalName = metadata?.name || `Token #${tokenId}`;

    // Record view on mount (moved from hook)
    useEffect(() => {
        if (isValidParams && recordView) {
            recordView();
        }
    }, [isValidParams, recordView]);

    // Enhanced toggle functions that also update stats
    // MODERNIZED: Verwende direkt die Stats Context Functions - automatische Updates
    // Die Stats werden automatisch aktualisiert, keine manuellen refetch() calls nötig
    const enhancedToggleWatchlist = statsToggleWatchlist;
    const enhancedToggleFavorite = statsToggleFavorite;
    const enhancedSetRating = statsSetRating;

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
        contractInfo?.symbol, nftAddress, statsUserInteractions,
        enhancedToggleFavorite, handleShare
    ]);

    // Memoize category pills props with insights
    const categoryPillsProps = useMemo(() => ({
        categories: [], // From NFT metadata - could be enhanced later
        tags: [],
        externalUrl: metadata?.externalUrl,
        // Use insights data for website/twitter links
        websiteUrl: null, // Insight type doesn't have projectWebsite
        twitterUrl: null, // Insight type doesn't have projectTwitter
        // Pass insights for category/tag display
        insights: publicInsights as any, // Type compatibility: Insight → expected insights type
        insightsLoading: isLoading,
        contractAddress: nftAddress,
        tokenId
    }), [
        metadata?.externalUrl, nftAddress, tokenId,
        publicInsights, isLoading
    ]);

    // Memoize media section props (FIXED: Better fallback logic for images)
    const mediaSectionProps = useMemo(() => {
        return {
            imageUrl: finalImageUrl, // Use consolidated image URL
            animationUrl: metadata?.animationUrl, // Use consolidated metadata
            videoUrl: null, // Simplified
            audioUrl: null, // Simplified  
            name: finalName, // Use consolidated name
            tokenId
        };
    }, [
        finalImageUrl, metadata?.animationUrl, finalName, tokenId
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
            currentOwner: nftContextData?.core?.owner || null, // Use NFTContext owner
            creator: null, // Simplified
            nftDetails,
            description: metadata?.description || '',
            rarityRank: null, // Simplified
            rarityScore: null, // Simplified  
            attributes: metadata?.attributes?.map((attr: any) => ({
                trait_type: attr.trait_type || '',
                value: attr.value || ''
            })) || undefined,
            supportsRoyalty: false, // Simplified
            royaltyInfo: null, // Simplified

            // Correct props for NewNFTInfoTabs (with type compatibility)
            publicInsights: publicInsights as any, // Type compatibility: AdminNFTInsight → PublicNFTInsights
            userInteractions: statsUserInteractions as any, // UPDATED: Use stats-based userInteractions
            isWalletConnected, // Add wallet connection state
            insightsLoading: isLoading,

            // User action handlers for PersonalTab (legacy compatibility)
            // NOTE: PersonalTab now prefers NFTStatsContext but keeps these for fallback
            onToggleFavorite: enhancedToggleFavorite,
            onToggleWatchlist: enhancedToggleWatchlist,
            onSetRating: enhancedSetRating,

            // Legacy user interaction data (context will override for PersonalTab)
            stats: undefined, // PersonalTab gets stats from NFTStatsContext
            userRating: statsUserInteractions?.userRating || 0, // UPDATED: Use stats-based data
            isWatchlisted: statsUserInteractions?.isWatchlisted || false, // UPDATED: Use stats-based data
            isFavorited: statsUserInteractions?.isFavorited || false, // UPDATED: Use stats-based data
            adminInsights: publicInsights as any, // Type compatibility: Insight → AdminNFTInsight
            collectionInsights: null, // Not available in simplified structure
            adminInsightsLoading: isLoading
        };
    }, [
        activeTab, handleTabChange, nftAddress, tokenId, contractInfo, metadata, nftDetails,
        statsUserInteractions, publicInsights, isLoading, enhancedToggleFavorite, enhancedToggleWatchlist, enhancedSetRating,
        isWalletConnected, nftContextData?.core?.owner
    ]);

    // Memoize conditional renders (simplified)
    const hasProperties = useMemo(() => {
        return metadata?.attributes && metadata.attributes.length > 0;
    }, [metadata?.attributes]);

    const swapTargetProps = useMemo(() => ({
        desiredNftAddress: nftDetails?.desiredNftAddress || "",
        desiredTokenId: nftDetails?.desiredTokenId !== undefined && nftDetails?.desiredTokenId !== null
            ? String(nftDetails.desiredTokenId)
            : ""
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

            {/* Mobile Only - NFT Image directly under CategoryPills */}
            <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <MemoizedNFTMediaSection {...mediaSectionProps} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - NFT Information & Details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {infoTabsProps && (
                            <MemoizedNewNFTInfoTabs {...infoTabsProps} />
                        )}

                        {/* Mobile Only - Price Card & Swap Info before Collection Items */}
                        <div className="lg:hidden space-y-6">
                            <MemoizedNFTPriceCard {...priceCardProps} />
                            <MemoizedSwapTargetInfo {...swapTargetProps} />
                        </div>

                        <MemoizedCollectionItemsList {...collectionItemsProps} />
                    </div>

                    {/* Right Side - Media & Price (1/3 width) - Desktop Only */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Desktop Only - NFT Image */}
                        <div className="hidden lg:block">
                            <MemoizedNFTMediaSection {...mediaSectionProps} />
                        </div>

                        {/* Desktop Only - Price Card & Swap Info */}
                        <div className="hidden lg:block">
                            <MemoizedNFTPriceCard {...priceCardProps} />
                        </div>

                        <div className="hidden lg:block">
                            <MemoizedSwapTargetInfo {...swapTargetProps} />
                        </div>

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
                                <h3 className="font-bold mb-2">🐛 User Interactions Debug (Modernized)</h3>
                                <div className="text-sm space-y-1">
                                    <div>Wallet Connected: {isWalletConnected ? 'Yes' : 'No'}</div>
                                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                                    <div>Error: {error || 'None'}</div>
                                    <div>Stats Data: {statsUserInteractions ? 'Loaded' : 'None'}</div>
                                    <div>Is Favorited: {statsUserInteractions?.isFavorited ? 'Yes' : 'No'}</div>
                                    <div>Is Watchlisted: {statsUserInteractions?.isWatchlisted ? 'Yes' : 'No'}</div>
                                    <div>Rating: {statsUserInteractions?.userRating || 'None'}</div>
                                    <div>Stats: Views: {statsData?.viewCount || 0}, Likes: {statsData?.favoriteCount || 0}</div>
                                    <div className="mt-2">
                                        <button
                                            onClick={enhancedToggleFavorite}
                                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
                                        >
                                            Test Favorite (Modern)
                                        </button>
                                        <button
                                            onClick={enhancedToggleWatchlist}
                                            className="bg-green-500 text-white px-2 py-1 rounded text-xs mr-2"
                                        >
                                            Test Watchlist (Modern)
                                        </button>
                                        <button
                                            onClick={() => enhancedSetRating?.(5)}
                                            className="bg-purple-500 text-white px-2 py-1 rounded text-xs mr-2"
                                        >
                                            Test Rating (5)
                                        </button>
                                        <button
                                            onClick={() => enhancedSetRating?.(0)}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                        >
                                            Delete Rating
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

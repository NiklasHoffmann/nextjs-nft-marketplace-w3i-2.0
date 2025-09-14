"use client";

import React, { useEffect, memo, useMemo, useCallback } from 'react';

import { useNFT, useNFTDetailLogic, useNFTStats, useNFTPriceData } from '@/hooks';

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
    // Logic hook for UI state, navigation, and marketplace functionality
    const {
        nftDetails,
        publicInsights,
        userInteractions,
        activeTab,
        isLoading: logicLoading,
        error: logicError,
        hasValidData,
        nftAddress,
        tokenId,
        userWalletAddress,
        isWalletConnected,
        handleBack,
        handleShare,
        handleTabChange,
        toggleFavorite,
        toggleWatchlist,
        setRating,
        handleUpdateUserInteraction,
        fetchListingData
    } = useNFTDetailLogic();

    // NFT metadata hook (blockchain/IPFS data)
    const nftData = useNFT(nftAddress, tokenId);

    // Use custom hook for price data
    const priceData = useNFTPriceData(nftDetails?.price || null);

    // Use custom hook for NFT stats
    const nftStats = useNFTStats({
        contractAddress: nftAddress,
        tokenId: tokenId,
        autoFetch: !!hasValidData,
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Combined loading and error states
    const isLoading = logicLoading || nftData.loading;
    const error = logicError || nftData.error;

    // Debug: Log user interactions data
    console.log('🐛 NFT Page Debug:', {
        nftAddress,
        tokenId,
        userWalletAddress,
        userInteractions,
        userInteractionsLoading: logicLoading,
        userInteractionsError: logicError,
        hasToggleFavorite: !!toggleFavorite,
        hasToggleWatchlist: !!toggleWatchlist,
        hasSetRating: !!setRating
    });

    // Effect to fetch listing data
    useEffect(() => {
        fetchListingData();
        // NOTE: View tracking is handled by useUserInteractions in useNFTDetailLogic
        // to avoid duplicate view records
    }, [fetchListingData, nftAddress, tokenId]);

    // Memoize header props to prevent unnecessary re-renders
    const headerProps = useMemo(() => ({
        name: nftData.name,
        tokenId,
        contractName: nftData.contractName,
        collection: nftData.contractName, // Using contractName as collection fallback
        contractSymbol: nftData.contractSymbol,
        nftAddress,
        isFavorited: userInteractions?.isFavorite || false,
        onToggleFavorite: toggleFavorite,
        onShare: handleShare,
        // Extended props for user actions - now working!
        isWatchlisted: userInteractions?.isWatchlisted || false,
        userRating: userInteractions?.rating || 0,
        onToggleWatchlist: toggleWatchlist,
        onSetRating: setRating,
        isWalletConnected, // Add wallet connection state for button states
        // Stats for display - using real data from useNFTStats
        viewCount: nftStats.stats?.viewCount || 0,
        favoriteCount: nftStats.stats?.favoriteCount || 0,
        averageRating: nftStats.stats?.averageRating || 0,
        ratingCount: nftStats.stats?.ratingCount || 0,
        watchlistCount: nftStats.stats?.watchlistCount || 0
    }), [
        nftData.name, tokenId, nftData.contractName,
        nftData.contractSymbol, nftAddress, userInteractions,
        toggleFavorite, handleShare, toggleWatchlist, setRating,
        nftStats.stats, isWalletConnected
    ]);

    // Memoize category pills props with insights
    const categoryPillsProps = useMemo(() => ({
        categories: [], // From NFT metadata - could be enhanced later
        tags: [],
        externalUrl: nftData.metadata?.external_url,
        // Use insights data for website/twitter links
        websiteUrl: publicInsights?.projectWebsite || null,
        twitterUrl: publicInsights?.projectTwitter || null,
        // Pass insights for category/tag display
        insights: publicInsights || null,
        insightsLoading: isLoading,
        contractAddress: nftAddress,
        tokenId
    }), [
        nftData.metadata?.external_url, nftAddress, tokenId,
        publicInsights, isLoading
    ]);

    // Memoize media section props
    const mediaSectionProps = useMemo(() => ({
        imageUrl: nftData.imageUrl,
        animationUrl: nftData.metadata?.animation_url,
        videoUrl: null, // Simplified
        audioUrl: null, // Simplified  
        name: nftData.name,
        tokenId
    }), [
        nftData.imageUrl, nftData.metadata?.animation_url, nftData.name, tokenId
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
            contractName: nftData.contractName,
            collection: nftData.contractName, // Simplified
            contractSymbol: nftData.contractSymbol,
            tokenStandard: 'ERC721', // Simplified
            blockchain: 'Ethereum', // Simplified  
            totalSupply: null, // Simplified
            currentOwner: nftData.owner,
            creator: null, // Simplified
            nftDetails,
            description: nftData.description,
            rarityRank: null, // Simplified
            rarityScore: null, // Simplified  
            attributes: nftData.attributes?.map(attr => ({
                ...attr,
                display_type: attr.display_type as 'boost_number' | 'boost_percentage' | 'number' | 'date' | undefined
            })) || undefined,
            supportsRoyalty: false, // Simplified
            royaltyInfo: null, // Simplified

            // Correct props for NewNFTInfoTabs (with type compatibility)
            publicInsights: publicInsights as any, // Type compatibility: AdminNFTInsight → PublicNFTInsights
            userInteractions: userInteractions as any, // Type compatibility: CombinedUserInteractionData → UserNFTInteractions
            userWalletAddress: userWalletAddress || undefined, // Convert null to undefined
            isWalletConnected, // Add wallet connection state
            insightsLoading: isLoading,
            onUpdateUserInteraction: handleUpdateUserInteraction,

            // User action handlers for PersonalTab
            onToggleFavorite: toggleFavorite,
            onToggleWatchlist: toggleWatchlist,
            onSetRating: setRating,

            // Clean data structure props
            stats: undefined, // TODO: Implement stats fetching
            userRating: userInteractions?.rating || 0,
            isWatchlisted: userInteractions?.isWatchlisted || false,
            isFavorited: userInteractions?.isFavorite || false,
            adminInsights: publicInsights, // For tabs that specifically need AdminNFTInsight
            collectionInsights: null, // Not available in simplified structure
            adminInsightsLoading: isLoading
        };
    }, [
        activeTab, handleTabChange, nftAddress, tokenId, nftData, nftDetails,
        userInteractions, publicInsights, isLoading, toggleFavorite, toggleWatchlist, setRating,
        handleUpdateUserInteraction, userWalletAddress, isWalletConnected
    ]);

    // Memoize conditional renders (simplified)
    const hasProperties = useMemo(() => {
        return nftData.attributes && nftData.attributes.length > 0;
    }, [nftData.attributes]);

    const swapTargetProps = useMemo(() => ({
        desiredNftAddress: nftDetails?.desiredNftAddress || "",
        desiredTokenId: nftDetails?.desiredTokenId || ""
    }), [nftDetails?.desiredNftAddress, nftDetails?.desiredTokenId]);

    const collectionItemsProps = useMemo(() => ({
        collection: nftData.contractName,
        nftAddress,
        tokenId,
        name: nftData.name,
        price: nftDetails?.price || "0"
    }), [nftData.contractName, nftAddress, tokenId, nftData.name, nftDetails?.price]);


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
                                    <div>Wallet: {userWalletAddress || 'Not connected'}</div>
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

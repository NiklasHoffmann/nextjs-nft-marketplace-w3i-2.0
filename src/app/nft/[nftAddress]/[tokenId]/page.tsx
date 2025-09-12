"use client";

import React, { useEffect, memo, useMemo } from 'react';
import { useNFTDetailLogic } from '@/hooks/useNFTDetailLogic';
import { useNFTPriceData } from '@/hooks/useNFTPriceData';
import {
    NFTDetailHeader,
    CategoryPills,
    NFTMediaSection,
    NFTPriceCard,
    NFTInfoTabs,
    PropertiesDisplay,
    SwapTargetInfo,
    CollectionItemsList,
    LoadingSpinner,
    ErrorDisplay,
    NFTInsightsPanel
} from '@/components/nft-detail';
import ManualRefreshControls from '@/components/ManualRefreshControls';

// Memoized layout components
const MemoizedNFTDetailHeader = memo(NFTDetailHeader);
const MemoizedCategoryPills = memo(CategoryPills);
const MemoizedNFTMediaSection = memo(NFTMediaSection);
const MemoizedNFTPriceCard = memo(NFTPriceCard);
const MemoizedNFTInfoTabs = memo(NFTInfoTabs);
const MemoizedPropertiesDisplay = memo(PropertiesDisplay);
const MemoizedSwapTargetInfo = memo(SwapTargetInfo);
const MemoizedCollectionItemsList = memo(CollectionItemsList);

function NFTDetailPage() {
    // Use custom hook for all NFT detail logic
    const {
        nftDetails,
        nftData,
        activeTab,
        isFavorited,
        isLoading,
        error,
        hasValidData,
        nftAddress,
        tokenId,
        insights,
        insightsLoading,
        handleBack,
        handleShare,
        toggleFavorite,
        handleTabChange,
        fetchListingData
    } = useNFTDetailLogic();

    // Use custom hook for price data
    const priceData = useNFTPriceData(nftDetails?.price || null);

    // Effect to fetch listing data
    useEffect(() => {
        fetchListingData();
    }, [fetchListingData]);

    // Memoize header props to prevent unnecessary re-renders
    const headerProps = useMemo(() => ({
        name: nftData.name,
        tokenId,
        contractName: nftData.contractName,
        collection: nftData.contractName, // Using contractName as collection fallback
        contractSymbol: nftData.contractSymbol,
        nftAddress,
        isFavorited,
        onToggleFavorite: toggleFavorite,
        onShare: handleShare
    }), [
        nftData.name, tokenId, nftData.contractName,
        nftData.contractSymbol, nftAddress, isFavorited, toggleFavorite, handleShare
    ]);

    // Memoize category pills props (simplified)
    const categoryPillsProps = useMemo(() => ({
        categories: [], // Simplified - remove complex category logic
        tags: [],
        externalUrl: nftData.metadata?.external_url,
        websiteUrl: null, // Simplified
        twitterUrl: null, // Simplified
        insights,
        insightsLoading,
        contractAddress: nftAddress,
        tokenId
    }), [
        nftData.metadata?.external_url, insights, insightsLoading, nftAddress, tokenId
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
            attributes: nftData.attributes as any,
            supportsRoyalty: false, // Simplified
            royaltyInfo: null // Simplified
        };
    }, [
        activeTab, handleTabChange, nftAddress, tokenId, nftData, nftDetails
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
        return <ErrorDisplay error={error || 'NFT not found'} onBack={handleBack} />;
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
                            <MemoizedNFTInfoTabs {...infoTabsProps} />
                        )}

                        {hasProperties && (
                            <MemoizedPropertiesDisplay properties={nftData.metadata || {}} />
                        )}

                        <MemoizedSwapTargetInfo {...swapTargetProps} />

                        <MemoizedCollectionItemsList {...collectionItemsProps} />
                    </div>

                    {/* Right Side - Media & Price (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <MemoizedNFTMediaSection {...mediaSectionProps} />

                        <MemoizedNFTPriceCard {...priceCardProps} />

                        {/* NFT Insights Panel */}
                        <NFTInsightsPanel
                            contractAddress={nftAddress}
                            tokenId={tokenId}
                        />
                        
                        {/* Manual Refresh Controls - Show in development or for admin users */}
                        {process.env.NODE_ENV === 'development' && (
                            <ManualRefreshControls 
                                contractAddress={nftAddress}
                                tokenId={tokenId}
                                showCacheStats={true}
                                className="mt-6"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(NFTDetailPage);

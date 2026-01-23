"use client";

import React, { useEffect, memo, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useNFTPriceData, useMarketplaceItemDetail } from '@/hooks';
import { useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';
import { isValidContractAddress, isValidNFTTokenId, createShareableNFTUrl } from '@/utils';
import { TabType } from '@/types';
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

// Global set to track recorded views - survives component remounts
const recordedViews = new Set<string>();

// Don't memo NFTDetailHeader - it needs to re-render when context changes
// The header has its own useNFTUserStats hook that reads from context
const MemoizedCategoryPills = memo(CategoryPills);
const MemoizedNFTMediaSection = memo(NFTMediaSection);
const MemoizedNFTPriceCard = memo(NFTPriceCard);
const MemoizedNewNFTInfoTabs = memo(NewNFTInfoTabs);
const MemoizedSwapTargetInfo = memo(SwapTargetInfo);
const MemoizedCollectionItemsList = memo(CollectionItemsList);

function NFTDetailPage() {
    const params = useParams();
    const contractAddress = params.contractAddress as string;
    const tokenId = params.tokenId as string;

    const isValidParams = useMemo(() => {
        return isValidContractAddress(contractAddress) && isValidNFTTokenId(tokenId);
    }, [contractAddress, tokenId]);

    // Use cache-aware hook instead of direct API call
    const { nft: nftData, loading: dataLoading, error: dataError } = useMarketplaceItemDetail({
        contractAddress,
        tokenId,
        autoFetch: isValidParams
    });
    console.log('NFTDetailPage:', { contractAddress, tokenId, isValidParams, nftData, dataError });
    const { address: userAddress } = useAccount();
    const router = useRouter();

    // All stats and user interactions from NFTStatsContext
    const {
        stats: statsData,
        userInteractions: statsUserInteractions,
        toggleFavorite: statsToggleFavorite,
        toggleWatchlist: statsToggleWatchlist,
        setRating: statsSetRating,
        incrementViews
    } = useNFTUserStats(contractAddress, tokenId, userAddress);

    // UI state
    const [activeTab, setActiveTab] = useState<TabType>('project');

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleShare = useCallback(() => {
        if (!contractAddress || !tokenId) return;
        const shareUrl = createShareableNFTUrl(contractAddress, tokenId);
        if (navigator.share) {
            navigator.share({
                title: `NFT ${tokenId}`,
                text: `Check out this NFT on Ideationmarket from collection ${contractAddress}`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    }, [contractAddress, tokenId]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const isWalletConnected = Boolean(userAddress);

    // Extract data from MongoDB response
    const metadata = nftData?.metadata;
    const imageUrl = nftData?.metadata?.image;
    const contractInfo = {
        name: nftData?.contract?.name,
        symbol: nftData?.contract?.symbol,
        totalSupply: nftData?.contract?.totalSupply
    };
    const publicInsights = nftData?.insights;

    const nftDetails = useMemo(() => {
        if (!isValidParams || !nftData) return null;

        return {
            // Core
            listingId: nftData.marketplace?.listingId || `${contractAddress}-${tokenId}`,
            contractAddress,
            tokenId,
            isListed: nftData.marketplace?.isListed || false,

            // Pricing (v1 & v2)
            price: nftData.marketplace?.price || "0",
            priceTotal: nftData.marketplace?.priceTotal,
            unitPrice: nftData.marketplace?.unitPrice,

            // Parties
            seller: nftData.marketplace?.seller || nftData.contract?.owner || "",
            buyer: nftData.marketplace?.buyer ?? undefined,

            // Swap Data
            desiredContractAddress: nftData.marketplace?.desiredContractAddress || nftData.marketplace?.desiredTokenAddress || "",
            desiredTokenAddress: nftData.marketplace?.desiredTokenAddress,
            desiredTokenId: nftData.marketplace?.desiredTokenId ? String(nftData.marketplace.desiredTokenId) : "",
            desiredErc1155Quantity: nftData.marketplace?.desiredErc1155Quantity,

            // v2 Fields
            tokenStandard: nftData.marketplace?.tokenStandard || 'ERC721',
            listingType: nftData.marketplace?.listingType,
            status: nftData.marketplace?.status,

            // ERC1155
            erc1155QuantityListed: nftData.marketplace?.erc1155QuantityListed,
            remainingQuantity: nftData.marketplace?.remainingQuantity,

            // Advanced
            buyerWhitelistEnabled: nftData.marketplace?.buyerWhitelistEnabled,
            partialBuyEnabled: nftData.marketplace?.partialBuyEnabled,
            feeRate: nftData.marketplace?.feeRate,

            // Chain & Timestamps
            chainId: nftData.marketplace?.chainId,
            createdAt: nftData.marketplace?.createdAt,
            syncedAt: nftData.marketplace?.syncedAt
        };
    }, [contractAddress, tokenId, isValidParams, nftData]);

    const priceData = useNFTPriceData(nftDetails?.price || null);

    const isLoading = dataLoading;
    const error = dataError;
    const hasValidData = isValidParams && nftDetails;
    const finalImageUrl = imageUrl;

    // Use customTitle from insights if available, otherwise use metadata name or fallback
    const finalName = useMemo(() => {
        return publicInsights?.customTitle || metadata?.name || `Token #${tokenId}`;
    }, [publicInsights?.customTitle, metadata?.name, tokenId]);

    // Record view on mount - DISABLED temporarily to fix infinite loop
    // TODO: Re-enable with proper debouncing after stats sync is fixed
    // useEffect(() => {
    //     if (!isValidParams || !contractAddress || !tokenId) return;
    //     const viewKey = `${contractAddress}-${tokenId}`;
    //     if (recordedViews.has(viewKey)) return;
    //     recordedViews.add(viewKey);
    //     incrementViews();
    // }, [isValidParams, contractAddress, tokenId]);

    const headerProps = useMemo(() => ({
        name: finalName,
        tokenId,
        contractName: contractInfo?.name || null,
        collection: contractInfo?.name || null,
        contractSymbol: contractInfo?.symbol || null,
        contractAddress,
        isFavorited: statsUserInteractions?.isFavorited || false,
        onToggleFavorite: statsToggleFavorite,
        onShare: handleShare
    }), [
        finalName, tokenId, contractInfo?.name,
        contractInfo?.symbol, contractAddress, statsUserInteractions,
        statsToggleFavorite, handleShare
    ]);

    const categoryPillsProps = useMemo(() => ({
        categories: [],
        tags: [],
        externalUrl: metadata?.externalUrl,
        websiteUrl: null,
        twitterUrl: null,
        insights: publicInsights as any,
        insightsLoading: isLoading,
        contractAddress: contractAddress,
        tokenId
    }), [
        metadata?.externalUrl, contractAddress, tokenId,
        publicInsights, isLoading
    ]);

    const mediaSectionProps = useMemo(() => ({
        imageUrl: finalImageUrl,
        animationUrl: metadata?.animationUrl,
        videoUrl: null,
        audioUrl: null,
        name: finalName,
        tokenId
    }), [
        finalImageUrl, metadata?.animationUrl, finalName, tokenId
    ]);

    const priceCardProps = useMemo(() => ({
        price: nftDetails?.price || "0",
        isListed: nftDetails?.isListed || false,
        convertedPrice: priceData.convertedPrice,
        priceLoading: priceData.priceLoading,
        selectedCurrencySymbol: priceData.selectedCurrencySymbol,
        contractAddress,
        tokenId,
        seller: nftDetails?.seller,
        listingId: nftDetails?.listingId,
        currentOwner: nftData?.blockchain?.owner || nftData?.contract?.owner || undefined,
        connectedAddress: userAddress || undefined,
        nftName: finalName,
        nftImage: finalImageUrl || undefined,
        desiredContractAddress: nftDetails?.desiredContractAddress,
        desiredTokenId: nftDetails?.desiredTokenId,
        // v2 fields
        status: nftDetails?.status,
        listingType: nftDetails?.listingType,
        tokenStandard: nftDetails?.tokenStandard
    }), [
        nftDetails?.price, nftDetails?.isListed, nftDetails?.seller,
        nftDetails?.desiredContractAddress, nftDetails?.desiredTokenId, nftDetails?.listingId,
        nftDetails?.status, nftDetails?.listingType, nftDetails?.tokenStandard,
        priceData.convertedPrice, priceData.priceLoading, priceData.selectedCurrencySymbol,
        contractAddress, tokenId, nftData?.contract?.owner, userAddress, finalName, finalImageUrl
    ]);

    const infoTabsProps = useMemo(() => {
        if (!nftDetails) return null;

        return {
            activeTab,
            onTabChange: handleTabChange,
            contractAddress,
            tokenId,
            contractName: contractInfo?.name || null,
            collection: contractInfo?.name || null,
            contractSymbol: contractInfo?.symbol || null,
            tokenStandard: nftDetails?.tokenStandard || 'ERC721',
            blockchain: 'Ethereum',
            totalSupply: typeof contractInfo?.totalSupply === 'bigint'
                ? Number(contractInfo.totalSupply)
                : contractInfo?.totalSupply ?? null,
            currentOwner: nftData?.blockchain?.owner || nftData?.contract?.owner || null,
            creator: null,
            nftDetails,
            description: metadata?.description || '',
            rarityRank: null,
            rarityScore: null,
            attributes: metadata?.attributes?.map((attr: any) => ({
                trait_type: attr.trait_type || '',
                value: attr.value || ''
            })) || undefined,
            supportsRoyalty: false,
            royaltyInfo: null,
            publicInsights: publicInsights as any,
            userInteractions: statsUserInteractions as any,
            isWalletConnected,
            insightsLoading: isLoading,
            onToggleFavorite: statsToggleFavorite,
            onToggleWatchlist: statsToggleWatchlist,
            onSetRating: statsSetRating,
            stats: undefined,
            userRating: statsUserInteractions?.userRating || 0,
            isWatchlisted: statsUserInteractions?.isWatchlisted || false,
            isFavorited: statsUserInteractions?.isFavorited || false,
            adminInsights: publicInsights as any,
            collectionInsights: null,
            adminInsightsLoading: isLoading,
            isValid: nftData?.marketplace?.isValid ?? true,
            invalidReasons: nftData?.marketplace?.invalidReasons ?? null,
            invalidatedAt: nftData?.marketplace?.invalidatedAt ? new Date(nftData.marketplace.invalidatedAt) : null,
            ownerBalance: nftData?.contract?.ownerBalance ?? null,
            approved: nftData?.blockchain?.approved || null,
            isApprovedForAll: nftData?.blockchain?.isApprovedForAll ?? false,
            tokenURI: nftData?.contract?.tokenURI ?? null
        };
    }, [
        activeTab, handleTabChange, contractAddress, tokenId, contractInfo, metadata, nftDetails,
        statsUserInteractions, publicInsights, isLoading, statsToggleFavorite, statsToggleWatchlist, statsSetRating,
        isWalletConnected, nftData
    ]);

    const hasProperties = useMemo(() => {
        return metadata?.attributes && metadata.attributes.length > 0;
    }, [metadata?.attributes]);

    const swapTargetProps = useMemo(() => ({
        desiredContractAddress: nftDetails?.desiredContractAddress || "",
        desiredTokenId: nftDetails?.desiredTokenId !== undefined && nftDetails?.desiredTokenId !== null
            ? String(nftDetails.desiredTokenId)
            : ""
    }), [nftDetails?.desiredContractAddress, nftDetails?.desiredTokenId]);

    const collectionItemsProps = useMemo(() => ({
        collection: contractInfo?.name || null,
        contractAddress,
        tokenId,
        name: finalName,
        price: nftDetails?.price || "0"
    }), [contractInfo?.name, contractAddress, tokenId, finalName, nftDetails?.price]);

    console.log('NFTDetailPage Render Complete:', { "blockchain.approved:": nftData?.blockchain?.approved, "blockchain.isApprovedForAll:": nftData?.blockchain?.isApprovedForAll });
    // Early returns for loading and error states
    if (isLoading && !nftData) {
        return <LoadingSpinner />;
    }

    // If we have data, show the page
    if (nftData && hasValidData) {
        return (
            <>
                <NFTDetailHeader {...headerProps} />

                <div className="pt-[120px]">
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

                            {/* Mobile Only - Price Card & Swap Info */}
                            <div className="lg:hidden space-y-6">
                                <MemoizedNFTPriceCard {...priceCardProps} />
                                <MemoizedSwapTargetInfo {...swapTargetProps} />
                                <MemoizedCollectionItemsList {...collectionItemsProps} />
                            </div>
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

                            {/* Desktop Only - Collection Items */}
                            <div className="hidden lg:block">
                                <MemoizedCollectionItemsList {...collectionItemsProps} />
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </>
        );
    }

    // If we're not loading and have no data, show error
    if (!isLoading && !nftData) {
        return <NFTDetailErrorDisplay error={error || 'NFT not found'} onBack={handleBack} />;
    }

    // Still loading data
    return <LoadingSpinner />;
}

export default memo(NFTDetailPage);

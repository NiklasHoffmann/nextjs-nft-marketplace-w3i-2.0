"use client";

import React, { useEffect, memo, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useNFTPriceData, useMarketplaceItemDetail } from '@/hooks';
import { useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';
import { isValidContractAddress, isValidNFTTokenId, resolveNFTImageByVariant } from '@/utils';
import { TabType } from '@/types';
import { devLog } from '@/utils';
import {
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
const VIEWER_ID_STORAGE_KEY = 'nft_viewer_id';

function getOrCreateViewerId(): string | null {
    if (typeof window === 'undefined') return null;
    const existing = window.localStorage.getItem(VIEWER_ID_STORAGE_KEY);
    if (existing) return existing;
    const newId = crypto.randomUUID();
    window.localStorage.setItem(VIEWER_ID_STORAGE_KEY, newId);
    return newId;
}

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
    devLog.info('NFTDetailPage:', { contractAddress, tokenId, isValidParams, nftData, dataError });
    const { address: userAddress } = useAccount();
    const router = useRouter();

    // All stats and user interactions from NFTStatsContext
    const {
        userInteractions: statsUserInteractions,
        toggleFavorite: statsToggleFavorite,
        toggleWatchlist: statsToggleWatchlist,
        setRating: statsSetRating,
        incrementViews,
        refresh
    } = useNFTUserStats(contractAddress, tokenId, userAddress);

    // UI state
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const isWalletConnected = Boolean(userAddress);

    // Extract data from MongoDB response
    const metadata = nftData?.metadata;
    const imageUrl = resolveNFTImageByVariant(
        nftData?.metadata?.imageOriginal || nftData?.metadata?.image || '',
        'detail',
        nftData?.metadata?.images,
    );
    const contractInfo = useMemo(() => ({
        name: nftData?.contract?.name,
        symbol: nftData?.contract?.symbol,
        totalSupply: nftData?.contract?.totalSupply
    }), [nftData?.contract?.name, nftData?.contract?.symbol, nftData?.contract?.totalSupply]);
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
            tokenStandard: nftData.marketplace?.tokenStandard || nftData.contract?.contractType || 'ERC721',
            listingType: nftData.marketplace?.listingType,
            status: nftData.marketplace?.status,
            currency: nftData.marketplace?.currency,

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

    const priceData = useNFTPriceData(nftDetails?.price || null, nftDetails?.currency, nftDetails?.chainId);

    const isLoading = dataLoading;
    const error = dataError;
    const hasValidData = isValidParams && nftDetails;
    const finalImageUrl = imageUrl;

    // Title fallback: customTitle -> title -> metadata name
    const finalName = useMemo(() => {
        return (publicInsights as any)?.customTitle || (publicInsights as any)?.title || metadata?.name || `Token #${tokenId}`;
    }, [publicInsights, metadata?.name, tokenId]);

    // Description fallback: metadata -> insights.description -> insights.descriptions[0] -> insights.cardDescriptions[0]
    const finalDescription = useMemo(() => {
        const insightDescription = (publicInsights as any)?.description
            || ((publicInsights as any)?.descriptions?.[0] ?? null)
            || ((publicInsights as any)?.cardDescriptions?.[0] ?? null);

        return metadata?.description || insightDescription || '';
    }, [metadata?.description, publicInsights]);

    const viewRecordedRef = useRef(false);
    const viewerIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isValidParams || !contractAddress || !tokenId) return;
        if (viewRecordedRef.current) return;

        if (!viewerIdRef.current) {
            viewerIdRef.current = getOrCreateViewerId();
        }

        const viewKey = `${contractAddress}-${tokenId}-${viewerIdRef.current || 'anon'}`;
        if (recordedViews.has(viewKey)) return;

        recordedViews.add(viewKey);
        viewRecordedRef.current = true;
        incrementViews();
    }, [isValidParams, contractAddress, tokenId, incrementViews]);

    useEffect(() => {
        if (!isValidParams || !contractAddress || !tokenId) return;
        refresh();
    }, [isValidParams, contractAddress, tokenId, refresh]);

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
        ownerBalance: nftData?.contract?.ownerBalance ?? null,
        nftName: finalName,
        nftImage: finalImageUrl || undefined,
        desiredContractAddress: nftDetails?.desiredContractAddress,
        desiredTokenId: nftDetails?.desiredTokenId,
        desiredErc1155Quantity: nftDetails?.desiredErc1155Quantity,
        currency: nftDetails?.currency,
        // v2 fields
        status: nftDetails?.status,
        listingType: nftDetails?.listingType,
        tokenStandard: nftDetails?.tokenStandard,
        erc1155QuantityListed: nftDetails?.erc1155QuantityListed,
        remainingQuantity: nftDetails?.remainingQuantity,
        unitPrice: nftDetails?.unitPrice,
        partialBuyEnabled: nftDetails?.partialBuyEnabled
    }), [
        nftDetails?.price, nftDetails?.isListed, nftDetails?.seller,
        nftDetails?.desiredContractAddress, nftDetails?.desiredTokenId, nftDetails?.listingId,
        nftDetails?.currency, nftDetails?.status, nftDetails?.listingType, nftDetails?.tokenStandard,
        nftDetails?.desiredErc1155Quantity, nftDetails?.erc1155QuantityListed, nftDetails?.remainingQuantity,
        nftDetails?.unitPrice, nftDetails?.partialBuyEnabled,
        priceData.convertedPrice, priceData.priceLoading, priceData.selectedCurrencySymbol,
        contractAddress, tokenId, nftData?.contract?.owner, nftData?.contract?.ownerBalance, nftData?.blockchain?.owner, userAddress, finalName, finalImageUrl
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
            description: finalDescription,
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
            ownershipBalances: nftData?.contract?.ownershipBalances ?? null,
            holderCount: nftData?.contract?.holderCount ?? null,
            approved: nftData?.blockchain?.approved || null,
            isApprovedForAll: nftData?.blockchain?.isApprovedForAll ?? false,
            tokenURI: nftData?.contract?.tokenURI ?? null,
            connectedAddress: userAddress || null
        };
    }, [
        activeTab, handleTabChange, contractAddress, tokenId, contractInfo, metadata, nftDetails,
        finalDescription,
        statsUserInteractions, publicInsights, isLoading, statsToggleFavorite, statsToggleWatchlist, statsSetRating,
        isWalletConnected, nftData
    ]);

    const swapTargetProps = useMemo(() => ({
        desiredContractAddress: nftDetails?.desiredContractAddress || nftDetails?.desiredTokenAddress || "",
        desiredTokenId: nftDetails?.desiredTokenId !== undefined && nftDetails?.desiredTokenId !== null
            ? String(nftDetails.desiredTokenId)
            : ""
    }), [nftDetails?.desiredContractAddress, nftDetails?.desiredTokenAddress, nftDetails?.desiredTokenId]);

    const collectionItemsProps = useMemo(() => ({
        collection: contractInfo?.name || null,
        contractAddress,
        tokenId,
        name: finalName,
        price: nftDetails?.price || "0"
    }), [contractInfo?.name, contractAddress, tokenId, finalName, nftDetails?.price]);

    devLog.info('NFTDetailPage Render Complete:', { "blockchain.approved:": nftData?.blockchain?.approved, "blockchain.isApprovedForAll:": nftData?.blockchain?.isApprovedForAll });
    // Early returns for loading and error states
    if (isLoading && !nftData) {
        return <LoadingSpinner />;
    }

    // If we have data, show the page
    if (nftData && hasValidData) {
        return (
            <>
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

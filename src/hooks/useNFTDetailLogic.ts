"use client";

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TabType, NFTDetailsPageData } from '@/types/nft-detail';
import { useNFT } from '@/hooks/useNFT';
import { useNFTInsights } from '@/hooks/useNFTInsights';
import { isValidNFTAddress, isValidNFTTokenId, createShareableNFTUrl } from '@/utils/nft-helpers';

/**
 * Custom hook that manages all the logic for the NFT Detail Page
 * Extracts state management and business logic from the component
 */
export function useNFTDetailLogic() {
    const params = useParams();
    const router = useRouter();

    // State
    const [nftDetails, setNftDetails] = useState<NFTDetailsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('project');

    // Extract and validate params
    const nftAddress = useMemo(() => params.nftAddress as string, [params.nftAddress]);
    const tokenId = useMemo(() => params.tokenId as string, [params.tokenId]);

    // Validate parameters with memoization
    const isValidParams = useMemo(() => {
        return isValidNFTAddress(nftAddress) && isValidNFTTokenId(tokenId);
    }, [nftAddress, tokenId]);

    // Use the unified NFT hook
    const nftData = useNFT(nftAddress, tokenId);

    // Use the NFT insights hook
    const { insights, loading: insightsLoading } = useNFTInsights({
        contractAddress: nftAddress,
        tokenId: tokenId,
        autoFetch: isValidParams
    });

    // Memoized mock listing data fetcher
    const createMockNFTDetails = useCallback((address: string, token: string): NFTDetailsPageData => ({
        listingId: `${address}-${token}`,
        nftAddress: address,
        tokenId: token,
        isListed: true,
        price: "50000000000000000", // 0.05 ETH in Wei
        seller: "0x742d35Cc6634C0532925a3b8D0C1C4C9C68F82D4",
        desiredNftAddress: "0x0000000000000000000000000000000000000000",
        desiredTokenId: "0"
    }), []);

    // Memoized handlers
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleShare = useCallback(async () => {
        const shareUrl = createShareableNFTUrl(nftAddress, tokenId);
        const shareTitle = nftData.name || `NFT #${tokenId}`;
        const shareText = nftData.description || 'Check out this NFT';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Error sharing:', err);
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.log('Clipboard not available');
            }
        }
    }, [nftAddress, tokenId, nftData.name, nftData.description]);

    const toggleFavorite = useCallback(() => {
        setIsFavorited(prev => !prev);
        // TODO: Persist to localStorage or API
    }, []);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    // Fetch listing data effect
    const fetchListingData = useCallback(async () => {
        if (!nftAddress || !tokenId || !isValidParams) {
            setError('Invalid NFT address or token ID');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Create mock listing data
            const mockData = createMockNFTDetails(nftAddress, tokenId);
            setNftDetails(mockData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load NFT details');
        } finally {
            setLoading(false);
        }
    }, [nftAddress, tokenId, isValidParams, createMockNFTDetails]);

    // Combined loading state
    const isLoading = useMemo(() => {
        return loading || nftData.loading;
    }, [loading, nftData.loading]);

    // Combined error state
    const combinedError = useMemo(() => {
        return error || nftData.error;
    }, [error, nftData.error]);

    // Validation state
    const hasValidData = useMemo(() => {
        return !isLoading && !combinedError && nftDetails && isValidParams;
    }, [isLoading, combinedError, nftDetails, isValidParams]);

    return {
        // State
        nftDetails,
        nftData, // Replaced nftMetadata with unified nftData
        activeTab,
        isFavorited,
        isLoading,
        error: combinedError,
        hasValidData,

        // Insights data
        insights,
        insightsLoading,

        // Parameters
        nftAddress,
        tokenId,
        isValidParams,

        // Handlers
        handleBack,
        handleShare,
        toggleFavorite,
        handleTabChange,
        fetchListingData,

        // Setters (if needed for external control)
        setActiveTab,
        setIsFavorited,
    };
}
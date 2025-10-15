"use client";

import { useState, useEffect, useMemo } from 'react';
import { useActiveItems } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';
import { formatEther } from '@/utils';

export interface AllCollectionData {
    contractAddress: string;
    symbol: string;
    name: string;
    // Total statistics (from insights API)
    totalSupply: number; // Total NFTs in this collection (from API)
    blockchainTotalSupply: number; // Original blockchain totalSupply
    totalListedNFTs: number; // How many are currently listed on marketplace
    // Financial data (only from listed items)
    totalValue: string; // in ETH - total value of listed items
    floorPrice: string | null; // in ETH
    averagePrice: string | null; // in ETH
    // Visual data
    imageUrl: string | null;
    previewImages: string[]; // Multiple preview images
    // Social metrics
    totalLikes: number;
    totalWatchlist: number;
    // Raw data for detailed views
    listedItems: any[];
}

interface UseAllCollectionsOptions {
    /** Whether to automatically fetch data when component mounts */
    autoFetch?: boolean;
}

/**
 * All Collections Hook
 * 
 * Fetches ALL collections from the insights API and combines with marketplace data
 * to provide complete collection statistics. This shows collections independent
 * of user wallet connection.
 * 
 * This hook gives a marketplace-wide view of collections by showing:
 * - All available collections (not just user-owned)
 * - Total NFTs per collection (from insights API)
 * - How many are currently listed on marketplace
 * - Complete collection metadata
 * 
 * @param options Configuration options
 * @returns All collection data with marketplace statistics
 */
export function useAllCollections({
    autoFetch = true
}: UseAllCollectionsOptions = {}) {
    const [insightsData, setInsightsData] = useState<any[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    const nftContext = useNFTContext();

    // Get marketplace data (listed NFTs)
    const {
        marketplaceItems,
        loading: marketplaceLoading,
        error: marketplaceError,
        refetch: refetchMarketplace
    } = useActiveItems();

    // Fetch insights data (all collections)
    const fetchInsightsData = async () => {
        if (!autoFetch) return;

        setInsightsLoading(true);
        setInsightsError(null);

        try {
            const response = await fetch('/api/nft/insights');
            if (!response.ok) {
                throw new Error(`Insights API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.collections)) {
                setInsightsData(data.collections);
            } else {
                console.warn('Invalid insights API response format:', data);
                setInsightsData([]);
            }
        } catch (error) {
            console.error('Error fetching insights data:', error);
            setInsightsError(error instanceof Error ? error.message : 'Unknown error');
            setInsightsData([]);
        } finally {
            setInsightsLoading(false);
        }
    };

    // Fetch insights data on mount
    useEffect(() => {
        fetchInsightsData();
    }, [autoFetch]);

    // Process combined data into all collections
    const allCollections = useMemo(() => {
        const collectionMap = new Map<string, AllCollectionData>();

        // First, process insights data to get ALL collections
        if (insightsData && Array.isArray(insightsData)) {
            insightsData.forEach((insight: any) => {
                const contractAddress = insight.contractAddress;

                if (!collectionMap.has(contractAddress)) {
                    collectionMap.set(contractAddress, {
                        contractAddress,
                        symbol: insight.symbol || `${(contractAddress || '').slice(0, 6)}...`,
                        name: insight.name || 'Unknown Collection',
                        totalSupply: insight.totalSupply || 0, // From insights API initially
                        blockchainTotalSupply: insight.blockchainTotalSupply || insight.totalSupply || 0,
                        totalListedNFTs: 0, // Will be calculated from marketplace
                        totalValue: '0',
                        floorPrice: null,
                        averagePrice: null,
                        imageUrl: insight.imageUrl || null,
                        previewImages: insight.previewImages || [],
                        totalLikes: insight.totalLikes || 0,
                        totalWatchlist: insight.totalWatchlist || 0,
                        listedItems: []
                    });
                }
            });
        }

        // Then, process marketplace items to add listing data
        if (marketplaceItems && Array.isArray(marketplaceItems)) {
            marketplaceItems.forEach((item: any) => {
                const contractAddress = item.nftAddress;
                const nftData = nftContext.getNFT(contractAddress, item.tokenId);

                // Create collection entry if not exists (from marketplace data)
                if (!collectionMap.has(contractAddress)) {
                    const blockchainTotalSupply = nftData?.core?.totalSupply || 0;
                    collectionMap.set(contractAddress, {
                        contractAddress,
                        symbol: nftData?.core?.symbol || `${(contractAddress || '').slice(0, 6)}...`,
                        name: nftData?.core?.contractName || 'Unknown Collection',
                        totalSupply: blockchainTotalSupply, // Use contract totalSupply
                        blockchainTotalSupply,
                        totalListedNFTs: 0,
                        totalValue: '0',
                        floorPrice: null,
                        averagePrice: null,
                        imageUrl: null,
                        previewImages: [],
                        totalLikes: 0,
                        totalWatchlist: 0,
                        listedItems: []
                    });
                }

                const collection = collectionMap.get(contractAddress)!;

                // Update collection with contract data if we have it and it's more accurate
                if (nftData?.core?.totalSupply && collection.totalSupply !== nftData.core.totalSupply) {
                    collection.totalSupply = nftData.core.totalSupply;
                    collection.blockchainTotalSupply = nftData.core.totalSupply;
                }

                // Update collection names if we have better data from contract
                if (nftData?.core?.symbol && collection.symbol.includes('...')) {
                    collection.symbol = nftData.core.symbol;
                }
                if (nftData?.core?.contractName && collection.name === 'Unknown Collection') {
                    collection.name = nftData.core.contractName;
                }

                // Add to listed items
                collection.listedItems.push({ ...item, nftData });

                // Add social metrics from NFT data
                if (nftData) {
                    collection.totalLikes += nftData.social?.likeCount || 0;
                    collection.totalWatchlist += nftData.social?.watchlistCount || 0;
                }

                // Calculate financial data from listed items
                if (item.isListed && item.price) {
                    collection.totalListedNFTs++;

                    const priceInEth = parseFloat(formatEther(item.price));
                    const currentTotal = parseFloat(collection.totalValue);
                    collection.totalValue = (currentTotal + priceInEth).toFixed(6);

                    // Update floor price
                    if (!collection.floorPrice || priceInEth < parseFloat(collection.floorPrice)) {
                        collection.floorPrice = priceInEth.toFixed(6);
                    }
                }

                // Collect preview images from NFT data (up to 4 images)
                if (nftData?.meta?.image && collection.previewImages.length < 4) {
                    if (!collection.previewImages.includes(nftData.meta.image)) {
                        collection.previewImages.push(nftData.meta.image);
                    }
                }

                // Use first available image as main collection image if not set
                if (!collection.imageUrl && nftData?.meta?.image) {
                    collection.imageUrl = nftData.meta.image;
                }
            });
        }

        // Calculate average prices
        collectionMap.forEach((collection) => {
            if (collection.totalListedNFTs > 0) {
                const avgPrice = parseFloat(collection.totalValue) / collection.totalListedNFTs;
                collection.averagePrice = avgPrice.toFixed(6);
            }
        });

        return Array.from(collectionMap.values());
    }, [insightsData, marketplaceItems, nftContext]);

    // Combined loading state
    const loading = insightsLoading || marketplaceLoading;

    // Combined error state
    const error = insightsError || marketplaceError;

    // Refresh function
    const refresh = async () => {
        await refetchMarketplace();
        await fetchInsightsData();
    };

    // Load missing NFT data
    useEffect(() => {
        if (!autoFetch) return;

        // Load data for marketplace items
        if (marketplaceItems && Array.isArray(marketplaceItems)) {
            marketplaceItems.forEach((item: any) => {
                const nftData = nftContext.getNFT(item.nftAddress, item.tokenId);
                if (!nftData) {
                    nftContext.loadNFT(item.nftAddress, item.tokenId);
                }
            });
        }
    }, [marketplaceItems, nftContext, autoFetch]);

    return {
        collections: allCollections,
        loading,
        error,
        refresh,
        // Raw data access
        marketplaceItems,
        insightsData,
        // Computed statistics
        totalCollections: allCollections.length,
        totalListedNFTs: allCollections.reduce((sum, col) => sum + col.totalListedNFTs, 0),
        totalValue: allCollections.reduce((sum, col) => sum + parseFloat(col.totalValue || '0'), 0).toFixed(6)
    };
}
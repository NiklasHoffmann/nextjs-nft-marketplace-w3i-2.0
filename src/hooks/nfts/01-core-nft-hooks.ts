/**
 * @deprecated Core NFT Hooks - Use useNFTContext() directly for better performance
 * This file contains legacy wrapper hooks. For new code, prefer direct context access.
 * 
 * Old: const { data, isLoading } = useNFTData(address, tokenId);
 * New: const context = useNFTContext(); 
 *      context.loadNFTData(address, tokenId); 
 *      const data = context.getNFTData(address, tokenId);
 */

import { useNFTData, useNFTContext } from '@/contexts/NFTContext';
import { useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_ITEMS } from '@/constants/subgraph.queries';

// ===== DEPRECATED EXPORTS =====
/** @deprecated Use useNFTContext() directly */
export { useNFTCardData } from '@/contexts/NFTContext';
/** @deprecated Use useNFTContext() directly */
export { useNFTDetailData } from '@/contexts/NFTContext';
/** @deprecated Use useNFTContext() directly */
export { useNFTData } from '@/contexts/NFTContext';
export { useNFTContext } from '@/contexts/NFTContext';

// ===== LEGACY-COMPATIBLE HOOKS =====

/**
 * @deprecated Enhanced useNFT - Use useNFTContext() directly for better performance
 */
export function useNFT(address: string, tokenId: string) {
    const { data: nftData, isLoading, refresh } = useNFTData(address, tokenId);

    return useMemo(() => ({
        // Metadata
        metadata: nftData?.metadata,
        imageUrl: nftData?.imageUrl,

        // Contract Info
        contractName: nftData?.contractInfo?.name || null,
        contractSymbol: nftData?.contractInfo?.symbol || null,
        owner: nftData?.contractInfo?.owner || null,
        totalSupply: nftData?.contractInfo?.totalSupply || null,

        // Loading states
        loading: isLoading || nftData?.loadingState.metadata || nftData?.loadingState.contractInfo,
        metadataLoading: nftData?.loadingState.metadata,
        contractLoading: nftData?.loadingState.contractInfo,

        // Error states
        error: nftData?.errorState.metadata || nftData?.errorState.contractInfo,
        metadataError: nftData?.errorState.metadata,
        contractError: nftData?.errorState.contractInfo,

        // Actions
        refetchAll: refresh,
        refetchMetadata: refresh,

        // Bonus data
        insights: nftData?.insights,
        stats: nftData?.stats,
        lastUpdated: nftData?.lastUpdated,
    }), [nftData]);
}

interface UseNFTInsightsOptions {
    contractAddress?: string;
    tokenId?: string;
    autoFetch?: boolean;
}

/**
 * Enhanced useNFTInsights with shared cache
 */
export function useNFTInsights(options: UseNFTInsightsOptions = {}) {
    const { contractAddress = '', tokenId = '', autoFetch = true } = options;
    const { data: nftData, isLoading, refresh } = useNFTData(contractAddress, tokenId);

    return useMemo(() => ({
        insights: nftData?.insights,
        loading: isLoading || nftData?.loadingState.insights,
        error: nftData?.errorState.insights,
        refetch: async () => {
            if (contractAddress && tokenId) {
                await refresh();
            }
        }
    }), [nftData, isLoading, refresh, contractAddress, tokenId]);
}

interface UseNFTStatsOptions {
    contractAddress?: string;
    tokenId?: string;
    autoFetch?: boolean;
    refetchInterval?: number;
}

/**
 * Enhanced useNFTStats with intelligent caching
 */
export function useNFTStats(options: UseNFTStatsOptions = {}) {
    const { contractAddress = '', tokenId = '', autoFetch = true } = options;
    const { data: nftData, isLoading, refresh } = useNFTData(contractAddress, tokenId);

    return useMemo(() => ({
        stats: nftData?.stats,
        loading: isLoading || nftData?.loadingState.stats,
        error: nftData?.errorState.stats,
        refetch: async () => {
            if (contractAddress && tokenId) {
                await refresh();
            }
        }
    }), [nftData, isLoading, refresh, contractAddress, tokenId]);
}

// ===== MARKETPLACE INTEGRATION =====

interface MarketplaceItem {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    buyer?: string | null;
    desiredNftAddress?: string;
    desiredTokenId?: string;
}

interface EnrichedMarketplaceItem extends MarketplaceItem {
    // NFT metadata
    name: string;
    description: string | null;
    imageUrl: string | null;
    attributes: any[];

    // Filter properties
    category: string;
    rarity: string;
    averageRating: number;
    ratingCount: number;
    favoriteCount: number;
    watchlistCount: number;
    viewCount: number;

    // Insights
    customTitle: string | null;
    cardDescriptions: string[] | null;
    tags: string[];

    // Data quality flags
    hasRealStats: boolean;
    hasRealMetadata: boolean;
}

/**
 * Active marketplace items with optimized NFT data enrichment
 * 
 * Provides marketplace data enriched with NFT metadata for filtering and display.
 * Uses intelligent caching and lazy loading for optimal performance.
 */
export function useActiveItems() {
    const { preloader, getNFTData } = useNFTContext();

    const { data, loading, error, refetch } = useQuery(GET_ACTIVE_ITEMS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
    });

    // Extract raw marketplace items from GraphQL
    const marketplaceItems = useMemo(() => {

        // Combine real data with custom NFTs
        const realItems = data.items.map((item: MarketplaceItem) => ({
            contractAddress: item.nftAddress,
            tokenId: item.tokenId,
            listingId: item.listingId,
            price: item.price,
            seller: item.seller,
            buyer: item.buyer,
            isListed: item.isListed,
            desiredNftAddress: item.desiredNftAddress,
            desiredTokenId: item.desiredTokenId,
        }));

        // Add custom NFTs at the beginning
        return [...realItems];
    }, [data]);

    // Smart preloading - only visible items
    useEffect(() => {
        if (marketplaceItems.length > 0) {
            const visibleItems = marketplaceItems.slice(0, 12); // First 12 items
            const nftsToPreload = visibleItems.map((item: any) => ({
                nftAddress: item.contractAddress,
                tokenId: item.tokenId,
            }));

            preloader.preloadMultipleNFTs(nftsToPreload);
        }
    }, [marketplaceItems, preloader]);

    // Enrich marketplace data with NFT context
    const enrichedItems = useMemo((): EnrichedMarketplaceItem[] => {
        return marketplaceItems.map((item: any) => {
            const nftData = getNFTData(item.contractAddress, item.tokenId);

            return enrichMarketplaceItem(item, nftData);
        });
    }, [marketplaceItems, getNFTData]);

    return {
        items: enrichedItems,
        marketplaceItems, // Raw data for NFTCard props
        loading,
        error,
        refetch,
        // Convenience accessors
        totalCount: enrichedItems.length,
        hasRealData: enrichedItems.some(item => item.hasRealMetadata),
    };
}

// Helper functions to extract filter data from NFT attributes
function extractCategory(attributes: any[] | undefined): string | null {
    if (!attributes || !Array.isArray(attributes)) return null;

    const categoryAttr = attributes.find(attr =>
        attr.trait_type?.toLowerCase() === 'category' ||
        attr.trait_type?.toLowerCase() === 'type' ||
        attr.trait_type?.toLowerCase() === 'genre'
    );

    return categoryAttr?.value || null;
}

function extractRarity(attributes: any[] | undefined): string | null {
    if (!attributes || !Array.isArray(attributes)) return null;

    const rarityAttr = attributes.find(attr =>
        attr.trait_type?.toLowerCase() === 'rarity' ||
        attr.trait_type?.toLowerCase() === 'rare' ||
        attr.trait_type?.toLowerCase() === 'tier'
    );

    return rarityAttr?.value || null;
}

/**
 * Enriches a marketplace item with NFT data for filtering and display
 */
function enrichMarketplaceItem(marketplaceItem: any, nftData: any): EnrichedMarketplaceItem {
    const hasMetadata = !!(nftData?.metadata);
    const hasStats = !!(nftData?.stats);

    return {
        // Marketplace data
        ...marketplaceItem,

        // NFT metadata
        name: nftData?.metadata?.name || `NFT #${marketplaceItem.tokenId}`,
        description: nftData?.metadata?.description || null,
        imageUrl: nftData?.imageUrl || null,
        attributes: nftData?.metadata?.attributes || [],

        // Filter properties - only use real data
        category: extractCategory(nftData?.metadata?.attributes) ||
            nftData?.insights?.category || 'Unknown',
        rarity: extractRarity(nftData?.metadata?.attributes) ||
            nftData?.insights?.rarity || 'unknown',
        averageRating: nftData?.stats?.averageRating || 0,
        ratingCount: nftData?.stats?.ratingCount || 0,
        favoriteCount: nftData?.stats?.favoriteCount || 0,
        watchlistCount: nftData?.stats?.watchlistCount || 0,
        viewCount: nftData?.stats?.viewCount || 0,

        // Insights
        customTitle: nftData?.insights?.customTitle || null,
        cardDescriptions: nftData?.insights?.cardDescriptions || null,
        tags: nftData?.insights?.tags || [],

        // Data quality flags
        hasRealStats: hasStats,
        hasRealMetadata: hasMetadata,
    };
}// ===== PERFORMANCE & OPTIMIZATION =====

/**
 * NFT list optimization with intelligent prefetching
 */
export function useNFTList(nfts: Array<{ contractAddress: string; tokenId: string }>) {
    const { preloader, getNFTData } = useNFTContext();

    useEffect(() => {
        if (nfts.length > 0) {
            preloader.preloadMultipleNFTs(nfts.map(nft => ({
                nftAddress: nft.contractAddress,
                tokenId: nft.tokenId
            })));
        }
    }, [nfts, preloader]);

    return useMemo(() => {
        return nfts.map(nft => {
            return getNFTData(nft.contractAddress, nft.tokenId) || null;
        }).filter(Boolean);
    }, [nfts, getNFTData]);
}

/**
 * Interaction-based preloading handlers
 */
export function useNFTInteractionPreload() {
    const { preloader } = useNFTContext();

    return {
        onHover: (contractAddress: string, tokenId: string) => {
            preloader.preloadNFTData(contractAddress, tokenId);
        },
        onFocus: (contractAddress: string, tokenId: string) => {
            preloader.preloadNFTData(contractAddress, tokenId);
        }
    };
}

/**
 * Performance monitoring and cache statistics
 */
export function useNFTPerformance() {
    const { getCacheStats } = useNFTContext();

    return useMemo(() => {
        const stats = getCacheStats();

        return {
            ...stats,
            loadingCount: 0,
            globalLoading: false,
            cacheKeys: [],
        };
    }, [getCacheStats]);
}
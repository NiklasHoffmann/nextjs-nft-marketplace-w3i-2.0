/**
 * Modern NFT Hooks - Core Marketplace Integration
 * 
 * This file provides modern hooks with unified data models and intelligent caching.
 * Integrates marketplace data with NFT metadata and real-time statistics.
 */

import { useModernNFT, useModernNFTContext } from '@/contexts/NFTContext';
import { useNFTStatsContext } from '@/contexts/NFTStatsContext';
import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_ITEMS } from '@/constants/subgraph.queries';

// ===== MODERN EXPORTS =====
export { useModernNFT, useModernNFTContext } from '@/contexts/NFTContext';

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
    const { loadMultipleNFTs, getNFT } = useModernNFTContext();
    const statsContext = useNFTStatsContext();

    // Force refresh counter - increment when stats change
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Listen for stats updates from detail pages
    useEffect(() => {
        const handleStatsUpdate = (event: CustomEvent) => {


            setRefreshCounter(prev => prev + 1);
        };

        window.addEventListener('nft-stats-updated', handleStatsUpdate as EventListener);
        return () => window.removeEventListener('nft-stats-updated', handleStatsUpdate as EventListener);
    }, []);

    const { data, loading, error, refetch } = useQuery(GET_ACTIVE_ITEMS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {

        },
        onError: (error) => {
            console.error('🚨 GraphQL Error:', error);
        }
    });

    // Use GraphQL data or empty array if no data available
    const rawItems = data?.items ?? [];

    // map only after we know we have an array
    const items = useMemo(
        () => {
            if (!Array.isArray(rawItems)) {
                console.warn('rawItems is not an array:', rawItems);
                return [];
            }

            const mappedItems = rawItems.map((e: any) => ({
                nftAddress: e.nftAddress,
                tokenId: e.tokenId,
                listingId: e.listingId,
                price: e.price,
                seller: e.seller,
                buyer: e.buyer,
                isListed: e.isListed,
                desiredNftAddress: e.desiredNftAddress,
                desiredTokenId: e.desiredTokenId,
            }));

            return mappedItems;
        },
        [rawItems, error]
    );

    // use items from above everywhere below
    useEffect(() => {
        if (Array.isArray(items) && items.length > 0) {
            const firstBatch = items.slice(0, 12).map((e: MarketplaceItem) => ({
                nftAddress: e.nftAddress,
                tokenId: e.tokenId,
            }));
            loadMultipleNFTs(firstBatch);

            // Load stats for the first batch of items
            firstBatch.forEach(({ nftAddress, tokenId }) => {
                const hasStats = statsContext.getStats(nftAddress, tokenId);
                const isLoading = statsContext.isLoading(nftAddress, tokenId);

                if (!hasStats && !isLoading) {

                    statsContext.loadStats(nftAddress, tokenId);
                } else {

                }
            });
        }
    }, [items, loadMultipleNFTs, statsContext]);

    // Create a dependency that changes when any stats change
    const statsChangeIndicator = useMemo(() => {
        if (!Array.isArray(items)) return 0;

        // Create a hash of all current stats to detect changes
        const indicator = items.reduce((acc, item) => {
            const stats = statsContext.getStats(item.nftAddress, item.tokenId);
            if (stats) {
                return acc + stats.lastUpdated + stats.favoriteCount + stats.viewCount + stats.averageRating + stats.watchlistCount;
            }
            return acc;
        }, 0);

        // Include refreshCounter to force recalculation when custom events fire
        const finalIndicator = indicator + refreshCounter * 1000000;

        return finalIndicator;
    }, [items, statsContext, refreshCounter]);

    // Enrich marketplace items with NFT data
    const enrichedItems = useMemo(() => {
        if (!Array.isArray(items)) {
            console.warn('items is not an array in enrichedItems:', items);
            return [];
        }
        return items.map((marketplaceItem: MarketplaceItem) => {
            const nftData = getNFT(marketplaceItem.nftAddress, marketplaceItem.tokenId);
            const realStats = statsContext.getStats(marketplaceItem.nftAddress, marketplaceItem.tokenId);

            const enriched = enrichMarketplaceItem(marketplaceItem, nftData, realStats);

            // Debug log for stats integration
            if (realStats) {

            } else {

            }

            return enriched;
        });
    }, [items, getNFT, statsContext, statsChangeIndicator, refreshCounter]);

    // Expose raw items for NFTCard props
    const marketplaceItems = items;

    return {
        items: enrichedItems,
        marketplaceItems, // Raw data for NFTCard props
        loading,
        error,
        refetch,
        // Convenience accessors
        totalCount: enrichedItems.length,
        hasRealData: enrichedItems.some((item: EnrichedMarketplaceItem) => item.hasRealMetadata),
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
function enrichMarketplaceItem(marketplaceItem: any, nftData: any, realStats?: any): EnrichedMarketplaceItem {
    const hasMetadata = !!(nftData?.core?.metadata);

    return {
        // Marketplace data
        ...marketplaceItem,

        // NFT metadata - use same path as NFTCard
        name: nftData?.meta?.name || nftData?.core?.name || nftData?.core?.metadata?.name || `NFT #${marketplaceItem.tokenId}`,
        description: nftData?.core?.metadata?.description || null,
        imageUrl: nftData?.core?.imageUrl || null,
        attributes: nftData?.core?.metadata?.attributes || [],

        // Contract info - correct path!
        symbol: nftData?.core?.contractSymbol || nftData?.insight?.symbol || nftData?.meta?.symbol || null,

        // Filter properties - use real stats from NFTStatsContext first, then fallback
        category: extractCategory(nftData?.core?.metadata?.attributes) ||
            nftData?.insight?.category || 'Art',
        rarity: extractRarity(nftData?.core?.metadata?.attributes) ||
            nftData?.insight?.rarity || 'common',
        averageRating: realStats?.averageRating ?? nftData?.stats?.averageRating ?? 0,
        ratingCount: realStats?.ratingCount ?? nftData?.stats?.ratingCount ?? 0,
        favoriteCount: realStats?.favoriteCount ?? nftData?.stats?.favoriteCount ?? 0,
        watchlistCount: realStats?.watchlistCount ?? nftData?.stats?.watchlistCount ?? 0,
        viewCount: realStats?.viewCount ?? nftData?.stats?.viewCount ?? 0,

        // Insights
        customTitle: nftData?.insight?.customTitle || null,
        cardDescriptions: nftData?.insight?.cardDescriptions || null,
        tags: nftData?.insight?.tags || [],

        // Data quality flags
        hasRealStats: !!(realStats || nftData?.stats),
        hasRealMetadata: hasMetadata,
    };
}
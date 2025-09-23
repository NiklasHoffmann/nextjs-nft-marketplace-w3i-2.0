/**
 * Modern NFT Hooks - Clean architecture using AggregatedNFT
 * This file provides modern hooks with unified data models and intelligent caching.
 */

import { useModernNFT, useModernNFTContext } from '@/contexts/NFTContext';
import { useMemo, useEffect } from 'react';
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

    const { data, loading, error, refetch } = useQuery(GET_ACTIVE_ITEMS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {
            console.log('🔍 GraphQL Response:', {
                hasData: !!data,
                itemsCount: data?.items?.length || 0,
                firstItem: data?.items?.[0],
                error: null
            });
        },
        onError: (error) => {
            console.error('🚨 GraphQL Error:', error);
            console.warn('⚠️ Falling back to mock data due to GraphQL unavailability');
        }
    });

    // Fallback mock data when GraphQL is unavailable
    const mockItems = useMemo(() => [
        // Collection 1: 0xb43a16451eb224539ce491349d49ecefe96013b6
        {
            listingId: "mock-1",
            nftAddress: "0xb43a16451eb224539ce491349d49ecefe96013b6",
            tokenId: "1",
            isListed: true,
            price: "1000000000000000000", // 1 ETH in wei
            seller: "0x8BbA5E9b30E986C55465fEaC4D3417791065d1bb",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        {
            listingId: "mock-1b",
            nftAddress: "0xb43a16451eb224539ce491349d49ecefe96013b6",
            tokenId: "14",
            isListed: true,
            price: "1200000000000000000", // 1.2 ETH in wei
            seller: "0x8BbA5E9b30E986C55465fEaC4D3417791065d1bb",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        {
            listingId: "mock-1c",
            nftAddress: "0xb43a16451eb224539ce491349d49ecefe96013b6",
            tokenId: "125",
            isListed: true,
            price: "800000000000000000", // 0.8 ETH in wei
            seller: "0x8BbA5E9b30E986C55465fEaC4D3417791065d1bb",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        // Collection 2: 0x41655ae49482de69eec8f6875c34a8ada01965e2
        {
            listingId: "mock-2",
            nftAddress: "0x41655ae49482de69eec8f6875c34a8ada01965e2",
            tokenId: "378",
            isListed: true,
            price: "2500000000000000000", // 2.5 ETH in wei
            seller: "0xf034e8ad11F249c8081d9da94852bE1734bc11a4",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        {
            listingId: "mock-2b",
            nftAddress: "0x41655ae49482de69eec8f6875c34a8ada01965e2",
            tokenId: "11",
            isListed: true,
            price: "1800000000000000000", // 1.8 ETH in wei
            seller: "0xf034e8ad11F249c8081d9da94852bE1734bc11a4",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        // Collection 3: 0xfdbc878ad5560de5f205a0c428d983d992c7406a
        {
            listingId: "mock-3",
            nftAddress: "0xfdbc878ad5560de5f205a0c428d983d992c7406a",
            tokenId: "862",
            isListed: true,
            price: "500000000000000000", // 0.5 ETH in wei
            seller: "0x530421c0D94e40A97648817CDd0A5C56dD9E09fd",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        },
        {
            listingId: "mock-3b",
            nftAddress: "0xfdbc878ad5560de5f205a0c428d983d992c7406a",
            tokenId: "539",
            isListed: true,
            price: "600000000000000000", // 0.6 ETH in wei
            seller: "0x530421c0D94e40A97648817CDd0A5C56dD9E09fd",
            buyer: null,
            desiredNftAddress: "0x0000000000000000000000000000000000000000",
            desiredTokenId: "0"
        }
    ], []);

    // Use GraphQL data if available, otherwise fallback to mock data
    const rawItems = data?.items ?? (error ? mockItems : []);

    // DEBUG: Log what we get from GraphQL
    console.log('🔍 useActiveItems rawItems:', {
        hasData: !!data,
        rawItemsLength: rawItems.length,
        rawItems: rawItems.slice(0, 2), // First 2 items
        loading,
        error: error?.message,
        usingFallback: !!error && rawItems.length > 0
    });

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

            console.log('📋 Mapped marketplace items:', {
                count: mappedItems.length,
                firstItem: mappedItems[0],
                hasNftAddress: mappedItems[0]?.nftAddress ? 'YES' : 'NO',
                source: error ? 'FALLBACK' : 'GRAPHQL'
            });

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
        }
    }, [items, loadMultipleNFTs]);

    // Enrich marketplace items with NFT data
    const enrichedItems = useMemo(() => {
        if (!Array.isArray(items)) {
            console.warn('items is not an array in enrichedItems:', items);
            return [];
        }
        return items.map((marketplaceItem: MarketplaceItem) => {
            const nftData = getNFT(marketplaceItem.nftAddress, marketplaceItem.tokenId);
            return enrichMarketplaceItem(marketplaceItem, nftData);
        });
    }, [items, getNFT]);

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
function enrichMarketplaceItem(marketplaceItem: any, nftData: any): EnrichedMarketplaceItem {
    const hasMetadata = !!(nftData?.core?.metadata);
    const hasStats = !!(nftData?.stats);

    return {
        // Marketplace data
        ...marketplaceItem,

        // NFT metadata
        name: nftData?.core?.metadata?.name || `NFT #${marketplaceItem.tokenId}`,
        description: nftData?.core?.metadata?.description || null,
        imageUrl: nftData?.core?.imageUrl || null,
        attributes: nftData?.core?.metadata?.attributes || [],

        // Filter properties - only use real data
        category: extractCategory(nftData?.core?.metadata?.attributes) ||
            nftData?.insight?.category || 'Unknown',
        rarity: extractRarity(nftData?.core?.metadata?.attributes) ||
            nftData?.insight?.rarity || 'unknown',
        averageRating: nftData?.stats?.averageRating || 0,
        ratingCount: nftData?.stats?.ratingCount || 0,
        favoriteCount: nftData?.stats?.favoriteCount || 0,
        watchlistCount: nftData?.stats?.watchlistCount || 0,
        viewCount: nftData?.stats?.viewCount || 0,

        // Insights
        customTitle: nftData?.insight?.customTitle || null,
        cardDescriptions: nftData?.insight?.cardDescriptions || null,
        tags: nftData?.insight?.tags || [],

        // Data quality flags
        hasRealStats: hasStats,
        hasRealMetadata: hasMetadata,
    };
}
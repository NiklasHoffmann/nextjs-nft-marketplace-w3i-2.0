"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface NFTMetadata {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

interface NFTMetadataResponse {
    metadata: NFTMetadata | null;
    imageUrl: string | null;
    cached: boolean;
}

// Client-side cache für bereits geladene NFT Metadaten
const clientCache = new Map<string, NFTMetadataResponse>();

async function fetchNFTMetadata(nftAddress: string, tokenId: string): Promise<NFTMetadataResponse> {
    const cacheKey = `${nftAddress}-${tokenId}`;

    // Check client-side cache first
    if (clientCache.has(cacheKey)) {
        return clientCache.get(cacheKey)!;
    }

    // Fetch from our API route (which has server-side caching)
    const response = await fetch(`/api/nft-metadata?address=${nftAddress}&tokenId=${tokenId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const data: NFTMetadataResponse = await response.json();

    // Cache successful responses client-side
    if (data.metadata || data.imageUrl) {
        clientCache.set(cacheKey, data);
    }

    return data;
}

export function useNFTMetadataOptimized(nftAddress: string, tokenId: string) {
    // Use React Query for advanced caching, stale-while-revalidate, etc.
    const {
        data,
        isLoading,
        error,
        isStale
    } = useQuery({
        queryKey: ['nft-metadata', nftAddress, tokenId],
        queryFn: () => fetchNFTMetadata(nftAddress, tokenId),
        enabled: !!nftAddress && !!tokenId,
        staleTime: 1000 * 60 * 15, // 15 Minuten - Daten gelten als "fresh"
        gcTime: 1000 * 60 * 30, // 30 Minuten - wie lange im Cache behalten
        retry: 2, // Retry failed requests 2 times
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnReconnect: true, // Refetch when network reconnects
    });

    // Memoize return values to prevent unnecessary re-renders
    return useMemo(() => ({
        metadata: data?.metadata || null,
        imageUrl: data?.imageUrl || null,
        loading: isLoading,
        error: error?.message || null,
        cached: data?.cached || false,
        stale: isStale
    }), [data, isLoading, error, isStale]);
}

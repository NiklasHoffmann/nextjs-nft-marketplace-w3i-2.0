"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useModernNFTContext } from '@/contexts/NFTContext';
import { useActiveItems } from '@/hooks';
import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

// Import the types from the API route
interface ExternalNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    image?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    contractName?: string;
    contractSymbol?: string;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string;
}

interface WalletNFTsResponse {
    success: boolean;
    data?: ExternalNFT[];
    total?: number;
    error?: string;
    source?: 'alchemy' | 'moralis';
}

// Enhanced NFT data that combines external API data with context data
// Moderne Version: Verwendet AggregatedNFT + externe API Daten
interface EnhancedAggregatedNFT extends AggregatedNFT {
    // Additional fields from external APIs
    description?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string;
    // Marketplace data (if available)
    marketplaceData?: {
        listingId: string;
        price: string;
        seller: string;
        buyer: string;
        isListed: boolean;
        desiredNftAddress?: string;
        desiredTokenId?: string;
    };
    // Data source indicators
    hasContextData: boolean;
    hasExternalData: boolean;
    dataSource: 'context' | 'external' | 'hybrid';
}

interface UseWalletNFTsOptions {
    /** Auto-fetch on mount */
    autoFetch?: boolean;
    /** Include context data (already loaded NFTs) */
    includeContext?: boolean;
    /** Refresh interval in milliseconds */
    refreshInterval?: number;
    /** API source preference */
    source?: 'alchemy' | 'moralis' | 'auto';
}

interface UseWalletNFTsReturn {
    /** External NFTs for the wallet */
    nfts: EnhancedAggregatedNFT[];
    /** Context NFTs (from AggregatedNFT cache) */
    contextNFTs: AggregatedNFT[];
    /** Total count */
    count: number;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Data source used */
    source: 'alchemy' | 'moralis' | null;
    /** Manually fetch/refresh data */
    fetch: () => Promise<void>;
    /** Refresh data */
    refresh: () => Promise<void>;
    /** Clear data */
    clear: () => void;
}

/**
 * Hook for fetching ALL NFTs for a wallet address
 * Combines external API data with context cache for comprehensive results
 */
export function useWalletNFTs(
    walletAddress: string | undefined,
    options: UseWalletNFTsOptions = {}
): UseWalletNFTsReturn {
    const {
        autoFetch = true,
        includeContext = true,
        refreshInterval,
        source = 'auto'
    } = options;

    const nftContext = useModernNFTContext();
    // Get marketplace data to identify listed items
    const { items: marketplaceItems } = useActiveItems();

    // State
    const [externalNFTs, setExternalNFTs] = useState<ExternalNFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'alchemy' | 'moralis' | null>(null);

    // Create marketplace lookup map for faster searches
    const marketplaceLookup = useMemo(() => {
        const lookup = new Map<string, any>();
        marketplaceItems?.forEach((item: any) => {
            const key = `${item.nftAddress.toLowerCase()}-${item.tokenId}`;
            lookup.set(key, item);
        });
        return lookup;
    }, [marketplaceItems]);

    // Convert external NFT to enhanced AggregatedNFT data
    const convertToCardData = useCallback((externalNFT: ExternalNFT): EnhancedAggregatedNFT => {
        // Modern approach: Use getNFT and map AggregatedNFT → EnhancedAggregatedNFT
        const contextData = nftContext.getNFT(externalNFT.contractAddress, externalNFT.tokenId);

        // Check marketplace listing status
        const marketplaceKey = `${externalNFT.contractAddress.toLowerCase()}-${externalNFT.tokenId}`;
        const marketplaceData = marketplaceLookup.get(marketplaceKey);

        if (contextData) {
            // Hybrid data: Enhance AggregatedNFT with external data
            return {
                ...contextData,
                // Override listing status with marketplace data if available
                listed: marketplaceData?.isListed || contextData.listed,
                // Store marketplace data separately
                marketplaceData: marketplaceData ? {
                    listingId: marketplaceData.listingId,
                    price: marketplaceData.price,
                    seller: marketplaceData.seller,
                    buyer: marketplaceData.buyer,
                    isListed: marketplaceData.isListed,
                    desiredNftAddress: marketplaceData.desiredNftAddress,
                    desiredTokenId: marketplaceData.desiredTokenId
                } : undefined,
                // Additional external data
                description: externalNFT.description,
                animationUrl: externalNFT.animationUrl,
                attributes: externalNFT.attributes,
                tokenType: externalNFT.tokenType,
                balance: externalNFT.balance,
                // Data source indicators
                hasContextData: true,
                hasExternalData: true,
                dataSource: 'hybrid'
            };
        } else {
            // External-only data: Create AggregatedNFT structure from external data
            return {
                key: `${externalNFT.contractAddress.toLowerCase()}-${externalNFT.tokenId}` as `${string}-${string}`,
                nftAddress: externalNFT.contractAddress as `0x${string}`,
                tokenId: externalNFT.tokenId,
                listed: marketplaceData?.isListed || false, // Use marketplace data for listing status
                // Store marketplace data separately
                marketplaceData: marketplaceData ? {
                    listingId: marketplaceData.listingId,
                    price: marketplaceData.price,
                    seller: marketplaceData.seller,
                    buyer: marketplaceData.buyer,
                    isListed: marketplaceData.isListed,
                    desiredNftAddress: marketplaceData.desiredNftAddress,
                    desiredTokenId: marketplaceData.desiredTokenId
                } : undefined,
                core: {
                    nftAddress: externalNFT.contractAddress as `0x${string}`,
                    tokenId: externalNFT.tokenId,
                    tokenURI: null,
                    name: externalNFT.name || null,
                    owner: null, // Would need to be fetched separately
                    symbol: externalNFT.contractSymbol || null,
                    contractName: externalNFT.contractName || null,
                    contractSymbol: externalNFT.contractSymbol || null
                },
                meta: {
                    name: externalNFT.name,
                    description: externalNFT.description,
                    image: externalNFT.image,
                    attributes: externalNFT.attributes?.map(attr => ({
                        trait_type: attr.trait_type,
                        value: attr.value
                    })),
                    animationUrl: externalNFT.animationUrl
                },
                lastUpdated: Date.now(),
                sources: {
                    blockchain: false,
                    metadata: true,
                    marketplace: false,
                    social: false,
                    insights: false
                },
                // Additional external data
                description: externalNFT.description,
                animationUrl: externalNFT.animationUrl,
                attributes: externalNFT.attributes,
                tokenType: externalNFT.tokenType,
                balance: externalNFT.balance,
                // Data source indicators
                hasContextData: false,
                hasExternalData: true,
                dataSource: 'external'
            };
        }
    }, [nftContext, marketplaceLookup]);

    // Fetch NFTs from external API
    const fetchExternalNFTs = useCallback(async () => {
        if (!walletAddress) {
            setExternalNFTs([]);
            setDataSource(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                address: walletAddress,
                source
            });

            const response = await fetch(`/api/wallet/nfts?${params}`);
            const result: WalletNFTsResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch wallet NFTs');
            }

            setExternalNFTs(result.data || []);
            setDataSource(result.source || null);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet NFTs';
            setError(errorMessage);
            console.error('❌ Error fetching wallet NFTs:', err);
        } finally {
            setLoading(false);
        }
    }, [walletAddress, source]);

    // Get context NFTs (already loaded)
    const contextNFTs = useMemo(() => {
        if (!includeContext || !walletAddress) return [];
        return nftContext.getNFTsByOwner(walletAddress);
    }, [nftContext, walletAddress, includeContext]);

    // Combine external and context NFTs
    const combinedNFTs = useMemo(() => {
        const external = externalNFTs.map(convertToCardData);

        // For now, only return external NFTs to avoid type conflicts
        // Context NFTs (AggregatedNFT[]) can be accessed separately via nftContext.getNFTsByOwner()
        return external;
    }, [externalNFTs, convertToCardData]);

    // Auto-fetch on mount and when wallet changes
    useEffect(() => {
        if (autoFetch) {
            fetchExternalNFTs();
        }
    }, [autoFetch, fetchExternalNFTs]);

    // Auto-refresh interval
    useEffect(() => {
        if (!refreshInterval || !walletAddress) return;

        const interval = setInterval(() => {
            fetchExternalNFTs();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval, walletAddress, fetchExternalNFTs]);

    // Clear data
    const clear = useCallback(() => {
        setExternalNFTs([]);
        setError(null);
        setDataSource(null);
    }, []);

    return {
        nfts: combinedNFTs,
        contextNFTs, // Add separate access to AggregatedNFT[]
        count: combinedNFTs.length,
        loading,
        error,
        source: dataSource,
        fetch: fetchExternalNFTs,
        refresh: fetchExternalNFTs,
        clear
    };
}

export type { EnhancedAggregatedNFT, UseWalletNFTsOptions, UseWalletNFTsReturn };
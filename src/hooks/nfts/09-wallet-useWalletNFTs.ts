import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNFTContext } from '@/contexts/NFTContext';
import type { NFTCardData } from '@/types/nft-context';

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
interface EnhancedNFTCardData extends NFTCardData {
    // Additional fields from external APIs
    description?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string;
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
    /** All NFTs for the wallet */
    nfts: EnhancedNFTCardData[];
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

    const nftContext = useNFTContext();

    // State
    const [externalNFTs, setExternalNFTs] = useState<ExternalNFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'alchemy' | 'moralis' | null>(null);

    // Convert external NFT to enhanced card data
    const convertToCardData = useCallback((externalNFT: ExternalNFT): EnhancedNFTCardData => {
        // Check if we have context data for this NFT
        const contextData = nftContext.getNFTCardData(externalNFT.contractAddress, externalNFT.tokenId);

        return {
            nftAddress: externalNFT.contractAddress,
            tokenId: externalNFT.tokenId,
            // Prefer context data when available, fallback to external
            imageUrl: contextData?.imageUrl || externalNFT.image || null,
            name: contextData?.name || externalNFT.name || null,
            contractInfo: contextData?.contractInfo || {
                name: externalNFT.contractName || undefined,
                symbol: externalNFT.contractSymbol || undefined,
                owner: undefined,
                totalSupply: undefined
            },
            // Marketplace data (only from context)
            price: contextData?.price || null,
            listingId: contextData?.listingId || null,
            isListed: contextData?.isListed || false,
            // Insights (only from context)
            customTitle: contextData?.customTitle || null,
            category: contextData?.category || null,
            cardDescriptions: contextData?.cardDescriptions || null,
            rarity: contextData?.rarity || null,
            // Stats (only from context)
            averageRating: contextData?.averageRating || null,
            ratingCount: contextData?.ratingCount || null,
            likeCount: contextData?.likeCount || null,
            watchlistCount: contextData?.watchlistCount || null,
            // Meta
            lastUpdated: contextData?.lastUpdated || Date.now(),
            // Additional external data
            description: externalNFT.description,
            animationUrl: externalNFT.animationUrl,
            attributes: externalNFT.attributes,
            tokenType: externalNFT.tokenType,
            balance: externalNFT.balance,
            // Data source indicators
            hasContextData: !!contextData,
            hasExternalData: true,
            dataSource: contextData ? 'hybrid' : 'external'
        };
    }, [nftContext]);

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
            console.log('✅ Fetched', result.data?.length || 0, 'NFTs from', result.source);

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
        return nftContext.getNFTsByWallet(walletAddress).map(nft => ({
            ...nft,
            // Additional fields for enhanced data
            description: undefined,
            animationUrl: undefined,
            attributes: undefined,
            tokenType: undefined,
            balance: undefined,
            hasContextData: true,
            hasExternalData: false,
            dataSource: 'context' as const
        }));
    }, [nftContext, walletAddress, includeContext]);

    // Combine external and context NFTs
    const combinedNFTs = useMemo(() => {
        const external = externalNFTs.map(convertToCardData);

        if (!includeContext) {
            return external;
        }

        // Create a map for efficient lookup
        const externalMap = new Map(
            external.map(nft => [`${nft.nftAddress}-${nft.tokenId}`, nft])
        );

        // Add context NFTs that aren't in external data
        const contextOnly = contextNFTs.filter(nft =>
            !externalMap.has(`${nft.nftAddress}-${nft.tokenId}`)
        );

        return [...external, ...contextOnly];
    }, [externalNFTs, contextNFTs, convertToCardData, includeContext]);

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
        count: combinedNFTs.length,
        loading,
        error,
        source: dataSource,
        fetch: fetchExternalNFTs,
        refresh: fetchExternalNFTs,
        clear
    };
}

export type { EnhancedNFTCardData, UseWalletNFTsOptions, UseWalletNFTsReturn };
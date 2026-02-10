/**
 * Wallet NFTs Hook V2
 * 
 * Simple data fetching for wallet NFTs without filters
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

interface UseWalletNFTsV2Options {
    walletAddress?: string;
    autoFetch?: boolean;
}

interface UseWalletNFTsV2Return {
    nfts: WalletNFT[];
    loading: boolean;
    error: string | null;
    total: number;
    listed: number;
    unlisted: number;
    refresh: () => Promise<void>;
}

export function useWalletNFTsV2({
    walletAddress,
    autoFetch = true
}: UseWalletNFTsV2Options): UseWalletNFTsV2Return {
    const [nfts, setNfts] = useState<WalletNFT[]>([]);
    const [loading, setLoading] = useState(autoFetch); // Start with true if autoFetch enabled
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, listed: 0, unlisted: 0 });
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchNFTs = useCallback(async () => {
        if (!walletAddress) {
            // Don't clear NFTs or change loading state if no wallet address
            // This prevents flashing when wallet is reconnecting
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            // Simple URL with just wallet address
            const params = new URLSearchParams();
            params.append('walletAddress', walletAddress);

            const response = await fetch(`/api/user/nfts?${params.toString()}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch NFTs');
            }

            // Map to WalletNFT format
            const walletNFTs: WalletNFT[] = data.data.nfts.map((nft: any) => ({
                contractAddress: nft.contractAddress,
                tokenId: nft.tokenId,
                name: nft.metadata?.name,
                description: nft.metadata?.description,
                image: nft.metadata?.image,
                animationUrl: nft.metadata?.animationUrl,
                attributes: nft.metadata?.attributes,
                contractName: nft.contract?.name,
                contractSymbol: nft.contract?.symbol,
                tokenType: nft.contract?.contractType || 'ERC721',
                totalSupply: nft.contract?.totalSupply,
                owner: nft.contract?.owner || nft.currentOwner,
                tokenURI: nft.contract?.tokenURI,
                approved: nft.contract?.approved,
                ownerBalance: nft.contract?.ownerBalance,
                isListed: nft.isListed || false,
                // Use flattened fields from API (from $addFields), fallback to listings array
                listingPrice: nft.price || nft.listings?.[0]?.price,
                listingId: nft.listingId || nft.listings?.[0]?.listingId,
                seller: nft.seller || nft.listings?.[0]?.seller,
                currency: nft.currency || nft.listings?.[0]?.currency,
                listingType: nft.listingType || nft.listings?.[0]?.listingType,
                hasMarketplaceData: !!nft.listings?.length,
                hasInsightsData: !!nft.insights,
                insights: nft.insights,
                stats: nft.stats ? {
                    likeCount: nft.stats.likeCount,
                    viewCount: nft.stats.viewCount,
                    averageRating: nft.stats.averageRating,
                    watchlistCount: nft.stats.watchlistCount,
                    ratingCount: nft.stats.ratingCount
                } : undefined
            }));

            setNfts(walletNFTs);
            setStats({
                total: data.data.total || walletNFTs.length,
                listed: data.data.listed || 0,
                unlisted: data.data.unlisted || 0
            });
            setLoading(false); // Set loading false immediately after setting data

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch wallet NFTs:', err);
                setError(err.message || 'Failed to fetch NFTs');
                setLoading(false); // Set loading false on error too
            }
        }
    }, [walletAddress]);

    // Auto-fetch when wallet address becomes available
    useEffect(() => {
        if (autoFetch && walletAddress) {
            fetchNFTs();
        }
    }, [autoFetch, walletAddress, fetchNFTs]);

    return {
        nfts,
        loading,
        error,
        total: stats.total,
        listed: stats.listed,
        unlisted: stats.unlisted,
        refresh: fetchNFTs
    };
}

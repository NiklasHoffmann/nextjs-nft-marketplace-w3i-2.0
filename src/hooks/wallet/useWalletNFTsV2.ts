/**
 * Wallet NFTs Hook V2
 * 
 * Simple data fetching for wallet NFTs without filters
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

type WalletCacheEntry = {
    nfts: WalletNFT[];
    stats: { total: number; listed: number; unlisted: number };
    fetchedAt: number;
};

const walletCache = new Map<string, WalletCacheEntry>();
const walletInFlight = new Map<string, Promise<void>>();
const CACHE_TTL_MS = 10_000;

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
    const lastFetchRef = useRef<number>(0);
    const nextAllowedAtRef = useRef<number>(0);
    const previousAddressRef = useRef<string | null>(null);

    useEffect(() => {
        const normalizedAddress = walletAddress?.toLowerCase() || null;

        if (previousAddressRef.current && previousAddressRef.current !== normalizedAddress) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            setNfts([]);
            setStats({ total: 0, listed: 0, unlisted: 0 });
            setError(null);
            setLoading(autoFetch && !!walletAddress);
            lastFetchRef.current = 0;
            nextAllowedAtRef.current = 0;
        }

        previousAddressRef.current = normalizedAddress;
    }, [walletAddress, autoFetch]);

    const fetchNFTs = useCallback(async () => {
        if (!walletAddress) {
            // Don't clear NFTs or change loading state if no wallet address
            // This prevents flashing when wallet is reconnecting
            return;
        }

        const cacheKey = walletAddress.toLowerCase();
        const cached = walletCache.get(cacheKey);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            setNfts(cached.nfts);
            setStats(cached.stats);
            setLoading(false);
            return;
        }

        const inFlight = walletInFlight.get(cacheKey);
        if (inFlight) {
            await inFlight;
            const refreshed = walletCache.get(cacheKey);
            if (refreshed) {
                setNfts(refreshed.nfts);
                setStats(refreshed.stats);
                setLoading(false);
            }
            return;
        }

        const now = Date.now();
        if (now < nextAllowedAtRef.current) {
            return;
        }

        if (now - lastFetchRef.current < 3000) {
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const controller = abortControllerRef.current;

        setLoading(true);
        setError(null);

        const requestPromise = (async () => {
            // Simple URL with just wallet address
            const params = new URLSearchParams();
            params.append('walletAddress', walletAddress);

            const response = await fetch(`/api/user/nfts?${params.toString()}`, {
                signal: controller.signal
            });

            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfterHeader = response.headers.get('retry-after');
                    const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 30;
                    nextAllowedAtRef.current = Date.now() + (Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 30000);
                    setError('Zu viele Anfragen. Bitte kurz warten und erneut versuchen.');
                    setLoading(false);
                    return;
                }

                if (response.status === 403 || response.status === 401) {
                    setNfts([]);
                    setStats({ total: 0, listed: 0, unlisted: 0 });
                    setError('Session passt nicht zur aktuellen Wallet. Bitte neu verbinden.');
                    setLoading(false);
                    return;
                }

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
                listingPrice: nft.price ?? nft.listings?.[0]?.price,
                listingId: nft.listingId ?? nft.listings?.[0]?.listingId,
                seller: nft.seller ?? nft.listings?.[0]?.seller,
                currency: nft.currency ?? nft.listings?.[0]?.currency,
                listingType: nft.listingType ?? nft.listings?.[0]?.listingType,
                listingStatus: nft.listingStatus ?? nft.listings?.[0]?.status ?? null,
                listingTokenStandard: nft.listingTokenStandard ?? nft.listings?.[0]?.tokenStandard ?? null,
                erc1155QuantityListed: nft.erc1155QuantityListed ?? nft.listings?.[0]?.erc1155QuantityListed ?? null,
                remainingQuantity: nft.remainingQuantity ?? nft.listings?.[0]?.remainingQuantity ?? null,
                unitPrice: nft.unitPrice ?? nft.listings?.[0]?.unitPrice ?? null,
                partialBuyEnabled: nft.partialBuyEnabled ?? nft.listings?.[0]?.partialBuyEnabled ?? false,
                desiredContractAddress: nft.desiredContractAddress ?? nft.desiredTokenAddress ?? nft.listings?.[0]?.desiredContractAddress ?? nft.listings?.[0]?.desiredTokenAddress,
                desiredTokenAddress: nft.desiredTokenAddress ?? nft.desiredContractAddress ?? nft.listings?.[0]?.desiredTokenAddress ?? nft.listings?.[0]?.desiredContractAddress,
                desiredTokenId: nft.desiredTokenId ?? nft.listings?.[0]?.desiredTokenId,
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
            walletCache.set(cacheKey, {
                nfts: walletNFTs,
                stats: {
                    total: data.data.total || walletNFTs.length,
                    listed: data.data.listed || 0,
                    unlisted: data.data.unlisted || 0
                },
                fetchedAt: Date.now()
            });
            lastFetchRef.current = Date.now();
            setLoading(false); // Set loading false immediately after setting data
        })();

        walletInFlight.set(cacheKey, requestPromise);

        try {
            await requestPromise;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                devLog.error('Failed to fetch wallet NFTs:', err);
                setError(err.message || 'Failed to fetch NFTs');
                setLoading(false); // Set loading false on error too
            }
        } finally {
            walletInFlight.delete(cacheKey);
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

/**
 * Wallet NFTs Hook V2
 * 
 * Simple data fetching for wallet NFTs without filters
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { devLog } from '@/utils';
import { WalletNFTsService, type WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

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
    const previousAddressRef = useRef<string | null>(null);
    const lastHiddenAtRef = useRef<number>(Date.now());

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
        }

        previousAddressRef.current = normalizedAddress;
    }, [walletAddress, autoFetch]);

    const fetchNFTs = useCallback(async (forceSync: boolean = false) => {
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

        if (!forceSync && now - lastFetchRef.current < 3000) {
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
            const walletNFTs = await WalletNFTsService.fetchWalletNFTs(walletAddress, {
                forceSync
            });
            if (controller.signal.aborted) {
                return;
            }

            const listedCount = walletNFTs.filter(nft => nft.isListed).length;
            const totalCount = walletNFTs.length;

            setNfts(walletNFTs);
            setStats({
                total: totalCount,
                listed: listedCount,
                unlisted: totalCount - listedCount
            });
            walletCache.set(cacheKey, {
                nfts: walletNFTs,
                stats: {
                    total: totalCount,
                    listed: listedCount,
                    unlisted: totalCount - listedCount
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
            fetchNFTs(false);
        }
    }, [autoFetch, walletAddress, fetchNFTs]);

    useEffect(() => {
        if (!walletAddress) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                lastHiddenAtRef.current = Date.now();
                return;
            }

            const hiddenDuration = Date.now() - lastHiddenAtRef.current;
            if (hiddenDuration > 5000) {
                void fetchNFTs(true);
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [walletAddress, fetchNFTs]);

    return {
        nfts,
        loading,
        error,
        total: stats.total,
        listed: stats.listed,
        unlisted: stats.unlisted,
        refresh: () => fetchNFTs(true)
    };
}

'use client';

/**
 * Wallet NFTs Context (Refactored)
 *
 * Manages NFTs owned by the connected wallet. This is separate from marketplace items
 * and provides data for:
 * - Wallet Dashboard (showing user's NFT collection)
 * - Sell Page (selecting NFTs to list)
 * - Trade Page (selecting NFTs for trade offers)
 *
 * Data Source: External APIs (Alchemy/Moralis) + enrichment from MongoDB
 *
 * Features:
 * - Auto-loads NFTs when wallet connects
 * - Caches NFT data per wallet address
 * - Enriches external data with marketplace status
 * - Handles loading/error states
 * - Auto-refresh on wallet change
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { devLog } from '@/utils';
import { WalletNFTsService, type WalletNFT } from './WalletNFTsService';
import {
    onDataInvalidation,
    type InvalidationEventDetail,
    GLOBAL_INVALIDATION_TYPES,
    WALLET_LISTING_INVALIDATION_TYPES,
    DB_SYNC_DELAY_MS,
    createDebouncedScheduler
} from '@/services/validation';
import { WalletNFTsCache, type WalletNFTsState } from './WalletNFTsCache';
import { useContextDevtools } from '@/hooks/useContextDevtools';

interface WalletNFTsContextType {
    // NFT data
    nfts: WalletNFT[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Stats
    totalCount: number;
    listedCount: number;
    unlistedCount: number;
    totalListedValue: number; // Total ETH value of listed NFTs

    // Actions
    refresh: () => Promise<void>;
    clear: () => void;

    // Helpers
    getNFT: (contractAddress: string, tokenId: string) => WalletNFT | undefined;
    getNFTsByCollection: (contractAddress: string) => WalletNFT[];
    getUnlistedNFTs: () => WalletNFT[];
    getListedNFTs: () => WalletNFT[];
}

const WalletNFTsContext = createContext<WalletNFTsContextType | undefined>(undefined);

export function WalletNFTsProvider({ children }: { children: React.ReactNode }) {
    const { address } = useAccount();
    const [state, setState] = useState<WalletNFTsState>(WalletNFTsCache.createInitialState());
    const cache = useMemo(() => new WalletNFTsCache(), []);
    const listingRetryScheduler = useMemo(() => createDebouncedScheduler(), []);

    /**
     * Fetch NFTs for the connected wallet using the service
     */
    const fetchWalletNFTs = useCallback(async (walletAddress: string): Promise<void> => {
        setState(WalletNFTsCache.createLoadingState());

        try {
            const nfts = await WalletNFTsService.fetchWalletNFTs(walletAddress);
            const normalizedNfts = Array.isArray(nfts) ? nfts : [];

            if (!Array.isArray(nfts)) {
                devLog.warn('wallet-nfts', '⚠️ Service returned non-array payload, defaulting to empty list');
            }

            // Force new array and object references to trigger React re-renders
            const freshNfts = normalizedNfts.map(nft => ({ ...nft }));
            
            const newState = WalletNFTsCache.createSuccessState(freshNfts);

            devLog.info('wallet-nfts', `✅ Fetched ${freshNfts.length} NFTs, setting new state`);
            setState(newState);
            cache.set(walletAddress, freshNfts);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            devLog.error('wallet-nfts', '🔴 [WalletNFTsContext] ========== ERROR ==========');
            devLog.error('wallet-nfts', '❌ Error:', errorMessage);
            devLog.error('wallet-nfts', 'Stack:', error);
            devLog.error('wallet-nfts', '==============================================\n');

            setState(WalletNFTsCache.createErrorState(errorMessage));
        }
    }, [cache]);

    /**
     * Auto-load NFTs as soon as wallet address is available
     * Implements Stale-While-Revalidate pattern for better UX
     */
    useEffect(() => {
        if (!address) {
            setState(WalletNFTsCache.createInitialState());
            return;
        }

        const lowerAddress = address.toLowerCase();

        // Check cache first
        const cached = cache.get(lowerAddress);
        if (cached) {
            // Show cached data immediately
            setState(cached);

            // But indicate we're refreshing in background
            const cacheAge = Date.now() - (cached.lastFetched || 0);
            const shouldRefresh = cacheAge > 30000; // Refresh if older than 30s

            if (shouldRefresh) {
                devLog.info('wallet-nfts', `📊 Showing cached data (${Math.round(cacheAge / 1000)}s old), refreshing in background...`);
                // Background refresh without showing loading state
                fetchWalletNFTs(address);
            }
            return;
        }

        // Fetch fresh data (no cache)
        devLog.info('wallet-nfts', '🔄 [WalletNFTsContext] Cache miss, fetching fresh data');
        fetchWalletNFTs(address);
    }, [address, fetchWalletNFTs, cache]);

    /**
     * Refresh NFTs
     */
    const refresh = useCallback(async () => {
        if (!address) return;
        devLog.info('wallet-nfts', '🔄 [WalletNFTsContext] Manual refresh requested, clearing cache');
        cache.invalidate(address);
        await fetchWalletNFTs(address);
    }, [address, fetchWalletNFTs, cache]);

    /**
     * Clear NFT data
     */
    const clear = useCallback(() => {
        setState(WalletNFTsCache.createInitialState());
        cache.invalidate();
    }, [cache]);

    /**
     * Listen for data invalidation events from other parts of the app
     * (e.g., after listing, purchasing, or canceling NFTs)
     */
    useEffect(() => {
        let pendingRefreshPromise: Promise<void> | null = null;

        const unsubscribe = onDataInvalidation(async (detail: InvalidationEventDetail) => {
            devLog.info('wallet-nfts', `🔔 Received invalidation event:`, detail);

            // Refresh wallet NFTs if:
            // 1. Manual refresh or graph update (affects all)
            // 2. Listing/purchase/cancel involving current wallet's NFT
            // 3. Transfer involving current wallet
            // 4. Listing created/canceled (affects all wallets that own NFTs)
            const shouldRefresh =
                GLOBAL_INVALIDATION_TYPES.has(detail.type) ||
                WALLET_LISTING_INVALIDATION_TYPES.has(detail.type) ||
                (detail.walletAddress && address && detail.walletAddress.toLowerCase() === address.toLowerCase());

            if (shouldRefresh && address) {
                devLog.info('wallet-nfts', `🔄 Auto-refreshing wallet NFTs after ${detail.type}`, {
                    contractAddress: detail.contractAddress,
                    tokenId: detail.tokenId,
                    walletAddress: address
                });

                // Clear context cache
                cache.invalidate(address);

                // Debounced retry strategy - prevents race conditions from multiple parallel fetches
                if (detail.type === 'listing-created') {
                    devLog.info('wallet-nfts', '⏱️ Listing detected - using debounced retry strategy');

                    // Immediate fetch (if not already pending)
                    if (!pendingRefreshPromise) {
                        pendingRefreshPromise = fetchWalletNFTs(address)
                            .finally(() => {
                                pendingRefreshPromise = null;
                            });
                    }

                    // Schedule debounced retry after 2s (DB sync typically complete)
                    listingRetryScheduler.schedule(DB_SYNC_DELAY_MS, () => {
                        if (!pendingRefreshPromise) {
                            devLog.info('wallet-nfts', `🔄 [Debounced Retry] After ${DB_SYNC_DELAY_MS}ms`);
                            pendingRefreshPromise = fetchWalletNFTs(address)
                                .finally(() => {
                                    pendingRefreshPromise = null;
                                });
                        } else {
                            devLog.info('wallet-nfts', '⏸️ Skipping retry - fetch already in progress');
                        }
                    });
                } else {
                    // For other events, single fetch is enough (with deduplication)
                    if (!pendingRefreshPromise) {
                        pendingRefreshPromise = fetchWalletNFTs(address)
                            .finally(() => {
                                pendingRefreshPromise = null;
                            });
                    }
                }
            }
        });

        return () => {
            unsubscribe();
            listingRetryScheduler.clear();
        };
    }, [address, cache, fetchWalletNFTs, listingRetryScheduler]);

    // NOTE: SSE handling removed - we rely on MarketplaceEventsContext to prevent multiple WebSocket connections
    // All updates come through eventsContext.subscribe() above

    /**
     * Get single NFT
     */
    const getNFT = useCallback((contractAddress: string, tokenId: string): WalletNFT | undefined => {
        return state.nfts.find(
            nft => nft.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
                && nft.tokenId === tokenId
        );
    }, [state.nfts]);

    /**
     * Get NFTs by collection
     */
    const getNFTsByCollection = useCallback((contractAddress: string): WalletNFT[] => {
        return state.nfts.filter(
            nft => nft.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
        );
    }, [state.nfts]);

    /**
     * Get unlisted NFTs (available to list)
     */
    const getUnlistedNFTs = useCallback((): WalletNFT[] => {
        return state.nfts.filter(nft => !nft.isListed);
    }, [state.nfts]);

    /**
     * Get listed NFTs
     */
    const getListedNFTs = useCallback((): WalletNFT[] => {
        return state.nfts.filter(nft => nft.isListed);
    }, [state.nfts]);

    // Computed stats
    const stats = useMemo(() => {
        const listedNFTs = state.nfts.filter(nft => nft.isListed);

        // Calculate total value of listed NFTs
        const totalValue = listedNFTs.reduce((sum, nft) => {
            if (nft.listingPrice) {
                try {
                    // listingPrice is already a bigint from the service
                    const price = typeof nft.listingPrice === 'string'
                        ? BigInt(nft.listingPrice)
                        : nft.listingPrice;
                    // Convert to ETH (divide by 10^18)
                    const ethValue = Number(price) / 1e18;
                    return sum + ethValue;
                } catch (e) {
                    return sum;
                }
            }
            return sum;
        }, 0);

        return {
            totalCount: state.nfts.length,
            listedCount: listedNFTs.length,
            unlistedCount: state.nfts.filter(nft => !nft.isListed).length,
            totalListedValue: totalValue
        };
    }, [state.nfts]);

    // DevTools (development only)
    useContextDevtools('WalletNFTs', {
        nftsCount: state.nfts.length,
        loading: state.loading,
        error: state.error,
        lastFetched: state.lastFetched,
        stats,
        walletAddress: address
    });

    const value: WalletNFTsContextType = React.useMemo(() => ({
        nfts: state.nfts,
        loading: state.loading,
        error: state.error,
        lastFetched: state.lastFetched,
        totalCount: stats.totalCount,
        listedCount: stats.listedCount,
        unlistedCount: stats.unlistedCount,
        totalListedValue: stats.totalListedValue,
        refresh,
        clear,
        getNFT,
        getNFTsByCollection,
        getUnlistedNFTs,
        getListedNFTs
    }), [state, stats, refresh, clear, getNFT, getNFTsByCollection, getUnlistedNFTs, getListedNFTs]);

    return (
        <WalletNFTsContext.Provider value={value}>
            {children}
        </WalletNFTsContext.Provider>
    );
}

export function useWalletNFTs() {
    const context = useContext(WalletNFTsContext);
    if (!context) {
        throw new Error('useWalletNFTs must be used within WalletNFTsProvider');
    }
    return context;
}
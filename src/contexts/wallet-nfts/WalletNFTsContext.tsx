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
import { devLog } from '@/utils/devLog';
import { WalletNFTsService, type WalletNFT } from './WalletNFTsService';
import { WalletNFTsCache, type WalletNFTsState } from './WalletNFTsCache';

interface WalletNFTsContextType {
    // NFT data
    nfts: WalletNFT[];
    loading: boolean;
    error: string | null;

    // Stats
    totalCount: number;
    listedCount: number;
    unlistedCount: number;

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
    const { address, isConnected } = useAccount();
    const [state, setState] = useState<WalletNFTsState>(WalletNFTsCache.createInitialState());
    const cache = useMemo(() => new WalletNFTsCache(), []);

    /**
     * Fetch NFTs for the connected wallet using the service
     */
    const fetchWalletNFTs = useCallback(async (walletAddress: string): Promise<void> => {
        setState(WalletNFTsCache.createLoadingState());

        try {
            const nfts = await WalletNFTsService.fetchWalletNFTs(walletAddress);
            const newState = WalletNFTsCache.createSuccessState(nfts);

            setState(newState);
            cache.set(walletAddress, nfts);

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
     * Auto-load NFTs when wallet connects
     */
    useEffect(() => {
        if (!isConnected || !address) {
            setState(WalletNFTsCache.createInitialState());
            return;
        }

        const lowerAddress = address.toLowerCase();

        // Check cache first
        const cached = cache.get(lowerAddress);
        if (cached) {
            setState(cached);
            return;
        }

        // Fetch fresh data
        devLog.info('wallet-nfts', '🔄 [WalletNFTsContext] Cache miss or expired, fetching fresh data');
        fetchWalletNFTs(address);
    }, [address, isConnected, fetchWalletNFTs, cache]);

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
    const stats = useMemo(() => ({
        totalCount: state.nfts.length,
        listedCount: state.nfts.filter(nft => nft.isListed).length,
        unlistedCount: state.nfts.filter(nft => !nft.isListed).length
    }), [state.nfts]);

    const value: WalletNFTsContextType = {
        nfts: state.nfts,
        loading: state.loading,
        error: state.error,
        totalCount: stats.totalCount,
        listedCount: stats.listedCount,
        unlistedCount: stats.unlistedCount,
        refresh,
        clear,
        getNFT,
        getNFTsByCollection,
        getUnlistedNFTs,
        getListedNFTs
    };

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
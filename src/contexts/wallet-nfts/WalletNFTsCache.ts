'use client';

/**
 * Wallet NFTs Cache Service
 *
 * Manages caching logic for wallet NFT data.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils';
import type { WalletNFT } from './WalletNFTsService';

export interface WalletNFTsState {
    nfts: WalletNFT[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

export class WalletNFTsCache {
    private static readonly CACHE_TTL = 60 * 1000; // 60 seconds (aligned with TheGraph polling)
    private static readonly INITIAL_STATE: WalletNFTsState = {
        nfts: [],
        loading: false,
        error: null,
        lastFetched: null
    };

    private cache: Map<string, WalletNFTsState> = new Map();

    /**
     * Get cached data for a wallet address
     */
    get(walletAddress: string): WalletNFTsState | null {
        const lowerAddress = walletAddress.toLowerCase();
        const cached = this.cache.get(lowerAddress);

        if (!cached) return null;

        // Check if cache is still valid
        const age = Date.now() - (cached.lastFetched || 0);
        if (age > WalletNFTsCache.CACHE_TTL) {
            devLog.cache(`[WalletNFTsCache] Cache expired for ${walletAddress} (age: ${Math.round(age / 1000)}s)`);
            this.invalidate(walletAddress);
            return null;
        }

        devLog.cache(`[WalletNFTsCache] Using cached data for ${walletAddress} (age: ${Math.round(age / 1000)}s, ${cached.nfts.length} NFTs)`);
        return cached;
    }

    /**
     * Set cache data for a wallet address
     */
    set(walletAddress: string, nfts: WalletNFT[]): void {
        const lowerAddress = walletAddress.toLowerCase();
        const state: WalletNFTsState = {
            nfts,
            loading: false,
            error: null,
            lastFetched: Date.now()
        };

        this.cache.set(lowerAddress, state);
        devLog.cache(`[WalletNFTsCache] Cached ${nfts.length} NFTs for ${walletAddress}`);
    }

    /**
     * Invalidate cache for a specific wallet or all wallets
     */
    invalidate(walletAddress?: string): void {
        if (walletAddress) {
            const lowerAddress = walletAddress.toLowerCase();
            this.cache.delete(lowerAddress);
            devLog.cache(`[WalletNFTsCache] Invalidated cache for ${walletAddress}`);
        } else {
            this.cache.clear();
            devLog.cache(`[WalletNFTsCache] Invalidated all cache`);
        }
    }

    /**
     * Check if cache exists and is valid for a wallet
     */
    hasValidCache(walletAddress: string): boolean {
        const cached = this.get(walletAddress);
        return cached !== null;
    }

    /**
     * Get cache statistics
     */
    getStats(): { totalEntries: number; totalNFTs: number } {
        const totalEntries = this.cache.size;
        const totalNFTs = Array.from(this.cache.values()).reduce((sum, state) => sum + state.nfts.length, 0);

        return { totalEntries, totalNFTs };
    }

    /**
     * Create initial loading state
     */
    static createInitialState(): WalletNFTsState {
        return { ...WalletNFTsCache.INITIAL_STATE };
    }

    /**
     * Create loading state
     */
    static createLoadingState(): WalletNFTsState {
        return {
            ...WalletNFTsCache.INITIAL_STATE,
            loading: true
        };
    }

    /**
     * Create error state
     */
    static createErrorState(error: string): WalletNFTsState {
        return {
            ...WalletNFTsCache.INITIAL_STATE,
            error
        };
    }

    /**
     * Create success state
     */
    static createSuccessState(nfts: WalletNFT[]): WalletNFTsState {
        return {
            nfts,
            loading: false,
            error: null,
            lastFetched: Date.now()
        };
    }
}
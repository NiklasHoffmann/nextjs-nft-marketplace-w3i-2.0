'use client';

/**
 * Collections Cache Service
 *
 * Manages caching logic for collection data.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils/devLog';
import type { Collection } from './CollectionsService';

export interface CollectionsState {
    collections: Collection[];
    loading: boolean;
    error: string | null;
    lastFetched: Date | null;
}

export class CollectionsCache {
    private static readonly DEFAULT_CACHE_DURATION = 60 * 1000; // 60 seconds (aligned with TheGraph polling)

    private cache: CollectionsState | null = null;
    private cacheDuration: number;

    constructor(cacheDuration = CollectionsCache.DEFAULT_CACHE_DURATION) {
        this.cacheDuration = cacheDuration;
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(): boolean {
        if (!this.cache || !this.cache.lastFetched) return false;

        const cacheAge = Date.now() - this.cache.lastFetched.getTime();
        return cacheAge < this.cacheDuration;
    }

    /**
     * Get cached data if valid
     */
    getCached(): CollectionsState | null {
        if (!this.isCacheValid()) {
            devLog.cache(`[CollectionsCache] Cache expired or empty`);
            return null;
        }

        const ageInSeconds = Math.floor((Date.now() - this.cache!.lastFetched!.getTime()) / 1000);
        devLog.cache(`[CollectionsCache] Using cached data (age: ${ageInSeconds}s, ${this.cache!.collections.length} collections)`);
        return this.cache;
    }

    /**
     * Set cache data
     */
    setCache(collections: Collection[]): void {
        this.cache = {
            collections,
            loading: false,
            error: null,
            lastFetched: new Date()
        };
        devLog.cache(`[CollectionsCache] Cached ${collections.length} collections`);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache = null;
        devLog.cache(`[CollectionsCache] Cache cleared`);
    }

    /**
     * Create initial state
     */
    static createInitialState(): CollectionsState {
        return {
            collections: [],
            loading: false,
            error: null,
            lastFetched: null
        };
    }

    /**
     * Create loading state
     */
    static createLoadingState(): CollectionsState {
        return {
            collections: [],
            loading: true,
            error: null,
            lastFetched: null
        };
    }

    /**
     * Create error state
     */
    static createErrorState(error: string): CollectionsState {
        return {
            collections: [],
            loading: false,
            error,
            lastFetched: null
        };
    }

    /**
     * Create success state
     */
    static createSuccessState(collections: Collection[]): CollectionsState {
        return {
            collections,
            loading: false,
            error: null,
            lastFetched: new Date()
        };
    }
}
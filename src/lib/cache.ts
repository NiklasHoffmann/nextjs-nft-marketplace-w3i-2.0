/**
 * Shared Cache Manager for API Routes
 * 
 * Provides centralized cache management across different API endpoints
 * to ensure consistency and proper cache invalidation.
 * 
 * @version 1.0.0
 * @date 2025-10-15
 */

// ===== TYPES =====

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// ===== STATS CACHE =====

const statsCache = new Map<string, CacheEntry<any>>();
const STATS_CACHE_TTL = 5000; // 5 seconds

export function getStatsCacheKey(contractAddress: string, tokenId: string): string {
    return `${contractAddress.toLowerCase()}-${tokenId}`;
}

export function getCachedStats<T>(contractAddress: string, tokenId: string): T | null {
    const key = getStatsCacheKey(contractAddress, tokenId);
    const cached = statsCache.get(key);

    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
        return cached.data as T;
    }

    // Clean up expired cache entry
    if (cached) {
        statsCache.delete(key);
    }

    return null;
}

export function setCachedStats<T>(contractAddress: string, tokenId: string, stats: T): void {
    const key = getStatsCacheKey(contractAddress, tokenId);
    statsCache.set(key, {
        data: stats,
        timestamp: Date.now()
    });

    // Auto-cleanup: Remove old entries (keep max 1000 entries)
    if (statsCache.size > 1000) {
        const oldestKey = statsCache.keys().next().value;
        if (oldestKey) statsCache.delete(oldestKey);
    }
}

export function invalidateStatsCache(contractAddress: string, tokenId: string): void {
    const key = getStatsCacheKey(contractAddress, tokenId);
    statsCache.delete(key);
}

// ===== INTERACTIONS CACHE =====

const interactionsCache = new Map<string, CacheEntry<any>>();
const INTERACTIONS_CACHE_TTL = 10000; // 10 seconds

export function getInteractionsCacheKey(userId: string, contractAddress: string, tokenId: string): string {
    return `${userId.toLowerCase()}-${contractAddress.toLowerCase()}-${tokenId}`;
}

export function getCachedInteractions<T>(userId: string, contractAddress: string, tokenId: string): T | null {
    const key = getInteractionsCacheKey(userId, contractAddress, tokenId);
    const cached = interactionsCache.get(key);

    if (cached && Date.now() - cached.timestamp < INTERACTIONS_CACHE_TTL) {
        return cached.data as T;
    }

    if (cached) {
        interactionsCache.delete(key);
    }

    return null;
}

export function setCachedInteractions<T>(userId: string, contractAddress: string, tokenId: string, data: T): void {
    const key = getInteractionsCacheKey(userId, contractAddress, tokenId);
    interactionsCache.set(key, {
        data,
        timestamp: Date.now()
    });

    // Auto-cleanup: Keep max 500 entries
    if (interactionsCache.size > 500) {
        const oldestKey = interactionsCache.keys().next().value;
        if (oldestKey) interactionsCache.delete(oldestKey);
    }
}

export function invalidateInteractionsCache(userId: string, contractAddress: string, tokenId: string): void {
    const key = getInteractionsCacheKey(userId, contractAddress, tokenId);
    interactionsCache.delete(key);
}

// ===== BATCH INVALIDATION =====

/**
 * Invalidates both stats and interactions cache for an NFT
 * Use this when user interactions change (like, watchlist, rating)
 * to ensure all related caches are cleared
 */
export function invalidateAllCachesForNFT(
    contractAddress: string,
    tokenId: string,
    userId?: string
): void {
    // Always invalidate stats cache (affects all users)
    invalidateStatsCache(contractAddress, tokenId);

    // Invalidate user-specific interactions cache if userId provided
    if (userId) {
        invalidateInteractionsCache(userId, contractAddress, tokenId);
    }
}

// ===== CACHE STATS (for monitoring) =====

export function getCacheStats() {
    return {
        stats: {
            size: statsCache.size,
            maxSize: 1000,
            ttl: STATS_CACHE_TTL
        },
        interactions: {
            size: interactionsCache.size,
            maxSize: 500,
            ttl: INTERACTIONS_CACHE_TTL
        }
    };
}

export function clearAllCaches(): void {
    statsCache.clear();
    interactionsCache.clear();
}

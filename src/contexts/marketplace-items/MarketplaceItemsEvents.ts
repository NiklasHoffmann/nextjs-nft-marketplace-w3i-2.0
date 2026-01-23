'use client';

/**
 * Marketplace Items Events
 *
 * Centralized event handling for marketplace items operations.
 * Separated from context for better organization and testability.
 */

import type { NFTStatsUpdateDetail } from '@/types';

/**
 * Emit stats update event for cross-context communication
 */
export function emitStatsUpdate(detail: NFTStatsUpdateDetail): void {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('nftStatsUpdate', { detail });
        window.dispatchEvent(event);
    }
}

/**
 * Listen for stats update events
 */
export function onStatsUpdate(callback: (detail: NFTStatsUpdateDetail) => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const handler = (event: CustomEvent<NFTStatsUpdateDetail>) => {
        callback(event.detail);
    };

    window.addEventListener('nftStatsUpdate', handler as EventListener);

    // Return cleanup function
    return () => {
        window.removeEventListener('nftStatsUpdate', handler as EventListener);
    };
}

/**
 * Emit cache invalidation event
 */
export function emitCacheInvalidation(filterKey?: string): void {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('marketplaceItemsInvalidated', {
            detail: { filterKey, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
}

/**
 * Listen for cache invalidation events
 */
export function onCacheInvalidation(callback: (detail: { filterKey?: string; timestamp: number }) => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const handler = (event: CustomEvent<{ filterKey?: string; timestamp: number }>) => {
        callback(event.detail);
    };

    window.addEventListener('marketplaceItemsInvalidated', handler as EventListener);

    return () => {
        window.removeEventListener('marketplaceItemsInvalidated', handler as EventListener);
    };
}
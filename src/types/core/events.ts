/**
 * Type-safe Event Definitions for NFT Marketplace
 * 
 * Defines all custom events with proper TypeScript typing
 * to ensure type safety across event dispatching and handling.
 * 
 * @version 1.0.0
 * @date 2025-10-15
 */

import type { NFTStats } from '@/types/api/api-responses';

// ===== NFT STATS UPDATE EVENT =====

/**
 * Extended stats for event dispatching
 * Includes additional metadata beyond the API response
 */
export interface NFTStatsWithMeta extends NFTStats {
    /** Client-side timestamp when stats were last updated */
    lastUpdated?: number;
}

/**
 * User interaction state for NFT (personal data)
 */
export interface UserInteractionState {
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating: number;
    hasViewed: boolean;
}

/**
 * Detail payload for nft-stats-updated event
 * Dispatched when NFT stats change (likes, watchlist, views, ratings)
 */
export interface NFTStatsUpdateDetail {
    /** NFT contract address */
    contractAddress: string;
    /** NFT token ID */
    tokenId: string;
    /** Updated stats object */
    stats: NFTStatsWithMeta;
    /** Updated user interactions (optional - only if relevant to this update) */
    userInteractions?: UserInteractionState;
    /** Timestamp when the update occurred */
    timestamp: number;
    /** Optional: Source of the update (for debugging) */
    source?: 'toggleFavorite' | 'toggleWatchlist' | 'setUserRating' | 'incrementViewCount' | 'api';
}

/**
 * Type-safe CustomEvent for NFT stats updates
 * Usage:
 * ```typescript
 * const event = new CustomEvent<NFTStatsUpdateDetail>('nft-stats-updated', {
 *   detail: { contractAddress, tokenId, stats, timestamp }
 * });
 * window.dispatchEvent(event);
 * ```
 */
export type NFTStatsUpdateEvent = CustomEvent<NFTStatsUpdateDetail>;

// ===== LEGACY EVENT (for backwards compatibility) =====

/**
 * Legacy event detail (used by old useUserInteractions hook)
 * @deprecated Use NFTStatsUpdateDetail instead
 */
export interface NFTStatsChangedDetail {
    contractAddress: string;
    tokenId: string;
}

/**
 * Legacy CustomEvent
 * @deprecated Use NFTStatsUpdateEvent instead
 */
export type NFTStatsChangedEvent = CustomEvent<NFTStatsChangedDetail>;

// ===== WINDOW EVENT MAP AUGMENTATION =====

/**
 * Augment the WindowEventMap to include our custom events
 * This enables type-safe addEventListener calls:
 * 
 * ```typescript
 * window.addEventListener('nft-stats-updated', (event) => {
 *   // event.detail is properly typed as NFTStatsUpdateDetail
 *   devLog.info(event.detail.stats.favoriteCount);
 * });
 * ```
 */
declare global {
    interface WindowEventMap {
        'nft-stats-updated': NFTStatsUpdateEvent;
        'nftStatsChanged': NFTStatsChangedEvent; // Legacy
    }
}

// ===== HELPER TYPE GUARDS =====

/**
 * Type guard to check if an event is an NFTStatsUpdateEvent
 * @param event - The event to check
 * @returns True if the event is an NFTStatsUpdateEvent
 */
export function isNFTStatsUpdateEvent(event: Event): event is NFTStatsUpdateEvent {
    return event.type === 'nft-stats-updated' && 'detail' in event;
}

/**
 * Type guard to check if an event is an NFTStatsChangedEvent (legacy)
 * @param event - The event to check
 * @returns True if the event is an NFTStatsChangedEvent
 */
export function isNFTStatsChangedEvent(event: Event): event is NFTStatsChangedEvent {
    return event.type === 'nftStatsChanged' && 'detail' in event;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a type-safe NFT stats update event
 * @param detail - The event detail
 * @returns A properly typed CustomEvent
 */
export function createNFTStatsUpdateEvent(detail: NFTStatsUpdateDetail): NFTStatsUpdateEvent {
    return new CustomEvent<NFTStatsUpdateDetail>('nft-stats-updated', {
        detail,
        bubbles: true,
        cancelable: false
    });
}

/**
 * Dispatches an NFT stats update event
 * @param detail - The event detail
 */
export function dispatchNFTStatsUpdate(detail: NFTStatsUpdateDetail): void {
    const event = createNFTStatsUpdateEvent(detail);
    window.dispatchEvent(event);
}

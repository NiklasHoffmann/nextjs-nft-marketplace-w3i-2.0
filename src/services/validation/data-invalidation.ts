'use client';

/**
 * Data Invalidation Service
 * 
 * Central service to invalidate/refresh all NFT-related data after contract actions
 * or The Graph updates. Ensures all UI components show the latest data.
 * 
 * Usage:
 * - After listing an NFT: invalidateAfterListing(contractAddress, tokenId)
 * - After buying an NFT: invalidateAfterPurchase(contractAddress, tokenId, buyerAddress)
 * - After canceling listing: invalidateAfterCancelListing(contractAddress, tokenId)
 * - After The Graph update: invalidateAll()
 */

import { devLog } from '@/utils/devLog';

// Event types for cross-context communication
export type InvalidationType =
    | 'listing-created'
    | 'listing-canceled'
    | 'nft-purchased'
    | 'nft-transferred'
    | 'graph-update'
    | 'manual-refresh';

export const GLOBAL_INVALIDATION_TYPES = new Set<InvalidationType>([
    'graph-update',
    'manual-refresh'
]);

export const LISTING_INVALIDATION_TYPES = new Set<InvalidationType>([
    'listing-created',
    'listing-canceled',
    'nft-purchased'
]);

export const WALLET_LISTING_INVALIDATION_TYPES = new Set<InvalidationType>([
    'listing-created',
    'listing-canceled'
]);

export const MARKETPLACE_INVALIDATION_TYPES = new Set<InvalidationType>([
    'listing-created',
    'listing-canceled',
    'nft-purchased',
    'graph-update',
    'manual-refresh'
]);

export const DB_SYNC_DELAY_MS = 2000;

export interface InvalidationEventDetail {
    type: InvalidationType;
    contractAddress?: string;
    tokenId?: string;
    walletAddress?: string;
    listingId?: string;
    timestamp: number;
}

/**
 * Emit invalidation event that all contexts can listen to
 */
export function emitDataInvalidation(detail: InvalidationEventDetail): void {
    if (typeof window === 'undefined') return;

    devLog.info('data-invalidation', `🔄 Emitting invalidation event:`, detail);

    const event = new CustomEvent('dataInvalidation', { detail });
    window.dispatchEvent(event);
}

/**
 * Listen for data invalidation events
 */
export function onDataInvalidation(callback: (detail: InvalidationEventDetail) => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<InvalidationEventDetail>;
        callback(customEvent.detail);
    };

    window.addEventListener('dataInvalidation', handler);

    return () => {
        window.removeEventListener('dataInvalidation', handler);
    };
}

/**
 * Invalidate data after creating a listing
 */
export function invalidateAfterListing(
    contractAddress: string,
    tokenId: string,
    listingId?: string
): void {
    devLog.info('data-invalidation', `📝 Invalidating after listing: ${contractAddress}/${tokenId}`);

    emitDataInvalidation({
        type: 'listing-created',
        contractAddress,
        tokenId,
        listingId,
        timestamp: Date.now()
    });
}

/**
 * Invalidate data after purchasing an NFT
 */
export function invalidateAfterPurchase(
    contractAddress: string,
    tokenId: string,
    buyerAddress: string,
    listingId?: string
): void {
    devLog.info('data-invalidation', `💰 Invalidating after purchase: ${contractAddress}/${tokenId}`);

    emitDataInvalidation({
        type: 'nft-purchased',
        contractAddress,
        tokenId,
        walletAddress: buyerAddress,
        listingId,
        timestamp: Date.now()
    });
}

/**
 * Invalidate data after canceling a listing
 */
export function invalidateAfterCancelListing(
    contractAddress: string,
    tokenId: string,
    listingId?: string
): void {
    devLog.info('data-invalidation', `❌ Invalidating after cancel listing: ${contractAddress}/${tokenId}`);

    emitDataInvalidation({
        type: 'listing-canceled',
        contractAddress,
        tokenId,
        listingId,
        timestamp: Date.now()
    });
}

/**
 * Invalidate data after NFT transfer (e.g., trade)
 */
export function invalidateAfterTransfer(
    contractAddress: string,
    tokenId: string,
    fromAddress: string,
    toAddress: string
): void {
    devLog.info('data-invalidation', `🔄 Invalidating after transfer: ${contractAddress}/${tokenId}`);

    // Emit for both sender and receiver
    emitDataInvalidation({
        type: 'nft-transferred',
        contractAddress,
        tokenId,
        walletAddress: fromAddress,
        timestamp: Date.now()
    });

    emitDataInvalidation({
        type: 'nft-transferred',
        contractAddress,
        tokenId,
        walletAddress: toAddress,
        timestamp: Date.now()
    });
}

/**
 * Invalidate all data (e.g., after The Graph update or manual refresh)
 */
export function invalidateAll(): void {
    devLog.info('data-invalidation', `🔄 Invalidating ALL data`);

    emitDataInvalidation({
        type: 'graph-update',
        timestamp: Date.now()
    });
}

/**
 * Manual refresh trigger
 */
export function triggerManualRefresh(): void {
    devLog.info('data-invalidation', `🔄 Manual refresh triggered`);

    emitDataInvalidation({
        type: 'manual-refresh',
        timestamp: Date.now()
    });
}

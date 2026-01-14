/**
 * Marketplace Events → Cache Invalidation Bridge
 * 
 * Connects real-time contract events to the existing cache invalidation system.
 * When a marketplace event occurs (list/buy/cancel/update), automatically
 * invalidates relevant caches to trigger data refresh.
 * 
 * Features:
 * - Auto-invalidation for WalletNFTsContext
 * - Auto-invalidation for MarketplaceItemsContext
 * - Auto-invalidation for CollectionsContext
 * - Optimistic UI updates
 * - Event-driven architecture
 * 
 * @version 1.0.0
 * @date 2026-01-14
 */

import {
    invalidateAfterListing,
    invalidateAfterPurchase,
    invalidateAfterCancellation,
    invalidateAfterUpdate,
    type InvalidationEventDetail
} from '@/lib/data-invalidation';
import type {
    ProcessedMarketplaceEvent,
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent
} from '@/types/marketplace/contract-events';

// ===== INVALIDATION HANDLERS =====

/**
 * Handle ListingCreated event
 * Invalidates wallet NFTs and marketplace items
 */
export function handleListingCreated(event: ProcessedItemListedEvent): void {
    const { nftAddress, tokenId, listingId, seller } = event.data;

    console.log('🔄 [EventBridge] ListingCreated:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        seller
    });

    // Invalidate using existing system
    invalidateAfterListing(
        nftAddress,
        tokenId.toString(),
        listingId.toString()
    );

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-created',
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            seller,
            price: event.data.price.toString(),
            listingType: event.listingType
        }
    });
}

/**
 * Handle ListingPurchased event
 * Invalidates buyer/seller wallets and marketplace
 */
export function handleListingPurchased(event: ProcessedItemBoughtEvent): void {
    const { nftAddress, tokenId, listingId, buyer } = event.data;
    const seller = (event.data as any).seller; // May not be in type yet

    console.log('🔄 [EventBridge] ListingPurchased:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        buyer,
        seller
    });

    // Invalidate using existing system
    invalidateAfterPurchase(
        nftAddress,
        tokenId.toString(),
        listingId.toString()
    );

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-purchased',
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            buyer,
            seller,
            price: event.data.price.toString()
        }
    });
}

/**
 * Handle ListingCanceled event
 * Invalidates seller wallet and marketplace
 */
export function handleListingCanceled(event: ProcessedItemCanceledEvent): void {
    const { nftAddress, tokenId, listingId, seller } = event.data;

    console.log('🔄 [EventBridge] ListingCanceled:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        seller
    });

    // Invalidate using existing system
    invalidateAfterCancellation(
        nftAddress,
        tokenId.toString(),
        listingId.toString()
    );

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-cancelled',
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            seller
        }
    });
}

/**
 * Handle ListingUpdated event
 * Invalidates marketplace cache for updated listing
 */
export function handleListingUpdated(event: ProcessedItemUpdatedEvent): void {
    const { nftAddress, tokenId, listingId, newPrice } = event.data;

    console.log('🔄 [EventBridge] ListingUpdated:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        newPrice: newPrice.toString()
    });

    // Invalidate using existing system
    invalidateAfterUpdate(
        nftAddress,
        tokenId.toString(),
        listingId.toString()
    );

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-updated',
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            newPrice: newPrice.toString(),
            listingType: event.listingType
        }
    });
}

// ===== OPTIMISTIC UPDATES =====

/**
 * Custom event for optimistic UI updates
 */
interface OptimisticUpdateDetail extends InvalidationEventDetail {
    metadata?: Record<string, any>;
}

/**
 * Emit optimistic update event
 * Used for immediate UI feedback before subgraph indexes
 */
function emitOptimisticUpdate(detail: OptimisticUpdateDetail): void {
    const event = new CustomEvent('marketplace-optimistic-update', {
        detail,
        bubbles: true,
        cancelable: false
    });

    if (typeof window !== 'undefined') {
        window.dispatchEvent(event);
    }
}

/**
 * Listen for optimistic updates
 */
export function onOptimisticUpdate(
    callback: (detail: OptimisticUpdateDetail) => void
): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const handler = (event: Event) => {
        const customEvent = event as CustomEvent<OptimisticUpdateDetail>;
        callback(customEvent.detail);
    };

    window.addEventListener('marketplace-optimistic-update', handler);

    return () => {
        window.removeEventListener('marketplace-optimistic-update', handler);
    };
}

// ===== EVENT ROUTER =====

/**
 * Route marketplace event to appropriate handler
 */
export function routeMarketplaceEvent(event: ProcessedMarketplaceEvent): void {
    try {
        switch (event.eventName) {
            case 'ItemListed':
                handleListingCreated(event as ProcessedItemListedEvent);
                break;
            
            case 'ItemBought':
                handleListingPurchased(event as ProcessedItemBoughtEvent);
                break;
            
            case 'ItemCanceled':
                handleListingCanceled(event as ProcessedItemCanceledEvent);
                break;
            
            case 'ItemUpdated':
                handleListingUpdated(event as ProcessedItemUpdatedEvent);
                break;
            
            default:
                console.warn('⚠️ [EventBridge] Unknown event type:', (event as any).eventName);
        }
    } catch (error) {
        console.error('❌ [EventBridge] Event routing error:', error);
    }
}

// ===== GLOBAL EVENT LISTENER =====

/**
 * Setup global event listener that auto-invalidates caches
 * Call this once in your app root
 */
export function setupGlobalEventInvalidation(): () => void {
    console.log('🔗 [EventBridge] Setting up global event invalidation...');

    // This will be connected to the event listener service
    // For now, it's a placeholder

    // Return cleanup function
    return () => {
        console.log('🔗 [EventBridge] Cleaning up global event invalidation');
    };
}

// ===== AUGMENT WINDOW EVENT MAP =====

declare global {
    interface WindowEventMap {
        'marketplace-optimistic-update': CustomEvent<OptimisticUpdateDetail>;
    }
}

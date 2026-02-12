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
    invalidateAfterCancelListing,
    type InvalidationEventDetail
} from '@/services/validation';
import { devLog } from '@/utils';
import type {
    ProcessedMarketplaceEvent,
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent,
    ProcessedListingCanceledDueToInvalidListingEvent,
    ProcessedCollectionWhitelistRevokedCancelTriggeredEvent,
    ProcessedBuyerWhitelistedEvent,
    ProcessedBuyerRemovedFromWhitelistEvent
} from '@/types/marketplace/contract-events';

export function handleListingCreated(event: ProcessedItemListedEvent): void {
    const { nftAddress, tokenId, listingId, seller } = event.data;

    devLog.info('[EventBridge] ListingCreated:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        seller
    });

    // CLIENT-SIDE: Invalidate using existing context system (immediate feedback for active user)
    if (typeof window !== 'undefined') {
        devLog.info('[EventBridge CLIENT] Triggering client-side invalidation...');
        invalidateAfterListing(
            nftAddress,
            tokenId.toString(),
            listingId.toString()
        );
    }
    // SERVER-SIDE: MongoDB sync + revalidatePath happens in /api/events/marketplace route

    // Emit custom event for real-time UI updates (client-side only)
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

    devLog.info('[EventBridge] ListingPurchased:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        buyer,
        seller
    });

    // Invalidate using existing system (CLIENT-SIDE ONLY)
    if (typeof window !== 'undefined') {
        invalidateAfterPurchase(
            nftAddress,
            tokenId.toString(),
            listingId.toString()
        );
    }

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'nft-purchased',
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

    devLog.info('[EventBridge] ListingCanceled:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        seller
    });

    // Invalidate using existing system (CLIENT-SIDE ONLY)
    if (typeof window !== 'undefined') {
        invalidateAfterCancelListing(
            nftAddress,
            tokenId.toString(),
            listingId.toString()
        );
    }

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-canceled',
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
 * Handle ListingCanceledDueToInvalidListing event
 * Same as ListingCanceled - NFT returns to owner
 */
export function handleListingCanceledDueToInvalid(event: ProcessedListingCanceledDueToInvalidListingEvent): void {
    const { nftAddress, tokenId, listingId, seller, triggeredBy } = event.data;

        devLog.info('[EventBridge] ListingCanceledDueToInvalidListing:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        seller,
        triggeredBy,
        reason: 'Invalid listing (NFT transferred or approval revoked)'
    });

    // Same invalidation as regular cancel (CLIENT-SIDE ONLY)
    if (typeof window !== 'undefined') {
        invalidateAfterCancelListing(
            nftAddress,
            tokenId.toString(),
            listingId.toString()
        );
    }

    // Emit custom event
    emitOptimisticUpdate({
        type: 'listing-canceled',
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            seller,
            triggeredBy,
            reason: 'invalid-listing'
        }
    });
}

/**
 * Handle CollectionWhitelistRevokedCancelTriggered event
 * Collection removed from whitelist - all listings canceled
 */
export function handleCollectionWhitelistRevoked(event: ProcessedCollectionWhitelistRevokedCancelTriggeredEvent): void {
    const { listingId, tokenAddress } = event.data;

        devLog.info('[EventBridge] CollectionWhitelistRevokedCancelTriggered:', {
        listingId: listingId.toString(),
        collection: tokenAddress,
        reason: 'Collection removed from whitelist'
    });

    // Invalidate entire collection (CLIENT-SIDE ONLY)
    // Note: We don't have tokenId in this event, so invalidate broadly
    if (typeof window !== 'undefined') {
        invalidateAfterCancelListing(
            tokenAddress,
            '0', // Placeholder - will trigger collection-wide refresh
            listingId.toString()
        );
    }

    // Emit custom event
    emitOptimisticUpdate({
        type: 'listing-canceled',
        contractAddress: tokenAddress,
        tokenId: '0',
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            reason: 'collection-whitelist-revoked'
        }
    });
}

/**
 * Handle BuyerWhitelisted event
 * No cache invalidation required by default
 */
export function handleBuyerWhitelisted(event: ProcessedBuyerWhitelistedEvent): void {
    const { listingId, buyer } = event.data;

        devLog.info('[EventBridge] BuyerWhitelisted:', {
        listingId: listingId.toString(),
        buyer
    });
}

/**
 * Handle BuyerRemovedFromWhitelist event
 * No cache invalidation required by default
 */
export function handleBuyerRemovedFromWhitelist(event: ProcessedBuyerRemovedFromWhitelistEvent): void {
    const { listingId, buyer } = event.data;

        devLog.info('[EventBridge] BuyerRemovedFromWhitelist:', {
        listingId: listingId.toString(),
        buyer
    });
}

/**
 * Handle ListingUpdated event
 * Invalidates marketplace cache for updated listing
 */
export function handleListingUpdated(event: ProcessedItemUpdatedEvent): void {
    const { nftAddress, tokenId, listingId, newPrice } = event.data;

        devLog.info('[EventBridge] ListingUpdated:', {
        listingId: listingId.toString(),
        nft: `${nftAddress}:${tokenId}`,
        newPrice: newPrice.toString()
    });

    // Invalidate using existing system (CLIENT-SIDE ONLY)
    if (typeof window !== 'undefined') {
        invalidateAfterCancelListing(
            nftAddress,
            tokenId.toString(),
            listingId.toString()
        );
    }

    // Emit custom event for real-time UI updates
    emitOptimisticUpdate({
        type: 'listing-created', // Use listing-created type since update is similar
        contractAddress: nftAddress,
        tokenId: tokenId.toString(),
        listingId: listingId.toString(),
        timestamp: event.processedAt,
        metadata: {
            newPrice: newPrice.toString(),
            listingType: event.listingType,
            isUpdate: true // Flag to distinguish from new listing
        }
    });
}

// ===== OPTIMISTIC UPDATES =====

/**
 * Custom event for optimistic UI updates
 */
interface OptimisticUpdateDetail extends InvalidationEventDetail {
    type: 'listing-created' | 'nft-purchased' | 'listing-canceled';
    metadata?: Record<string, any>;
}

/**
 * Emit optimistic update event
 * Used for immediate UI feedback before subgraph indexes
 */
function emitOptimisticUpdate(detail: OptimisticUpdateDetail): void {
    // Only run in browser (CustomEvent is not available in Node.js)
    if (typeof window === 'undefined') {
        return;
    }

    const event = new CustomEvent('marketplace-optimistic-update', {
        detail,
        bubbles: true,
        cancelable: false
    });

    window.dispatchEvent(event);
}

/**
 * Listen for optimistic updates
 */
export function onOptimisticUpdate(
    callback: (detail: OptimisticUpdateDetail) => void
): () => void {
    if (typeof window === 'undefined') {
        return () => { };
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
export function routeMarketplaceEvent(event: ProcessedMarketplaceEvent | any): void {
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

            case 'ListingCanceledDueToInvalidListing':
                handleListingCanceledDueToInvalid(event as ProcessedListingCanceledDueToInvalidListingEvent);
                break;

            case 'CollectionWhitelistRevokedCancelTriggered':
                handleCollectionWhitelistRevoked(event as ProcessedCollectionWhitelistRevokedCancelTriggeredEvent);
                break;

            case 'BuyerWhitelisted':
                handleBuyerWhitelisted(event as ProcessedBuyerWhitelistedEvent);
                break;

            case 'BuyerRemovedFromWhitelist':
                handleBuyerRemovedFromWhitelist(event as ProcessedBuyerRemovedFromWhitelistEvent);
                break;

            default:
                    devLog.warn('[EventBridge] Unknown event type:', (event as any).eventName);
        }
    } catch (error) {
            devLog.error('[EventBridge] Event routing error:', error);
            devLog.error('Error message:', (error as any)?.message);
            devLog.error('Error stack:', (error as any)?.stack);
            devLog.error('Error name:', (error as any)?.name);
            devLog.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
}

// ===== GLOBAL EVENT LISTENER =====

/**
 * Setup global event listener that auto-invalidates caches
 * Call this once in your app root
 */
export function setupGlobalEventInvalidation(): () => void {
    devLog.info('[EventBridge] Setting up global event invalidation...');

    // This will be connected to the event listener service
    // For now, it's a placeholder

    // Return cleanup function
    return () => {
           devLog.info('[EventBridge] Cleaning up global event invalidation');
    };
}

// ===== AUGMENT WINDOW EVENT MAP =====

declare global {
    interface WindowEventMap {
        'marketplace-optimistic-update': CustomEvent<OptimisticUpdateDetail>;
    }
}

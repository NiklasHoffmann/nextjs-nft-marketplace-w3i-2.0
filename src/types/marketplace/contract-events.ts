/**
 * Marketplace Contract Events Type Definitions
 * 
 * Type-safe definitions for all marketplace contract events.
 * Used for WebSocket event subscriptions and optimistic UI updates.
 * 
 * @version 1.0.0
 * @date 2026-01-14
 */

import type { Address, Hash, Log } from 'viem';

// ===== EVENT NAMES =====

/**
 * All marketplace contract event names
 */
export type MarketplaceEventName =
    | 'ItemListed'
    | 'ItemBought'
    | 'ItemCanceled'
    | 'ItemUpdated'
    | 'ListingCanceledDueToInvalidListing'
    | 'CollectionWhitelistRevokedCancelTriggered'
    | 'BuyerWhitelisted'
    | 'BuyerRemovedFromWhitelist';

// ===== RAW EVENT DATA (from contract logs) =====

/**
 * ItemListed event data
 * Emitted when a new NFT is listed on the marketplace
 */
export interface ItemListedEventData {
    listingId: string;  // Converted from bigint
    seller: Address;
    nftAddress: Address;
    tokenId: string;    // Converted from bigint
    price: string;      // Converted from bigint (Wei)
    buyer: Address; // 0x0 for pure ETH, target address for swap
    desiredNftAddress: Address; // 0x0 if no swap
    desiredTokenId: string;  // Converted from bigint
    // V2 fields from ListingCreated event
    currency: Address;
    feeRate: string;  // Converted from uint32
    buyerWhitelistEnabled: boolean;
    partialBuyEnabled: boolean;
    erc1155Quantity: string;  // Converted from bigint
    desiredErc1155Quantity: string;  // Converted from bigint
}

/**
 * ItemBought event data
 * Emitted when an NFT is purchased
 */
export interface ItemBoughtEventData {
    listingId: string;  // Converted from bigint
    buyer: Address;
    nftAddress: Address;
    tokenId: string;    // Converted from bigint
    price: string;      // Converted from bigint (Wei)
}

/**
 * ItemCanceled event data
 * Emitted when a listing is cancelled by seller
 */
export interface ItemCanceledEventData {
    listingId: string;  // Converted from bigint
    seller: Address;
    nftAddress: Address;
    tokenId: string;    // Converted from bigint
}

/**
 * ItemUpdated event data
 * Emitted when listing price/terms are updated
 */
export interface ItemUpdatedEventData {
    listingId: string;        // Converted from bigint
    nftAddress: Address;
    tokenId: string;          // Converted from bigint
    newPrice: string;         // Converted from bigint (Wei)
    newDesiredNftAddress: Address;
    newDesiredTokenId: string; // Converted from bigint
}

/**
 * ListingCanceledDueToInvalidListing event data
 * Emitted when a listing is auto-canceled due to invalid state
 */
export interface ListingCanceledDueToInvalidListingEventData {
    listingId: string;  // Converted from bigint
    nftAddress: Address;
    tokenId: string;    // Converted from bigint
    seller: Address;
    triggeredBy: Address;
}

/**
 * CollectionWhitelistRevokedCancelTriggered event data
 * Emitted when collection whitelist removal cancels a listing
 */
export interface CollectionWhitelistRevokedCancelTriggeredEventData {
    listingId: string;  // Converted from bigint
    tokenAddress: Address;
}

/**
 * BuyerWhitelisted event data
 * Emitted when a buyer is added to a listing whitelist
 */
export interface BuyerWhitelistedEventData {
    listingId: string;  // Converted from bigint
    buyer: Address;
}

/**
 * BuyerRemovedFromWhitelist event data
 * Emitted when a buyer is removed from a listing whitelist
 */
export interface BuyerRemovedFromWhitelistEventData {
    listingId: string;  // Converted from bigint
    buyer: Address;
}

// ===== PROCESSED EVENT DATA (enriched for app use) =====

/**
 * Base interface for all processed marketplace events
 * Includes metadata about the event itself
 */
export interface BaseMarketplaceEvent {
    /** Event type */
    eventName: MarketplaceEventName;
    /** Transaction hash */
    transactionHash: Hash;
    /** Block number */
    blockNumber: bigint;
    /** Block timestamp (if available) */
    blockTimestamp?: number;
    /** Log index in transaction */
    logIndex: number;
    /** When the event was processed client-side */
    processedAt: number;
}

/**
 * Processed ItemListed event
 * Ready for UI consumption
 */
export interface ProcessedItemListedEvent extends BaseMarketplaceEvent {
    eventName: 'ItemListed';
    data: ItemListedEventData;
    /** Derived listing type */
    listingType: 'sale' | 'swap' | 'swap-and-sale';
}

/**
 * Processed ItemBought event
 */
export interface ProcessedItemBoughtEvent extends BaseMarketplaceEvent {
    eventName: 'ItemBought';
    data: ItemBoughtEventData;
}

/**
 * Processed ItemCanceled event
 */
export interface ProcessedItemCanceledEvent extends BaseMarketplaceEvent {
    eventName: 'ItemCanceled';
    data: ItemCanceledEventData;
}

/**
 * Processed ItemUpdated event
 */
export interface ProcessedItemUpdatedEvent extends BaseMarketplaceEvent {
    eventName: 'ItemUpdated';
    data: ItemUpdatedEventData;
    /** Derived listing type after update */
    listingType: 'sale' | 'swap' | 'swap-and-sale';
}

/**
 * Processed ListingCanceledDueToInvalidListing event
 */
export interface ProcessedListingCanceledDueToInvalidListingEvent extends BaseMarketplaceEvent {
    eventName: 'ListingCanceledDueToInvalidListing';
    data: ListingCanceledDueToInvalidListingEventData;
}

/**
 * Processed CollectionWhitelistRevokedCancelTriggered event
 */
export interface ProcessedCollectionWhitelistRevokedCancelTriggeredEvent extends BaseMarketplaceEvent {
    eventName: 'CollectionWhitelistRevokedCancelTriggered';
    data: CollectionWhitelistRevokedCancelTriggeredEventData;
}

/**
 * Processed BuyerWhitelisted event
 */
export interface ProcessedBuyerWhitelistedEvent extends BaseMarketplaceEvent {
    eventName: 'BuyerWhitelisted';
    data: BuyerWhitelistedEventData;
}

/**
 * Processed BuyerRemovedFromWhitelist event
 */
export interface ProcessedBuyerRemovedFromWhitelistEvent extends BaseMarketplaceEvent {
    eventName: 'BuyerRemovedFromWhitelist';
    data: BuyerRemovedFromWhitelistEventData;
}

/**
 * Union type of all processed marketplace events
 */
export type ProcessedMarketplaceEvent =
    | ProcessedItemListedEvent
    | ProcessedItemBoughtEvent
    | ProcessedItemCanceledEvent
    | ProcessedItemUpdatedEvent
    | ProcessedListingCanceledDueToInvalidListingEvent
    | ProcessedCollectionWhitelistRevokedCancelTriggeredEvent
    | ProcessedBuyerWhitelistedEvent
    | ProcessedBuyerRemovedFromWhitelistEvent;

// ===== EVENT LISTENER TYPES =====

/**
 * Event listener callback
 */
export type MarketplaceEventCallback<T extends ProcessedMarketplaceEvent = ProcessedMarketplaceEvent> = (
    event: T
) => void | Promise<void>;

/**
 * Event listener configuration
 */
export interface EventListenerConfig {
    /** Enable/disable specific events */
    enabledEvents?: MarketplaceEventName[];
    /** Callback for all events */
    onEvent?: MarketplaceEventCallback;
    /** Specific callbacks per event type */
    onItemListed?: MarketplaceEventCallback<ProcessedItemListedEvent>;
    onItemBought?: MarketplaceEventCallback<ProcessedItemBoughtEvent>;
    onItemCanceled?: MarketplaceEventCallback<ProcessedItemCanceledEvent>;
    onItemUpdated?: MarketplaceEventCallback<ProcessedItemUpdatedEvent>;
    onListingCanceledDueToInvalidListing?: MarketplaceEventCallback<ProcessedListingCanceledDueToInvalidListingEvent>;
    onCollectionWhitelistRevokedCancelTriggered?: MarketplaceEventCallback<ProcessedCollectionWhitelistRevokedCancelTriggeredEvent>;
    onBuyerWhitelisted?: MarketplaceEventCallback<ProcessedBuyerWhitelistedEvent>;
    onBuyerRemovedFromWhitelist?: MarketplaceEventCallback<ProcessedBuyerRemovedFromWhitelistEvent>;
    /** Error handler */
    onError?: (error: Error, eventName?: MarketplaceEventName) => void;
    /** Connection status change */
    onConnectionChange?: (connected: boolean) => void;
}

// ===== SERVICE TYPES =====

/**
 * Event listener service state
 */
export interface EventListenerState {
    /** Is service active? */
    isActive: boolean;
    /** Is WebSocket connected? */
    isConnected: boolean;
    /** Total events processed */
    eventsProcessed: number;
    /** Last event timestamp */
    lastEventAt: number | null;
    /** Connection attempts */
    reconnectAttempts: number;
    /** Active event subscriptions */
    activeSubscriptions: MarketplaceEventName[];
}

/**
 * Event listener service interface
 */
export interface IMarketplaceEventListener {
    /** Start listening for events */
    start(config?: EventListenerConfig): Promise<void>;
    /** Stop listening */
    stop(): Promise<void>;
    /** Get current state */
    getState(): EventListenerState;
    /** Subscribe to specific event */
    subscribe(eventName: MarketplaceEventName, callback: MarketplaceEventCallback): () => void;
    /** Unsubscribe from event */
    unsubscribe(eventName: MarketplaceEventName, callback: MarketplaceEventCallback): void;
}

// ===== HELPER TYPES =====

/**
 * Optimistic update data for UI
 * Used before transaction is mined
 */
export interface OptimisticListingUpdate {
    contractAddress: string;
    tokenId: string;
    status: 'pending' | 'success' | 'error';
    operation: 'list' | 'buy' | 'cancel' | 'update';
    transactionHash?: Hash;
    timestamp: number;
    /** Expected outcome */
    expectedData?: {
        price?: bigint;
        isListed?: boolean;
        listingId?: string;
    };
}

/**
 * Event processing result
 */
export interface EventProcessingResult {
    success: boolean;
    event?: ProcessedMarketplaceEvent;
    error?: Error;
    skipped?: boolean;
    skipReason?: 'duplicate' | 'invalid' | 'filtered';
}

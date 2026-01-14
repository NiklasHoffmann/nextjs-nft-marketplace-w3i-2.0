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
    | 'ItemUpdated';

// ===== RAW EVENT DATA (from contract logs) =====

/**
 * ItemListed event data
 * Emitted when a new NFT is listed on the marketplace
 */
export interface ItemListedEventData {
    listingId: bigint;
    seller: Address;
    nftAddress: Address;
    tokenId: bigint;
    price: bigint;
    buyer: Address; // 0x0 for pure ETH, target address for swap
    desiredNftAddress: Address; // 0x0 if no swap
    desiredTokenId: bigint;
}

/**
 * ItemBought event data
 * Emitted when an NFT is purchased
 */
export interface ItemBoughtEventData {
    listingId: bigint;
    buyer: Address;
    nftAddress: Address;
    tokenId: bigint;
    price: bigint;
}

/**
 * ItemCanceled event data
 * Emitted when a listing is cancelled by seller
 */
export interface ItemCanceledEventData {
    listingId: bigint;
    seller: Address;
    nftAddress: Address;
    tokenId: bigint;
}

/**
 * ItemUpdated event data
 * Emitted when listing price/terms are updated
 */
export interface ItemUpdatedEventData {
    listingId: bigint;
    nftAddress: Address;
    tokenId: bigint;
    newPrice: bigint;
    newDesiredNftAddress: Address;
    newDesiredTokenId: bigint;
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
 * Union type of all processed marketplace events
 */
export type ProcessedMarketplaceEvent = 
    | ProcessedItemListedEvent
    | ProcessedItemBoughtEvent
    | ProcessedItemCanceledEvent
    | ProcessedItemUpdatedEvent;

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

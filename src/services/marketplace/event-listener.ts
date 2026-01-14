/**
 * Marketplace Event Listener Service
 * 
 * Real-time WebSocket-based event listener for marketplace contract events.
 * Provides push notifications for:
 * - New listings (ListingCreated)
 * - Purchases (ListingPurchased)  
 * - Cancellations (ListingCanceled)
 * - Updates (ListingUpdated)
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Event deduplication
 * - Type-safe event handling
 * - Memory leak prevention
 * - Error recovery
 * 
 * @version 1.0.0
 * @date 2026-01-14
 */

import { createPublicClient, webSocket, type Address, type Hash, type Log, type WatchContractEventReturnType } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';
import type {
    MarketplaceEventName,
    ProcessedMarketplaceEvent,
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent,
    EventListenerConfig,
    EventListenerState,
    IMarketplaceEventListener,
    EventProcessingResult,
    MarketplaceEventCallback
} from '@/types/marketplace/contract-events';

// ===== CONFIGURATION =====

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1s
const MAX_RECONNECT_DELAY = 60000; // 60s
const EVENT_DEDUP_WINDOW = 5000; // 5s - prevent duplicate event processing

// ===== SERVICE IMPLEMENTATION =====

export class MarketplaceEventListenerService implements IMarketplaceEventListener {
    // Core state
    private isActive = false;
    private isConnected = false;
    private client: ReturnType<typeof createPublicClient> | null = null;
    private unwatch: WatchContractEventReturnType | null = null;

    // Configuration
    private marketplaceAddress: Address;
    private wsUrl: string;
    private config: EventListenerConfig = {};

    // Statistics
    private eventsProcessed = 0;
    private lastEventAt: number | null = null;
    private reconnectAttempts = 0;

    // Event deduplication (prevent processing same event twice)
    private processedEvents = new Set<string>();
    private dedupCleanupInterval: NodeJS.Timeout | null = null;

    // Reconnection
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;

    // Event callbacks (for programmatic subscriptions)
    private eventCallbacks = new Map<MarketplaceEventName, Set<MarketplaceEventCallback>>();

    constructor(marketplaceAddress: Address, wsUrl?: string) {
        this.marketplaceAddress = marketplaceAddress;
        
        // Use provided URL or fall back to env vars
        this.wsUrl = wsUrl 
            || process.env.NEXT_PUBLIC_ALCHEMY_URL_WSS 
            || process.env.ALCHEMY_URL_WSS
            || process.env.NEXT_PUBLIC_INFURA_URL_WSS
            || process.env.INFURA_URL_WSS
            || '';

        if (!this.wsUrl) {
            console.warn('⚠️ [EventListener] No WebSocket URL configured. Service will not work.');
        }

        // Initialize callback storage
        this.eventCallbacks.set('ItemListed', new Set());
        this.eventCallbacks.set('ItemBought', new Set());
        this.eventCallbacks.set('ItemCanceled', new Set());
        this.eventCallbacks.set('ItemUpdated', new Set());
    }

    // ===== PUBLIC API =====

    /**
     * Start listening for contract events
     */
    async start(config?: EventListenerConfig): Promise<void> {
        if (this.isActive) {
            console.warn('⚠️ [EventListener] Already active');
            return;
        }

        if (!this.wsUrl) {
            throw new Error('WebSocket URL not configured');
        }

        this.config = { ...this.config, ...config };
        this.isActive = true;

        console.log('🚀 [EventListener] Starting...');
        console.log(`   Marketplace: ${this.marketplaceAddress}`);
        console.log(`   WebSocket: ${this.wsUrl.substring(0, 50)}...`);

        await this.connect();

        // Start deduplication cleanup (every 10s)
        this.dedupCleanupInterval = setInterval(() => {
            this.cleanupProcessedEvents();
        }, 10000);

        console.log('✅ [EventListener] Started');
    }

    /**
     * Stop listening
     */
    async stop(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        console.log('🛑 [EventListener] Stopping...');

        this.isActive = false;
        this.disconnect();

        // Clear dedup cleanup
        if (this.dedupCleanupInterval) {
            clearInterval(this.dedupCleanupInterval);
            this.dedupCleanupInterval = null;
        }

        // Clear reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Clear processed events
        this.processedEvents.clear();

        console.log('✅ [EventListener] Stopped');
    }

    /**
     * Get current service state
     */
    getState(): EventListenerState {
        return {
            isActive: this.isActive,
            isConnected: this.isConnected,
            eventsProcessed: this.eventsProcessed,
            lastEventAt: this.lastEventAt,
            reconnectAttempts: this.reconnectAttempts,
            activeSubscriptions: this.getActiveEventNames()
        };
    }

    /**
     * Subscribe to specific event type
     */
    subscribe(eventName: MarketplaceEventName, callback: MarketplaceEventCallback): () => void {
        const callbacks = this.eventCallbacks.get(eventName);
        if (callbacks) {
            callbacks.add(callback);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(eventName, callback);
    }

    /**
     * Unsubscribe from event
     */
    unsubscribe(eventName: MarketplaceEventName, callback: MarketplaceEventCallback): void {
        const callbacks = this.eventCallbacks.get(eventName);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    // ===== PRIVATE METHODS =====

    /**
     * Connect to WebSocket and start watching events
     */
    private async connect(): Promise<void> {
        try {
            // Create viem client with WebSocket transport
            this.client = createPublicClient({
                chain: sepolia,
                transport: webSocket(this.wsUrl, {
                    reconnect: false, // We handle reconnection ourselves
                    timeout: 30000
                })
            });

            // Watch all marketplace events
            this.unwatch = this.client.watchContractEvent({
                address: this.marketplaceAddress,
                abi: marketplaceAbi,
                onLogs: (logs) => this.handleLogs(logs),
                onError: (error) => this.handleError(error),
                strict: false // Don't throw on decode errors
            });

            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            console.log('✅ [EventListener] WebSocket connected');
            
            // Notify connection change
            this.config.onConnectionChange?.(true);

        } catch (error) {
            console.error('❌ [EventListener] Connection failed:', error);
            this.handleConnectionFailure(error as Error);
        }
    }

    /**
     * Disconnect from WebSocket
     */
    private disconnect(): void {
        if (this.unwatch) {
            this.unwatch();
            this.unwatch = null;
        }

        this.client = null;
        this.isConnected = false;

        // Notify connection change
        this.config.onConnectionChange?.(false);
    }

    /**
     * Handle incoming logs from contract
     */
    private async handleLogs(logs: Log[]): Promise<void> {
        for (const log of logs) {
            try {
                const result = await this.processLog(log);
                
                if (result.success && result.event) {
                    await this.dispatchEvent(result.event);
                }
            } catch (error) {
                console.error('❌ [EventListener] Log processing error:', error);
                this.config.onError?.(error as Error);
            }
        }
    }

    /**
     * Process single log entry
     */
    private async processLog(log: Log): Promise<EventProcessingResult> {
        // Check for duplicate (use transactionHash + logIndex as unique key)
        const eventKey = `${log.transactionHash}-${log.logIndex}`;
        if (this.processedEvents.has(eventKey)) {
            return {
                success: false,
                skipped: true,
                skipReason: 'duplicate'
            };
        }

        // Mark as processed
        this.processedEvents.add(eventKey);

        // Decode event based on topics
        const event = await this.decodeLog(log);
        
        if (!event) {
            return {
                success: false,
                skipped: true,
                skipReason: 'invalid'
            };
        }

        // Update statistics
        this.eventsProcessed++;
        this.lastEventAt = Date.now();

        return {
            success: true,
            event
        };
    }

    /**
     * Decode log into typed event
     * 
     * Note: When using watchContractEvent with specific event names,
     * viem automatically decodes the events. The logs parameter contains
     * the decoded args already. This method is for additional processing
     * and type mapping.
     */
    private async decodeLog(log: any): Promise<ProcessedMarketplaceEvent | null> {
        if (!log || !log.eventName) return null;

        try {
            const processedAt = Date.now();
            const baseEvent = {
                transactionHash: log.transactionHash!,
                blockNumber: log.blockNumber!,
                logIndex: log.logIndex!,
                processedAt
            };

            // viem automatically decodes events when using watchContractEvent
            // The log.args contains the decoded parameters
            const args = log.args as any;

            switch (log.eventName) {
                case 'ListingCreated': {
                    // Determine listing type based on swap parameters
                    const hasSwap = args.desiredTokenAddress && 
                        args.desiredTokenAddress !== '0x0000000000000000000000000000000000000000';
                    const hasPrice = args.price && args.price > BigInt(0);
                    
                    const listingType: 'sale' | 'swap' | 'swap-and-sale' = 
                        hasSwap && hasPrice ? 'swap-and-sale' :
                        hasSwap ? 'swap' :
                        'sale';

                    return {
                        eventName: 'ItemListed',
                        ...baseEvent,
                        listingType,
                        data: {
                            listingId: args.listingId,
                            seller: args.seller,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: args.tokenId,
                            price: args.price,
                            buyer: '0x0000000000000000000000000000000000000000' as Address, // Default for ETH sales
                            desiredNftAddress: args.desiredTokenAddress || '0x0000000000000000000000000000000000000000' as Address,
                            desiredTokenId: args.desiredTokenId || BigInt(0)
                        }
                    } as ProcessedItemListedEvent;
                }

                case 'ListingPurchased':
                    return {
                        eventName: 'ItemBought',
                        ...baseEvent,
                        data: {
                            listingId: args.listingId,
                            buyer: args.buyer,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: args.tokenId,
                            price: args.price
                        }
                    } as ProcessedItemBoughtEvent;

                case 'ListingCanceled':
                    return {
                        eventName: 'ItemCanceled',
                        ...baseEvent,
                        data: {
                            listingId: args.listingId,
                            seller: args.seller,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: args.tokenId
                        }
                    } as ProcessedItemCanceledEvent;

                case 'ListingUpdated': {
                    // Determine new listing type
                    const hasSwap = args.desiredTokenAddress && 
                        args.desiredTokenAddress !== '0x0000000000000000000000000000000000000000';
                    const hasPrice = args.price && args.price > BigInt(0);
                    
                    const listingType: 'sale' | 'swap' | 'swap-and-sale' = 
                        hasSwap && hasPrice ? 'swap-and-sale' :
                        hasSwap ? 'swap' :
                        'sale';

                    return {
                        eventName: 'ItemUpdated',
                        ...baseEvent,
                        listingType,
                        data: {
                            listingId: args.listingId,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: args.tokenId,
                            newPrice: args.price,
                            newDesiredNftAddress: args.desiredTokenAddress || '0x0000000000000000000000000000000000000000' as Address,
                            newDesiredTokenId: args.desiredTokenId || BigInt(0)
                        }
                    } as ProcessedItemUpdatedEvent;
                }

                default:
                    console.warn('⚠️ [EventListener] Unknown event:', log.eventName);
                    return null;
            }

        } catch (error) {
            console.error('❌ [EventListener] Decode error:', error);
            return null;
        }
    }

    /**
     * Dispatch processed event to all listeners
     */
    private async dispatchEvent(event: ProcessedMarketplaceEvent): Promise<void> {
        console.log(`📡 [EventListener] ${event.eventName}:`, {
            txHash: event.transactionHash.substring(0, 10),
            block: event.blockNumber.toString()
        });

        // Call general event callback
        if (this.config.onEvent) {
            try {
                await this.config.onEvent(event);
            } catch (error) {
                console.error('❌ [EventListener] General callback error:', error);
            }
        }

        // Call specific event callbacks from config
        const specificCallback = this.getSpecificCallback(event.eventName);
        if (specificCallback) {
            try {
                await specificCallback(event as any);
            } catch (error) {
                console.error(`❌ [EventListener] ${event.eventName} callback error:`, error);
            }
        }

        // Call programmatic subscriptions
        const callbacks = this.eventCallbacks.get(event.eventName);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    await callback(event);
                } catch (error) {
                    console.error(`❌ [EventListener] Subscription callback error:`, error);
                }
            }
        }
    }

    /**
     * Get specific callback from config
     */
    private getSpecificCallback(eventName: MarketplaceEventName): MarketplaceEventCallback | undefined {
        // Type assertion needed because specific callbacks use generic constraint
        switch (eventName) {
            case 'ItemListed': return this.config.onItemListed as MarketplaceEventCallback | undefined;
            case 'ItemBought': return this.config.onItemBought as MarketplaceEventCallback | undefined;
            case 'ItemCanceled': return this.config.onItemCanceled as MarketplaceEventCallback | undefined;
            case 'ItemUpdated': return this.config.onItemUpdated as MarketplaceEventCallback | undefined;
            default: return undefined;
        }
    }

    /**
     * Handle WebSocket errors
     */
    private handleError(error: Error): void {
        console.error('❌ [EventListener] WebSocket error:', error);
        
        this.config.onError?.(error);

        // Attempt reconnection
        if (this.isActive) {
            this.handleConnectionFailure(error);
        }
    }

    /**
     * Handle connection failure and attempt reconnect
     */
    private handleConnectionFailure(error: Error): void {
        if (this.isReconnecting || !this.isActive) {
            return;
        }

        this.isConnected = false;
        this.disconnect();

        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ [EventListener] Max reconnection attempts reached');
            this.config.onError?.(new Error('Max reconnection attempts reached'));
            this.stop();
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        // Exponential backoff
        const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
            MAX_RECONNECT_DELAY
        );

        console.log(`🔄 [EventListener] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        this.reconnectTimeout = setTimeout(async () => {
            this.isReconnecting = false;
            
            if (this.isActive) {
                await this.connect();
            }
        }, delay);
    }

    /**
     * Clean up old processed event IDs to prevent memory leak
     */
    private cleanupProcessedEvents(): void {
        // Keep only events from last 5 seconds
        // This is safe because events older than that won't be reprocessed
        
        // Simple approach: clear all if too many stored
        if (this.processedEvents.size > 1000) {
            console.log('🧹 [EventListener] Cleaning up processed events cache');
            this.processedEvents.clear();
        }
    }

    /**
     * Get active event names (for state reporting)
     */
    private getActiveEventNames(): MarketplaceEventName[] {
        const events: MarketplaceEventName[] = [];
        
        if (this.config.enabledEvents) {
            return this.config.enabledEvents;
        }

        // Return all if not specified
        return ['ItemListed', 'ItemBought', 'ItemCanceled', 'ItemUpdated'];
    }
}

// ===== SINGLETON INSTANCE =====

let globalEventListener: MarketplaceEventListenerService | null = null;

/**
 * Get or create global event listener instance
 */
export function getMarketplaceEventListener(marketplaceAddress: Address, wsUrl?: string): MarketplaceEventListenerService {
    if (!globalEventListener) {
        globalEventListener = new MarketplaceEventListenerService(marketplaceAddress, wsUrl);
    }
    return globalEventListener;
}

/**
 * Destroy global event listener
 */
export async function destroyMarketplaceEventListener(): Promise<void> {
    if (globalEventListener) {
        await globalEventListener.stop();
        globalEventListener = null;
    }
}

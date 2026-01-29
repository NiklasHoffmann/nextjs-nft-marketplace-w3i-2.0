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
 * - Error recovery with severity classification
 * - Improved error diagnostics (extracts meaningful info from viem errors)
 * 
 * @version 1.1.0
 * @date 2026-01-19
 */

import { createPublicClient, webSocket, decodeEventLog, type Address, type Hash, type Log, type WatchContractEventReturnType } from 'viem';
import { sepolia } from 'viem/chains';
import { MARKETPLACE_ABI } from '@/config/abis/marketplace';
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
const KEEPALIVE_INTERVAL = 30000; // 30s - send keepalive to prevent WebSocket timeout

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

    // Keepalive (prevent WebSocket timeout)
    private keepaliveInterval: NodeJS.Timeout | null = null;

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

        console.log('🔍 [EventListener] Constructor Debug:');
        console.log('   Marketplace Address:', marketplaceAddress);
        console.log('   Provided WSS URL:', wsUrl || 'none');
        console.log('   NEXT_PUBLIC_ALCHEMY_URL_WSS:', process.env.NEXT_PUBLIC_ALCHEMY_URL_WSS || 'not set');
        console.log('   NEXT_PUBLIC_INFURA_URL_WSS:', process.env.NEXT_PUBLIC_INFURA_URL_WSS || 'not set');
        console.log('   Final WSS URL:', this.wsUrl || 'NONE - SERVICE WILL NOT WORK!');

        if (!this.wsUrl) {
            console.error('❌ [EventListener] No WebSocket URL configured. Service will not work.');
            console.error('   Please set NEXT_PUBLIC_ALCHEMY_URL_WSS or NEXT_PUBLIC_INFURA_URL_WSS in .env.local');
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

        // Clear keepalive interval
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
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
        const environment = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';
        console.log(`🔌 [EventListener ${environment}] Attempting to connect...`);
        console.log('   WSS URL:', this.wsUrl);
        console.log('   Chain:', sepolia.name);
        console.log('   Marketplace:', this.marketplaceAddress);

        try {
            // Create viem client with WebSocket transport
            console.log(`📡 [EventListener ${environment}] Creating WebSocket client...`);
            this.client = createPublicClient({
                chain: sepolia,
                transport: webSocket(this.wsUrl, {
                    reconnect: false, // We handle reconnection ourselves
                    timeout: 30000,
                    retryCount: 3,
                    retryDelay: 1000
                })
            });
            console.log(`✓ Client created (${environment})`);

            // Watch all marketplace events
            console.log(`👀 [EventListener ${environment}] Starting event watcher...`);
            this.unwatch = this.client.watchContractEvent({
                address: this.marketplaceAddress,
                abi: MARKETPLACE_ABI,
                onLogs: (logs) => {
                    console.log(`🔔 [EventListener ${environment}] onLogs callback triggered with ${logs.length} logs`);
                    this.handleLogs(logs);
                },
                onError: (error) => {
                    console.error(`❌ [EventListener ${environment}] onError callback triggered:`, error);
                    this.handleError(error);
                },
                strict: false, // Don't throw on decode errors
            });
            console.log(`✓ Event watcher started (${environment})`);

            this.isConnected = true;
            this.reconnectAttempts = 0;

            console.log(`✅ [EventListener ${environment}] WebSocket connected successfully!`);
            console.log('   Status: CONNECTED');
            console.log('   Listening for: ItemListed, ItemBought, ItemCanceled, ItemUpdated');

            // Start keepalive to prevent WebSocket timeout
            this.startKeepalive();

            // Notify connection change
            this.config.onConnectionChange?.(true);

        } catch (error) {
            console.error('❌ [EventListener] Connection failed!');
            console.error('   Error:', error);
            console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
            console.error('   Error message:', error instanceof Error ? error.message : String(error));
            this.handleConnectionFailure(error as Error);
        }
    }

    /**
     * Disconnect from WebSocket
     */
    private disconnect(): void {
        // Clear keepalive interval
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }

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
     * Start keepalive to prevent WebSocket timeout
     * Infura/Alchemy WebSocket connections timeout after ~10-15 minutes of inactivity
     */
    private startKeepalive(): void {
        // Clear any existing interval
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
        }

        const environment = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';

        this.keepaliveInterval = setInterval(async () => {
            if (!this.isConnected || !this.client) {
                return;
            }

            try {
                // Make a lightweight RPC call to keep connection alive
                await this.client.getBlockNumber();
                console.log(`💓 [EventListener ${environment}] Keepalive ping successful`);
            } catch (error) {
                console.warn(`⚠️ [EventListener ${environment}] Keepalive ping failed:`, error);
                // If keepalive fails, trigger reconnection
                this.handleError(error);
            }
        }, KEEPALIVE_INTERVAL);

        console.log(`💓 [EventListener ${environment}] Keepalive started (${KEEPALIVE_INTERVAL}ms interval)`);
    }

    /**
     * Handle incoming logs from contract
     */
    private async handleLogs(logs: Log[]): Promise<void> {
        const environment = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';
        console.log(`📬 [EventListener ${environment}] Received ${logs.length} log(s)`);

        for (const log of logs) {
            try {
                console.log(`📝 [EventListener ${environment}] Processing log:`, {
                    eventName: (log as any).eventName,
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber
                });

                const result = await this.processLog(log);

                if (result.success && result.event) {
                    console.log(`✅ [EventListener ${environment}] Event processed successfully:`, result.event.eventName);
                    await this.dispatchEvent(result.event);
                } else if (result.skipped) {
                    console.log(`⏭️ [EventListener ${environment}] Event skipped (${result.skipReason})`);
                }
            } catch (error) {
                console.error(`❌ [EventListener ${environment}] Log processing error:`, error);
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
     * Note: When watching all events (no eventName specified), viem doesn't
     * set log.eventName automatically. We need to decode it from topics.
     */
    private async decodeLog(log: any): Promise<ProcessedMarketplaceEvent | null> {
        console.log('🔍 [decodeLog] Input log:', {
            eventName: log.eventName,
            topics: log.topics?.length,
            hasArgs: !!log.args,
            topicSignature: log.topics?.[0] // Log the event signature
        });

        // If eventName is not set, try to decode from topics
        if (!log.eventName && log.topics && log.topics.length > 0) {
            console.log('🔍 [decodeLog] No eventName, attempting manual decode...');
            console.log('   Event Signature:', log.topics[0]);
            console.log('   From Contract:', log.address);
            console.log('   Expected Contract:', this.marketplaceAddress);

            try {
                const decoded = decodeEventLog({
                    abi: MARKETPLACE_ABI,
                    data: log.data,
                    topics: log.topics,
                    strict: false // Don't throw on unknown events
                });

                console.log('✅ [decodeLog] Manual decode successful:', decoded.eventName);
                log.eventName = decoded.eventName;
                log.args = decoded.args;
            } catch (error) {
                console.log('⚠️ [decodeLog] Could not decode event (possibly not a marketplace listing event)');
                console.log('   Error:', error instanceof Error ? error.message : String(error));
                return null;
            }
        }

        if (!log || !log.eventName) {
            console.log('❌ [decodeLog] Still no eventName after decode attempt');
            return null;
        }

        // Only process marketplace listing events (including auto-cancel events)
        const supportedEvents = [
            'ListingCreated',
            'ListingPurchased',
            'ListingCanceled',
            'ListingUpdated',
            'ListingCanceledDueToInvalidListing',
            'CollectionWhitelistRevokedCancelTriggered'
        ];
        if (!supportedEvents.includes(log.eventName)) {
            console.log(`⏭️ [decodeLog] Skipping non-marketplace event: ${log.eventName}`);
            return null;
        }

        console.log('✅ [decodeLog] Processing event:', log.eventName);

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
                            listingId: String(args.listingId),
                            seller: args.seller,
                            nftAddress: args.tokenAddress,
                            tokenId: String(args.tokenId),
                            price: String(args.price),
                            buyer: '0x0000000000000000000000000000000000000000' as Address,
                            desiredNftAddress: args.desiredTokenAddress || '0x0000000000000000000000000000000000000000' as Address,
                            desiredTokenId: String(args.desiredTokenId || BigInt(0)),
                            // V2 fields from ListingCreated event
                            currency: args.currency,
                            feeRate: String(args.feeRate),
                            buyerWhitelistEnabled: args.buyerWhitelistEnabled,
                            partialBuyEnabled: args.partialBuyEnabled,
                            erc1155Quantity: String(args.erc1155Quantity || BigInt(0)),
                            desiredErc1155Quantity: String(args.desiredErc1155Quantity || BigInt(0))
                        }
                    } as ProcessedItemListedEvent;
                }

                case 'ListingPurchased':
                    return {
                        eventName: 'ItemBought',
                        ...baseEvent,
                        data: {
                            listingId: String(args.listingId),
                            buyer: args.buyer,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: String(args.tokenId),
                            price: String(args.price)
                        }
                    } as ProcessedItemBoughtEvent;

                case 'ListingCanceled':
                    return {
                        eventName: 'ItemCanceled',
                        ...baseEvent,
                        data: {
                            listingId: String(args.listingId),
                            seller: args.seller,
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: String(args.tokenId)
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
                            listingId: String(args.listingId),
                            nftAddress: args.tokenAddress, // Map to expected field name
                            tokenId: String(args.tokenId),
                            newPrice: String(args.price),
                            newDesiredNftAddress: args.desiredTokenAddress || '0x0000000000000000000000000000000000000000' as Address,
                            newDesiredTokenId: String(args.desiredTokenId || BigInt(0))
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
        const environment = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';
        console.log(`📡 [EventListener ${environment}] Dispatching ${event.eventName}:`, {
            txHash: event.transactionHash.substring(0, 10) + '...',
            block: event.blockNumber.toString(),
            data: event.data
        });

        // On client-side: Forward event to server API for MongoDB sync
        if (typeof window !== 'undefined') {
            try {
                console.log(`📤 [EventListener CLIENT] Forwarding event to server API...`);
                const response = await fetch('/api/events/marketplace', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event })
                });

                if (response.ok) {
                    console.log(`✅ [EventListener CLIENT] Event forwarded to server successfully`);
                } else {
                    console.error(`❌ [EventListener CLIENT] Failed to forward event:`, response.status);
                }
            } catch (error) {
                console.error(`❌ [EventListener CLIENT] Error forwarding event:`, error);
            }
        }

        // Call general event callback
        if (this.config.onEvent) {
            console.log('   → Calling onEvent callback');
            try {
                await this.config.onEvent(event);
                console.log('   ✅ onEvent callback completed');
            } catch (error) {
                console.error('❌ [EventListener] General callback error:', error);
            }
        } else {
            console.log('   ⚠️ No onEvent callback configured');
        }

        // Call specific event callbacks from config
        const specificCallback = this.getSpecificCallback(event.eventName);
        if (specificCallback) {
            console.log(`   → Calling ${event.eventName} specific callback`);
            try {
                await specificCallback(event as any);
                console.log(`   ✅ ${event.eventName} callback completed`);
            } catch (error) {
                console.error(`❌ [EventListener] ${event.eventName} callback error:`, error);
            }
        }

        // Call programmatic subscriptions
        const callbacks = this.eventCallbacks.get(event.eventName);
        if (callbacks && callbacks.size > 0) {
            console.log(`   → Calling ${callbacks.size} subscription callback(s)`);
            for (const callback of callbacks) {
                try {
                    await callback(event);
                } catch (error) {
                    console.error(`❌ [EventListener] Subscription callback error:`, error);
                }
            }
        }

        console.log(`✅ [EventListener ${environment}] ${event.eventName} dispatch complete`);
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
    private handleError(error: Error | unknown): void {
        // Safely extract error information
        const safeError = error as any;

        // Check if error is actually an empty object (common with WebSocket close events)
        const isEmptyError = error && typeof error === 'object' &&
            Object.keys(error).length === 0 &&
            !error.constructor?.name;

        // Extract meaningful error info (viem sometimes sends empty objects or close events)
        const errorMessage = safeError?.message || safeError?.reason ||
            (isEmptyError ? 'WebSocket closed' : 'Unknown error');
        const errorCode = safeError?.code;
        const errorType = safeError?.type || safeError?.constructor?.name || 'Unknown';
        const errorName = safeError?.name || 'Error';

        // Classify error severity
        const isConnectionError =
            errorMessage.includes('connection') ||
            errorMessage.includes('disconnect') ||
            errorMessage.includes('closed') ||
            errorMessage.includes('network') ||
            errorCode === 'ECONNREFUSED' ||
            errorCode === 'ENOTFOUND' ||
            errorCode === 1000 || // Normal WebSocket close
            isEmptyError;

        // Only log meaningful errors (skip empty WebSocket close events)
        if (!isEmptyError || !this.isConnected) {
            console.log('🔍 [EventListener] Connection event:', {
                isConnectionError,
                isEmptyError,
                errorMessage,
                errorCode,
                errorType,
                errorName,
                hasStack: !!safeError?.stack,
                wsUrl: this.wsUrl?.substring(0, 50) + '...'
            });
        }

        // Notify config error handler
        if (!isEmptyError && this.config.onError) {
            this.config.onError(error as Error);
        }

        // Only reconnect on actual connection failures (not normal close events)
        if (this.isActive && isConnectionError && !isEmptyError) {
            console.warn('⚠️ [EventListener] Connection lost, attempting reconnect...');
            this.handleConnectionFailure(error as Error);
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
    console.log('🔍 [Singleton] getMarketplaceEventListener called');
    console.log('   Current instance exists:', !!globalEventListener);
    console.log('   Requested marketplace:', marketplaceAddress);
    console.log('   Provided wsUrl:', wsUrl || 'none');
    console.log('   NEXT_PUBLIC_ALCHEMY_URL_WSS from env:', process.env.NEXT_PUBLIC_ALCHEMY_URL_WSS || 'NOT SET');

    if (!globalEventListener) {
        console.log('   ➡️ Creating NEW singleton instance');
        globalEventListener = new MarketplaceEventListenerService(marketplaceAddress, wsUrl);
    } else {
        console.log('   ➡️ Returning EXISTING singleton instance');
    }
    return globalEventListener;
}

/**
 * Destroy global event listener
 */
export async function destroyMarketplaceEventListener(): Promise<void> {
    if (globalEventListener) {
        console.log('🗑️ [Singleton] Destroying existing event listener');
        await globalEventListener.stop();
        globalEventListener = null;
        console.log('✅ [Singleton] Event listener destroyed');
    }
}

/**
 * Reset and recreate the global event listener with new configuration
 * Use this when WebSocket URL needs to be updated
 */
export async function resetMarketplaceEventListener(marketplaceAddress: Address, wsUrl?: string): Promise<MarketplaceEventListenerService> {
    console.log('🔄 [Singleton] Resetting event listener with new config');
    await destroyMarketplaceEventListener();
    return getMarketplaceEventListener(marketplaceAddress, wsUrl);
}

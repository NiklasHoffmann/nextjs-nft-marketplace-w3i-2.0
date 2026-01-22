/**
 * useMarketplaceEvents Hook
 * 
 * React hook for subscribing to real-time marketplace contract events.
 * Automatically manages subscriptions, cleanup, and provides connection status.
 * 
 * Usage:
 * ```typescript
 * const { isConnected, eventsReceived } = useMarketplaceEvents({
 *   onItemListed: (event) => {
 *     console.log('New listing:', event.data.listingId);
 *     // Invalidate cache, update UI
 *   },
 *   onItemBought: (event) => {
 *     console.log('NFT sold:', event.data.listingId);
 *   }
 * });
 * ```
 * 
 * @version 1.0.0
 * @date 2026-01-14
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { getMarketplaceEventListener } from '@/services/marketplace/event-listener';
import type {
    EventListenerConfig,
    EventListenerState,
    ProcessedMarketplaceEvent,
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent,
    MarketplaceEventCallback
} from '@/types/marketplace/contract-events';
import type { Address } from 'viem';

// ===== HOOK CONFIGURATION =====

export interface UseMarketplaceEventsConfig extends EventListenerConfig {
    /** Auto-start listening on mount? (default: true) */
    autoStart?: boolean;
    /** Only listen when wallet is connected? (default: false) */
    requireConnection?: boolean;
    /** Custom marketplace address (uses default if not provided) */
    marketplaceAddress?: Address;
    /** Custom WebSocket URL (uses env var if not provided) */
    wsUrl?: string;
}

export interface UseMarketplaceEventsReturn {
    /** Is WebSocket connected? */
    isConnected: boolean;
    /** Is service active? */
    isActive: boolean;
    /** Total events received in this session */
    eventsReceived: number;
    /** Last event timestamp */
    lastEventAt: number | null;
    /** Connection state */
    state: EventListenerState;
    /** Manually start listening */
    start: () => Promise<void>;
    /** Manually stop listening */
    stop: () => Promise<void>;
    /** Subscribe to specific event (returns unsubscribe function) */
    subscribe: (eventName: string, callback: MarketplaceEventCallback) => () => void;
}

// Default marketplace address (Sepolia)
const DEFAULT_MARKETPLACE_ADDRESS: Address = '0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC';

// ===== HOOK IMPLEMENTATION =====

export function useMarketplaceEvents(config: UseMarketplaceEventsConfig = {}): UseMarketplaceEventsReturn {
    console.log('🎣 [useMarketplaceEvents] Hook initialized with config:', {
        autoStart: config.autoStart ?? true,
        requireConnection: config.requireConnection ?? false,
        marketplaceAddress: config.marketplaceAddress || 'default',
        hasWsUrl: !!config.wsUrl
    });

    const {
        autoStart = true,
        requireConnection = false,
        marketplaceAddress = DEFAULT_MARKETPLACE_ADDRESS,
        wsUrl,
        ...listenerConfig
    } = config;

    // Wallet connection state
    const { isConnected: walletConnected } = useAccount();

    // Service instance (stable reference)
    const listenerRef = useRef(getMarketplaceEventListener(marketplaceAddress, wsUrl));
    const configRef = useRef(listenerConfig);

    // Initialize state from service (important for remounts when service is still active)
    const [state, setState] = useState<EventListenerState>(() => {
        const serviceState = listenerRef.current.getState();
        return serviceState;
    });

    const isStartedRef = useRef(listenerRef.current.getState().isActive);

    console.log('🔗 [useMarketplaceEvents] Service instance created/retrieved');
    console.log('   listenerRef.current:', !!listenerRef.current);
    console.log('   marketplaceAddress:', marketplaceAddress);
    console.log('   wsUrl:', wsUrl || 'from env');

    // Update config ref when it changes
    useEffect(() => {
        configRef.current = listenerConfig;
    }, [listenerConfig]);

    // State update function (called by service callbacks ONLY)
    const updateState = useCallback(() => {
        try {
            const newState = listenerRef.current.getState();
            console.log('🔄 [updateState] Callback triggered, syncing state:', newState);
            setState(newState);
        } catch (error) {
            console.error('❌ [updateState] Error:', error);
        }
    }, []);

    // Wrapped callbacks that update state (using refs to avoid recreating on every render)
    const wrappedConfigRef = useRef<EventListenerConfig>({
        onEvent: async (event) => {
            updateState();
            await configRef.current.onEvent?.(event);
        },
        onItemListed: async (event) => {
            updateState();
            await configRef.current.onItemListed?.(event);
        },
        onItemBought: async (event) => {
            updateState();
            await configRef.current.onItemBought?.(event);
        },
        onItemCanceled: async (event) => {
            updateState();
            await configRef.current.onItemCanceled?.(event);
        },
        onItemUpdated: async (event) => {
            updateState();
            await configRef.current.onItemUpdated?.(event);
        },
        onConnectionChange: (connected) => {
            updateState();
            configRef.current.onConnectionChange?.(connected);
        },
        onError: (error, eventName) => {
            updateState();
            configRef.current.onError?.(error, eventName);
        }
    });

    // Auto-start effect (runs ONCE on mount)
    useEffect(() => {
        console.log('🚀 [Auto-Start Effect] Mounted, autoStart:', autoStart);

        if (autoStart && !isStartedRef.current) {
            const currentState = listenerRef.current.getState();
            console.log('📊 [Auto-Start] Current service state:', currentState);

            if (!currentState.isActive) {
                console.log('🚀 [Auto-Start] Starting listener with callbacks...');
                isStartedRef.current = true;
                listenerRef.current.start(wrappedConfigRef.current);
            } else {
                console.log('✅ [Auto-Start] Service already active');
                isStartedRef.current = true;
            }
        }

        // No cleanup - we want the service to keep running
    }, [autoStart]);

    // Periodic state sync (fallback in case callbacks miss updates)
    useEffect(() => {
        console.log('⏰ [State Sync] Setting up periodic sync (5s interval)');

        const syncInterval = setInterval(() => {
            const currentState = listenerRef.current.getState();
            setState(prev => {
                // Only update if state actually changed (avoid unnecessary re-renders)
                if (prev.isActive !== currentState.isActive ||
                    prev.isConnected !== currentState.isConnected ||
                    prev.eventsProcessed !== currentState.eventsProcessed) {
                    console.log('🔄 [Periodic Sync] State changed, updating:', {
                        isConnected: currentState.isConnected,
                        isActive: currentState.isActive
                    });
                    return currentState;
                }
                return prev;
            });
        }, 5000); // Every 5 seconds

        return () => {
            console.log('🧹 [State Sync] Cleanup periodic sync');
            clearInterval(syncInterval);
        };
    }, []); // Empty deps - runs once

    // Start listening
    const start = useCallback(async () => {
        console.log('🚀 [useMarketplaceEvents] start() called');
        console.log('   isStartedRef.current:', isStartedRef.current);
        console.log('   requireConnection:', requireConnection);
        console.log('   walletConnected:', walletConnected);

        if (isStartedRef.current) {
            console.log('⏭️ [useMarketplaceEvents] Already started, skipping');
            return;
        }

        // Check wallet connection requirement
        if (requireConnection && !walletConnected) {
            console.log('⏸️ [useMarketplaceEvents] Waiting for wallet connection...');
            return;
        }

        console.log('✓ [useMarketplaceEvents] Starting event listener...');
        try {
            await listenerRef.current.start(wrappedConfigRef.current);
            isStartedRef.current = true;
            updateState();
            console.log('✅ [useMarketplaceEvents] Event listener started successfully!');
        } catch (error) {
            console.error('❌ [useMarketplaceEvents] Start failed:', error);
            console.error('   Error details:', error instanceof Error ? error.message : String(error));
        }
    }, [requireConnection, walletConnected, updateState]);

    // Stop listening
    const stop = useCallback(async () => {
        if (!isStartedRef.current) {
            return;
        }

        try {
            await listenerRef.current.stop();
            isStartedRef.current = false;
            updateState();
        } catch (error) {
            console.error('❌ [useMarketplaceEvents] Stop failed:', error);
        }
    }, [updateState]);

    // Subscribe to specific event
    const subscribe = useCallback((eventName: string, callback: MarketplaceEventCallback) => {
        return listenerRef.current.subscribe(eventName as any, callback);
    }, []);

    console.log('📋 [useMarketplaceEvents] Before effects - state:', {
        autoStart,
        isStartedRef: isStartedRef.current,
        requireConnection,
        walletConnected
    });

    // Auto-start effect
    useEffect(() => {
        console.log('🔄 [useMarketplaceEvents] Auto-start effect triggered');
        console.log('   autoStart:', autoStart);
        console.log('   isStartedRef.current:', isStartedRef.current);

        if (autoStart && !isStartedRef.current) {
            console.log('➡️ [useMarketplaceEvents] Calling start()...');
            start();
        } else if (!autoStart) {
            console.log('⏸️ [useMarketplaceEvents] autoStart is false, not starting');
        }

        // NO cleanup - service is a singleton and should persist across component lifecycles
        // Stopping here would disconnect WebSocket on page navigation
    }, [autoStart, start]);

    // Wallet connection effect (if required)
    useEffect(() => {
        if (requireConnection) {
            if (walletConnected && !isStartedRef.current) {
                start();
            } else if (!walletConnected && isStartedRef.current) {
                stop();
            }
        }
    }, [requireConnection, walletConnected, start, stop]);

    console.log('✅ [useMarketplaceEvents] Hook render complete, returning state');

    return {
        isConnected: state.isConnected,
        isActive: state.isActive,
        eventsReceived: state.eventsProcessed,
        lastEventAt: state.lastEventAt,
        state,
        start,
        stop,
        subscribe
    };
}

// ===== SPECIALIZED HOOKS =====

/**
 * Hook for listening to new listings only
 */
export function useListingCreatedEvents(
    callback: (event: ProcessedItemListedEvent) => void | Promise<void>,
    options: Omit<UseMarketplaceEventsConfig, 'onItemListed'> = {}
): Pick<UseMarketplaceEventsReturn, 'isConnected' | 'eventsReceived'> {
    const { isConnected, eventsReceived } = useMarketplaceEvents({
        ...options,
        onItemListed: callback,
        enabledEvents: ['ItemListed']
    });

    return { isConnected, eventsReceived };
}

/**
 * Hook for listening to purchases only
 */
export function usePurchaseEvents(
    callback: (event: ProcessedItemBoughtEvent) => void | Promise<void>,
    options: Omit<UseMarketplaceEventsConfig, 'onItemBought'> = {}
): Pick<UseMarketplaceEventsReturn, 'isConnected' | 'eventsReceived'> {
    const { isConnected, eventsReceived } = useMarketplaceEvents({
        ...options,
        onItemBought: callback,
        enabledEvents: ['ItemBought']
    });

    return { isConnected, eventsReceived };
}

/**
 * Hook for listening to cancellations only
 */
export function useCancellationEvents(
    callback: (event: ProcessedItemCanceledEvent) => void | Promise<void>,
    options: Omit<UseMarketplaceEventsConfig, 'onItemCanceled'> = {}
): Pick<UseMarketplaceEventsReturn, 'isConnected' | 'eventsReceived'> {
    const { isConnected, eventsReceived } = useMarketplaceEvents({
        ...options,
        onItemCanceled: callback,
        enabledEvents: ['ItemCanceled']
    });

    return { isConnected, eventsReceived };
}

/**
 * Hook for user's own listings (filters by connected wallet)
 */
export function useMyListingEvents(
    callbacks: {
        onListed?: (event: ProcessedItemListedEvent) => void | Promise<void>;
        onSold?: (event: ProcessedItemBoughtEvent) => void | Promise<void>;
        onCanceled?: (event: ProcessedItemCanceledEvent) => void | Promise<void>;
    },
    options: UseMarketplaceEventsConfig = {}
): Pick<UseMarketplaceEventsReturn, 'isConnected' | 'eventsReceived'> {
    const { address: userAddress } = useAccount();

    const { isConnected, eventsReceived } = useMarketplaceEvents({
        ...options,
        requireConnection: true,
        onItemListed: async (event) => {
            if (event.data.seller.toLowerCase() === userAddress?.toLowerCase()) {
                await callbacks.onListed?.(event);
            }
        },
        onItemBought: async (event) => {
            if (event.data.buyer.toLowerCase() === userAddress?.toLowerCase() ||
                (event as any).data.seller?.toLowerCase() === userAddress?.toLowerCase()) {
                await callbacks.onSold?.(event);
            }
        },
        onItemCanceled: async (event) => {
            if (event.data.seller.toLowerCase() === userAddress?.toLowerCase()) {
                await callbacks.onCanceled?.(event);
            }
        }
    });

    return { isConnected, eventsReceived };
}

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
const DEFAULT_MARKETPLACE_ADDRESS: Address = '0xF422A7779D2feB884CcC1773b88d98494A946604';

// ===== HOOK IMPLEMENTATION =====

export function useMarketplaceEvents(config: UseMarketplaceEventsConfig = {}): UseMarketplaceEventsReturn {
    const {
        autoStart = true,
        requireConnection = false,
        marketplaceAddress = DEFAULT_MARKETPLACE_ADDRESS,
        wsUrl,
        ...listenerConfig
    } = config;

    // Wallet connection state
    const { isConnected: walletConnected } = useAccount();

    // Hook state
    const [state, setState] = useState<EventListenerState>({
        isActive: false,
        isConnected: false,
        eventsProcessed: 0,
        lastEventAt: null,
        reconnectAttempts: 0,
        activeSubscriptions: []
    });

    // Service instance (stable reference)
    const listenerRef = useRef(getMarketplaceEventListener(marketplaceAddress, wsUrl));
    const configRef = useRef(listenerConfig);
    const isStartedRef = useRef(false);

    // Update config ref when it changes
    useEffect(() => {
        configRef.current = listenerConfig;
    }, [listenerConfig]);

    // State update function (called by service)
    const updateState = useCallback(() => {
        const newState = listenerRef.current.getState();
        setState(newState);
    }, []);

    // Wrapped callbacks that update state
    const wrappedConfig: EventListenerConfig = {
        ...listenerConfig,
        onEvent: async (event) => {
            updateState();
            await listenerConfig.onEvent?.(event);
        },
        onItemListed: async (event) => {
            updateState();
            await listenerConfig.onItemListed?.(event);
        },
        onItemBought: async (event) => {
            updateState();
            await listenerConfig.onItemBought?.(event);
        },
        onItemCanceled: async (event) => {
            updateState();
            await listenerConfig.onItemCanceled?.(event);
        },
        onItemUpdated: async (event) => {
            updateState();
            await listenerConfig.onItemUpdated?.(event);
        },
        onConnectionChange: (connected) => {
            updateState();
            listenerConfig.onConnectionChange?.(connected);
        },
        onError: (error, eventName) => {
            updateState();
            listenerConfig.onError?.(error, eventName);
        }
    };

    // Start listening
    const start = useCallback(async () => {
        if (isStartedRef.current) {
            return;
        }

        // Check wallet connection requirement
        if (requireConnection && !walletConnected) {
            console.log('⏸️ [useMarketplaceEvents] Waiting for wallet connection...');
            return;
        }

        try {
            await listenerRef.current.start(wrappedConfig);
            isStartedRef.current = true;
            updateState();
        } catch (error) {
            console.error('❌ [useMarketplaceEvents] Start failed:', error);
        }
    }, [requireConnection, walletConnected, wrappedConfig, updateState]);

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

    // Auto-start effect
    useEffect(() => {
        if (autoStart && !isStartedRef.current) {
            start();
        }

        // Cleanup on unmount
        return () => {
            if (isStartedRef.current) {
                stop();
            }
        };
    }, [autoStart, start, stop]);

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

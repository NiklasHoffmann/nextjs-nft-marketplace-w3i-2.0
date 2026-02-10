/**
 * Marketplace Events Provider
 * 
 * Global provider that manages real-time marketplace event listening
 * and automatic cache invalidation.
 * 
 * Wrap your app with this provider to enable:
 * - Real-time event notifications
 * - Automatic cache invalidation
 * - Optimistic UI updates
 * - Connection status monitoring
 * 
 * Usage:
 * ```tsx
 * <MarketplaceEventsProvider>
 *   <YourApp />
 * </MarketplaceEventsProvider>
 * ```
 * 
 * @version 1.0.0
 * @date 2026-01-14
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMarketplaceEvents } from '@/hooks';
import { routeMarketplaceEvent } from '@/services/marketplace/event-invalidation-bridge';
import type {
    ProcessedMarketplaceEvent,
    EventListenerState,
    MarketplaceEventName,
    MarketplaceEventCallback
} from '@/types/marketplace/contract-events';

// ===== CONTEXT =====

interface MarketplaceEventsContextValue {
    /** Is WebSocket connected? */
    isConnected: boolean;
    /** Total events received */
    eventsReceived: number;
    /** Last event timestamp */
    lastEventAt: number | null;
    /** Full service state */
    state: EventListenerState;
    /** Latest event (for debugging) */
    latestEvent: ProcessedMarketplaceEvent | null;
    /** Subscribe to events (supports '*' for all) */
    subscribe: (eventName: MarketplaceEventName | '*', callback: MarketplaceEventCallback) => () => void;
}

const MarketplaceEventsContext = createContext<MarketplaceEventsContextValue | undefined>(undefined);

// ===== PROVIDER PROPS =====

interface MarketplaceEventsProviderProps {
    children: React.ReactNode;
    /** Enable/disable auto-start (default: true) */
    autoStart?: boolean;
    /** Show connection status in console (default: false) */
    debug?: boolean;
    /** Custom marketplace address (optional) */
    marketplaceAddress?: `0x${string}`;
    /** Custom WebSocket URL (optional) */
    wsUrl?: string;
}

// ===== PROVIDER COMPONENT =====

export function MarketplaceEventsProvider({
    children,
    autoStart = true,
    debug = false,
    marketplaceAddress,
    wsUrl
}: MarketplaceEventsProviderProps) {
    const isDev = process.env.NODE_ENV === 'development';
    const enableWsEvents = process.env.NEXT_PUBLIC_ENABLE_WS_EVENTS === 'true';
    const shouldAutoStart = autoStart && (!isDev || enableWsEvents);

    console.log('🏪 [MarketplaceEventsProvider] Initializing...');
    console.log('   autoStart:', autoStart);
    console.log('   shouldAutoStart:', shouldAutoStart);
    console.log('   debug:', debug);
    console.log('   marketplaceAddress:', marketplaceAddress || 'default');
    console.log('   wsUrl:', wsUrl || 'from env');

    const [latestEvent, setLatestEvent] = useState<ProcessedMarketplaceEvent | null>(null);

    // Setup event listener with auto-invalidation
    const { isConnected, eventsReceived, lastEventAt, state, subscribe } = useMarketplaceEvents({
        autoStart: shouldAutoStart,
        marketplaceAddress,
        wsUrl,
        onEvent: (event) => {
            if (debug) {
                console.log('📡 [MarketplaceEvents] Event received:', event);
            }

            // Store latest event
            setLatestEvent(event);

            // Route to invalidation handlers
            routeMarketplaceEvent(event);
        },
        onConnectionChange: (connected) => {
            console.log(`🔌 [MarketplaceEvents] Connection status changed: ${connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
            if (debug) {
                console.log(`🔌 [MarketplaceEvents] Connection ${connected ? 'established' : 'lost'}`);
            }
        },
        onError: (error) => {
            const isPlainObject = error && typeof error === 'object' &&
                Object.getPrototypeOf(error) === Object.prototype;
            const isEmptyError = Boolean(isPlainObject && Object.keys(error as object).length === 0);

            if (isEmptyError) {
                return;
            }

            console.error('❌ [MarketplaceEvents] Error:', error);
        }
    });

    console.log('📊 [MarketplaceEventsProvider] Current state:', {
        isConnected,
        eventsReceived,
        lastEventAt,
        stateActive: state.isActive
    });

    // Log connection status changes
    useEffect(() => {
        if (debug) {
            console.log('🔄 [MarketplaceEvents] State:', state);
        }
    }, [state, debug]);

    const contextValue: MarketplaceEventsContextValue = {
        isConnected,
        eventsReceived,
        lastEventAt,
        state,
        latestEvent,
        subscribe: (eventName, callback) => {
            if (eventName === '*') {
                const unsubscribers = ([
                    'ItemListed',
                    'ItemBought',
                    'ItemCanceled',
                    'ItemUpdated',
                    'ListingCanceledDueToInvalidListing',
                    'CollectionWhitelistRevokedCancelTriggered',
                    'BuyerWhitelisted',
                    'BuyerRemovedFromWhitelist'
                ] as MarketplaceEventName[])
                    .map((name) => subscribe(name, callback));
                return () => {
                    unsubscribers.forEach((unsubscribe) => unsubscribe());
                };
            }

            return subscribe(eventName, callback);
        }
    };

    return (
        <MarketplaceEventsContext.Provider value={contextValue}>
            {children}
        </MarketplaceEventsContext.Provider>
    );
}

// ===== HOOK =====

/**
 * Access marketplace events context
 * 
 * Usage:
 * ```tsx
 * const { isConnected, eventsReceived } = useMarketplaceEventsContext();
 * ```
 */
export function useMarketplaceEventsContext(): MarketplaceEventsContextValue {
    const context = useContext(MarketplaceEventsContext);

    if (!context) {
        throw new Error('useMarketplaceEventsContext must be used within MarketplaceEventsProvider');
    }

    return context;
}

// ===== CONNECTION STATUS COMPONENT =====

/**
 * Visual indicator for WebSocket connection status
 * Shows a small dot in the corner of the screen
 */
export function EventConnectionStatus() {
    const { isConnected, eventsReceived } = useMarketplaceEventsContext();

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/90 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm"
            title={isConnected ? `Connected • ${eventsReceived} events` : 'Disconnected'}
        >
            <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
            />
            <span className="font-medium">
                {isConnected ? 'Live' : 'Offline'}
            </span>
            {isConnected && eventsReceived > 0 && (
                <span className="text-gray-400 text-xs">
                    {eventsReceived}
                </span>
            )}
        </div>
    );
}

// ===== DEBUG PANEL COMPONENT =====

/**
 * Debug panel showing event activity (for development)
 */
export function EventDebugPanel() {
    const { state, latestEvent } = useMarketplaceEventsContext();

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed top-20 right-4 z-50 w-80 bg-gray-900/95 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm font-mono text-xs">
            <h3 className="text-sm font-bold mb-3 text-green-400">🔴 Event Listener</h3>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={state.isConnected ? 'text-green-400' : 'text-red-400'}>
                        {state.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-400">Events:</span>
                    <span>{state.eventsProcessed}</span>
                </div>

                {state.lastEventAt && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Last Event:</span>
                        <span>{new Date(state.lastEventAt).toLocaleTimeString()}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-400">Reconnects:</span>
                    <span>{state.reconnectAttempts}</span>
                </div>

                {latestEvent && (
                    <>
                        <div className="border-t border-gray-700 my-2 pt-2">
                            <div className="text-gray-400 mb-1">Latest Event:</div>
                            <div className="text-yellow-400">{latestEvent.eventName}</div>
                            <div className="text-gray-500 text-[10px] truncate">
                                TX: {latestEvent.transactionHash.substring(0, 10)}...
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

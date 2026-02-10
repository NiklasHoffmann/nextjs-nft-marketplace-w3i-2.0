/**
 * MarketplaceEventsContext - Central WebSocket Event Hub
 * 
 * Single WebSocket connection for all marketplace events.
 * Other contexts subscribe to events and react accordingly.
 * 
 * Architecture:
 * WebSocket → EventContext → [MarketplaceItems, Collections, WalletNFTs] → Components
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useMarketplaceEvents } from '@/hooks';
import type {
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent,
    ProcessedListingCanceledDueToInvalidListingEvent,
    ProcessedCollectionWhitelistRevokedCancelTriggeredEvent,
    ProcessedBuyerWhitelistedEvent,
    ProcessedBuyerRemovedFromWhitelistEvent
} from '@/types/marketplace/contract-events';

// ===== TYPES =====

type MarketplaceEvent = 
    | ProcessedItemListedEvent 
    | ProcessedItemBoughtEvent 
    | ProcessedItemCanceledEvent 
    | ProcessedItemUpdatedEvent
    | ProcessedListingCanceledDueToInvalidListingEvent
    | ProcessedCollectionWhitelistRevokedCancelTriggeredEvent
    | ProcessedBuyerWhitelistedEvent
    | ProcessedBuyerRemovedFromWhitelistEvent;

type EventCallback = (event: MarketplaceEvent) => void;

interface MarketplaceEventsContextType {
    isConnected: boolean;
    lastEvent: MarketplaceEvent | null;
    lastEventAt: number | null;
    eventsReceived: number;
    subscribe: (eventName: string, callback: EventCallback) => () => void;
}

// ===== CONTEXT =====

const MarketplaceEventsContext = createContext<MarketplaceEventsContextType | undefined>(undefined);

// ===== PROVIDER =====

export function MarketplaceEventsProvider({ children }: { children: React.ReactNode }) {
    const [lastEvent, setLastEvent] = useState<MarketplaceEvent | null>(null);
    const [subscribers, setSubscribers] = useState<Map<string, Set<EventCallback>>>(new Map());

    // Single WebSocket connection
    const { isConnected, eventsReceived, lastEventAt } = useMarketplaceEvents({
        autoStart: true,
        onItemListed: (event) => {
            console.log('📡 [EventContext] ItemListed:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('ItemListed', event);
        },
        onItemBought: (event) => {
            console.log('📡 [EventContext] ItemBought:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('ItemBought', event);
        },
        onItemCanceled: (event) => {
            console.log('📡 [EventContext] ItemCanceled:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('ItemCanceled', event);
        },
        onItemUpdated: (event) => {
            console.log('📡 [EventContext] ItemUpdated:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('ItemUpdated', event);
        },
        onListingCanceledDueToInvalidListing: (event) => {
            console.log('📡 [EventContext] ListingCanceledDueToInvalidListing:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('ListingCanceledDueToInvalidListing', event);
        },
        onCollectionWhitelistRevokedCancelTriggered: (event) => {
            console.log('📡 [EventContext] CollectionWhitelistRevokedCancelTriggered:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('CollectionWhitelistRevokedCancelTriggered', event);
        },
        onBuyerWhitelisted: (event) => {
            console.log('📡 [EventContext] BuyerWhitelisted:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('BuyerWhitelisted', event);
        },
        onBuyerRemovedFromWhitelist: (event) => {
            console.log('📡 [EventContext] BuyerRemovedFromWhitelist:', event.data.listingId);
            setLastEvent(event);
            notifySubscribers('BuyerRemovedFromWhitelist', event);
        }
    });

    // Notify all subscribers for specific event
    const notifySubscribers = useCallback((eventName: string, event: MarketplaceEvent) => {
        const eventSubscribers = subscribers.get(eventName);
        const allSubscribers = subscribers.get('*'); // Wildcard subscribers

        if (eventSubscribers) {
            eventSubscribers.forEach(callback => callback(event));
        }
        if (allSubscribers) {
            allSubscribers.forEach(callback => callback(event));
        }
    }, [subscribers]);

    // Subscribe to specific event or all events (*)
    const subscribe = useCallback((eventName: string, callback: EventCallback) => {
        setSubscribers(prev => {
            const newMap = new Map(prev);
            const eventSubs = newMap.get(eventName) || new Set();
            eventSubs.add(callback);
            newMap.set(eventName, eventSubs);
            return newMap;
        });

        // Return unsubscribe function
        return () => {
            setSubscribers(prev => {
                const newMap = new Map(prev);
                const eventSubs = newMap.get(eventName);
                if (eventSubs) {
                    eventSubs.delete(callback);
                    if (eventSubs.size === 0) {
                        newMap.delete(eventName);
                    }
                }
                return newMap;
            });
        };
    }, []);

    const value: MarketplaceEventsContextType = useMemo(() => ({
        isConnected,
        lastEvent,
        lastEventAt,
        eventsReceived,
        subscribe
    }), [isConnected, lastEvent, lastEventAt, eventsReceived, subscribe]);

    return (
        <MarketplaceEventsContext.Provider value={value}>
            {children}
        </MarketplaceEventsContext.Provider>
    );
}

// ===== HOOK =====

export function useMarketplaceEventsContext() {
    const context = useContext(MarketplaceEventsContext);
    if (!context) {
        throw new Error('useMarketplaceEventsContext must be used within MarketplaceEventsProvider');
    }
    return context;
}

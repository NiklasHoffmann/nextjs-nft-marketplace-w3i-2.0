/**
 * Server-Sent Events (SSE) Hook
 * 
 * Subscribe to real-time marketplace events from server.
 * When ANY client triggers an event (list/buy/cancel), ALL clients receive notification.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ProcessedMarketplaceEvent } from '@/types/marketplace/contract-events';
import { devLog } from '@/utils';

export interface SSEConfig {
    /** Enable SSE connection? (default: true) */
    enabled?: boolean;
    /** Auto-reconnect on disconnect? */
    autoReconnect?: boolean;
    /** Callback when event received */
    onEvent?: (event: ProcessedMarketplaceEvent) => void;
    /** Callback on connection status change */
    onConnectionChange?: (connected: boolean) => void;
}

export function useServerEvents(config: SSEConfig = {}) {
    const { enabled = true, autoReconnect = true, onEvent, onConnectionChange } = config;
    
    const [isConnected, setIsConnected] = useState(false);
    const [eventsReceived, setEventsReceived] = useState(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Stabilize callbacks to prevent reconnection loops
    const stableOnEvent = useCallback((event: ProcessedMarketplaceEvent) => {
        onEvent?.(event);
    }, [onEvent]);
    
    const stableOnConnectionChange = useCallback((connected: boolean) => {
        onConnectionChange?.(connected);
    }, [onConnectionChange]);

    useEffect(() => {
        if (!enabled) {
            devLog.info('⏸️ [SSE] Connection disabled');
            return;
        }
        
        let mounted = true;

        const connect = () => {
            if (!mounted) return;
            
            devLog.info('🔌 [SSE] Connecting to server events...');
            
            const eventSource = new EventSource('/api/events/subscribe');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                devLog.info('✅ [SSE] Connected');
                setIsConnected(true);
                stableOnConnectionChange(true);
            };

            eventSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    
                    // Skip connection confirmation
                    if (data.type === 'connected') {
                        devLog.info('🔌 [SSE] Connection confirmed');
                        return;
                    }

                    devLog.info('📨 [SSE] Event received:', data.eventName);
                    setEventsReceived(prev => prev + 1);
                    stableOnEvent(data);
                } catch (error) {
                    devLog.error('❌ [SSE] Failed to parse event:', error);
                }
            };

            eventSource.onerror = () => {
                devLog.error('❌ [SSE] Connection error');
                setIsConnected(false);
                stableOnConnectionChange(false);
                eventSource.close();
                eventSourceRef.current = null;

                // Auto-reconnect after 5s
                if (autoReconnect && mounted) {
                    devLog.info('🔄 [SSE] Reconnecting in 5s...');
                    reconnectTimeoutRef.current = setTimeout(connect, 5000);
                }
            };
        };

        connect();

        return () => {
            mounted = false;
            if (eventSourceRef.current) {
                devLog.info('🔌 [SSE] Disconnecting...');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [enabled, autoReconnect, stableOnEvent, stableOnConnectionChange]);

    return {
        isConnected,
        eventsReceived,
        disconnect: () => {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        }
    };
}

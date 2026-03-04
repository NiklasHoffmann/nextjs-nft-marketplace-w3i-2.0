/**
 * Server-Sent Events (SSE) Broadcast Service
 * 
 * Manages SSE connections and broadcasts events to all connected clients.
 */

import type Redis from 'ioredis';
import { getRedisClientIfAvailable } from '@/lib/redis/client';
import { devLog } from '@/utils';

// Store all active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Rate limiting: Track last broadcast time
let lastBroadcast = 0;
const MIN_BROADCAST_INTERVAL = 100; // ms - prevents spam

const SSE_CHANNEL = process.env.REDIS_SSE_CHANNEL || 'marketplace:sse:events';
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

interface SSEEnvelope {
    source: string;
    timestamp: number;
    event: any;
}

let subscriberClient: Redis | null = null;
let subscriberInitialized = false;
let subscriberInitPromise: Promise<void> | null = null;

export interface SSEHealthStatus {
    instanceId: string;
    channel: string;
    activeConnections: number;
    redisSubscriberInitialized: boolean;
    redisSubscriberStatus: string;
}

function sendEventToLocalConnections(event: any): void {
    const now = Date.now();

    if (now - lastBroadcast < MIN_BROADCAST_INTERVAL) {
        devLog.debug('[SSE] Rate limit - skipping local broadcast (too soon after last)');
        return;
    }

    lastBroadcast = now;

    const message = `data: ${JSON.stringify(event)}\n\n`;

    let successCount = 0;
    let failCount = 0;

    connections.forEach(controller => {
        try {
            controller.enqueue(new TextEncoder().encode(message));
            successCount++;
        } catch (error) {
            devLog.error('[SSE] Failed to send to client:', error);
            connections.delete(controller);
            failCount++;
        }
    });

    devLog.debug(`[SSE] Broadcasted to ${successCount}/${connections.size} client(s):`, event?.eventName);
    if (failCount > 0) {
        devLog.warn(`[SSE] ${failCount} client(s) failed and were removed`);
    }
}

async function ensureRedisSubscriber(): Promise<void> {
    if (subscriberInitialized || subscriberInitPromise) {
        if (subscriberInitPromise) {
            await subscriberInitPromise;
        }
        return;
    }

    subscriberInitPromise = (async () => {
        const publisherClient = await getRedisClientIfAvailable();
        if (!publisherClient) {
            return;
        }

        const duplicate = publisherClient.duplicate();

        duplicate.on('error', (error) => {
            devLog.warn('[SSE] Redis subscriber error:', error instanceof Error ? error.message : error);
            subscriberInitialized = false;
        });

        duplicate.on('message', (channel, payload) => {
            if (channel !== SSE_CHANNEL) {
                return;
            }

            try {
                const envelope = JSON.parse(payload) as SSEEnvelope;
                if (envelope.source === INSTANCE_ID) {
                    return;
                }
                sendEventToLocalConnections(envelope.event);
            } catch (error) {
                devLog.warn('[SSE] Failed to parse Redis SSE payload:', error instanceof Error ? error.message : error);
            }
        });

        try {
            await duplicate.connect();
        } catch {
            // ioredis may already be connected depending on state
        }

        await duplicate.subscribe(SSE_CHANNEL);
        subscriberClient = duplicate;
        subscriberInitialized = true;
        devLog.info(`[SSE] Redis subscriber active on channel: ${SSE_CHANNEL}`);
    })();

    try {
        await subscriberInitPromise;
    } finally {
        subscriberInitPromise = null;
    }
}

/**
 * Add a new SSE connection
 */
export function addConnection(controller: ReadableStreamDefaultController): void {
    connections.add(controller);
    devLog.info(`[SSE] Client connected (${connections.size} total)`);

    void ensureRedisSubscriber();
}

/**
 * Remove an SSE connection
 */
export function removeConnection(controller: ReadableStreamDefaultController): void {
    connections.delete(controller);
    devLog.info(`[SSE] Client disconnected (${connections.size} remaining)`);
}

/**
 * Get number of active connections
 */
export function getConnectionCount(): number {
    return connections.size;
}

export function getSSEHealthStatus(): SSEHealthStatus {
    return {
        instanceId: INSTANCE_ID,
        channel: SSE_CHANNEL,
        activeConnections: connections.size,
        redisSubscriberInitialized: subscriberInitialized,
        redisSubscriberStatus: subscriberClient?.status || 'not-initialized',
    };
}

/**
 * Broadcast event to ALL connected clients
 * Rate-limited to prevent spam (max 10 broadcasts/second)
 */
export async function broadcastMarketplaceEvent(event: any): Promise<void> {
    sendEventToLocalConnections(event);

    const redis = await getRedisClientIfAvailable();
    if (!redis) {
        return;
    }

    const envelope: SSEEnvelope = {
        source: INSTANCE_ID,
        timestamp: Date.now(),
        event,
    };

    try {
        await redis.publish(SSE_CHANNEL, JSON.stringify(envelope));
    } catch (error) {
        devLog.warn('[SSE] Redis publish failed, continuing with local broadcast only:', error instanceof Error ? error.message : error);
    }
}

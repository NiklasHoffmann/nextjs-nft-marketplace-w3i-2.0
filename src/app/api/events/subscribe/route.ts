/**
 * Server-Sent Events (SSE) Subscription Endpoint
 * 
 * Allows clients to subscribe to real-time marketplace events.
 * When an event occurs (list/buy/cancel), ALL connected clients receive a notification.
 */

import { NextRequest } from 'next/server';
import { addConnection, removeConnection } from '@/services/sse/broadcast';

/**
 * GET /api/events/subscribe
 * 
 * Establishes SSE connection for real-time event updates
 */
export async function GET(request: NextRequest) {
    console.log('🔌 [SSE] New client connecting...');

    const stream = new ReadableStream({
        start(controller) {
            // Add to active connections
            addConnection(controller);

            // Send initial connection message
            const initMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
            controller.enqueue(new TextEncoder().encode(initMessage));

            // Keep-alive ping every 30s
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': ping\n\n'));
                } catch {
                    clearInterval(pingInterval);
                    removeConnection(controller);
                }
            }, 30000);

            // Cleanup on disconnect
            request.signal.addEventListener('abort', () => {
                clearInterval(pingInterval);
                removeConnection(controller);
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}

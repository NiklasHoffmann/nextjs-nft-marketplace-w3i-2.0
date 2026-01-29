/**
 * Server-Sent Events (SSE) Broadcast Service
 * 
 * Manages SSE connections and broadcasts events to all connected clients.
 */

// Store all active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Rate limiting: Track last broadcast time
let lastBroadcast = 0;
const MIN_BROADCAST_INTERVAL = 100; // ms - prevents spam

/**
 * Add a new SSE connection
 */
export function addConnection(controller: ReadableStreamDefaultController): void {
    connections.add(controller);
    console.log(`✅ [SSE] Client connected (${connections.size} total)`);
}

/**
 * Remove an SSE connection
 */
export function removeConnection(controller: ReadableStreamDefaultController): void {
    connections.delete(controller);
    console.log(`🔌 [SSE] Client disconnected (${connections.size} remaining)`);
}

/**
 * Get number of active connections
 */
export function getConnectionCount(): number {
    return connections.size;
}

/**
 * Broadcast event to ALL connected clients
 * Rate-limited to prevent spam (max 10 broadcasts/second)
 */
export function broadcastMarketplaceEvent(event: any): void {
    const now = Date.now();
    
    // Rate limiting check
    if (now - lastBroadcast < MIN_BROADCAST_INTERVAL) {
        console.log(`⏱️ [SSE] Rate limit - skipping broadcast (too soon after last)`);
        return;
    }
    
    lastBroadcast = now;
    
    const message = `data: ${JSON.stringify(event)}\n\n`;
    
    // Broadcast to all clients
    let successCount = 0;
    let failCount = 0;
    
    connections.forEach(controller => {
        try {
            controller.enqueue(new TextEncoder().encode(message));
            successCount++;
        } catch (error) {
            console.error('❌ [SSE] Failed to send to client:', error);
            connections.delete(controller);
            failCount++;
        }
    });
    
    console.log(`📡 [SSE] Broadcasted to ${successCount}/${connections.size} client(s):`, event.eventName);
    if (failCount > 0) {
        console.log(`⚠️ [SSE] ${failCount} client(s) failed and were removed`);
    }
}

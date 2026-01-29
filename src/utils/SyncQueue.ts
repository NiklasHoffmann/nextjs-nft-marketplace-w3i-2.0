/**
 * SyncQueue - Retry queue for failed async operations
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Max retry attempts
 * - Queue processing
 * - Error tracking
 * 
 * @example
 * const queue = new SyncQueue<CartSyncPayload>(
 *   async (payload) => await syncToAPI(payload),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * queue.enqueue({ id: '123', data: {...} });
 */

import { devLog } from './devLog';

export interface SyncQueueItem<T> {
    id: string;
    data: T;
    retries: number;
    lastAttempt: number;
}

export interface SyncQueueOptions {
    maxRetries?: number;
    baseDelay?: number; // Base delay in ms for exponential backoff
    maxDelay?: number; // Max delay in ms
}

export class SyncQueue<T> {
    private queue: SyncQueueItem<T>[] = [];
    private isProcessing = false;
    private syncFn: (data: T) => Promise<void>;
    private options: Required<SyncQueueOptions>;

    constructor(
        syncFn: (data: T) => Promise<void>,
        options: SyncQueueOptions = {}
    ) {
        this.syncFn = syncFn;
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            baseDelay: options.baseDelay ?? 1000,
            maxDelay: options.maxDelay ?? 30000
        };
    }

    /**
     * Add item to queue
     */
    enqueue(id: string, data: T): void {
        // Check if item already in queue
        const existingIndex = this.queue.findIndex(item => item.id === id);

        if (existingIndex !== -1) {
            // Update existing item
            const existingItem = this.queue[existingIndex];
            if (existingItem) {
                existingItem.data = data;
                existingItem.retries = 0; // Reset retries
            }
            devLog.info('sync-queue', `📝 Updated item in queue: ${id}`);
        } else {
            // Add new item
            this.queue.push({
                id,
                data,
                retries: 0,
                lastAttempt: 0
            });
            devLog.info('sync-queue', `➕ Added item to queue: ${id} (queue size: ${this.queue.length})`);
        }

        // Start processing if not already running
        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Remove item from queue
     */
    remove(id: string): void {
        const initialSize = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== id);
        if (this.queue.length < initialSize) {
            devLog.info('sync-queue', `🗑️ Removed item from queue: ${id}`);
        }
    }

    /**
     * Get queue status
     */
    getStatus(): { queueSize: number; isProcessing: boolean } {
        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Process queue items
     */
    private async process(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        devLog.info('sync-queue', `🔄 Processing queue (${this.queue.length} items)...`);

        while (this.queue.length > 0) {
            const item = this.queue[0];
            if (!item) break; // Safety check

            // Check if we should wait before retrying
            const now = Date.now();
            const timeSinceLastAttempt = now - item.lastAttempt;
            const requiredDelay = this.calculateDelay(item.retries);

            if (item.retries > 0 && timeSinceLastAttempt < requiredDelay) {
                // Wait before retrying
                const waitTime = requiredDelay - timeSinceLastAttempt;
                devLog.info('sync-queue', `⏳ Waiting ${waitTime}ms before retry...`);
                await this.sleep(waitTime);
            }

            // Try to sync
            try {
                item.lastAttempt = now;
                await this.syncFn(item.data);

                // Success - remove from queue
                this.queue.shift();
                devLog.success('sync-queue', `✅ Successfully synced: ${item.id}`);
            } catch (error) {
                item.retries++;
                devLog.error('sync-queue', `❌ Sync failed for ${item.id} (attempt ${item.retries}/${this.options.maxRetries}):`, error);

                if (item.retries >= this.options.maxRetries) {
                    // Max retries reached - remove from queue
                    this.queue.shift();
                    devLog.error('sync-queue', `🚫 Max retries reached for ${item.id}, removing from queue`);
                } else {
                    // Will retry on next iteration
                    devLog.info('sync-queue', `🔄 Will retry ${item.id} in ${this.calculateDelay(item.retries)}ms`);
                }
            }
        }

        this.isProcessing = false;
        devLog.success('sync-queue', `✅ Queue processing complete`);
    }

    /**
     * Calculate delay with exponential backoff
     */
    private calculateDelay(retryCount: number): number {
        const delay = this.options.baseDelay * Math.pow(2, retryCount);
        return Math.min(delay, this.options.maxDelay);
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all items from queue
     */
    clear(): void {
        this.queue = [];
        devLog.info('sync-queue', '🗑️ Queue cleared');
    }
}

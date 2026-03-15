/**
 * Insights Sync Service
 * 
 * Syncs curated insights data when admins make edits
 */

import { getEnrichedNFTsCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export class InsightsSync {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private itemsProcessed: number = 0;
    private lastRun: Date | null = null;
    private errorCount: number = 0;
    private lastErrorAt: Date | null = null;

    // Run every 30 minutes by default (configurable)
    private readonly INTERVAL_MS = parsePositiveInt(process.env.INSIGHTS_SYNC_INTERVAL_MS, 30 * 60 * 1000);

    // Process max 100 items per run by default (configurable)
    private readonly BATCH_SIZE = parsePositiveInt(process.env.INSIGHTS_SYNC_BATCH_SIZE, 100);

    /**
     * Start periodic insights sync
     */
    start() {
        if (this.isRunning) {
            devLog.warn('⚠️ Insights sync already running');
            return;
        }

        devLog.info('💡 Starting insights sync service...');
        this.isRunning = true;

        // Run after 2 minutes, then on interval
        setTimeout(() => {
            this.runSync();
            this.intervalId = setInterval(() => this.runSync(), this.INTERVAL_MS);
        }, 2 * 60 * 1000);

        devLog.info(`✅ Insights sync started (runs every ${this.INTERVAL_MS / 1000 / 60} minutes)`);
    }

    /**
     * Stop periodic sync
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        devLog.info('🛑 Insights sync stopped');
    }

    /**
     * Run one sync cycle
     */
    private async runSync() {
        try {
            // Get all insights from API
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/insights`);

            if (!response.ok) {
                throw new Error(`Insights API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success || !data.data) {
                devLog.warn('⚠️ No insights data available');
                return;
            }

            const insights = Array.isArray(data.data) ? data.data : (data.data.data || []);

            if (insights.length === 0) {
                return;
            }

            devLog.info(`💡 Syncing ${insights.length} insights...`);

            const collection = await getEnrichedNFTsCollection();

            for (const insight of insights) {
                try {
                    await this.syncInsightForNFT(insight, collection);
                    this.itemsProcessed++;
                } catch (error) {
                    devLog.error(`❌ Error syncing insight for ${insight.contractAddress}-${insight.tokenId}:`, error);
                    this.errorCount++;
                    this.lastErrorAt = new Date();
                }
            }

            this.lastRun = new Date();
            devLog.info(`✅ Insights sync complete. Processed: ${this.itemsProcessed} total`);
        } catch (error) {
            devLog.error('❌ Error in insights sync:', error);
            this.errorCount++;
            this.lastErrorAt = new Date();
        }
    }

    /**
     * Sync insight for a single NFT
     */
    private async syncInsightForNFT(insight: any, collection: any) {
        const contractAddress = insight.contractAddress;
        const tokenId = insight.tokenId;

        if (!contractAddress || !tokenId) {
            return; // Skip if missing identifier
        }

        // ✅ NEW ARCHITECTURE: Insights are already in admin_nft_insights collection
        // Just update the sync timestamp in marketplace_items to track freshness
        await collection.updateOne(
            { contractAddress, tokenId },
            {
                $set: {
                    'lastSync.insights': new Date(),
                }
            },
            { upsert: false } // Don't create if doesn't exist (insights are optional)
        );
    }

    /**
     * Manually trigger sync for a specific NFT (called when admin edits)
     */
    async syncNFT(contractAddress: string, tokenId: string) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`);

            if (!response.ok) {
                throw new Error(`Insights API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                return;
            }

            const collection = await getEnrichedNFTsCollection();
            await this.syncInsightForNFT(data.data, collection);

            devLog.info(`✅ Synced insights for ${contractAddress}-${tokenId}`);
        } catch (error) {
            devLog.error(`❌ Failed to sync insights for ${contractAddress}-${tokenId}:`, error);
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            itemsProcessed: this.itemsProcessed,
            lastRun: this.lastRun,
            intervalMs: this.INTERVAL_MS,
            batchSize: this.BATCH_SIZE,
            errorCount: this.errorCount,
            lastErrorAt: this.lastErrorAt,
        };
    }
}

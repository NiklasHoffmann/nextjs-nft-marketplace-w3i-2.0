/**
 * Insights Sync Service
 * 
 * Syncs curated insights data when admins make edits
 */

import { getEnrichedNFTsCollection } from '@/lib/mongodb';

export class InsightsSync {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private itemsProcessed: number = 0;
    private lastRun: Date | null = null;

    // Run every 30 minutes (insights change less frequently)
    private readonly INTERVAL_MS = 30 * 60 * 1000;

    // Process max 100 items per run
    private readonly BATCH_SIZE = 100;

    /**
     * Start periodic insights sync
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Insights sync already running');
            return;
        }

        console.log('💡 Starting insights sync service...');
        this.isRunning = true;

        // Run after 2 minutes, then on interval
        setTimeout(() => {
            this.runSync();
            this.intervalId = setInterval(() => this.runSync(), this.INTERVAL_MS);
        }, 2 * 60 * 1000);

        console.log(`✅ Insights sync started (runs every ${this.INTERVAL_MS / 1000 / 60} minutes)`);
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
        console.log('🛑 Insights sync stopped');
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
                console.log('⚠️ No insights data available');
                return;
            }

            const insights = Array.isArray(data.data) ? data.data : (data.data.data || []);

            if (insights.length === 0) {
                return;
            }

            console.log(`💡 Syncing ${insights.length} insights...`);

            const collection = await getEnrichedNFTsCollection();

            for (const insight of insights) {
                try {
                    await this.syncInsightForNFT(insight, collection);
                    this.itemsProcessed++;
                } catch (error) {
                    console.error(`❌ Error syncing insight for ${insight.contractAddress}-${insight.tokenId}:`, error);
                }
            }

            this.lastRun = new Date();
            console.log(`✅ Insights sync complete. Processed: ${this.itemsProcessed} total`);
        } catch (error) {
            console.error('❌ Error in insights sync:', error);
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

            console.log(`✅ Synced insights for ${contractAddress}-${tokenId}`);
        } catch (error) {
            console.error(`❌ Failed to sync insights for ${contractAddress}-${tokenId}:`, error);
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
        };
    }
}

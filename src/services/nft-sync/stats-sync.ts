/**
 * Stats Sync Service
 * 
 * Periodically refreshes social stats for active NFTs
 */

import { getEnrichedNFTsCollection, getCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveInternalApiBaseUrl = (): string => {
    return process.env.INTERNAL_API_BASE_URL
        || process.env.NEXT_PUBLIC_BASE_URL
        || `http://localhost:${process.env.PORT || 3000}`;
};

export class StatsSync {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private itemsProcessed: number = 0;
    private lastRun: Date | null = null;
    private errorCount: number = 0;
    private lastErrorAt: Date | null = null;

    // Run every 5 minutes by default (configurable)
    private readonly INTERVAL_MS = parsePositiveInt(process.env.STATS_SYNC_INTERVAL_MS, 5 * 60 * 1000);

    // Process max 50 items per run by default (configurable)
    private readonly BATCH_SIZE = parsePositiveInt(process.env.STATS_SYNC_BATCH_SIZE, 50);

    /**
     * Start periodic stats sync
     */
    start() {
        if (this.isRunning) {
            devLog.warn('⚠️ Stats sync already running');
            return;
        }

        devLog.info('📊 Starting stats sync service...');
        this.isRunning = true;

        // Run after 1 minute, then on interval
        setTimeout(() => {
            this.runSync();
            this.intervalId = setInterval(() => this.runSync(), this.INTERVAL_MS);
        }, 60 * 1000);

        devLog.info(`✅ Stats sync started (runs every ${this.INTERVAL_MS / 1000 / 60} minutes)`);
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
        devLog.info('🛑 Stats sync stopped');
    }

    /**
     * Run one sync cycle
     */
    private async runSync() {
        try {
            const collection = await getEnrichedNFTsCollection();

            // Find active NFTs (listed or have views)
            const activeNFTs = await collection.find({
                $or: [
                    { 'marketplace.isListed': true },
                    { 'stats.viewCount': { $gt: 5 } }
                ]
            })
                .sort({ 'stats.viewCount': -1 }) // Most viewed first
                .limit(this.BATCH_SIZE)
                .toArray();

            if (activeNFTs.length === 0) {
                return;
            }

            devLog.info(`📊 Syncing stats for ${activeNFTs.length} NFTs...`);

            for (const nft of activeNFTs) {
                try {
                    await this.syncStatsForNFT(nft.contractAddress, nft.tokenId);
                    this.itemsProcessed++;
                } catch (error) {
                    devLog.error(`❌ Error syncing stats for ${nft.contractAddress}-${nft.tokenId}:`, error);
                    this.errorCount++;
                    this.lastErrorAt = new Date();
                }
            }

            this.lastRun = new Date();
            devLog.info(`✅ Stats sync complete. Processed: ${this.itemsProcessed} total`);
        } catch (error) {
            devLog.error('❌ Error in stats sync:', error);
            this.errorCount++;
            this.lastErrorAt = new Date();
        }
    }

    /**
     * Sync stats for a single NFT
     */
    private async syncStatsForNFT(contractAddress: string, tokenId: string) {
        try {
            // Call existing stats API
            const baseUrl = resolveInternalApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/nft/stats/${contractAddress}/${tokenId}`);

            if (!response.ok) {
                // Stats API might return 404 if no stats exist yet - this is OK
                if (response.status === 404) {
                    return;
                }
                throw new Error(`Stats API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                return; // No stats yet
            }

            // ✅ NEW ARCHITECTURE: Store stats in nft_stats collection, NOT marketplace_items!
            const statsCollection = await getCollection('nft_stats');
            await statsCollection.updateOne(
                { contractAddress, tokenId },
                {
                    $set: {
                        // CRITICAL: Set contractAddress and tokenId explicitly for upsert
                        contractAddress,
                        tokenId,
                        likeCount: data.data?.likeCount || 0,
                        favoriteCount: data.data?.favoriteCount || 0,
                        watchlistCount: data.data?.watchlistCount || 0,
                        viewCount: data.data?.viewCount || 0,
                        shareCount: data.data?.shareCount || 0,
                        commentCount: data.data?.commentCount || 0,
                        averageRating: data.data?.averageRating || 0,
                        ratingCount: data.data?.ratingCount || 0,
                        updatedAt: new Date(),
                    },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );

            // ✅ Only update sync timestamp in marketplace_items (keep it clean!)
            const marketplaceCollection = await getEnrichedNFTsCollection();
            await marketplaceCollection.updateOne(
                { contractAddress, tokenId },
                { $set: { 'lastSync.stats': new Date() } }
            );
        } catch (error) {
            devLog.error(`❌ Failed to sync stats for ${contractAddress}-${tokenId}:`, error);
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

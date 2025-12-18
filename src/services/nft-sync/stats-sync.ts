/**
 * Stats Sync Service
 * 
 * Periodically refreshes social stats for active NFTs
 */

import { getEnrichedNFTsCollection, getCollection } from '@/lib/mongodb';

export class StatsSync {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private itemsProcessed: number = 0;
    private lastRun: Date | null = null;

    // Run every 5 minutes
    private readonly INTERVAL_MS = 5 * 60 * 1000;

    // Process max 50 items per run
    private readonly BATCH_SIZE = 50;

    /**
     * Start periodic stats sync
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Stats sync already running');
            return;
        }

        console.log('📊 Starting stats sync service...');
        this.isRunning = true;

        // Run after 1 minute, then on interval
        setTimeout(() => {
            this.runSync();
            this.intervalId = setInterval(() => this.runSync(), this.INTERVAL_MS);
        }, 60 * 1000);

        console.log(`✅ Stats sync started (runs every ${this.INTERVAL_MS / 1000 / 60} minutes)`);
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
        console.log('🛑 Stats sync stopped');
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

            console.log(`📊 Syncing stats for ${activeNFTs.length} NFTs...`);

            for (const nft of activeNFTs) {
                try {
                    await this.syncStatsForNFT(nft.contractAddress, nft.tokenId);
                    this.itemsProcessed++;
                } catch (error) {
                    console.error(`❌ Error syncing stats for ${nft.contractAddress}-${nft.tokenId}:`, error);
                }
            }

            this.lastRun = new Date();
            console.log(`✅ Stats sync complete. Processed: ${this.itemsProcessed} total`);
        } catch (error) {
            console.error('❌ Error in stats sync:', error);
        }
    }

    /**
     * Sync stats for a single NFT
     */
    private async syncStatsForNFT(contractAddress: string, tokenId: string) {
        try {
            // Call existing stats API
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/nft/stats/${contractAddress}/${tokenId}`);

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
            console.error(`❌ Failed to sync stats for ${contractAddress}-${tokenId}:`, error);
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

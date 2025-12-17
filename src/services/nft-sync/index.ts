/**
 * NFT Sync Service - Main Entry Point
 * 
 * OPTIMIZED ARCHITECTURE (per DATA_SYNC_ARCHITECTURE.md)
 * 
 * Background services:
 * - The Graph v2: Polls every 30s (LISTING DATA ONLY)
 * - Stats Sync: Aggregates stats periodically
 * - Insights Sync: Syncs admin insights
 * 
 * On-demand services (NOT scheduled):
 * - Blockchain State Sync: Called when needed (owner + approved)
 * - IPFS Metadata Sync: Called when missing (one-time fetch)
 */

import { GraphQLSyncV2 } from './graph-subscription-v2';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';

// ❌ DEPRECATED: graph-subscription.ts (v1 - REMOVED)
// ❌ DEPRECATED: metadata-sync.ts (replaced by on-demand services)

export class NFTSyncService {
    private graphSyncV2: GraphQLSyncV2;
    private statsSync: StatsSync;
    private insightsSync: InsightsSync;

    private isRunning: boolean = false;

    constructor() {
        this.graphSyncV2 = new GraphQLSyncV2();
        this.statsSync = new StatsSync();
        this.insightsSync = new InsightsSync();
        console.log('🆕 Subgraph v2 sync initialized (OPTIMIZED: listing data only)');
    }

    /**
     * Start all background sync services
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ NFT Sync Service already running');
            return;
        }

        console.log('🚀 Starting NFT Sync Service...');

        try {
            // Start GraphQL v2 sync (real-time marketplace updates)
            console.log('📡 Using Subgraph v2 (Ideation Market) - OPTIMIZED');
            await this.graphSyncV2.start();

            // Start periodic sync jobs
            this.statsSync.start();
            this.insightsSync.start();

            // ❌ REMOVED: metadata-sync (replaced by on-demand services)
            // Blockchain state and IPFS metadata are now fetched on-demand
            // See: blockchain-state-sync.ts and ipfs-metadata-lazy-sync.ts

            this.isRunning = true;
            console.log('✅ NFT Sync Service started successfully (OPTIMIZED ARCHITECTURE)');
            console.log('   ✅ Subgraph v2: Every 30s (listing data only)');
            console.log('   ✅ Blockchain State: On-demand (when needed)');
            console.log('   ✅ IPFS Metadata: Lazy-loaded (one-time fetch)');
        } catch (error) {
            console.error('❌ Error starting NFT Sync Service:', error);
            throw error;
        }
    }

    /**
     * Stop all background sync services
     */
    async stop() {
        if (!this.isRunning) {
            console.log('⚠️ NFT Sync Service not running');
            return;
        }

        console.log('🛑 Stopping NFT Sync Service...');

        try {
            await this.graphSubscription.stop();

            // Stop v2 sync if running
            if (this.graphSyncV2) {
                await this.graphSyncV2.stop();
            }

            this.statsSync.styncV2.stop();
            this.statsSync.stop();
            this.insightsSync.stop();

            this.isRunning = false;
            console.log('✅ NFT Sync Service stopped');
        } catch (error) {
            console.error('❌ Error stopping NFT Sync Service:', error);
            throw error;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            architecture: 'OPTIMIZED (v2 only)',
            graphSyncV2: this.graphSyncV2.getStatus(),
            statsSync: this.statsSync.getStatus(),
            insightsSync: this.insightsSync.getStatus()
        };
    }
}

// Singleton instance
let syncServiceInstance: NFTSyncService | null = null;

export function getNFTSyncService(): NFTSyncService {
    if (!syncServiceInstance) {
        syncServiceInstance = new NFTSyncService();
    }
    return syncServiceInstance;
}

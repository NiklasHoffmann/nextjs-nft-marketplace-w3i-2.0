/**
 * NFT Sync Service - Main Entry Point
 * 
 * Background service that keeps MongoDB in sync with:
 * - The Graph (marketplace/blockchain data)
 * - IPFS (NFT metadata)
 * - Stats API (social stats)
 * - Insights API (curated insights)
 */

import { GraphQLSubscriptionManager } from './graph-subscription';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';
import { marketplaceMetadataSync } from './metadata-sync';

export class NFTSyncService {
    private graphSubscription: GraphQLSubscriptionManager;
    private statsSync: StatsSync;
    private insightsSync: InsightsSync;

    private isRunning: boolean = false;

    constructor() {
        this.graphSubscription = new GraphQLSubscriptionManager();
        this.statsSync = new StatsSync();
        this.insightsSync = new InsightsSync();
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
            // Start GraphQL subscription (real-time marketplace updates)
            await this.graphSubscription.start();

            // Start periodic sync jobs
            this.statsSync.start();
            this.insightsSync.start();

            // ✅ Start marketplace metadata sync (NEW ARCHITECTURE: uses nft_metadata collection)
            marketplaceMetadataSync.start();

            this.isRunning = true;
            console.log('✅ NFT Sync Service started successfully');
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
            this.statsSync.stop();
            this.insightsSync.stop();

            // ✅ Stop marketplace metadata sync
            marketplaceMetadataSync.stop();

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
            graphSubscription: this.graphSubscription.getStatus(),
            statsSync: this.statsSync.getStatus(),
            insightsSync: this.insightsSync.getStatus(),
            marketplaceMetadataSync: marketplaceMetadataSync.getStatus(),
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

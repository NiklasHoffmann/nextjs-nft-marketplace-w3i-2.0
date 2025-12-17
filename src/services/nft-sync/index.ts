/**
 * NFT Sync Service - Main Entry Point
 * 
 * Background service that keeps MongoDB in sync with:
 * - The Graph v1 (marketplace/blockchain data - legacy)
 * - The Graph v2 (Ideation Market - new schema)
 * - IPFS (NFT metadata)
 * - Stats API (social stats)
 * - Insights API (curated insights)
 */

import { GraphQLSubscriptionManager } from './graph-subscription';
import { GraphQLSyncV2 } from './graph-subscription-v2';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';
import { marketplaceMetadataSync } from './metadata-sync';

export class NFTSyncService {
    private graphSubscription: GraphQLSubscriptionManager;  // v1
    private graphSyncV2: GraphQLSyncV2 | null = null;       // v2 (optional)
    private statsSync: StatsSync;
    private insightsSync: InsightsSync;

    private isRunning: boolean = false;

    constructor() {
        this.graphSubscription = new GraphQLSubscriptionManager();
        this.statsSync = new StatsSync();
        this.insightsSync = new InsightsSync();

        // Initialize v2 sync if enabled
        const subgraphVersion = process.env.NEXT_PUBLIC_SUBGRAPH_VERSION || 'v1';
        if (subgraphVersion === 'v2' || process.env.NEXT_PUBLIC_SUBGRAPH_V2_URL) {
            this.graphSyncV2 = new GraphQLSyncV2();
            console.log('🆕 Subgraph v2 sync initialized');
        }
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
            const subgraphVersion = process.env.NEXT_PUBLIC_SUBGRAPH_VERSION || 'v1';
            
            if (subgraphVersion === 'v2' && this.graphSyncV2) {
                console.log('📡 Using Subgraph v2 (Ideation Market)');
                await this.graphSyncV2.start();
            } else if (subgraphVersion === 'v1') {
                console.log('📡 Using Subgraph v1 (legacy)');
                await this.graphSubscription.start();
            }

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
            
            // Stop v2 sync if running
            if (this.graphSyncV2) {
                await this.graphSyncV2.stop();
            }
            
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
        const status: any = {
            isRunning: this.isRunning,
            graphSubscription: this.graphSubscription.getStatus(),
            statsSync: this.statsSync.getStatus(),
            insightsSync: this.insightsSync.getStatus(),
            marketplaceMetadataSync: marketplaceMetadataSync.getStatus(),
        };

        // Add v2 status if available
        if (this.graphSyncV2) {
            status.graphSyncV2 = this.graphSyncV2.getStatus();
        }

        return status;
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

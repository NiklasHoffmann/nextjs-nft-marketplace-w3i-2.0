/**
 * NFT Sync Service - Main Entry Point
 * 
 * HYBRID ARCHITECTURE (Optimized Real-Time System)
 * 
 * Real-time services:
 * - WebSocket Event Listener: Instant events from blockchain (< 1s)
 * - The Graph v2: Polls every 30s as fallback (LISTING DATA)
 * 
 * Periodic services:
 * - Stats Sync: Aggregates stats periodically
 * - Insights Sync: Syncs admin insights
 * 
 * On-demand services:
 * - Blockchain State Sync: Called when needed (owner + approved)
 * - IPFS Metadata Sync: Called when missing (one-time fetch)
 */

import { GraphQLSyncV2 } from './graph-subscription-v2';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';
import { MarketplaceEventListenerService } from '../marketplace/event-listener';
import { routeMarketplaceEvent } from '../marketplace/event-invalidation-bridge';
import { syncListingToMongoDB, removeListingFromMongoDB } from '../marketplace/event-mongodb-sync';
import type { ProcessedItemListedEvent, ProcessedItemBoughtEvent, ProcessedItemCanceledEvent } from '@/types/marketplace/contract-events';

// ❌ DEPRECATED: graph-subscription.ts (v1 - REMOVED)
// ❌ DEPRECATED: metadata-sync.ts (replaced by on-demand services)

export class NFTSyncService {
    private graphSyncV2: GraphQLSyncV2;
    private statsSync: StatsSync;
    private insightsSync: InsightsSync;
    private eventListener: MarketplaceEventListenerService;

    private isRunning: boolean = false;

    constructor() {
        this.graphSyncV2 = new GraphQLSyncV2();
        this.statsSync = new StatsSync();
        this.insightsSync = new InsightsSync();

        // Initialize event listener with marketplace address
        const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
        if (!marketplaceAddress) {
            throw new Error('NEXT_PUBLIC_MARKETPLACE_ADDRESS not configured');
        }
        this.eventListener = new MarketplaceEventListenerService(marketplaceAddress);

        console.log('🆕 Subgraph v2 sync initialized (OPTIMIZED: listing data only)');
        console.log('🎧 WebSocket event listener initialized (REAL-TIME)');
    }

    /**
     * Start all background sync services
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ NFT Sync Service already running');
            return;
        }

        console.log('🚀 Starting NFT Sync Service (HYBRID MODE)...');

        try {
            // Start WebSocket Event Listener (REAL-TIME - Priority #1)
            console.log('🎧 Starting WebSocket Event Listener...');

            // Subscribe to all marketplace events and route them
            const eventTypes: Array<'ItemListed' | 'ItemBought' | 'ItemCanceled' | 'ItemUpdated'> = [
                'ItemListed',
                'ItemBought',
                'ItemCanceled',
                'ItemUpdated'
            ];

            eventTypes.forEach(eventName => {
                this.eventListener.subscribe(eventName, (event) => {
                    console.log(`📡 [Backend] Received ${event.eventName}:`, {
                        listingId: (event.data as any).listingId?.toString(),
                        nft: `${(event.data as any).nftAddress}:${(event.data as any).tokenId}`
                    });

                    // SERVER-SIDE: Immediately sync to MongoDB
                    if (event.eventName === 'ItemListed') {
                        syncListingToMongoDB(event as ProcessedItemListedEvent).catch(error => {
                            console.error('❌ [Backend] MongoDB sync failed:', error);
                        });
                    } else if (event.eventName === 'ItemBought' || event.eventName === 'ItemCanceled') {
                        const { nftAddress, tokenId, listingId } = (event as ProcessedItemBoughtEvent | ProcessedItemCanceledEvent).data;
                        removeListingFromMongoDB(
                            nftAddress,
                            tokenId.toString(),
                            listingId.toString()
                        ).catch(error => {
                            console.error('❌ [Backend] MongoDB removal failed:', error);
                        });
                    }

                    // Route event through invalidation bridge (triggers client-side cache invalidation)
                    routeMarketplaceEvent(event);
                });
            });

            await this.eventListener.start();
            console.log('✅ WebSocket connected - Real-time events active');

            // Start GraphQL v2 sync (FALLBACK - runs every 30s)
            console.log('📡 Starting Subgraph v2 sync (FALLBACK)...');
            await this.graphSyncV2.start();

            // Start periodic sync jobs
            this.statsSync.start();
            this.insightsSync.start();

            this.isRunning = true;
            console.log('\n✅ NFT Sync Service started successfully (HYBRID ARCHITECTURE)');
            console.log('   🎧 WebSocket Events: REAL-TIME (< 1 second)');
            console.log('   📡 Subgraph v2: Every 30s (fallback + historical data)');
            console.log('   📊 Stats/Insights: Periodic sync');
            console.log('   ⚡ Blockchain State: On-demand');
            console.log('   💾 IPFS Metadata: Lazy-loaded\n');
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
            // Stop WebSocket listener
            await this.eventListener.stop();
            console.log('✅ WebSocket disconnected');

            // Stop v2 sync
            await this.graphSyncV2.stop();

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
            architecture: 'HYBRID (WebSocket + TheGraph)',
            eventListener: this.eventListener.getState(),
            graphSyncV2: this.graphSyncV2.getStatus(),
            statsSync: this.statsSync.getStatus(),
            insightsSync: this.insightsSync.getStatus()
        };
    }

    /**
     * Force immediate sync (single run, no polling)
     * Used after transactions to immediately update marketplace_items
     */
    async syncOnce(): Promise<void> {
        console.log('🔄 [Force Sync] Running immediate sync...');
        await this.graphSyncV2.syncOnce();
        console.log('✅ [Force Sync] Immediate sync complete');
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

/**
 * NFT SYNC SERVICE - Main Entry Point
 * 
 * HYBRID ARCHITECTURE (Optimized Real-Time System)
 * 
 * Real-time services:
 * - WebSocket Event Listener: Instant events from blockchain (< 1s)
 * - The Graph: Polls every 30s as fallback (LISTING DATA)
 * 
 * Periodic services:
 * - Stats Sync: Aggregates stats periodically
 * - Insights Sync: Syncs admin insights
 * 
 * On-demand services:
 * - Blockchain State Sync: Called when needed (owner + approved)
 * - IPFS Metadata Sync: Called when missing (one-time fetch)
 * 
 * ❌ DEPRECATED (moved to archive/deprecated/):
 * - graph-subscription.ts (v1 - replaced by current version)
 * - metadata-sync.ts (replaced by on-demand services)
 */

import { GraphQLSync } from './graph-subscription';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';
import { getMarketplaceEventListener, type MarketplaceEventListenerService } from '../marketplace/event-listener';
import { routeMarketplaceEvent } from '../marketplace/event-invalidation-bridge';
import { syncListingToMongoDB, removeListingFromMongoDB, updateListingInMongoDB } from '../marketplace/event-mongodb-sync';
import type { ProcessedItemListedEvent, ProcessedItemBoughtEvent, ProcessedItemCanceledEvent, ProcessedItemUpdatedEvent } from '@/types/marketplace/contract-events';

export { blockchainStateSync } from './blockchain-state-sync';
export { ipfsMetadataLazySync } from './ipfs-metadata-lazy-sync';

export class NFTSyncService {
    private graphSync: GraphQLSync;
    private statsSync: StatsSync;
    private insightsSync: InsightsSync;
    private eventListener: MarketplaceEventListenerService | null = null;

    private isRunning: boolean = false;

    constructor() {
        this.graphSync = new GraphQLSync();
        this.statsSync = new StatsSync();
        this.insightsSync = new InsightsSync();

        console.log('🆕 Subgraph v2 sync initialized (OPTIMIZED: listing data only)');
        console.log('🎧 WebSocket event listener will be obtained from global singleton');
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
            // Get global event listener (if available)
            const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
            const wsUrl = process.env.NEXT_PUBLIC_ALCHEMY_URL_WSS 
                || process.env.ALCHEMY_URL_WSS
                || process.env.NEXT_PUBLIC_INFURA_URL_WSS
                || process.env.INFURA_URL_WSS;

            if (marketplaceAddress && wsUrl) {
                console.log('🎧 Configuring WebSocket Event Listener...');
                this.eventListener = getMarketplaceEventListener(marketplaceAddress, wsUrl);

                // Subscribe to all marketplace events and route them
                const eventTypes: Array<'ItemListed' | 'ItemBought' | 'ItemCanceled' | 'ItemUpdated'> = [
                    'ItemListed',
                    'ItemBought',
                    'ItemCanceled',
                    'ItemUpdated'
                ];

                eventTypes.forEach(eventName => {
                    this.eventListener!.subscribe(eventName, (event) => {
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
                            const { nftAddress, tokenId, listingId } = event.data;
                            const buyer = event.eventName === 'ItemBought' ? (event as ProcessedItemBoughtEvent).data.buyer : undefined;
                            
                            removeListingFromMongoDB(
                                nftAddress,
                                tokenId.toString(),
                                listingId.toString(),
                                buyer // Only defined for ItemBought
                            ).catch(error => {
                                console.error('❌ [Backend] MongoDB removal failed:', error);
                            });
                        } else if (event.eventName === 'ItemUpdated') {
                            updateListingInMongoDB(event as ProcessedItemUpdatedEvent).catch(error => {
                                console.error('❌ [Backend] MongoDB update failed:', error);
                            });
                        }

                        // Route event through invalidation bridge (triggers client-side cache invalidation)
                        routeMarketplaceEvent(event);
                    });
                });

                await this.eventListener.start();
                console.log('✅ WebSocket connected - Real-time events active');
            } else {
                console.warn('⚠️ WebSocket not configured - falling back to GraphQL polling only');
                console.warn('   Set NEXT_PUBLIC_ALCHEMY_URL_WSS for real-time updates');
            }

            // Start GraphQL sync (FALLBACK - runs every 30s)
            console.log('📡 Starting Subgraph sync (FALLBACK)...');
            await this.graphSync.start();

            // Start periodic sync jobs
            this.statsSync.start();
            this.insightsSync.start();

            this.isRunning = true;
            console.log('\n✅ NFT Sync Service started successfully (HYBRID ARCHITECTURE)');
            console.log('   🎧 WebSocket Events: REAL-TIME (< 1 second)');
            console.log('   📡 Subgraph: Every 30s (fallback + historical data)');
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
            // Stop WebSocket listener (if active)
            if (this.eventListener) {
                await this.eventListener.stop();
                console.log('✅ WebSocket disconnected');
            }

            // Stop GraphQL sync
            await this.graphSync.stop();

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
            eventListener: this.eventListener ? this.eventListener.getState() : { isConnected: false, message: 'WebSocket not configured' },
            graphSync: this.graphSync.getStatus(),
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
        await this.graphSync.syncOnce();
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

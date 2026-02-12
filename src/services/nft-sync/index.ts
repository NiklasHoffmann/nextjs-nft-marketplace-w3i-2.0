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
 * ❌ DEPRECATED (removed):
 * - Legacy graph-subscription v1
 * - Legacy metadata sync service
 */

import { GraphQLSync } from './graph-subscription';
import { StatsSync } from './stats-sync';
import { InsightsSync } from './insights-sync';
import { getMarketplaceEventListener, type MarketplaceEventListenerService } from '../marketplace/event-listener';
import { routeMarketplaceEvent } from '../marketplace/event-invalidation-bridge';
import { syncListingToMongoDB, removeListingFromMongoDB, removeListingByListingId, updateListingInMongoDB } from '../marketplace/event-mongodb-sync';
import { devLog } from '@/utils';
import type {
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent,
    ProcessedItemUpdatedEvent,
    ProcessedListingCanceledDueToInvalidListingEvent,
    ProcessedCollectionWhitelistRevokedCancelTriggeredEvent
} from '@/types/marketplace/contract-events';

const isEnabled = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
};

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

        devLog.info('🆕 Subgraph v2 sync initialized (OPTIMIZED: listing data only)');
        devLog.info('🎧 WebSocket event listener will be obtained from global singleton');
    }

    /**
     * Start all background sync services
     */
    async start() {
        if (this.isRunning) {
            devLog.warn('⚠️ NFT Sync Service already running');
            return;
        }

        devLog.info('🚀 Starting NFT Sync Service (HYBRID MODE)...');

        const enableStatsSync = isEnabled(process.env.ENABLE_STATS_SYNC, true);
        const enableInsightsSync = isEnabled(process.env.ENABLE_INSIGHTS_SYNC, true);

        try {
            // Get global event listener (if available)
            const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
            const wsUrl = process.env.NEXT_PUBLIC_ALCHEMY_URL_WSS
                || process.env.ALCHEMY_URL_WSS
                || process.env.NEXT_PUBLIC_INFURA_URL_WSS
                || process.env.INFURA_URL_WSS;

            if (marketplaceAddress && wsUrl) {
                devLog.info('🎧 Configuring WebSocket Event Listener...');
                this.eventListener = getMarketplaceEventListener(marketplaceAddress, wsUrl);

                // Subscribe to all marketplace events and route them
                const eventTypes: Array<
                    'ItemListed'
                    | 'ItemBought'
                    | 'ItemCanceled'
                    | 'ItemUpdated'
                    | 'ListingCanceledDueToInvalidListing'
                    | 'CollectionWhitelistRevokedCancelTriggered'
                > = [
                    'ItemListed',
                    'ItemBought',
                    'ItemCanceled',
                    'ItemUpdated',
                    'ListingCanceledDueToInvalidListing',
                    'CollectionWhitelistRevokedCancelTriggered'
                ];

                eventTypes.forEach(eventName => {
                    this.eventListener!.subscribe(eventName, (event) => {
                        devLog.info(`📡 [Backend] Received ${event.eventName}:`, {
                            listingId: (event.data as any).listingId?.toString(),
                            nft: `${(event.data as any).nftAddress}:${(event.data as any).tokenId}`
                        });

                        // SERVER-SIDE: Immediately sync to MongoDB
                        if (event.eventName === 'ItemListed') {
                            syncListingToMongoDB(event as ProcessedItemListedEvent).catch(error => {
                                devLog.error('❌ [Backend] MongoDB sync failed:', error);
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
                                devLog.error('❌ [Backend] MongoDB removal failed:', error);
                            });
                        } else if (event.eventName === 'ListingCanceledDueToInvalidListing') {
                            const { nftAddress, tokenId, listingId } = (event as ProcessedListingCanceledDueToInvalidListingEvent).data;
                            removeListingFromMongoDB(
                                nftAddress,
                                tokenId.toString(),
                                listingId.toString()
                            ).catch(error => {
                                devLog.error('❌ [Backend] MongoDB removal failed:', error);
                            });
                        } else if (event.eventName === 'CollectionWhitelistRevokedCancelTriggered') {
                            const { tokenAddress, listingId } = (event as ProcessedCollectionWhitelistRevokedCancelTriggeredEvent).data;
                            removeListingByListingId(tokenAddress, listingId.toString()).catch(error => {
                                devLog.error('❌ [Backend] MongoDB removal failed:', error);
                            });
                        } else if (event.eventName === 'ItemUpdated') {
                            updateListingInMongoDB(event as ProcessedItemUpdatedEvent).catch(error => {
                                devLog.error('❌ [Backend] MongoDB update failed:', error);
                            });
                        }

                        // Route event through invalidation bridge (triggers client-side cache invalidation)
                        routeMarketplaceEvent(event);
                    });
                });

                await this.eventListener.start();
                devLog.info('✅ WebSocket connected - Real-time events active');
            } else {
                devLog.warn('⚠️ WebSocket not configured - falling back to GraphQL polling only');
                devLog.warn('   Set NEXT_PUBLIC_ALCHEMY_URL_WSS for real-time updates');
            }

            // Start GraphQL sync (FALLBACK - runs every 30s)
            devLog.info('📡 Starting Subgraph sync (FALLBACK)...');
            await this.graphSync.start();

            // Start periodic sync jobs
            if (enableStatsSync) {
                this.statsSync.start();
            } else {
                devLog.warn('⚠️ Stats sync disabled (ENABLE_STATS_SYNC=false)');
            }

            if (enableInsightsSync) {
                this.insightsSync.start();
            } else {
                devLog.warn('⚠️ Insights sync disabled (ENABLE_INSIGHTS_SYNC=false)');
            }

            this.isRunning = true;
            devLog.info('\n✅ NFT Sync Service started successfully (HYBRID ARCHITECTURE)');
            devLog.info('   🎧 WebSocket Events: REAL-TIME (< 1 second)');
            devLog.info('   📡 Subgraph: Every 30s (fallback + historical data)');
            devLog.info('   📊 Stats/Insights: Periodic sync (env configurable)');
            devLog.info('   ⚡ Blockchain State: On-demand');
            devLog.info('   💾 IPFS Metadata: Lazy-loaded\n');
        } catch (error) {
            devLog.error('❌ Error starting NFT Sync Service:', error);
            throw error;
        }
    }

    /**
     * Stop all background sync services
     */
    async stop() {
        if (!this.isRunning) {
            devLog.warn('⚠️ NFT Sync Service not running');
            return;
        }

        devLog.info('🛑 Stopping NFT Sync Service...');

        try {
            // Stop WebSocket listener (if active)
            if (this.eventListener) {
                await this.eventListener.stop();
                devLog.info('✅ WebSocket disconnected');
            }

            // Stop GraphQL sync
            await this.graphSync.stop();

            this.statsSync.stop();
            this.insightsSync.stop();

            this.isRunning = false;
            devLog.info('✅ NFT Sync Service stopped');
        } catch (error) {
            devLog.error('❌ Error stopping NFT Sync Service:', error);
            throw error;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        const enableStatsSync = isEnabled(process.env.ENABLE_STATS_SYNC, true);
        const enableInsightsSync = isEnabled(process.env.ENABLE_INSIGHTS_SYNC, true);

        return {
            isRunning: this.isRunning,
            architecture: 'HYBRID (WebSocket + TheGraph)',
            eventListener: this.eventListener ? this.eventListener.getState() : { isConnected: false, message: 'WebSocket not configured' },
            graphSync: this.graphSync.getStatus(),
            statsSync: this.statsSync.getStatus(),
            insightsSync: this.insightsSync.getStatus(),
            statsSyncEnabled: enableStatsSync,
            insightsSyncEnabled: enableInsightsSync
        };
    }

    /**
     * Force immediate sync (single run, no polling)
     * Used after transactions to immediately update marketplace_items
     */
    async syncOnce(): Promise<void> {
        devLog.info('🔄 [Force Sync] Running immediate sync...');
        await this.graphSync.syncOnce();
        devLog.info('✅ [Force Sync] Immediate sync complete');
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

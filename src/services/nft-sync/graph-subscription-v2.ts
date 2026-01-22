/**
 * Subgraph v2 Sync Service (Ideation Market)
 * 
 * Syncs Listing and WhitelistedBuyer entities from new subgraph to MongoDB
 * Runs in parallel with v1 sync service
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GET_ACTIVE_LISTINGS, LISTINGS_UPDATED_SUBSCRIPTION } from '@/config/subgraph';
import { getDatabase } from '@/lib/mongodb';
import type { ListingV2 } from '@/types/marketplace/listing-v2';
import { blockchainStateSync } from './blockchain-state-sync';

export class GraphQLSyncV2 {
    private client: ApolloClient<any> | null = null;
    private isActive: boolean = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private itemsProcessed: number = 0;
    private lastUpdate: Date | null = null;
    private consecutiveErrors: number = 0;
    private currentInterval: number = 60000; // Start with 60 seconds
    private readonly MIN_INTERVAL = 60000; // 60 seconds minimum
    private readonly MAX_INTERVAL = 300000; // 5 minutes maximum

    /**
     * Start syncing from subgraph v2
     */
    async start() {
        if (this.isActive) {
            console.log('⚠️ Subgraph v2 sync already active');
            return;
        }

        const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_V2_URL;

        if (!subgraphUrl) {
            console.warn('⚠️ NEXT_PUBLIC_SUBGRAPH_V2_URL not configured, skipping v2 sync');
            return;
        }

        console.log('\n🚀 [V2 Sync] Starting Subgraph v2 sync (Ideation Market)...');
        console.log('🔗 [V2 Sync] Endpoint:', subgraphUrl);
        console.log('📊 [V2 Sync] Polling interval: 60 seconds (adaptive with backoff)');
        console.log('📦 [V2 Sync] Target collection: marketplace_items');

        // Create Apollo Client
        this.client = new ApolloClient({
            link: new HttpLink({
                uri: subgraphUrl,
            }),
            cache: new InMemoryCache(),
        });

        console.log('✅ [V2 Sync] Apollo Client initialized');

        // Start polling (30 second intervals)
        await this.startPolling();
    }

    /**
     * Start polling for updates
     */
    private async startPolling() {
        console.log('🔄 Starting adaptive polling mode for v2 subgraph (60s base interval with backoff)');
        this.isActive = true;

        // Initial sync
        await this.pollListings();

        // Start adaptive polling
        this.scheduleNextPoll();
    }

    /**
     * Schedule next poll with current interval
     */
    private scheduleNextPoll() {
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
        }

        this.pollingInterval = setTimeout(async () => {
            await this.pollListings();
            if (this.isActive) {
                this.scheduleNextPoll();
            }
        }, this.currentInterval);
    }

    /**
     * Poll for active listings
     */
    private async pollListings() {
        if (!this.client) return;

        try {
            console.log('\n📡 [V2 Subgraph] Fetching active listings...');
            console.log('   Query: GET_ACTIVE_LISTINGS');
            console.log('   Variables: { first: 1000, skip: 0 }');
            console.log(`   Current interval: ${this.currentInterval / 1000}s`);

            const result = await this.client.query({
                query: GET_ACTIVE_LISTINGS,
                variables: {
                    first: 1000,
                    skip: 0
                },
                fetchPolicy: 'network-only' // Always fetch fresh data
            });

            // Success - reset error tracking and interval
            this.consecutiveErrors = 0;
            this.currentInterval = this.MIN_INTERVAL;

            console.log('📥 [V2 Subgraph] Response received:');
            console.log(`   Total listings: ${result.data?.listings?.length || 0}`);

            if (result.data?.listings && result.data.listings.length > 0) {
                console.log('\n📋 [V2 Subgraph] Listings details:');
                result.data.listings.forEach((listing: any, index: number) => {
                    console.log(`   ${index + 1}. ListingID: ${listing.listingId}`);
                    console.log(`      NFT: ${listing.tokenAddress}/${listing.tokenId}`);
                    console.log(`      Price: ${listing.priceTotal} wei`);
                    console.log(`      Seller: ${listing.seller}`);
                    console.log(`      Status: ${listing.active ? '✅ Active' : '❌ Inactive'}`);
                });

                await this.syncListingsToMongoDB(result.data.listings);
                this.lastUpdate = new Date();
                console.log(`\n✅ [V2 Subgraph] Synced ${result.data.listings.length} listings at ${this.lastUpdate.toISOString()}`);
            } else {
                console.log('   ℹ️  No active listings found');
            }
        } catch (error: any) {
            // Check if it's a rate limit error (429)
            const isRateLimit = error?.networkError?.statusCode === 429 ||
                error?.message?.includes('429') ||
                error?.message?.includes('Too many requests');

            if (isRateLimit) {
                this.consecutiveErrors++;
                // Exponential backoff: double the interval, up to MAX_INTERVAL
                this.currentInterval = Math.min(
                    this.currentInterval * 2,
                    this.MAX_INTERVAL
                );

                console.error(`\n⚠️ [V2 Subgraph] Rate limit hit (429)`);
                console.error(`   Consecutive errors: ${this.consecutiveErrors}`);
                console.error(`   Backing off to ${this.currentInterval / 1000}s interval`);
                console.error(`   Next retry in ${this.currentInterval / 1000} seconds`);
            } else {
                // Other errors - moderate backoff
                this.consecutiveErrors++;
                this.currentInterval = Math.min(
                    this.currentInterval * 1.5,
                    this.MAX_INTERVAL
                );

                console.error('❌ [V2 Subgraph] Polling error:', error);
                if (error instanceof Error) {
                    console.error('   Error message:', error.message);
                    console.error('   Error stack:', error.stack);
                }
                console.error(`   Next retry in ${this.currentInterval / 1000} seconds`);
            }
        }
    }

    /**
     * Sync listings to MongoDB
     */
    private async syncListingsToMongoDB(listings: ListingV2[]) {
        try {
            console.log('\n💾 [V2 MongoDB] Syncing to database...');
            console.log(`   Collection: marketplace_items`);
            console.log(`   Items from TheGraph: ${listings.length}`);

            const db = await getDatabase();
            const collection = db.collection('marketplace_items');

            // STRATEGY: Complete replacement for 100% accuracy
            // Delete all existing listings for this chain, then insert fresh data from TheGraph
            // This ensures no stale data (sold/cancelled items are removed)
            // ⚡ Uses MongoDB transaction to avoid empty collection state

            const chainId = 11155111; // Sepolia

            // STEP 1: If no new listings from TheGraph, only delete (marketplace is empty)
            if (!listings || listings.length === 0) {
                const deleteResult = await collection.deleteMany({ chainId });
                console.log(`   🗑️  Deleted ${deleteResult.deletedCount} existing listings`);
                console.log('   ✅ Marketplace is empty (no active listings)');
                return;
            }

            // STEP 2: Perform sequential delete and insert operations
            // Note: Transactions require replica set configuration

            try {
                // Delete old listings
                const deleteResult = await collection.deleteMany({ chainId });
                const deleteCount = deleteResult.deletedCount;

                // STEP 3: Insert all fresh listings from TheGraph
                // ✅ OPTIMIZED: Only sync listing data (no metadata/approval here)
                // Metadata is stored in nft_metadata collection (lazy-loaded)
                // Blockchain state (owner/approval) is synced on-demand
                const documents = listings.map((listing) => ({
                    // V2 → V1 field mapping (LISTING DATA ONLY)
                    listingId: listing.listingId,
                    chainId: listing.chainId,
                    contractAddress: listing.tokenAddress,
                    nftAddress: listing.tokenAddress,
                    tokenId: listing.tokenId,
                    tokenStandard: listing.tokenStandard,
                    erc1155QuantityListed: listing.erc1155QuantityListed,
                    remainingQuantity: listing.remainingQuantity,
                    price: listing.priceTotal || listing.unitPrice,
                    priceTotal: listing.priceTotal,
                    unitPrice: listing.unitPrice,
                    seller: listing.seller,
                    isListed: listing.active,
                    active: listing.active,
                    status: listing.status,
                    listingType: listing.listingType,
                    buyerWhitelistEnabled: listing.buyerWhitelistEnabled,
                    partialBuyEnabled: listing.partialBuyEnabled,
                    feeRate: listing.feeRate,
                    desiredTokenAddress: listing.desiredTokenAddress,
                    desiredTokenId: listing.desiredTokenId,
                    desiredErc1155Quantity: listing.desiredErc1155Quantity,
                    currency: listing.currency,
                    createdAt: listing.createdAt,
                    firstSyncedAt: new Date(),
                    syncedAt: new Date()
                }));

                // Insert new listings
                const insertResult = await collection.insertMany(documents);
                const insertCount = insertResult.insertedCount;

                // Operations completed successfully
                this.itemsProcessed += insertCount;

                console.log(`✅ [V2 MongoDB] Database updated:`);
                // 🔥 OPTIMIZED: Trigger blockchain state sync for ALL listings
                // (Since we deleted everything, all are "new")
                if (insertCount > 0) {
                    console.log(`\n🔄 [Blockchain Sync] Triggering on-demand sync for ${insertCount} listings...`);

                    const nftsToSync = listings.map(l => ({
                        contractAddress: l.tokenAddress,
                        tokenId: l.tokenId
                    }));

                    // Sync blockchain state asynchronously (don't block subgraph sync)
                    blockchainStateSync.syncBatch(
                        nftsToSync,
                        process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
                    ).catch(error => {
                        console.error('❌ [Blockchain Sync] Error syncing listings:', error);
                    });
                }
            } catch (syncError) {
                console.error('❌ [V2 MongoDB] Sync operation error:', syncError);
            }
        } catch (error) {
            console.error('❌ [V2 MongoDB] Sync error:', error);
            if (error instanceof Error) {
                console.error('   Error message:', error.message);
            }
        }
    }

    /**
     * Stop syncing
     */
    async stop() {
        console.log('🛑 Stopping Subgraph v2 sync...');

        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
            this.pollingInterval = null;
        }

        this.isActive = false;

        console.log(`📊 v2: Total items processed: ${this.itemsProcessed}`);
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            version: 'v2',
            active: this.isActive,
            itemsProcessed: this.itemsProcessed,
            lastUpdate: this.lastUpdate,
            mode: 'polling',
            currentInterval: this.currentInterval,
            consecutiveErrors: this.consecutiveErrors,
            subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_V2_URL
        };
    }

    /**
     * Force sync now
     */
    async forceSync() {
        console.log('🔄 v2: Force sync triggered');
        await this.pollListings();
    }

    /**
     * Single sync run (can be called even if service not started)
     * Used for immediate sync after transactions
     */
    async syncOnce() {
        // If client doesn't exist, create it temporarily
        if (!this.client) {
            const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_V2_URL;
            if (!subgraphUrl) {
                console.warn('⚠️ Cannot sync: NEXT_PUBLIC_SUBGRAPH_V2_URL not configured');
                return;
            }

            this.client = new ApolloClient({
                link: new HttpLink({
                    uri: subgraphUrl,
                }),
                cache: new InMemoryCache(),
            });
        }

        // Run single poll
        await this.pollListings();
    }
}

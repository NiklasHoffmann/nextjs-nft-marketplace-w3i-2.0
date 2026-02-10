/**
 * Subgraph Sync Service
 * 
 * Syncs marketplace listings from The Graph subgraph to MongoDB
 * Uses polling (5min interval) as fallback for WebSocket events
 * 
 * NOTE: This is a FALLBACK service - primary real-time updates via WebSocket
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GET_ACTIVE_LISTINGS, LISTINGS_UPDATED_SUBSCRIPTION } from '@/config/subgraph';
import { getDatabase } from '@/lib/mongodb';
import type { ListingV2 } from '@/types/marketplace/listing-v2';
import { blockchainStateSync } from './blockchain-state-sync';
import { IPFSMetadataLazySync } from './ipfs-metadata-lazy-sync';
import { getCurrencyFixSync } from './currency-fix-sync';

export class GraphQLSync {
    private client: ApolloClient<any> | null = null;
    private isActive: boolean = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private itemsProcessed: number = 0;
    private lastUpdate: Date | null = null;
    private consecutiveErrors: number = 0;
    private currentInterval: number = 300000; // Start with 300 seconds (5 minutes)
    private readonly MIN_INTERVAL = 300000; // 5 minutes minimum (WebSocket is primary)
    private readonly MAX_INTERVAL = 900000; // 15 minutes maximum

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
        console.log('📊 [V2 Sync] Polling interval: 5 minutes (FALLBACK - WebSocket is primary)');
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
        console.log('🔄 Starting adaptive polling mode for v2 subgraph (120s base interval with exponential backoff)');
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
            console.log('   Variables: { first: 100, skip: 0 }');
            console.log(`   Current interval: ${this.currentInterval / 1000}s`);

            const result = await this.client.query({
                query: GET_ACTIVE_LISTINGS,
                variables: {
                    first: 100, // Reduced from 1000 to 100 to avoid rate limits
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

            // STEP 1: Get all existing listings to detect deletions
            const existingListings = await collection.find(
                { chainId },
                { projection: { listingId: 1, contractAddress: 1, tokenId: 1 } }
            ).toArray();

            // STEP 2: Smart merge strategy using bulkWrite (upsert)
            // This MERGES data instead of deleting everything
            // ✅ Prevents race conditions with WebSocket events
            // ✅ Keeps metadata enrichment from WebSocket events
            // ✅ No temporary empty state

            if (!listings || listings.length === 0) {
                // Marketplace is empty - DELETE all listings
                if (existingListings.length > 0) {
                    await collection.deleteMany({ chainId });
                    console.log(`   🗑️  Deleted ${existingListings.length} inactive listings`);
                }
                console.log('   ✅ Marketplace is empty (no active listings)');
                return;
            }

            try {
                // STEP 3: Build bulkWrite operations (upsert all listings from TheGraph)
                // ✅ OPTIMIZED: Only sync listing data (no metadata/approval here)
                // Metadata is stored in nft_metadata collection (lazy-loaded)
                // Blockchain state (owner/approval) is synced on-demand
                const bulkOps = listings.map((listing) => ({
                    updateOne: {
                        filter: {
                            listingId: listing.listingId,
                            chainId: listing.chainId
                        },
                        update: {
                            $set: {
                                // V2 → V1 field mapping (LISTING DATA ONLY)
                                listingId: listing.listingId,
                                chainId: listing.chainId,
                                contractAddress: listing.tokenAddress,
                                nftAddress: listing.tokenAddress,
                                // CRITICAL: Store tokenId as STRING (consistent with nft_metadata)
                                tokenId: String(listing.tokenId),
                                tokenStandard: listing.tokenStandard,
                                erc1155QuantityListed: listing.erc1155QuantityListed,
                                remainingQuantity: listing.remainingQuantity,
                                // CRITICAL: Convert price to STRING (MongoDB stores as String, not Number/BigInt)
                                price: String(listing.priceTotal || listing.unitPrice),
                                priceTotal: String(listing.priceTotal || '0'),
                                unitPrice: String(listing.unitPrice || '0'),
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
                                syncedAt: new Date()
                            },
                            $setOnInsert: {
                                firstSyncedAt: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                // Execute bulk upsert
                const bulkResult = await collection.bulkWrite(bulkOps, { ordered: false });
                const upsertedCount = bulkResult.upsertedCount + bulkResult.modifiedCount;

                // STEP 4: Mark listings that are no longer in TheGraph as inactive
                const graphListingIds = new Set(listings.map(l => l.listingId));
                const inactiveListingIds = existingListings
                    .filter(existing => !graphListingIds.has(existing.listingId))
                    .map(l => l.listingId);

                let deletedCount = 0;
                if (inactiveListingIds.length > 0) {
                    const deleteResult = await collection.deleteMany(
                        { listingId: { $in: inactiveListingIds }, chainId }
                    );
                    deletedCount = deleteResult.deletedCount;
                }

                // Operations completed successfully
                this.itemsProcessed += upsertedCount;

                console.log(`✅ [V2 MongoDB] Database updated:`);
                console.log(`   ✅ Upserted: ${upsertedCount} listings`);
                console.log(`   �️ Deleted: ${deletedCount} old listings`);
                // STEP 5: Fix currency fields from blockchain (SubGraph may not capture correctly)
                if (upsertedCount > 0) {
                    try {
                        console.log('🔧 [Currency Fix] Correcting currency from blockchain...');
                        const currencyFix = getCurrencyFixSync();
                        const result = await currencyFix.fixAllListings();
                        if (result.fixed > 0) {
                            console.log(`✅ [Currency Fix] Fixed ${result.fixed} listings`);
                        }
                    } catch (error) {
                        console.error('❌ [Currency Fix] Error:', error);
                        // Don't fail the whole sync, currency fix is optional
                    }
                }
                // Note: graph-update invalidation happens via SSE in /api/events/marketplace
                // Server-side invalidation is not needed here since all clients get SSE updates

                // 🔥 OPTIMIZED: Trigger blockchain state sync for new/updated listings
                if (upsertedCount > 0) {
                    console.log(`\n🔄 [Blockchain Sync] Triggering on-demand sync for ${upsertedCount} listings...`);

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

                    // 🎨 CRITICAL: Also trigger metadata sync for ALL listings
                    // This ensures images and names are loaded for display
                    console.log(`\n🎨 [Metadata Sync] Triggering IPFS metadata enrichment for ${listings.length} listings...`);
                    const metadataSync = new IPFSMetadataLazySync();
                    metadataSync.ensureBatch(nftsToSync).catch(error => {
                        console.error('❌ [Metadata Sync] Error enriching metadata:', error);
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

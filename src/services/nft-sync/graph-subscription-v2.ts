/**
 * Subgraph v2 Sync Service (Ideation Market)
 * 
 * Syncs Listing and WhitelistedBuyer entities from new subgraph to MongoDB
 * Runs in parallel with v1 sync service
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GET_ACTIVE_LISTINGS, LISTINGS_UPDATED_SUBSCRIPTION } from '@/constants/subgraph.queries.v2';
import { getDatabase } from '@/lib/mongodb';
import type { ListingV2 } from '@/types/marketplace/listing-v2';
import { blockchainStateSync } from './blockchain-state-sync';

export class GraphQLSyncV2 {
    private client: ApolloClient<any> | null = null;
    private isActive: boolean = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private itemsProcessed: number = 0;
    private lastUpdate: Date | null = null;

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
        console.log('📊 [V2 Sync] Polling interval: 30 seconds');
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
        console.log('🔄 Starting polling mode for v2 subgraph (30s interval)');
        this.isActive = true;

        // Initial sync
        await this.pollListings();

        // Poll every 30 seconds
        this.pollingInterval = setInterval(async () => {
            await this.pollListings();
        }, 30000);
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

            const result = await this.client.query({
                query: GET_ACTIVE_LISTINGS,
                variables: {
                    first: 1000,
                    skip: 0
                },
                fetchPolicy: 'network-only' // Always fetch fresh data
            });

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
        } catch (error) {
            console.error('❌ [V2 Subgraph] Polling error:', error);
            if (error instanceof Error) {
                console.error('   Error message:', error.message);
                console.error('   Error stack:', error.stack);
            }
        }
    }

    /**
     * Sync listings to MongoDB
     */
    private async syncListingsToMongoDB(listings: ListingV2[]) {
        if (!listings || listings.length === 0) return;

        try {
            console.log('\n💾 [V2 MongoDB] Syncing to database...');
            console.log(`   Collection: marketplace_items`);
            console.log(`   Items to sync: ${listings.length}`);

            const db = await getDatabase();
            const collection = db.collection('marketplace_items');

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

            if (bulkOps.length > 0) {
                const result = await collection.bulkWrite(bulkOps);
                this.itemsProcessed += result.upsertedCount + result.modifiedCount;

                console.log(`✅ [V2 MongoDB] Database updated:`);
                console.log(`   New listings: ${result.upsertedCount}`);
                console.log(`   Updated listings: ${result.modifiedCount}`);
                console.log(`   Total processed: ${this.itemsProcessed}`);

                // 🔥 OPTIMIZED: Trigger blockchain state sync for NEW listings only
                if (result.upsertedCount > 0) {
                    console.log(`\n🔄 [Blockchain Sync] Triggering on-demand sync for ${result.upsertedCount} new listings...`);

                    // Get newly inserted listings
                    const newListings = listings.slice(0, result.upsertedCount);
                    const nftsToSync = newListings.map(l => ({
                        contractAddress: l.tokenAddress,
                        tokenId: l.tokenId
                    }));

                    // Sync blockchain state asynchronously (don't block subgraph sync)
                    blockchainStateSync.syncBatch(
                        nftsToSync,
                        process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
                    ).catch(error => {
                        console.error('❌ [Blockchain Sync] Error syncing new listings:', error);
                    });
                }
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
            clearInterval(this.pollingInterval);
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
}

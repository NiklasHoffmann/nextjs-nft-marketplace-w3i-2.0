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

            // Upsert all listings with field mapping (v2 schema → v1 compatible)
            // Note: approved/approvedAddress is synced separately by metadata-sync.ts
            const bulkOps = listings.map((listing) => ({
                updateOne: {
                    filter: { 
                        listingId: listing.listingId,
                        chainId: listing.chainId 
                    },
                    update: {
                        $set: {
                            // V2 → V1 field mapping
                            listingId: listing.listingId,
                            chainId: listing.chainId,
                            contractAddress: listing.tokenAddress,       // v2: tokenAddress → v1: contractAddress
                            nftAddress: listing.tokenAddress,            // Also keep nftAddress for compatibility
                            tokenId: listing.tokenId,
                            tokenStandard: listing.tokenStandard,
                            erc1155QuantityListed: listing.erc1155QuantityListed,
                            remainingQuantity: listing.remainingQuantity,
                            price: listing.priceTotal || listing.unitPrice,  // v2: priceTotal → v1: price
                            priceTotal: listing.priceTotal,
                            unitPrice: listing.unitPrice,
                            seller: listing.seller,
                            isListed: listing.active,                    // v2: active → v1: isListed
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
                            syncedAt: new Date(),
                            isNewListing: true  // 🔥 NEW: Mark as new for approval fetch
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
                
                // 🔥 NEW: For new listings, immediately fetch approval to avoid 0x000... issue
                if (result.upsertedCount > 0) {
                    console.log(`\n🔄 [V2 Approval] Fetching approval for ${result.upsertedCount} new listings...`);
                    // Fetch only items marked as new
                    const newListings = await collection.find({ isNewListing: true }).toArray();
                    if (newListings.length > 0) {
                        await this.fetchApprovalForNewListings(newListings, collection);
                        // Clear the isNewListing flag
                        await collection.updateMany(
                            { isNewListing: true },
                            { $unset: { isNewListing: '' } }
                        );
                    }
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
     * Fetch approval status for new listings immediately
     * This prevents the 0x000... issue for newly listed NFTs
     */
    private async fetchApprovalForNewListings(listings: any[], collection: any) {
        try {
            const ERC721_ABI = [
                {
                    name: 'getApproved',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [{ name: 'tokenId', type: 'uint256' }],
                    outputs: [{ name: '', type: 'address' }],
                }
            ] as const;

            const { createPublicClient, http } = await import('viem');
            const { sepolia } = await import('viem/chains');

            const client = createPublicClient({
                chain: sepolia,
                transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
            });

            const db = await getDatabase();
            const metadataCollection = db.collection('nft_metadata');

            // Process in parallel (max 5 at once)
            const BATCH_SIZE = 5;
            for (let i = 0; i < listings.length; i += BATCH_SIZE) {
                const batch = listings.slice(i, i + BATCH_SIZE);
                
                await Promise.all(batch.map(async (listing) => {
                    try {
                        const approvedAddress = await client.readContract({
                            address: listing.contractAddress as `0x${string}`,
                            abi: ERC721_ABI,
                            functionName: 'getApproved',
                            args: [BigInt(listing.tokenId)]
                        });

                        const now = new Date();

                        // Update marketplace_items with approval
                        await collection.updateOne(
                            { 
                                listingId: listing.listingId,
                                chainId: listing.chainId 
                            },
                            {
                                $set: {
                                    approved: approvedAddress,
                                    approvedAddress: approvedAddress,
                                    'lastSync.approval': now
                                }
                            }
                        );

                        // Also update nft_metadata collection
                        await metadataCollection.updateOne(
                            {
                                contractAddress: listing.contractAddress,
                                tokenId: listing.tokenId
                            },
                            {
                                $set: {
                                    'blockchain.approved': approvedAddress,
                                    updatedAt: now
                                }
                            },
                            { upsert: true }
                        );

                        console.log(`  ✅ Approval fetched for ${listing.contractAddress}/${listing.tokenId}: ${approvedAddress}`);
                    } catch (error) {
                        console.error(`  ❌ Failed to fetch approval for ${listing.contractAddress}/${listing.tokenId}:`, error);
                    }
                }));
            }

            console.log(`✅ [V2 Approval] Completed approval fetch for new listings`);
        } catch (error) {
            console.error('❌ [V2 Approval] Error fetching approvals:', error);
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

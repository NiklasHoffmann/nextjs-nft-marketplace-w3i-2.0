#!/usr/bin/env node
/**
 * Collection Sync Service
 * 
 * Similar to sync-marketplace-data.js, this service:
 * 1. Aggregates marketplace_items by contractAddress
 * 2. Fetches contract metadata (name, symbol, totalSupply)
 * 3. Calculates collection statistics
 * 4. Enriches with admin insights
 * 5. Stores in marketplace_collections collection
 * 
 * Runs continuously with configurable sync interval
 */

// Load environment variables
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Sync configuration
const SYNC_INTERVAL_MS = 30_000; // 30 seconds (same as NFT sync)
const MAX_PREVIEW_IMAGES = 6;

// Types
interface CollectionSyncResult {
    success: boolean;
    contractAddress: string;
    itemsProcessed: number;
    statsCalculated: boolean;
    error?: string;
}

let isRunning = false;
let syncCount = 0;
let lastSyncTime: Date | null = null;
let errorCount = 0;

/**
 * Fetch contract metadata from blockchain/API
 */
async function fetchContractMetadata(client: MongoClient, contractAddress: string): Promise<{
    name: string | null;
    symbol: string | null;
    totalSupply: number;
    imageUrl: string | null;
    description: string | null;
}> {
    try {
        console.log(`⏳ Fetching metadata for contract ${contractAddress}...`);

        // Try to get from first NFT in marketplace_items
        const db = client.db();
        const marketplaceCollection = db.collection('marketplace_items');
        const firstItem = await marketplaceCollection.findOne({ nftAddress: contractAddress });

        return {
            name: firstItem?.name || null,
            symbol: firstItem?.symbol || null,
            totalSupply: 0, // Will be fetched from blockchain later
            imageUrl: null, // Collection banner image
            description: null
        };
    } catch (error) {
        console.error(`Error fetching metadata for ${contractAddress}:`, error);
        return {
            name: null,
            symbol: null,
            totalSupply: 0,
            imageUrl: null,
            description: null
        };
    }
}

/**
 * Fetch admin insights for collection
 */
async function fetchAdminInsights(client: MongoClient, contractAddress: string) {
    try {
        const db = client.db();
        const insightsCollection = db.collection('admin_collection_insights');
        const insights = await insightsCollection.findOne({
            contractAddress: contractAddress.toLowerCase()
        });

        if (!insights) return null;

        return {
            customTitle: insights.customTitle || null,
            category: insights.category || null,
            tags: insights.tags || [],
            rarity: insights.rarity || null,
            description: insights.description || null,
            hasInsights: true
        };
    } catch (error) {
        console.error(`Error fetching insights for ${contractAddress}:`, error);
        return null;
    }
}

/**
 * Aggregate statistics for a single collection
 */
async function aggregateCollectionStats(client: MongoClient, contractAddress: string): Promise<any> {
    try {
        const db = client.db();
        const marketplaceCollection = db.collection('marketplace_items');
        const collectionsCollection = db.collection('marketplace_collections');

        // Get all items for this collection
        const items = await marketplaceCollection.find({
            nftAddress: contractAddress
        }).toArray();

        if (items.length === 0) {
            console.log(`⚠️  No items found for ${contractAddress}, skipping...`);
            return {
                success: false,
                contractAddress,
                itemsProcessed: 0,
                statsCalculated: false,
                error: 'No items found'
            };
        }

        // Calculate statistics
        const prices = items
            .map((item: any) => parseFloat(item.price || '0'))
            .filter((p: number) => p > 0);

        const floorPrice = prices.length > 0 ? Math.min(...prices).toString() : null;
        const totalValue = prices.reduce((sum: number, p: number) => sum + p, 0).toString();
        const averagePrice = prices.length > 0
            ? (prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length).toString()
            : null;

        // Get preview images (up to MAX_PREVIEW_IMAGES)
        const previewImages = items
            .map((item: any) => item.image)
            .filter((img: any): img is string => !!img)
            .slice(0, MAX_PREVIEW_IMAGES);

        // Create item references
        const itemRefs = items.map((item: any) => ({
            tokenId: item.tokenId,
            seller: item.seller,
            price: item.price,
            listedAt: item.itemCreatedAt || new Date().toISOString()
        }));

        // Fetch contract metadata
        const metadata = await fetchContractMetadata(client, contractAddress);

        // Fetch admin insights
        const insights = await fetchAdminInsights(client, contractAddress);

        // Aggregate social stats from nft_stats collection
        const statsCollection = db.collection('nft_stats');
        const socialStats = await statsCollection.aggregate([
            {
                $match: {
                    contractAddress: contractAddress.toLowerCase()
                }
            },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: '$likeCount' },
                    totalViews: { $sum: '$viewCount' }
                }
            }
        ]).toArray();

        const social = socialStats[0] || { totalLikes: 0, totalViews: 0 };

        // Build collection document
        const collectionDoc: any = {
            contractAddress,
            contractName: metadata.name,
            contractSymbol: metadata.symbol,
            imageUrl: metadata.imageUrl,
            description: metadata.description,
            bannerImageUrl: null,
            totalSupply: metadata.totalSupply,
            deployedAt: null,
            stats: {
                itemCount: items.length,
                floorPrice,
                totalValue,
                averagePrice,
                soldCount: 0, // TODO: Track from marketplace events
                totalVolume: '0' // TODO: Calculate from sales history
            },
            socialStats: {
                totalLikes: social.totalLikes || 0,
                totalViews: social.totalViews || 0,
                uniqueOwners: 0 // TODO: Calculate unique owners
            },
            previewImages,
            itemRefs,
            insights,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSyncedAt: new Date(),
            syncStatus: 'active',
            syncError: null
        };

        // Upsert collection document
        await collectionsCollection.updateOne(
            { contractAddress },
            {
                $set: {
                    ...collectionDoc,
                    updatedAt: new Date(),
                    lastSyncedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return {
            success: true,
            contractAddress,
            itemsProcessed: items.length,
            statsCalculated: true
        };

    } catch (error) {
        console.error(`❌ Error syncing collection ${contractAddress}:`, error);
        return {
            success: false,
            contractAddress,
            itemsProcessed: 0,
            statsCalculated: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Main sync function - syncs all collections
 */
async function syncAllCollections(): Promise<void> {
    if (isRunning) {
        console.log('⏭️  Sync already running, skipping...');
        return;
    }

    isRunning = true;
    const startTime = Date.now();

    const client = new MongoClient(MONGODB_URI!);

    try {
        await client.connect();
        const db = client.db();
        console.log('\n🔄 Starting collection sync...');

        const marketplaceCollection = db.collection('marketplace_items');

        // Get distinct contract addresses
        const contracts = await marketplaceCollection.distinct('nftAddress');
        console.log(`📊 Found ${contracts.length} unique collections`);

        // Sync each collection
        const results: any[] = [];
        for (const contractAddress of contracts) {
            if (!contractAddress) continue;

            const result = await aggregateCollectionStats(client, contractAddress);
            results.push(result);

            if (result.success) {
                console.log(`✅ Synced ${contractAddress}: ${result.itemsProcessed} items`);
            } else {
                console.log(`❌ Failed ${contractAddress}: ${result.error}`);
                errorCount++;
            }
        }

        const successCount = results.filter(r => r.success).length;
        const duration = Date.now() - startTime;

        syncCount++;
        lastSyncTime = new Date();

        console.log(`\n✅ Collection sync complete!`);
        console.log(`   - Processed: ${contracts.length} collections`);
        console.log(`   - Success: ${successCount}`);
        console.log(`   - Failed: ${results.length - successCount}`);
        console.log(`   - Duration: ${duration}ms`);
        console.log(`   - Total syncs: ${syncCount}`);
        console.log(`   - Errors: ${errorCount}`);

    } catch (error) {
        console.error('❌ Collection sync failed:', error);
        errorCount++;
    } finally {
        await client.close();
        isRunning = false;
    }
}

/**
 * Start continuous sync loop
 */
async function startSyncLoop() {
    console.log('🚀 Collection Sync Service starting...');
    console.log(`⏱️  Sync interval: ${SYNC_INTERVAL_MS / 1000}s`);

    // Initial sync
    await syncAllCollections();

    // Schedule periodic syncs
    setInterval(async () => {
        await syncAllCollections();
    }, SYNC_INTERVAL_MS);

    console.log('✅ Collection Sync Service is running');
    console.log('Press Ctrl+C to stop\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping Collection Sync Service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Stopping Collection Sync Service...');
    process.exit(0);
});

// Start service
if (require.main === module) {
    startSyncLoop().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { syncAllCollections, aggregateCollectionStats };

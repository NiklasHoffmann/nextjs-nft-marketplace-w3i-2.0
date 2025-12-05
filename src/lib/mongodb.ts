import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get database
export async function getDatabase(): Promise<Db> {
    const client = await clientPromise;
    // Use the database name from the URI instead of hardcoding it
    return client.db(); // This will use the database name from the connection string
}

// Helper function to get collection
export async function getCollection(collectionName: string) {
    const db = await getDatabase();
    return db.collection(collectionName);
}

/**
 * Get the enriched_nfts collection (marketplace_items)
 */
export async function getEnrichedNFTsCollection() {
    const db = await getDatabase();
    return db.collection('marketplace_items');
}

/**
 * Get the collection_stats collection (for aggregated collection data)
 */
export async function getCollectionStatsCollection() {
    const db = await getDatabase();
    return db.collection('collection_stats');
}

/**
 * Initialize MongoDB indexes
 * Call this on server startup
 */
export async function initializeIndexes() {
    const db = await getDatabase();
    const enrichedNFTs = db.collection('marketplace_items');

    console.log('🔧 Creating MongoDB indexes...');

    try {
        // Unique compound index for NFT identifier
        await enrichedNFTs.createIndex(
            { contractAddress: 1, tokenId: 1 },
            { unique: true, name: 'nft_identifier' }
        );

        // Text index for full-text search
        await enrichedNFTs.createIndex(
            {
                'metadata.name': 'text',
                'metadata.description': 'text',
                'insights.customTitle': 'text',
                'insights.tags': 'text',
                'contract.contractName': 'text'
            },
            { name: 'fulltext_search' }
        );

        // Range indexes for sorting/filtering
        await enrichedNFTs.createIndex({ 'marketplace.price': 1 }, { name: 'price_asc' });
        await enrichedNFTs.createIndex({ 'stats.averageRating': -1 }, { name: 'rating_desc' });
        await enrichedNFTs.createIndex({ 'stats.viewCount': -1 }, { name: 'views_desc' });
        await enrichedNFTs.createIndex({ 'stats.likeCount': -1 }, { name: 'likes_desc' });
        await enrichedNFTs.createIndex({ 'stats.watchlistCount': -1 }, { name: 'watchlist_desc' });

        // Categorical indexes
        await enrichedNFTs.createIndex({ 'marketplace.isListed': 1 }, { name: 'is_listed' });
        await enrichedNFTs.createIndex({ 'insights.category': 1 }, { name: 'category' });
        await enrichedNFTs.createIndex({ 'insights.rarity': 1 }, { name: 'rarity' });

        // Timestamp index for background jobs
        await enrichedNFTs.createIndex({ lastUpdated: 1 }, { name: 'last_updated' });
        await enrichedNFTs.createIndex({ createdAt: 1 }, { name: 'created_at' });

        console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating MongoDB indexes:', error);
        throw error;
    }
}
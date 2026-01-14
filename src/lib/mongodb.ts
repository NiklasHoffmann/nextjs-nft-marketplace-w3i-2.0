import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
};

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
    try {
        const client = await clientPromise;
        // Use the database name from the URI instead of hardcoding it
        return client.db(); // This will use the database name from the connection string
    } catch (error: any) {
        console.error('❌ [MongoDB] Connection failed:', error);
        throw new MongoConnectionError(error);
    }
}

// Helper function to get collection
export async function getCollection(collectionName: string) {
    try {
        const db = await getDatabase();
        return db.collection(collectionName);
    } catch (error: any) {
        throw new MongoConnectionError(error);
    }
}

/**
 * Custom error for MongoDB connection issues with helpful messages
 */
class MongoConnectionError extends Error {
    public readonly isMongoError = true;
    public readonly userMessage: string;

    constructor(originalError: any) {
        const errorMessage = MongoConnectionError.getHelpfulMessage(originalError);
        super(errorMessage);
        this.name = 'MongoConnectionError';
        this.userMessage = errorMessage;
    }

    private static getHelpfulMessage(error: any): string {
        const errorStr = JSON.stringify(error);
        const message = error?.message || '';
        const reason = error?.reason?.type || '';

        // IP Whitelist Problem (häufigster Fall)
        if (
            reason === 'ReplicaSetNoPrimary' ||
            message.includes('ECONNREFUSED') ||
            message.includes('connection refused') ||
            message.includes('SSL alert') ||
            message.includes('tlsv1 alert')
        ) {
            return '🚫 MongoDB Verbindung fehlgeschlagen!\n\n' +
                '⚠️ HÄUFIGSTE URSACHE: Deine IP-Adresse ist nicht in MongoDB Atlas freigegeben!\n\n' +
                '✅ LÖSUNG:\n' +
                '1. Gehe zu https://cloud.mongodb.com\n' +
                '2. Wähle dein Projekt\n' +
                '3. Network Access → Add IP Address\n' +
                '4. Füge deine aktuelle IP hinzu oder verwende 0.0.0.0/0 für alle IPs (nur für Development!)\n\n' +
                `📋 Technischer Fehler: ${reason || message}`;
        }

        // Authentication Problem
        if (
            message.includes('Authentication failed') ||
            message.includes('auth failed') ||
            message.includes('not authorized')
        ) {
            return '🔐 MongoDB Authentifizierung fehlgeschlagen!\n\n' +
                '⚠️ URSACHE: Falscher Benutzername oder Passwort\n\n' +
                '✅ LÖSUNG:\n' +
                '1. Überprüfe MONGODB_URI in .env.local\n' +
                '2. Stelle sicher, dass Passwort URL-encoded ist\n' +
                '3. Überprüfe Database User in MongoDB Atlas\n\n' +
                `📋 Technischer Fehler: ${message}`;
        }

        // Timeout
        if (
            message.includes('timeout') ||
            message.includes('timed out')
        ) {
            return '⏱️ MongoDB Verbindungs-Timeout!\n\n' +
                '⚠️ MÖGLICHE URSACHEN:\n' +
                '1. IP-Adresse nicht in Whitelist (häufigster Fall)\n' +
                '2. MongoDB Atlas Cluster pausiert\n' +
                '3. Netzwerkprobleme\n\n' +
                '✅ LÖSUNG: Überprüfe Network Access in MongoDB Atlas\n\n' +
                `📋 Technischer Fehler: ${message}`;
        }

        // Generic Error
        return '❌ MongoDB Verbindungsfehler\n\n' +
            '⚠️ Überprüfe:\n' +
            '1. IP-Adresse in MongoDB Atlas Network Access\n' +
            '2. MONGODB_URI in .env.local\n' +
            '3. MongoDB Atlas Cluster Status\n\n' +
            `📋 Fehler: ${message || errorStr}`;
    }
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
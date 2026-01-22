/**
 * Create MongoDB indexes for user_carts collection
 * 
 * Run: node scripts/create-cart-indexes.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function createCartIndexes() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not set');
        console.error('Make sure .env file exists with MONGODB_URI variable');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('user_carts');

        // Index on walletAddress (unique, for fast lookups)
        await collection.createIndex(
            { walletAddress: 1 },
            { unique: true, name: 'walletAddress_unique' }
        );
        console.log('✅ Created index: walletAddress_unique');

        // TTL index: Auto-delete carts older than 90 days
        // Drop existing non-TTL index first if it exists
        try {
            await collection.dropIndex('updatedAt_asc');
            console.log('🗑️  Dropped old index: updatedAt_asc');
        } catch (e) {
            // Index doesn't exist, ignore
        }

        await collection.createIndex(
            { updatedAt: 1 },
            {
                expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
                name: 'cart_ttl'
            }
        );
        console.log('✅ Created TTL index: cart_ttl (90 days)');

        console.log('\n🎉 All indexes created successfully!');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

createCartIndexes();

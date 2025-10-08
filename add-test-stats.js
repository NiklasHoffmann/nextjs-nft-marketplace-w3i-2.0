/**
 * Add test stats data for testing the sorting functionality
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017/nft-marketplace";

async function addTestStats() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('📡 Connected to MongoDB');

        const db = client.db('nft-marketplace');
        const statsCollection = db.collection('nft-stats');

        // Clear existing stats
        await statsCollection.deleteMany({});
        console.log('🗑️ Cleared existing stats');

        // Mock marketplace NFTs with varied stats
        const testStats = [
            // Collection 1: 0xb43a16451eb224539ce491349d49ecefe96013b6 (high stats)
            {
                contractAddress: "0xb43a16451eb224539ce491349d49ecefe96013b6",
                tokenId: "378",
                viewCount: 1250,
                favoriteCount: 89,
                watchlistCount: 34,
                averageRating: 4.7,
                ratingCount: 23,
                lastUpdated: new Date()
            },
            {
                contractAddress: "0xb43a16451eb224539ce491349d49ecefe96013b6",
                tokenId: "902",
                viewCount: 890,
                favoriteCount: 67,
                watchlistCount: 28,
                averageRating: 4.3,
                ratingCount: 19,
                lastUpdated: new Date()
            },

            // Collection 2: 0x41655ae49482de69eec8f6875c34a8ada01965e2 (medium stats)
            {
                contractAddress: "0x41655ae49482de69eec8f6875c34a8ada01965e2",
                tokenId: "378",
                viewCount: 567,
                favoriteCount: 42,
                watchlistCount: 18,
                averageRating: 3.9,
                ratingCount: 15,
                lastUpdated: new Date()
            },
            {
                contractAddress: "0x41655ae49482de69eec8f6875c34a8ada01965e2",
                tokenId: "11",
                viewCount: 234,
                favoriteCount: 28,
                watchlistCount: 12,
                averageRating: 3.5,
                ratingCount: 8,
                lastUpdated: new Date()
            },

            // Collection 3: 0xfdbc878ad5560de5f205a0c428d983d992c7406a (low stats)
            {
                contractAddress: "0xfdbc878ad5560de5f205a0c428d983d992c7406a",
                tokenId: "862",
                viewCount: 123,
                favoriteCount: 15,
                watchlistCount: 7,
                averageRating: 2.8,
                ratingCount: 5,
                lastUpdated: new Date()
            },
            {
                contractAddress: "0xfdbc878ad5560de5f205a0c428d983d992c7406a",
                tokenId: "539",
                viewCount: 89,
                favoriteCount: 9,
                watchlistCount: 3,
                averageRating: 2.2,
                ratingCount: 3,
                lastUpdated: new Date()
            }
        ];

        await statsCollection.insertMany(testStats);
        console.log('✅ Added test stats:', testStats.length);

        // Verify the data
        const count = await statsCollection.countDocuments();
        console.log('📊 Total stats in database:', count);

        // Show sample stats
        const sample = await statsCollection.findOne();
        console.log('🔍 Sample stats:', sample);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

addTestStats();
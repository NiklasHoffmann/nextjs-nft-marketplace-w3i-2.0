/**
 * Fix Negative Stats Script
 * 
 * This script repairs NFT stats that have negative counts due to a bug
 * where decrements could go below 0.
 * 
 * It recalculates all stats by counting from the source collections.
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables!');
    console.log('Please check your .env.local file');
    process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');
console.log('   URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials
console.log('   DB:', DB_NAME);

async function fixNegativeStats() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);

        // Get collections
        const statsCollection = db.collection('nft_stats');
        const favoritesCollection = db.collection('user_favorites');
        const watchlistCollection = db.collection('user_watchlist');
        const ratingsCollection = db.collection('user_ratings');
        const viewsCollection = db.collection('nft_views');

        // Find all stats documents with negative values
        const negativeStats = await statsCollection.find({
            $or: [
                { viewCount: { $lt: 0 } },
                { favoriteCount: { $lt: 0 } },
                { watchlistCount: { $lt: 0 } },
                { ratingCount: { $lt: 0 } }
            ]
        }).toArray();

        console.log(`\n🔍 Found ${negativeStats.length} stats documents with negative values`);

        if (negativeStats.length === 0) {
            console.log('✅ No negative stats found! Database is clean.');
            return;
        }

        // Fix each document by recounting from source collections
        let fixedCount = 0;
        for (const statDoc of negativeStats) {
            const { contractAddress, tokenId } = statDoc;

            console.log(`\n📊 Fixing stats for ${contractAddress}/${tokenId}`);
            console.log('   Current (broken):', {
                viewCount: statDoc.viewCount,
                favoriteCount: statDoc.favoriteCount,
                watchlistCount: statDoc.watchlistCount,
                ratingCount: statDoc.ratingCount
            });

            // Recount from source collections
            const [favoriteCount, watchlistCount, ratings, viewCount] = await Promise.all([
                favoritesCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                }),
                watchlistCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                }),
                ratingsCollection.find({
                    contractAddress: contractAddress,
                    tokenId: tokenId,
                    isPublic: true
                }).toArray(),
                viewsCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                })
            ]);

            const ratingCount = ratings.length;
            const averageRating = ratingCount > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
                : 0;

            // Update with correct values
            await statsCollection.updateOne(
                { contractAddress, tokenId },
                {
                    $set: {
                        viewCount: Math.max(0, viewCount),
                        favoriteCount: Math.max(0, favoriteCount),
                        watchlistCount: Math.max(0, watchlistCount),
                        averageRating: Math.round(averageRating * 10) / 10,
                        ratingCount: Math.max(0, ratingCount),
                        lastUpdated: new Date().toISOString()
                    }
                }
            );

            console.log('   Fixed to:', {
                viewCount,
                favoriteCount,
                watchlistCount,
                averageRating: Math.round(averageRating * 10) / 10,
                ratingCount
            });

            fixedCount++;
        }

        console.log(`\n✅ Fixed ${fixedCount} stats documents!`);

        // Optional: Check for any remaining negative values
        const stillNegative = await statsCollection.countDocuments({
            $or: [
                { viewCount: { $lt: 0 } },
                { favoriteCount: { $lt: 0 } },
                { watchlistCount: { $lt: 0 } },
                { ratingCount: { $lt: 0 } }
            ]
        });

        if (stillNegative > 0) {
            console.warn(`⚠️  Warning: ${stillNegative} documents still have negative values!`);
        } else {
            console.log('✅ All stats are now correct!');
        }

    } catch (error) {
        console.error('❌ Error fixing negative stats:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixNegativeStats()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });

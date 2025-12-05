/**
 * Migration Script: favoriteCount → likeCount
 * 
 * Migrates all favoriteCount fields to likeCount in nft_stats collection
 * This ensures consistency across the entire application
 */

require('dotenv/config');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { MongoClient } = require('mongodb');

async function migrateFavoriteCountToLikeCount() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(process.env.MONGODB_DB || 'Ideationmarket_v2');
        const nftStats = db.collection('nft_stats');

        console.log('🔍 Checking current state...\n');

        // Count documents with favoriteCount
        const withFavoriteCount = await nftStats.countDocuments({ favoriteCount: { $exists: true } });
        const withLikeCount = await nftStats.countDocuments({ likeCount: { $exists: true } });
        const total = await nftStats.countDocuments({});

        console.log(`📊 Current Statistics:`);
        console.log(`   Total documents: ${total}`);
        console.log(`   With favoriteCount: ${withFavoriteCount}`);
        console.log(`   With likeCount: ${withLikeCount}\n`);

        // Show sample before migration
        const sampleBefore = await nftStats.findOne({ favoriteCount: { $gt: 0 } });
        if (sampleBefore) {
            console.log(`📋 Sample BEFORE migration:`);
            console.log(`   Contract: ${sampleBefore.contractAddress}`);
            console.log(`   Token ID: ${sampleBefore.tokenId}`);
            console.log(`   favoriteCount: ${sampleBefore.favoriteCount}`);
            console.log(`   likeCount: ${sampleBefore.likeCount || 'not set'}\n`);
        }

        console.log('🔄 Starting migration...\n');

        // Step 1: Copy favoriteCount to likeCount (only if likeCount doesn't exist)
        const result1 = await nftStats.updateMany(
            {
                favoriteCount: { $exists: true },
                likeCount: { $exists: false }
            },
            [
                {
                    $set: {
                        likeCount: '$favoriteCount'
                    }
                }
            ]
        );

        console.log(`✅ Step 1: Copied favoriteCount to likeCount`);
        console.log(`   Modified: ${result1.modifiedCount} documents\n`);

        // Step 2: For documents with both fields, use the higher value
        const result2 = await nftStats.updateMany(
            {
                favoriteCount: { $exists: true },
                likeCount: { $exists: true }
            },
            [
                {
                    $set: {
                        likeCount: { $max: ['$likeCount', '$favoriteCount'] }
                    }
                }
            ]
        );

        console.log(`✅ Step 2: Merged both fields (using max value)`);
        console.log(`   Modified: ${result2.modifiedCount} documents\n`);

        // Step 3: Remove favoriteCount field
        const result3 = await nftStats.updateMany(
            { favoriteCount: { $exists: true } },
            { $unset: { favoriteCount: "" } }
        );

        console.log(`✅ Step 3: Removed favoriteCount field`);
        console.log(`   Modified: ${result3.modifiedCount} documents\n`);

        // Show sample after migration
        const sampleAfter = await nftStats.findOne({ likeCount: { $gt: 0 } });
        if (sampleAfter) {
            console.log(`📋 Sample AFTER migration:`);
            console.log(`   Contract: ${sampleAfter.contractAddress}`);
            console.log(`   Token ID: ${sampleAfter.tokenId}`);
            console.log(`   likeCount: ${sampleAfter.likeCount}`);
            console.log(`   favoriteCount: ${sampleAfter.favoriteCount || 'removed ✓'}\n`);
        }

        // Final statistics
        const finalWithLikeCount = await nftStats.countDocuments({ likeCount: { $exists: true } });
        const finalWithFavoriteCount = await nftStats.countDocuments({ favoriteCount: { $exists: true } });

        console.log(`📊 Final Statistics:`);
        console.log(`   Total documents: ${total}`);
        console.log(`   With likeCount: ${finalWithLikeCount}`);
        console.log(`   With favoriteCount: ${finalWithFavoriteCount}\n`);

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.close();
        console.log('👋 Connection closed');
    }
}

// Run migration
migrateFavoriteCountToLikeCount().catch(console.error);

/**
 * Verify data separation: marketplace_items vs nft_stats
 * 
 * This script confirms that:
 * 1. marketplace_items has NO stats field
 * 2. nft_stats collection exists and has data
 * 3. Collections are properly separated
 * 
 * Usage: node scripts/verify-stats-separation.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

async function verifyStatsSeparation() {
    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('🔌 Connecting to MongoDB...\n');
        await client.connect();

        const dbName = process.env.MONGODB_DB || 'nft-marketplace';
        const db = client.db(dbName);

        // ===== CHECK MARKETPLACE_ITEMS =====
        console.log('📦 Checking marketplace_items collection...');
        const marketplaceCollection = db.collection('marketplace_items');

        const totalMarketplace = await marketplaceCollection.countDocuments();
        const withStatsField = await marketplaceCollection.countDocuments({ stats: { $exists: true } });

        console.log(`   Total documents: ${totalMarketplace}`);
        console.log(`   Documents with 'stats' field: ${withStatsField}`);

        if (withStatsField === 0) {
            console.log(`   ✅ CLEAN: No stats fields in marketplace_items`);
        } else {
            console.log(`   ⚠️  WARNING: ${withStatsField} documents still have stats field!`);
        }

        // Sample document
        const marketplaceSample = await marketplaceCollection.findOne({});
        if (marketplaceSample) {
            console.log(`\n   📄 Sample marketplace_items document:`);
            console.log(`      Fields: ${Object.keys(marketplaceSample).join(', ')}`);
            console.log(`      Has stats: ${('stats' in marketplaceSample) ? '❌ YES' : '✅ NO'}`);
        }

        // ===== CHECK NFT_STATS =====
        console.log(`\n📊 Checking nft_stats collection...`);
        const statsCollection = db.collection('nft_stats');

        const totalStats = await statsCollection.countDocuments();
        console.log(`   Total stat documents: ${totalStats}`);

        if (totalStats > 0) {
            console.log(`   ✅ nft_stats collection has data`);

            // Sample stat document
            const statsSample = await statsCollection.findOne({});
            if (statsSample) {
                console.log(`\n   📄 Sample nft_stats document:`);
                console.log(`      Contract: ${statsSample.contractAddress || statsSample.nftAddress || 'N/A'}`);
                console.log(`      Token ID: ${statsSample.tokenId}`);
                console.log(`      View Count: ${statsSample.viewCount || 0}`);
                console.log(`      Favorite Count: ${statsSample.favoriteCount || 0}`);
                console.log(`      Watchlist Count: ${statsSample.watchlistCount || 0}`);
                console.log(`      Average Rating: ${statsSample.averageRating || 0}`);
            }
        } else {
            console.log(`   ⚠️  WARNING: nft_stats collection is empty!`);
        }

        // ===== VERIFY SEPARATION =====
        console.log(`\n🔍 Verification Summary:`);
        console.log(`   ┌─────────────────────────────────────────────┐`);
        console.log(`   │ Data Separation Status                      │`);
        console.log(`   ├─────────────────────────────────────────────┤`);
        console.log(`   │ marketplace_items (metadata/insights):      │`);
        console.log(`   │   - Total documents: ${totalMarketplace.toString().padEnd(24)}│`);
        console.log(`   │   - Has stats field: ${withStatsField === 0 ? '✅ NO'.padEnd(24) : '❌ YES'.padEnd(23)}│`);
        console.log(`   │                                             │`);
        console.log(`   │ nft_stats (user interactions):              │`);
        console.log(`   │   - Total documents: ${totalStats.toString().padEnd(24)}│`);
        console.log(`   │   - Collection exists: ${totalStats > 0 ? '✅ YES'.padEnd(22) : '❌ NO'.padEnd(21)}│`);
        console.log(`   └─────────────────────────────────────────────┘`);

        // Overall status
        const isClean = withStatsField === 0 && totalStats > 0;
        console.log(`\n   Overall Status: ${isClean ? '✅ PERFECT SEPARATION' : '⚠️  NEEDS ATTENTION'}`);

        if (isClean) {
            console.log(`\n💡 Architecture:`);
            console.log(`   marketplace_items: Metadata, Insights, Contract, Marketplace`);
            console.log(`   nft_stats: View/Like/Watchlist counts (real-time)`);
            console.log(`   UI: NFTStatsContext for reactive stat updates`);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run verification
verifyStatsSeparation()
    .then(() => {
        console.log('\n✅ Verification complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Verification failed:', error);
        process.exit(1);
    });

/**
 * Check Database Collections
 * Shows all collections and their document counts
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not found in environment');
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('ideationmarket_v2');

        // List all collections
        const collections = await db.listCollections().toArray();

        console.log('📊 Collections in ideationmarket_v2:');
        console.log('━'.repeat(60));

        if (collections.length === 0) {
            console.log('❌ No collections found!');
            return;
        }

        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments({});
            console.log(`  ${collection.name}: ${count} documents`);

            // Show sample document for marketplace_items
            if (collection.name === 'marketplace_items' && count > 0) {
                const sample = await coll.findOne({});
                console.log('    Sample document fields:', Object.keys(sample || {}).join(', '));
            }
        }

        // Check marketplace_items specifically
        console.log('\n📋 Marketplace Items Details:');
        console.log('━'.repeat(60));

        const marketplaceItems = db.collection('marketplace_items');
        const allItems = await marketplaceItems.find({}).limit(10).toArray();

        if (allItems.length === 0) {
            console.log('❌ marketplace_items collection is empty!');
            console.log('\n💡 Possible reasons:');
            console.log('  1. TheGraph sync service is not running');
            console.log('  2. No NFTs have been listed yet on the blockchain');
            console.log('  3. Sync service is not configured correctly');
            console.log('\n🔧 To check sync service:');
            console.log('  - Check /api/admin/system/health');
            console.log('  - Check server logs for sync errors');
        } else {
            console.log(`Found ${allItems.length} items:\n`);
            for (const item of allItems) {
                console.log(`  Listing ${item.listingId || 'N/A'}`);
                console.log(`    NFT: ${item.contractAddress}#${item.tokenId}`);
                console.log(`    Status: ${item.status || 'N/A'}`);
                console.log(`    Price: ${item.price}`);
                console.log(`    Currency: ${item.currency || 'N/A'}`);
                console.log('');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.close();
    }
}

checkCollections()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

/**
 * List all MongoDB databases
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function listDatabases() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not found in environment');
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        // List all databases
        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();

        console.log('📊 Available Databases:');
        console.log('━'.repeat(60));

        for (const db of databases) {
            console.log(`  ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);

            // Check for marketplace_items in each DB
            const database = client.db(db.name);
            const collections = await database.listCollections().toArray();

            const hasMarketplace = collections.find(c => c.name === 'marketplace_items');
            if (hasMarketplace) {
                const count = await database.collection('marketplace_items').countDocuments({});
                console.log(`    ✅ Has marketplace_items: ${count} documents`);
            }
        }

        console.log('\n💡 Check your .env.local MONGODB_URI to see which DB is configured');
        console.log(`   Current URI database: ${uri.split('/').pop().split('?')[0]}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.close();
    }
}

listDatabases()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

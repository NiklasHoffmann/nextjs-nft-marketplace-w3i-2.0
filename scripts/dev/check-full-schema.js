// Check Full Schema: Shows complete marketplace_items structure
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkFullSchema() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'nft-marketplace');
        const collection = db.collection('marketplace_items');

        console.log('🔍 Full marketplace_items Schema Check\n');

        // Get one complete document
        const sample = await collection.findOne({ 'marketplace.isListed': true });

        if (!sample) {
            console.log('❌ No documents found');
            return;
        }

        console.log('📄 Complete Document Structure:\n');
        console.log(JSON.stringify(sample, null, 2));

        console.log('\n\n📋 Top-level keys:');
        Object.keys(sample).forEach(key => {
            console.log(`   - ${key} (${typeof sample[key]})`);
        });

        console.log('\n✅ Check complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkFullSchema().catch(console.error);

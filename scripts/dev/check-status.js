/**
 * Check listing status field
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkStatus() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('Ideationmarket_v2');
        const items = await db.collection('marketplace_items').find({}).toArray();

        console.log(`Total items: ${items.length}\n`);

        for (const item of items) {
            console.log(`Listing ${item.listingId}:`);
            console.log(`  status field: ${item.status !== undefined ? `"${item.status}"` : 'MISSING'}`);
            console.log(`  isListed: ${item.isListed}`);
            console.log('');
        }
    } finally {
        await client.close();
    }
}

checkStatus();

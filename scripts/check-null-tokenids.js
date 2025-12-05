require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkNullTokenIds() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db();
        const collection = db.collection('marketplace_items');

        // Find items with null tokenId
        const nullItems = await collection.find({ tokenId: null }).toArray();

        console.log(`Found ${nullItems.length} items with null tokenId:\n`);

        nullItems.forEach(item => {
            console.log({
                listingId: item.listingId,
                nftAddress: item.nftAddress,
                tokenId: item.tokenId,
                seller: item.seller,
                price: item.price
            });
        });

        // Check if they have tokenId stored differently
        console.log('\n--- Full document examples ---\n');
        nullItems.slice(0, 2).forEach(item => {
            console.log(JSON.stringify(item, null, 2));
            console.log('\n---\n');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkNullTokenIds();

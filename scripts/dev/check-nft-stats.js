// Check nft_stats collection structure
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkStats() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('nft_stats');

        console.log('📊 Current indexes:');
        const indexes = await collection.listIndexes().toArray();
        indexes.forEach((idx, i) => {
            console.log(`   ${i + 1}. ${idx.name} - ${JSON.stringify(idx.key)}`);
        });

        console.log('\n📄 Sample document:');
        const sample = await collection.findOne();
        if (sample) {
            console.log(JSON.stringify(sample, null, 2));
        } else {
            console.log('   Collection is empty');
        }

        console.log('\n📈 Total documents:', await collection.countDocuments());

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkStats();

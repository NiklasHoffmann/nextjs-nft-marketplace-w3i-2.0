/**
 * Check which collections exist and show sample documents
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkCollections() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        // Extract database name from connection string
        const uri = process.env.MONGODB_URI;
        const dbMatch = uri.match(/\/([^/?]+)(\?|$)/);
        const dbName = dbMatch ? dbMatch[1] : 'nft-marketplace';
        console.log(`📦 Using database: ${dbName}`);

        const db = client.db(dbName);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📚 Available collections:');
        collections.forEach((coll, i) => {
            console.log(`  ${i + 1}. ${coll.name}`);
        });

        // Check each collection for documents
        console.log('\n📊 Document counts:');
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments({});
            console.log(`  - ${coll.name}: ${count} documents`);

            if (count > 0) {
                const sample = await db.collection(coll.name).findOne({});
                console.log(`    Sample _id: ${sample._id}`);
                if (sample.listingId) console.log(`    listingId: ${sample.listingId}`);
                if (sample.contractAddress !== undefined) console.log(`    contractAddress: ${sample.contractAddress}`);
                if (sample.tokenId) console.log(`    tokenId: ${sample.tokenId}`);
            }
        }

        // Check for the specific document you showed (listingId 578, tokenId 4)
        console.log('\n🔍 Searching for listingId 578, tokenId 4...');
        for (const coll of collections) {
            const docs = await db.collection(coll.name).find({
                listingId: '578',
                tokenId: '4'
            }).toArray();

            if (docs.length > 0) {
                console.log(`\n  Found ${docs.length} documents in ${coll.name}:`);
                docs.forEach((doc, i) => {
                    console.log(`    ${i + 1}. _id: ${doc._id}`);
                    console.log(`       contractAddress: ${doc.contractAddress || 'NULL/UNDEFINED'}`);
                    console.log(`       has metadata: ${!!doc.metadata}`);
                    console.log(`       has contract: ${!!doc.contract}`);
                    console.log(`       has insights: ${!!doc.insights}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Check failed:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

checkCollections()
    .then(() => {
        console.log('\n🎉 Check completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Check failed:', error);
        process.exit(1);
    });

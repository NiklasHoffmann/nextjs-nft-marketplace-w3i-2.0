// Quick script to check if NFT #886 is in MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkNFT() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    // Use the database name from the URI
    const db = client.db(); // This uses the DB from connection string (Ideationmarket_v2)
    const collection = db.collection('marketplace_items');

    console.log(`\n🔍 Connected to database: ${db.databaseName}`);
    console.log('   Searching for NFT #886...\n');

    // Find by tokenId
    const nft = await collection.findOne({ tokenId: '886' });
    
    if (nft) {
        console.log('✅ FOUND NFT #886!');
        console.log('\n📋 Full Document:');
        console.log(JSON.stringify(nft, null, 2));
        
        console.log('\n📊 Key Fields:');
        console.log(`  contractAddress: ${nft.contractAddress}`);
        console.log(`  tokenId: ${nft.tokenId}`);
        console.log(`  listingId: ${nft.listingId}`);
        console.log(`  isListed: ${nft.isListed}`);
        console.log(`  active: ${nft.active}`);
        console.log(`  approved: ${nft.approved}`);
        console.log(`  approvedAddress: ${nft.approvedAddress}`);
        console.log(`  seller: ${nft.seller}`);
        console.log(`  price: ${nft.price}`);
    } else {
        console.log('❌ NFT #886 NOT FOUND in marketplace_items');
        
        // Show what IS in the collection
        const count = await collection.countDocuments();
        console.log(`\n📊 Total documents in marketplace_items: ${count}`);
        
        const samples = await collection.find().limit(3).toArray();
        console.log('\n📋 Sample documents:');
        samples.forEach(doc => {
            console.log(`  - ${doc.contractAddress}/${doc.tokenId} - isListed: ${doc.isListed}, listingId: ${doc.listingId}`);
        });
    }

    await client.close();
}

checkNFT().catch(console.error);

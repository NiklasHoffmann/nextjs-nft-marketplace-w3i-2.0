// Test if metadata sync query finds NFT #886
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testQuery() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();
    const collection = db.collection('marketplace_items');

    console.log('\n🔍 Testing metadata sync query...\n');

    const query = {
        tokenId: { $ne: null },
        isCollectionLevel: { $ne: true },
        isListed: true,
        $or: [
            { 'metadata.name': /^(Crypto Punk|Bored Ape|Cool Cat|Pudgy Penguin|Azuki|Doodle|Meebits|CloneX|Moonbird|Art Block)/ },
            { 'metadata.name': null },
            { 'metadata.image': null },
            { metadataLastSync: null },
            { metadataLastSync: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            { 'lastSync.approval': null },
            { 'lastSync.approval': { $lt: new Date(Date.now() - 5 * 60 * 1000) } }
        ]
    };

    const results = await collection.find(query).limit(10).toArray();

    console.log(`Found ${results.length} NFTs matching criteria (showing first 10):`);
    results.forEach((nft, index) => {
        console.log(`\n  ${index + 1}. Token #${nft.tokenId}:`);
        console.log(`    Contract: ${nft.contractAddress.slice(0, 8)}...`);
        console.log(`    metadata.name: ${nft.metadata?.name || 'null/undefined'}`);
        console.log(`    metadataLastSync: ${nft.metadataLastSync || 'null/undefined'}`);
        console.log(`    lastSync.approval: ${nft.lastSync?.approval || 'null/undefined'}`);
        console.log(`    isListed: ${nft.isListed}`);
    });

    // Check NFT #886 specifically
    const nft886 = await collection.findOne({ tokenId: '886' });
    console.log(`\n\n📊 NFT #886 Status:`);
    console.log(`  tokenId: ${nft886?.tokenId}`);
    console.log(`  isListed: ${nft886?.isListed}`);
    console.log(`  isCollectionLevel: ${nft886?.isCollectionLevel || 'undefined'}`);
    console.log(`  metadata field exists: ${nft886?.metadata !== undefined}`);
    console.log(`  metadata.name: ${nft886?.metadata?.name || 'null/undefined'}`);
    console.log(`  metadataLastSync: ${nft886?.metadataLastSync || 'null/undefined'}`);
    console.log(`  lastSync: ${JSON.stringify(nft886?.lastSync || {})}`);

    // Check if it matches the query
    const matches = await collection.findOne({ ...query, tokenId: '886' });
    console.log(`\n  Matches metadata sync query: ${matches ? '✅ YES' : '❌ NO'}`);

    if (!matches) {
        console.log('\n  Why not?');
        console.log(`    - tokenId !== null: ${nft886.tokenId !== null}`);
        console.log(`    - isCollectionLevel !== true: ${nft886.isCollectionLevel !== true}`);
        console.log(`    - isListed === true: ${nft886.isListed === true}`);
        console.log(`    - $or conditions:`);
        console.log(`        - metadata.name null: ${nft886.metadata?.name === null || nft886.metadata?.name === undefined}`);
        console.log(`        - metadata.image null: ${nft886.metadata?.image === null || nft886.metadata?.image === undefined}`);
        console.log(`        - metadataLastSync null: ${nft886.metadataLastSync === null || nft886.metadataLastSync === undefined}`);
        console.log(`        - lastSync.approval null: ${nft886.lastSync?.approval === null || nft886.lastSync?.approval === undefined}`);
    }

    await client.close();
}

testQuery().catch(console.error);

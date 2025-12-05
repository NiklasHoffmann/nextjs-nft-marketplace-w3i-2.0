/**
 * Fix undefined contractAddress in enriched_nfts collection
 * 
 * This script finds and removes NFTs with undefined/null contractAddress
 * that were synced from TheGraph before the mapping fix was applied.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixUndefinedContractAddress() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('nft-marketplace');
        const enrichedCollection = db.collection('enriched_nfts');
        const marketplaceCollection = db.collection('marketplace_items');

        // 1. Find documents with undefined/null contractAddress
        console.log('\n🔍 Searching for documents with undefined/null contractAddress...');

        const undefinedDocs = await enrichedCollection.find({
            $or: [
                { contractAddress: null },
                { contractAddress: undefined },
                { contractAddress: { $exists: false } }
            ]
        }).toArray();

        console.log(`\n📊 Found ${undefinedDocs.length} documents with undefined/null contractAddress`);

        if (undefinedDocs.length === 0) {
            console.log('✅ No documents to fix in enriched_nfts!');
        } else {
            // Show samples
            console.log('\n📄 Sample documents:');
            undefinedDocs.slice(0, 3).forEach((doc, i) => {
                console.log(`\n  ${i + 1}. _id: ${doc._id}`);
                console.log(`     contractAddress: ${doc.contractAddress}`);
                console.log(`     tokenId: ${doc.tokenId}`);
                console.log(`     nftAddress: ${doc.nftAddress || 'NOT SET'}`);
            });

            // Delete these broken documents
            console.log(`\n🗑️  Deleting ${undefinedDocs.length} broken documents...`);
            const deleteResult = await enrichedCollection.deleteMany({
                $or: [
                    { contractAddress: null },
                    { contractAddress: undefined },
                    { contractAddress: { $exists: false } }
                ]
            });
            console.log(`✅ Deleted ${deleteResult.deletedCount} documents from enriched_nfts`);
        }

        // 2. Check marketplace_items
        const marketplaceUndefined = await marketplaceCollection.find({
            $or: [
                { contractAddress: null },
                { contractAddress: undefined },
                { contractAddress: { $exists: false } }
            ]
        }).toArray();

        console.log(`\n📊 Found ${marketplaceUndefined.length} marketplace items with undefined/null contractAddress`);

        if (marketplaceUndefined.length === 0) {
            console.log('✅ No documents to fix in marketplace_items!');
        } else {
            // Show samples
            console.log('\n📄 Sample marketplace items:');
            marketplaceUndefined.slice(0, 3).forEach((doc, i) => {
                console.log(`\n  ${i + 1}. listingId: ${doc.listingId}`);
                console.log(`     contractAddress: ${doc.contractAddress}`);
                console.log(`     tokenId: ${doc.tokenId}`);
                console.log(`     nftAddress: ${doc.nftAddress || 'NOT SET'}`);
            });

            // Delete these broken documents
            console.log(`\n🗑️  Deleting ${marketplaceUndefined.length} broken marketplace items...`);
            const deleteResult = await marketplaceCollection.deleteMany({
                $or: [
                    { contractAddress: null },
                    { contractAddress: undefined },
                    { contractAddress: { $exists: false } }
                ]
            });
            console.log(`✅ Deleted ${deleteResult.deletedCount} documents from marketplace_items`);
        }

        // 3. Verify cleanup
        const remainingBroken = await enrichedCollection.countDocuments({
            $or: [
                { contractAddress: null },
                { contractAddress: undefined },
                { contractAddress: { $exists: false } }
            ]
        });

        const totalDocs = await enrichedCollection.countDocuments({});
        const totalMarketplace = await marketplaceCollection.countDocuments({});

        console.log('\n📊 Final Status:');
        console.log(`  - enriched_nfts: ${totalDocs} total, ${remainingBroken} broken`);
        console.log(`  - marketplace_items: ${totalMarketplace} total`);

        if (remainingBroken === 0) {
            console.log('\n✅ SUCCESS: All broken documents cleaned up!');
            console.log('\n💡 Next steps:');
            console.log('   1. Restart dev server: npm run dev');
            console.log('   2. TheGraph sync will re-fetch with correct mapping');
        } else {
            console.log('\n⚠️  WARNING: Some broken documents still exist');
        }

    } catch (error) {
        console.error('❌ Fix failed:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run fix
fixUndefinedContractAddress()
    .then(() => {
        console.log('\n🎉 Fix script completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Fix script failed:', error);
        process.exit(1);
    });

/**
 * Cleanup Script: Remove duplicate marketplace items and fix data structure
 * 
 * 1. Delete documents with contractAddress: null
 * 2. Remove metadata/contract/insights/stats from marketplace_items (should only have TheGraph data)
 * 3. Verify unique constraint (contractAddress + tokenId + listingId)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanupMarketplace() {
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
        const collection = db.collection('marketplace_items');

        // 1. Count and delete documents with null/undefined contractAddress
        console.log('\n🔍 Step 1: Finding documents with null contractAddress...');
        const nullDocs = await collection.find({
            $or: [
                { contractAddress: null },
                { contractAddress: { $exists: false } }
            ]
        }).toArray();

        console.log(`📊 Found ${nullDocs.length} documents with null contractAddress`);

        if (nullDocs.length > 0) {
            console.log('\n📄 Sample broken documents:');
            nullDocs.slice(0, 3).forEach((doc, i) => {
                console.log(`  ${i + 1}. listingId: ${doc.listingId}, tokenId: ${doc.tokenId}, contractAddress: ${doc.contractAddress}`);
            });

            const deleteResult = await collection.deleteMany({
                $or: [
                    { contractAddress: null },
                    { contractAddress: { $exists: false } }
                ]
            });
            console.log(`\n✅ Deleted ${deleteResult.deletedCount} broken documents`);
        }

        // 2. Find documents with old field names (desiredNftAddress)
        console.log('\n🔍 Step 2: Finding documents with old field names...');
        const oldFieldDocs = await collection.countDocuments({
            $or: [
                { desiredNftAddress: { $exists: true } },
                { nftAddress: { $exists: true } }
            ]
        });

        console.log(`📊 Found ${oldFieldDocs} documents with old field names`);

        if (oldFieldDocs > 0) {
            // Rename old fields
            const renameResult = await collection.updateMany(
                {
                    $or: [
                        { desiredNftAddress: { $exists: true } },
                        { nftAddress: { $exists: true } }
                    ]
                },
                [
                    {
                        $set: {
                            // Top-level fields (for queries)
                            contractAddress: {
                                $ifNull: ['$contractAddress', '$nftAddress']
                            },
                            // In marketplace sub-object
                            'marketplace.desiredContractAddress': {
                                $ifNull: ['$marketplace.desiredContractAddress', '$desiredNftAddress', '$marketplace.desiredNftAddress']
                            }
                        }
                    },
                    {
                        $unset: ['nftAddress', 'desiredNftAddress', 'marketplace.desiredNftAddress']
                    }
                ]
            );
            console.log(`✅ Updated ${renameResult.modifiedCount} documents with old field names`);
        }

        // 3. Remove embedded metadata/contract/insights/stats (should only be in nft_metadata collection)
        console.log('\n🔍 Step 3: Cleaning up embedded data structures...');
        const docsWithEmbedded = await collection.countDocuments({
            $or: [
                { metadata: { $exists: true } },
                { contract: { $exists: true } },
                { insights: { $exists: true } },
                { stats: { $exists: true } },
                { contractName: { $exists: true } },
                { contractSymbol: { $exists: true } }
            ]
        });

        console.log(`📊 Found ${docsWithEmbedded} documents with embedded data`);

        if (docsWithEmbedded > 0) {
            const cleanupResult = await collection.updateMany(
                {},
                {
                    $unset: {
                        metadata: '',
                        contract: '',
                        insights: '',
                        stats: '',
                        contractName: '',
                        contractSymbol: '',
                        metadataLastSync: '',
                        metadataSource: '',
                        insightsLastUpdated: '',
                        lastUpdated: '',
                        dataQuality: ''
                    }
                }
            );
            console.log(`✅ Cleaned ${cleanupResult.modifiedCount} documents (removed embedded data)`);
        }

        // 4. Check for remaining duplicates
        console.log('\n🔍 Step 4: Checking for duplicate listingIds...');
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: '$listingId',
                    count: { $sum: 1 },
                    docs: { $push: '$_id' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();

        console.log(`📊 Found ${duplicates.length} duplicate listingIds`);

        if (duplicates.length > 0) {
            console.log('\n⚠️  Duplicate listingIds detected:');
            duplicates.forEach((dup, i) => {
                console.log(`  ${i + 1}. listingId: ${dup._id} (${dup.count} copies)`);
            });

            // Keep only the most recent document for each listingId
            for (const dup of duplicates) {
                const docs = await collection.find({ listingId: dup._id })
                    .sort({ 'lastSync.marketplace': -1 })
                    .toArray();

                // Keep first (most recent), delete others
                const toDelete = docs.slice(1).map(doc => doc._id);
                if (toDelete.length > 0) {
                    await collection.deleteMany({ _id: { $in: toDelete } });
                    console.log(`  ✅ Kept most recent, deleted ${toDelete.length} old copies of listingId ${dup._id}`);
                }
            }
        }

        // 5. Final verification
        console.log('\n📊 Final Status:');
        const totalDocs = await collection.countDocuments({});
        const docsWithContractAddress = await collection.countDocuments({ contractAddress: { $exists: true, $ne: null } });
        const docsWithOldFields = await collection.countDocuments({
            $or: [
                { desiredNftAddress: { $exists: true } },
                { nftAddress: { $exists: true } }
            ]
        });
        const docsWithEmbedded2 = await collection.countDocuments({
            $or: [
                { metadata: { $exists: true } },
                { contract: { $exists: true } },
                { insights: { $exists: true } }
            ]
        });

        console.log(`  - Total documents: ${totalDocs}`);
        console.log(`  - With contractAddress: ${docsWithContractAddress}`);
        console.log(`  - With old field names: ${docsWithOldFields}`);
        console.log(`  - With embedded data: ${docsWithEmbedded2}`);

        if (docsWithContractAddress === totalDocs && docsWithOldFields === 0 && docsWithEmbedded2 === 0) {
            console.log('\n✅ SUCCESS: marketplace_items is clean!');
            console.log('\n💡 Structure now:');
            console.log('   - marketplace_items: Only TheGraph data (listingId, price, seller, etc.)');
            console.log('   - nft_metadata: Blockchain data (metadata, contract info)');
            console.log('   - admin_nft_insights: Admin-added insights');
            console.log('   - nft_stats: User interactions (likes, views, etc.)');
        } else {
            console.log('\n⚠️  Some issues remain - run script again or check manually');
        }

        // Show sample document
        const sample = await collection.findOne({});
        console.log('\n📄 Sample cleaned document:');
        console.log(JSON.stringify(sample, null, 2));

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run cleanup
cleanupMarketplace()
    .then(() => {
        console.log('\n🎉 Cleanup script completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Cleanup script failed:', error);
        process.exit(1);
    });

/**
 * Migration: Rename nftAddress → contractAddress in marketplace_items
 * 
 * This script migrates old marketplace_items documents that still use
 * nftAddress to the new contractAddress field.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateMarketplaceItems() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('nft-marketplace');
        const collection = db.collection('marketplace_items');

        // 1. Count documents with nftAddress field
        const countWithNftAddress = await collection.countDocuments({
            nftAddress: { $exists: true }
        });

        console.log(`\n📊 Found ${countWithNftAddress} items with 'nftAddress' field`);

        if (countWithNftAddress === 0) {
            console.log('✅ No migration needed - all items already use contractAddress');
            return;
        }

        // 2. Find sample document to show before migration
        const sample = await collection.findOne({ nftAddress: { $exists: true } });
        console.log('\n📄 Sample document BEFORE migration:');
        console.log(`  - _id: ${sample._id}`);
        console.log(`  - nftAddress: ${sample.nftAddress}`);
        console.log(`  - contractAddress: ${sample.contractAddress || 'NOT SET'}`);
        console.log(`  - desiredNftAddress: ${sample.desiredNftAddress || 'NOT SET'}`);
        console.log(`  - desiredContractAddress: ${sample.desiredContractAddress || 'NOT SET'}`);

        // 3. Perform migration
        console.log('\n🔄 Starting migration...');

        const result = await collection.updateMany(
            { nftAddress: { $exists: true } },
            [
                {
                    $set: {
                        // Copy nftAddress to contractAddress (if not already set)
                        contractAddress: {
                            $ifNull: ['$contractAddress', '$nftAddress']
                        },
                        // Copy desiredNftAddress to desiredContractAddress (if exists and not already set)
                        desiredContractAddress: {
                            $cond: {
                                if: { $ne: ['$desiredNftAddress', null] },
                                then: {
                                    $ifNull: ['$desiredContractAddress', '$desiredNftAddress']
                                },
                                else: '$desiredContractAddress'
                            }
                        }
                    }
                },
                {
                    $unset: ['nftAddress', 'desiredNftAddress']
                }
            ]
        );

        console.log(`\n✅ Migration completed!`);
        console.log(`  - Matched: ${result.matchedCount} documents`);
        console.log(`  - Modified: ${result.modifiedCount} documents`);

        // 4. Verify migration
        const remainingOldFields = await collection.countDocuments({
            $or: [
                { nftAddress: { $exists: true } },
                { desiredNftAddress: { $exists: true } }
            ]
        });

        const countWithContractAddress = await collection.countDocuments({
            contractAddress: { $exists: true }
        });

        console.log('\n📊 Verification:');
        console.log(`  - Remaining items with old fields: ${remainingOldFields}`);
        console.log(`  - Items with contractAddress: ${countWithContractAddress}`);

        if (remainingOldFields === 0) {
            console.log('\n✅ SUCCESS: All items migrated to contractAddress!');
        } else {
            console.log('\n⚠️  WARNING: Some items still have old field names');
        }

        // 5. Show sample after migration
        const sampleAfter = await collection.findOne({ _id: sample._id });
        console.log('\n📄 Sample document AFTER migration:');
        console.log(`  - _id: ${sampleAfter._id}`);
        console.log(`  - contractAddress: ${sampleAfter.contractAddress}`);
        console.log(`  - desiredContractAddress: ${sampleAfter.desiredContractAddress || 'NOT SET'}`);
        console.log(`  - nftAddress: ${sampleAfter.nftAddress || 'REMOVED ✅'}`);
        console.log(`  - desiredNftAddress: ${sampleAfter.desiredNftAddress || 'REMOVED ✅'}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migrateMarketplaceItems()
    .then(() => {
        console.log('\n🎉 Migration script completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Migration script failed:', error);
        process.exit(1);
    });

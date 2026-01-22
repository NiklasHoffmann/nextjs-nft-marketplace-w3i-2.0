/**
 * Cleanup Script: Remove embedded data from marketplace_items
 * 
 * Problem: marketplace_items had metadata, contract, insights, stats embedded
 * Solution: Keep ONLY TheGraph data (listing info), remove all enrichment fields
 * 
 * The new architecture uses:
 * - marketplace_items: ONLY listing data from TheGraph
 * - nft_metadata: NFT metadata + contract info
 * - admin_nft_insights: Custom insights
 * - nft_stats: User interaction stats
 * 
 * Enrichment happens via MongoDB $lookup at query time
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'Ideationmarket_v2';

async function cleanupMarketplaceItems() {
    console.log('🧹 Starting marketplace_items cleanup...\n');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('marketplace_items');

        // Count documents before
        const totalDocs = await collection.countDocuments();
        console.log(`📊 Total documents: ${totalDocs}\n`);

        // STEP 1: Remove embedded metadata fields
        console.log('🗑️  Step 1: Removing embedded metadata fields...');
        const metadataResult = await collection.updateMany(
            { metadata: { $exists: true } },
            {
                $unset: {
                    metadata: '',
                    metadataLastSync: '',
                    metadataSource: ''
                }
            }
        );
        console.log(`   ✅ Removed metadata from ${metadataResult.modifiedCount} documents\n`);

        // STEP 2: Remove contract info fields
        console.log('🗑️  Step 2: Removing contract info fields...');
        const contractResult = await collection.updateMany(
            {
                $or: [
                    { contractName: { $exists: true } },
                    { contractSymbol: { $exists: true } }
                ]
            },
            {
                $unset: {
                    contractName: '',
                    contractSymbol: ''
                }
            }
        );
        console.log(`   ✅ Removed contract info from ${contractResult.modifiedCount} documents\n`);

        // STEP 3: Remove embedded insights
        console.log('🗑️  Step 3: Removing embedded insights...');
        const insightsResult = await collection.updateMany(
            { insights: { $exists: true } },
            {
                $unset: {
                    insights: '',
                    insightsLastUpdated: ''
                }
            }
        );
        console.log(`   ✅ Removed insights from ${insightsResult.modifiedCount} documents\n`);

        // STEP 4: Remove embedded stats
        console.log('🗑️  Step 4: Removing embedded stats...');
        const statsResult = await collection.updateMany(
            { stats: { $exists: true } },
            {
                $unset: {
                    stats: '',
                    statsLastUpdated: ''
                }
            }
        );
        console.log(`   ✅ Removed stats from ${statsResult.modifiedCount} documents\n`);

        // STEP 5: Remove dataQuality fields (not needed anymore)
        console.log('🗑️  Step 5: Removing dataQuality fields...');
        const dataQualityResult = await collection.updateMany(
            { dataQuality: { $exists: true } },
            { $unset: { dataQuality: '' } }
        );
        console.log(`   ✅ Removed dataQuality from ${dataQualityResult.modifiedCount} documents\n`);

        // STEP 6: Flatten nested marketplace object to top level
        console.log('🔄 Step 6: Flattening nested marketplace object...');
        const docsWithMarketplace = await collection.find({
            'marketplace': { $exists: true }
        }).toArray();

        let flattenedCount = 0;
        for (const doc of docsWithMarketplace) {
            if (doc.marketplace && typeof doc.marketplace === 'object') {
                // Move marketplace.* fields to top level (if not already there)
                const updates = {};
                if (doc.marketplace.isListed !== undefined && doc.isListed === undefined) {
                    updates.isListed = doc.marketplace.isListed;
                }
                if (doc.marketplace.price !== undefined && doc.price === undefined) {
                    updates.price = doc.marketplace.price;
                }
                if (doc.marketplace.seller && doc.seller === undefined) {
                    updates.seller = doc.marketplace.seller;
                }
                if (doc.marketplace.buyer !== undefined && doc.buyer === undefined) {
                    updates.buyer = doc.marketplace.buyer;
                }
                if (doc.marketplace.desiredContractAddress && doc.desiredContractAddress === undefined) {
                    updates.desiredContractAddress = doc.marketplace.desiredContractAddress;
                }
                if (doc.marketplace.desiredTokenId !== undefined && doc.desiredTokenId === undefined) {
                    updates.desiredTokenId = doc.marketplace.desiredTokenId;
                }

                if (Object.keys(updates).length > 0) {
                    await collection.updateOne(
                        { _id: doc._id },
                        {
                            $set: updates,
                            $unset: { marketplace: '' }
                        }
                    );
                    flattenedCount++;
                } else {
                    // Just remove marketplace if all fields already on top level
                    await collection.updateOne(
                        { _id: doc._id },
                        { $unset: { marketplace: '' } }
                    );
                    flattenedCount++;
                }
            }
        }
        console.log(`   ✅ Flattened ${flattenedCount} documents\n`);

        // STEP 7: Show sample cleaned document
        console.log('📋 Sample cleaned document:');
        const sample = await collection.findOne({});
        console.log(JSON.stringify(sample, null, 2));
        console.log('');

        // STEP 8: Verify only correct fields remain
        console.log('✅ Verification - Fields that SHOULD exist:');
        const fieldsToKeep = [
            '_id',
            'listingId',
            'contractAddress',
            'tokenId',
            'isListed',
            'price',
            'seller',
            'buyer',
            'desiredContractAddress', // ✅ Flattened from marketplace.desiredContractAddress
            'desiredTokenId',
            'lastSync',
            'listedAt',
            'createdAt',
            'updatedAt'
        ];

        const sampleDoc = await collection.findOne({});
        const existingFields = Object.keys(sampleDoc || {});
        const extraFields = existingFields.filter(f => !fieldsToKeep.includes(f));

        if (extraFields.length > 0) {
            console.log(`   ⚠️  Found unexpected fields: ${extraFields.join(', ')}`);
        } else {
            console.log('   ✅ All fields are correct!');
        }

        console.log('\n🎉 Cleanup complete!');
        console.log('\n📝 Summary:');
        console.log(`   - Metadata removed: ${metadataResult.modifiedCount} docs`);
        console.log(`   - Contract info removed: ${contractResult.modifiedCount} docs`);
        console.log(`   - Insights removed: ${insightsResult.modifiedCount} docs`);
        console.log(`   - Stats removed: ${statsResult.modifiedCount} docs`);
        console.log(`   - DataQuality removed: ${dataQualityResult.modifiedCount} docs`);
        console.log(`   - Marketplace nested object flattened: ${flattenedCount} docs`);
        console.log(`\n✅ marketplace_items now contains ONLY TheGraph data in FLAT structure!`);
        console.log(`✅ Enrichment happens via $lookup in API routes`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

cleanupMarketplaceItems();

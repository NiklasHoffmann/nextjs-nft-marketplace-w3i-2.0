/**
 * Add Unique Index to marketplace_items collection
 * 
 * Prevents duplicate listings for the same listingId
 * Run this once to ensure data integrity
 * 
 * Usage: node scripts/maintenance/add-unique-index-marketplace.js
 */

const { MongoClient } = require('mongodb');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment
config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'Ideationmarket_v2';

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

async function addUniqueIndex() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DATABASE_NAME);
        const collection = db.collection('marketplace_items');

        // Check existing indexes
        const existingIndexes = await collection.indexes();
        console.log('\n📋 Existing indexes:');
        existingIndexes.forEach(idx => {
            console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        // Check for duplicates BEFORE creating index
        console.log('\n🔍 Checking for duplicate listingIds...');
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: { listingId: '$listingId', chainId: '$chainId' },
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();

        if (duplicates.length > 0) {
            console.log(`\n⚠️  Found ${duplicates.length} duplicate listingId groups!`);
            
            // Show details
            for (const dup of duplicates) {
                console.log(`\n   ListingID ${dup._id.listingId} (chainId: ${dup._id.chainId}) has ${dup.count} entries:`);
                dup.docs.forEach((doc, i) => {
                    console.log(`      ${i + 1}. ${doc.contractAddress}:${doc.tokenId} - Active: ${doc.active} - Synced: ${doc.syncedAt}`);
                });
            }

            // Clean up: Keep only the MOST RECENT entry for each listingId
            console.log('\n🧹 Cleaning up duplicates (keeping most recent)...');
            let removedCount = 0;

            for (const dup of duplicates) {
                // Sort by syncedAt descending, keep first (most recent)
                const sorted = dup.docs.sort((a, b) => 
                    new Date(b.syncedAt || 0) - new Date(a.syncedAt || 0)
                );
                
                const toKeep = sorted[0]._id;
                const toRemove = sorted.slice(1).map(d => d._id);

                // Delete old duplicates
                const deleteResult = await collection.deleteMany({
                    _id: { $in: toRemove }
                });

                removedCount += deleteResult.deletedCount;
                console.log(`   ✅ Removed ${deleteResult.deletedCount} duplicates for listingId ${dup._id.listingId}`);
            }

            console.log(`\n✅ Total duplicates removed: ${removedCount}`);
        } else {
            console.log('✅ No duplicates found!');
        }

        // Create unique index
        console.log('\n🔨 Creating unique index on (listingId, chainId)...');
        
        try {
            const indexResult = await collection.createIndex(
                { listingId: 1, chainId: 1 },
                { 
                    unique: true,
                    name: 'unique_listing_per_chain'
                }
            );
            console.log(`✅ Index created: ${indexResult}`);
        } catch (error) {
            if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
                console.log('ℹ️  Index already exists with same specification');
            } else {
                throw error;
            }
        }

        // Verify index was created
        const updatedIndexes = await collection.indexes();
        const uniqueIndex = updatedIndexes.find(idx => idx.name === 'unique_listing_per_chain');
        
        if (uniqueIndex) {
            console.log('\n✅ Unique index verified:');
            console.log(`   Name: ${uniqueIndex.name}`);
            console.log(`   Keys: ${JSON.stringify(uniqueIndex.key)}`);
            console.log(`   Unique: ${uniqueIndex.unique}`);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Run script
addUniqueIndex();

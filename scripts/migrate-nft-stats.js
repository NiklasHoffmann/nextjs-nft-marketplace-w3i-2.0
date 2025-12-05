// Migrate nft_stats: contractAddress -> nftAddress, add listingId
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateStats() {
    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();

        const db = client.db();
        const statsCollection = db.collection('nft_stats');
        const marketplaceCollection = db.collection('marketplace_items');

        console.log('\n📊 Current state:');
        const totalStats = await statsCollection.countDocuments();
        console.log(`   Total stats documents: ${totalStats}`);

        // Step 1: Rename contractAddress to nftAddress
        console.log('\n1️⃣  Renaming contractAddress -> nftAddress...');
        const renameResult = await statsCollection.updateMany(
            { contractAddress: { $exists: true } },
            { $rename: { contractAddress: 'nftAddress' } }
        );
        console.log(`   ✅ Updated ${renameResult.modifiedCount} documents`);

        // Step 2: Add listingId by looking up marketplace_items
        console.log('\n2️⃣  Adding listingId from marketplace_items...');
        const statsWithoutListingId = await statsCollection.find({
            listingId: { $exists: false }
        }).toArray();

        console.log(`   Found ${statsWithoutListingId.length} stats without listingId`);

        let updated = 0;
        let notFound = 0;

        for (const stat of statsWithoutListingId) {
            // Find corresponding marketplace item
            const marketplaceItem = await marketplaceCollection.findOne({
                nftAddress: stat.nftAddress,
                tokenId: stat.tokenId,
                'marketplace.isListed': true
            }, {
                sort: { listingId: -1 } // Get latest listing
            });

            if (marketplaceItem && marketplaceItem.listingId) {
                await statsCollection.updateOne(
                    { _id: stat._id },
                    { $set: { listingId: marketplaceItem.listingId } }
                );
                updated++;
                if (updated % 10 === 0) {
                    console.log(`   Progress: ${updated}/${statsWithoutListingId.length}`);
                }
            } else {
                notFound++;
                console.log(`   ⚠️  No marketplace item found for ${stat.nftAddress}-${stat.tokenId}`);
            }
        }

        console.log(`   ✅ Added listingId to ${updated} documents`);
        if (notFound > 0) {
            console.log(`   ⚠️  ${notFound} documents had no matching marketplace item`);
        }

        // Step 3: Create unique index
        console.log('\n3️⃣  Creating unique index (nftAddress + tokenId + listingId)...');

        // Drop old index if exists
        try {
            await statsCollection.dropIndex('contractAddress_1_tokenId_1');
            console.log('   Dropped old index: contractAddress_1_tokenId_1');
        } catch (e) {
            // Index doesn't exist, that's ok
        }

        // Create new index
        await statsCollection.createIndex(
            { nftAddress: 1, tokenId: 1, listingId: 1 },
            { unique: true, name: 'nft_stats_unique_index' }
        );
        console.log('   ✅ Created new index');

        // Show final state
        console.log('\n📊 Final state:');
        console.log('   Indexes:');
        const indexes = await statsCollection.listIndexes().toArray();
        indexes.forEach((idx, i) => {
            console.log(`      ${i + 1}. ${idx.name} - ${JSON.stringify(idx.key)}`);
        });

        console.log('\n   Sample document:');
        const sample = await statsCollection.findOne();
        console.log('   ', JSON.stringify(sample, null, 2));

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.close();
        console.log('\n👋 Connection closed');
    }
}

migrateStats();

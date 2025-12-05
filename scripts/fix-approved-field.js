/**
 * Script to fix inconsistent approved/approvedAddress fields in nft_metadata collection
 * Some NFTs have 'approved', others have 'approvedAddress' - this normalizes them
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixApprovedFields() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('🔌 Connected to MongoDB');

        const db = client.db('nft_marketplace');
        const collection = db.collection('nft_metadata');

        // Count NFTs with different field variations
        const withApproved = await collection.countDocuments({ 'contract.approved': { $exists: true } });
        const withApprovedAddress = await collection.countDocuments({ 'contract.approvedAddress': { $exists: true } });
        const withBoth = await collection.countDocuments({
            $and: [
                { 'contract.approved': { $exists: true } },
                { 'contract.approvedAddress': { $exists: true } }
            ]
        });

        console.log(`📊 Current state:`);
        console.log(`  - NFTs with 'approved': ${withApproved}`);
        console.log(`  - NFTs with 'approvedAddress': ${withApprovedAddress}`);
        console.log(`  - NFTs with both: ${withBoth}`);

        // Fix NFTs that have 'approved' but not 'approvedAddress'
        const result1 = await collection.updateMany(
            {
                'contract.approved': { $exists: true },
                'contract.approvedAddress': { $exists: false }
            },
            [{
                $set: {
                    'contract.approvedAddress': '$contract.approved'
                }
            }]
        );

        console.log(`\n✅ Added approvedAddress to ${result1.modifiedCount} NFTs that only had 'approved'`);

        // Fix NFTs that have 'approvedAddress' but not 'approved'
        const result2 = await collection.updateMany(
            {
                'contract.approvedAddress': { $exists: true },
                'contract.approved': { $exists: false }
            },
            [{
                $set: {
                    'contract.approved': '$contract.approvedAddress'
                }
            }]
        );

        console.log(`✅ Added approved to ${result2.modifiedCount} NFTs that only had 'approvedAddress'`);

        // Check final state
        const finalWithBoth = await collection.countDocuments({
            $or: [
                { 'contract.approved': { $exists: true } },
                { 'contract.approvedAddress': { $exists: true } }
            ]
        });

        console.log(`\n📊 Final state:`);
        console.log(`  - NFTs with approved data: ${finalWithBoth}`);

        // Show some examples
        console.log(`\n📋 Sample NFTs with approved data:`);
        const samples = await collection.find({
            $or: [
                { 'contract.approved': { $exists: true } },
                { 'contract.approvedAddress': { $exists: true } }
            ]
        }).limit(5).toArray();

        samples.forEach(nft => {
            console.log(`  - ${nft.contractAddress}/${nft.tokenId}:`);
            console.log(`    approved: ${nft.contract?.approved || 'none'}`);
            console.log(`    approvedAddress: ${nft.contract?.approvedAddress || 'none'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
fixApprovedFields().catch(console.error);
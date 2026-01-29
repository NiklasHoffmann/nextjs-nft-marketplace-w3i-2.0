/**
 * Cleanup Incomplete Listings
 * 
 * Deletes marketplace_items that are missing v2 fields
 * (created by old WebSocket events before the fix)
 * 
 * TheGraph sync will recreate them with complete data.
 */

import { MongoClient } from 'mongodb';

async function getDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not set');
    }
    const client = await MongoClient.connect(uri);
    return client.db(process.env.MONGODB_DB || 'Ideationmarket_v2');
}

async function cleanupIncompleteListings() {
    console.log('🔄 Starting incomplete listings cleanup...\n');

    try {
        console.log('📡 Connecting to MongoDB...');
        const db = await getDatabase();
        const collection = db.collection('marketplace_items');
        console.log('✅ Connected!\n');

        // Find items missing v2 fields
        console.log('🔍 Finding incomplete items...');
        const incompleteItems = await collection.find({
            $or: [
                { status: { $exists: false } },
                { tokenStandard: { $exists: false } },
                { currency: { $exists: false } },
                { feeRate: { $exists: false } },
                { priceTotal: { $exists: false } },
                { unitPrice: { $exists: false } }
            ]
        }).toArray();

        console.log(`   Found ${incompleteItems.length} incomplete item(s)\n`);

        if (incompleteItems.length === 0) {
            console.log('✅ No incomplete items found. All listings are complete!\n');
            return;
        }

        // Show which items will be deleted
        console.log('📋 Items to delete:');
        incompleteItems.forEach((item: any) => {
            const missing: string[] = [];
            if (!item.status) missing.push('status');
            if (!item.tokenStandard) missing.push('tokenStandard');
            if (!item.currency) missing.push('currency');
            if (!item.feeRate) missing.push('feeRate');
            if (!item.priceTotal) missing.push('priceTotal');
            if (!item.unitPrice) missing.push('unitPrice');

            console.log(`   - ${item.contractAddress} #${item.tokenId} (listingId: ${item.listingId})`);
            console.log(`     Missing: ${missing.join(', ')}`);
        });

        console.log('\n🗑️  Deleting incomplete items...');
        const result = await collection.deleteMany({
            $or: [
                { status: { $exists: false } },
                { tokenStandard: { $exists: false } },
                { currency: { $exists: false } },
                { feeRate: { $exists: false } },
                { priceTotal: { $exists: false } },
                { unitPrice: { $exists: false } }
            ]
        });

        console.log(`   ✅ Deleted ${result.deletedCount} item(s)\n`);

        // Verify cleanup
        console.log('🔍 Verifying cleanup...');
        const remainingIncomplete = await collection.find({
            $or: [
                { status: { $exists: false } },
                { tokenStandard: { $exists: false } },
                { currency: { $exists: false } },
                { feeRate: { $exists: false } }
            ]
        }).toArray();

        if (remainingIncomplete.length === 0) {
            console.log('   ✅ No incomplete items remaining!\n');
        } else {
            console.warn(`   ⚠️  Still ${remainingIncomplete.length} incomplete items remaining\n`);
        }

        console.log('✅ Cleanup complete!\n');
        console.log('📝 Note: TheGraph sync will recreate these items with complete v2 data\n');
        console.log('   Wait ~60 seconds for the next sync cycle.\n');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Run cleanup
cleanupIncompleteListings()
    .then(() => {
        console.log('🎉 Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });

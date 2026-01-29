/**
 * Check Incomplete Listings
 * 
 * Finds marketplace_items that are missing v2 fields.
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not set');
        process.exit(1);
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(process.env.MONGODB_DB || 'Ideationmarket_v2');

    console.log('🔍 Checking for incomplete listings...\n');

    // Find items missing v2 fields
    const incompleteItems = await db.collection('marketplace_items').find({
        $or: [
            { status: { $exists: false } },
            { tokenStandard: { $exists: false } },
            { currency: { $exists: false } },
            { feeRate: { $exists: false } },
            { priceTotal: { $exists: false } },
            { unitPrice: { $exists: false } }
        ]
    }).toArray();

    if (incompleteItems.length === 0) {
        console.log('✅ All listings have complete v2 fields!');
    } else {
        console.log(`⚠️ Found ${incompleteItems.length} incomplete listing(s):\n`);
        
        for (const item of incompleteItems) {
            console.log(`Listing #${item.listingId} (${item.contractAddress}/${item.tokenId})`);
            
            const missing = [];
            if (!item.status) missing.push('status');
            if (!item.tokenStandard) missing.push('tokenStandard');
            if (!item.currency) missing.push('currency');
            if (!item.feeRate) missing.push('feeRate');
            if (!item.priceTotal) missing.push('priceTotal');
            if (!item.unitPrice) missing.push('unitPrice');
            
            console.log(`  Missing: ${missing.join(', ')}`);
            console.log();
        }
        
        console.log('\n💡 These incomplete listings will be corrected by TheGraph sync (every 60s)');
        console.log('   or you can delete them manually in MongoDB.');
    }

    await client.close();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});

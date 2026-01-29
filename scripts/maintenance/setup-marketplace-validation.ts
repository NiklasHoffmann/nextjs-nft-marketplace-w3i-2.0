/**
 * Setup MongoDB Schema Validation for marketplace_items
 * 
 * Prevents inserting/updating marketplace_items with isListed: false
 * marketplace_items should ONLY contain active listings (isListed: true)
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

    console.log('🔧 Setting up marketplace_items validation...\n');

    try {
        // Add validation rule: isListed must be true OR not exist (for backwards compatibility)
        await db.command({
            collMod: 'marketplace_items',
            validator: {
                $or: [
                    { isListed: true },
                    { isListed: { $exists: false } } // Allow if field doesn't exist
                ]
            },
            validationLevel: 'moderate', // Apply to inserts and updates
            validationAction: 'error' // Reject invalid documents
        });

        console.log('✅ Schema validation enabled for marketplace_items');
        console.log('   Rule: isListed must be true or not exist');
        console.log('   Action: Reject inserts/updates with isListed: false\n');

        // Clean up existing isListed: false entries
        console.log('🧹 Cleaning up existing invalid entries...');
        const deleteResult = await db.collection('marketplace_items').deleteMany({
            isListed: false
        });

        if (deleteResult.deletedCount > 0) {
            console.log(`✅ Deleted ${deleteResult.deletedCount} entries with isListed: false`);
        } else {
            console.log('✅ No invalid entries found');
        }

    } catch (error) {
        console.error('❌ Error setting up validation:', error);
        process.exit(1);
    }

    await client.close();
    console.log('\n✅ Setup complete!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});

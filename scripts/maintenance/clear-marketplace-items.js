/**
 * Clear old marketplace items from MongoDB
 * Run with: node scripts/maintenance/clear-marketplace-items.js
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'Ideationmarket_v2';

async function clearMarketplaceItems() {
    console.log('🧹 Clearing old marketplace items...');
    console.log('');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(MONGODB_DB);
        const collection = db.collection('marketplace_items');

        // Count current items
        const countBefore = await collection.countDocuments();
        console.log(`📊 Current items: ${countBefore}`);

        if (countBefore === 0) {
            console.log('✅ Collection already empty!');
            return;
        }

        // Delete all items
        const result = await collection.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} items`);

        // Verify
        const countAfter = await collection.countDocuments();
        console.log(`📊 Items after cleanup: ${countAfter}`);

        console.log('');
        console.log('✅ Marketplace items cleared successfully!');
        console.log('   Ready for new listings with updated contract.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('');
        console.log('🔌 MongoDB connection closed');
    }
}

clearMarketplaceItems();

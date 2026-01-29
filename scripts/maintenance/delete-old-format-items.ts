/**
 * Fix: Delete old format marketplace items
 * 
 * Deletes items with old schema (missing v2 fields)
 * TheGraph sync will recreate them correctly
 * 
 * Usage: npx tsx scripts/maintenance/delete-old-format-items.ts
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
function loadEnv() {
    const envPath = path.resolve(__dirname, '../../.env.local');
    
    if (!fs.existsSync(envPath)) {
        throw new Error('.env.local not found');
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = envContent.split('\n');
    
    for (const line of envVars) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    }
}

async function deleteOldFormatItems() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Deleting old format marketplace items...\n');

        loadEnv();

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected!\n');

        const db = client.db();
        const marketplaceItems = db.collection('marketplace_items');
        
        // Find old format items (missing v2 fields OR number listingId)
        console.log('🔍 Finding old format items...');
        
        const oldFormatItems = await marketplaceItems.find({
            $or: [
                { listingId: { $type: 'number' } },  // Old v1 format
                { status: { $exists: false } },      // Missing v2 field
                { tokenStandard: { $exists: false } }, // Missing v2 field
                { priceTotal: { $exists: false } },  // Missing v2 field
                { unitPrice: { $exists: false } }    // Missing v2 field
            ]
        }).toArray();
        
        console.log(`   Found ${oldFormatItems.length} old format item(s)\n`);
        
        if (oldFormatItems.length === 0) {
            console.log('✅ No old format items to delete!');
        } else {
            console.log('📋 Items to delete:');
            for (const item of oldFormatItems) {
                console.log(`   - ${item.contractAddress} #${item.tokenId} (listingId: ${item.listingId})`);
            }
            
            console.log('\n🗑️  Deleting...');
            
            const result = await marketplaceItems.deleteMany({
                $or: [
                    { listingId: { $type: 'number' } },
                    { status: { $exists: false } },
                    { tokenStandard: { $exists: false } },
                    { priceTotal: { $exists: false } },
                    { unitPrice: { $exists: false } }
                ]
            });
            
            console.log(`   ✅ Deleted ${result.deletedCount} item(s)`);
            
            console.log('\n💡 Note: TheGraph sync will recreate these items in correct v2 format');
        }

        console.log('\n✅ Cleanup complete!');

    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            console.log('\n📡 Closing MongoDB connection...');
            await client.close();
            console.log('✅ Connection closed');
        }
    }
}

deleteOldFormatItems();

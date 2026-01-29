/**
 * Find and display the problematic marketplace_item
 * 
 * Usage: npx tsx scripts/maintenance/find-broken-item.ts
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

async function findBrokenItem() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔍 Finding broken marketplace_item...\n');

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
        
        // Find item with number listingId (old format)
        const brokenItem = await marketplaceItems.findOne({
            listingId: { $type: 'number' }
        });
        
        if (!brokenItem) {
            console.log('✅ No broken items found!');
        } else {
            console.log('❌ BROKEN ITEM FOUND:\n');
            console.log(JSON.stringify(brokenItem, null, 2));
            console.log('\n');
            
            console.log('📋 Issues detected:');
            console.log(`   - listingId type: ${typeof brokenItem.listingId} (should be string)`);
            console.log(`   - Has priceTotal? ${brokenItem.priceTotal !== undefined}`);
            console.log(`   - Has unitPrice? ${brokenItem.unitPrice !== undefined}`);
            console.log(`   - Has status? ${brokenItem.status !== undefined}`);
            console.log(`   - Has tokenStandard? ${brokenItem.tokenStandard !== undefined}`);
            console.log(`   - Has currency? ${brokenItem.currency !== undefined}`);
            console.log(`   - Has feeRate? ${brokenItem.feeRate !== undefined}`);
            
            console.log('\n🔧 Recommended actions:');
            console.log('   1. Delete this old format item');
            console.log('   2. Let TheGraph sync recreate it in correct format');
            console.log('   OR');
            console.log('   3. Fix the fields to match v2 schema');
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

findBrokenItem();

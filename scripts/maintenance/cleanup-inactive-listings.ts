/**
 * Cleanup: Remove inactive/cancelled listings from marketplace_items
 * 
 * Problem: Listings with active=false and isListed=false stay in DB
 * Solution: Delete all entries where active=false or isListed=false
 * 
 * Usage: npx tsx scripts/maintenance/cleanup-inactive-listings.ts
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

async function cleanupInactive() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Starting inactive listings cleanup...\n');

        // Load environment variables
        loadEnv();

        // Check MongoDB URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected!\n');

        const db = client.db();
        const marketplaceItems = db.collection('marketplace_items');
        
        console.log('🔍 Finding inactive listings...');
        
        // Find all inactive items (active=false OR isListed=false)
        const inactiveItems = await marketplaceItems.find({
            $or: [
                { active: false },
                { isListed: false }
            ]
        }).toArray();
        
        console.log(`   Found ${inactiveItems.length} inactive items`);
        
        if (inactiveItems.length === 0) {
            console.log('   ✅ No inactive items to clean up!');
        } else {
            console.log('\n📋 Items to delete:');
            for (const item of inactiveItems) {
                const contractAddr = String(item.contractAddress || item.nftAddress || '').toLowerCase();
                console.log(`   - ${contractAddr} #${item.tokenId} (listingId: ${item.listingId}, active: ${item.active}, isListed: ${item.isListed})`);
            }
            
            console.log('\n🗑️  Deleting inactive items...');
            const result = await marketplaceItems.deleteMany({
                $or: [
                    { active: false },
                    { isListed: false }
                ]
            });
            
            console.log(`   ✅ Deleted ${result.deletedCount} items`);
        }
        
        // Verify
        console.log('\n🔍 Verifying cleanup...');
        const remaining = await marketplaceItems.find({}).toArray();
        const stillInactive = remaining.filter(item => !item.active || !item.isListed);
        
        console.log(`   Total remaining items: ${remaining.length}`);
        console.log(`   Inactive items: ${stillInactive.length}`);
        
        if (stillInactive.length > 0) {
            console.log('   ⚠️  Still have inactive items!');
            for (const item of stillInactive) {
                console.log(`      - ${item.contractAddress} #${item.tokenId} (active: ${item.active}, isListed: ${item.isListed})`);
            }
        } else {
            console.log('   ✅ All items are active!');
        }

        console.log('\n✅ Cleanup complete!');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        if (client) {
            console.log('\n📡 Closing MongoDB connection...');
            await client.close();
            console.log('✅ Connection closed');
        }
    }
}

cleanupInactive();

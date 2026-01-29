/**
 * Migration: Convert price fields from Number/BSON Long to String
 * 
 * Problem: price, priceTotal, unitPrice stored as Number or BSON Long
 * Solution: Convert all price fields to String (Wei format)
 * 
 * Usage: npx tsx scripts/maintenance/migrate-price-to-string.ts
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

function convertToString(value: any): string {
    if (value === null || value === undefined) {
        return '0';
    }
    
    // BSON Long Object
    if (typeof value === 'object' && 'toString' in value) {
        return String(value);
    }
    
    // Already string
    if (typeof value === 'string') {
        return value;
    }
    
    // Number or BigInt
    return String(value);
}

async function migratePrices() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Starting price migration (Number/BSON Long → String)...\n');

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
        
        // ============================================
        // marketplace_items collection
        // ============================================
        const marketplaceItems = db.collection('marketplace_items');
        
        console.log('📦 Processing marketplace_items...');
        const marketplaceDocs = await marketplaceItems.find({}).toArray();
        console.log(`   Found ${marketplaceDocs.length} documents`);
        
        let marketplaceUpdated = 0;
        for (const doc of marketplaceDocs) {
            const updates: any = {};
            let needsUpdate = false;
            
            // Check price
            if (doc.price !== undefined && typeof doc.price !== 'string') {
                updates.price = convertToString(doc.price);
                needsUpdate = true;
            }
            
            // Check priceTotal
            if (doc.priceTotal !== undefined && typeof doc.priceTotal !== 'string') {
                updates.priceTotal = convertToString(doc.priceTotal);
                needsUpdate = true;
            }
            
            // Check unitPrice
            if (doc.unitPrice !== undefined && typeof doc.unitPrice !== 'string') {
                updates.unitPrice = convertToString(doc.unitPrice);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await marketplaceItems.updateOne(
                    { _id: doc._id },
                    { $set: updates }
                );
                marketplaceUpdated++;
                console.log(`   → Updated listing ${doc.listingId}: ${Object.keys(updates).join(', ')}`);
            }
        }
        console.log(`   ✅ Updated ${marketplaceUpdated} documents\n`);

        console.log('📊 Summary:');
        console.log(`   marketplace_items: ${marketplaceUpdated} converted`);
        console.log(`   Total: ${marketplaceUpdated} documents\n`);

        console.log('✅ Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
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

migratePrices();

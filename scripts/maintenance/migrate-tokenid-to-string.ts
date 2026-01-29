/**
 * Migration: Convert tokenId from Number to String
 * 
 * Problem: marketplace_items had tokenId as Number, nft_metadata has String
 * Solution: Convert all tokenIds to String for consistency
 * 
 * Usage: tsx scripts/maintenance/migrate-tokenid-to-string.ts
 * Note: Make sure MONGODB_URI is set in .env.local
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

async function migrateTokenIds() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Starting tokenId migration (Number → String)...\n');

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
        
        console.log('📦 Checking marketplace_items...');
        const marketplaceDocs = await marketplaceItems.find({}).toArray();
        console.log(`   Found ${marketplaceDocs.length} documents`);
        
        let marketplaceUpdated = 0;
        for (const doc of marketplaceDocs) {
            if (typeof doc.tokenId === 'number') {
                await marketplaceItems.updateOne(
                    { _id: doc._id },
                    { $set: { tokenId: String(doc.tokenId) } }
                );
                marketplaceUpdated++;
            }
        }
        console.log(`   ✅ Updated ${marketplaceUpdated} documents\n`);

        // ============================================
        // nft_metadata collection
        // ============================================
        const nftMetadata = db.collection('nft_metadata');
        
        console.log('📦 Checking nft_metadata...');
        const metadataDocs = await nftMetadata.find({}).toArray();
        console.log(`   Found ${metadataDocs.length} documents`);
        
        let metadataUpdated = 0;
        for (const doc of metadataDocs) {
            if (typeof doc.tokenId === 'number') {
                await nftMetadata.updateOne(
                    { _id: doc._id },
                    { $set: { tokenId: String(doc.tokenId) } }
                );
                metadataUpdated++;
            }
        }
        console.log(`   ✅ Updated ${metadataUpdated} documents\n`);

        // ============================================
        // nft_stats collection
        // ============================================
        const nftStats = db.collection('nft_stats');
        
        console.log('📦 Checking nft_stats...');
        const statsDocs = await nftStats.find({}).toArray();
        console.log(`   Found ${statsDocs.length} documents`);
        
        let statsUpdated = 0;
        for (const doc of statsDocs) {
            if (typeof doc.tokenId === 'number') {
                await nftStats.updateOne(
                    { _id: doc._id },
                    { $set: { tokenId: String(doc.tokenId) } }
                );
                statsUpdated++;
            }
        }
        console.log(`   ✅ Updated ${statsUpdated} documents\n`);

        console.log('📊 Summary:');
        console.log(`   marketplace_items: ${marketplaceUpdated} converted`);
        console.log(`   nft_metadata: ${metadataUpdated} converted`);
        console.log(`   nft_stats: ${statsUpdated} converted`);
        console.log(`   Total: ${marketplaceUpdated + metadataUpdated + statsUpdated} documents\n`);

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

migrateTokenIds();

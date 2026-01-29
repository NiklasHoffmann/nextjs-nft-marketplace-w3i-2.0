/**
 * Cleanup: Remove duplicate marketplace_items entries
 * 
 * Problem: Same NFT (contractAddress + tokenId) appears multiple times
 *          - One with active=false (old listing - cancelled/sold)
 *          - One with active=true (current listing)
 * 
 * Solution: Keep only the ACTIVE listing, delete inactive duplicates
 * 
 * Usage: npx tsx scripts/maintenance/cleanup-duplicate-listings.ts
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

async function cleanupDuplicates() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Starting duplicate cleanup...\n');

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
        
        console.log('🔍 Finding duplicates...');
        
        // Find all items grouped by NFT (contractAddress + tokenId)
        const allItems = await marketplaceItems.find({}).toArray();
        console.log(`   Total items: ${allItems.length}`);
        
        // Group by contractAddress (lowercase!) + tokenId
        const groupedByNFT = new Map<string, any[]>();
        
        for (const item of allItems) {
            const contractAddr = String(item.contractAddress || item.nftAddress || '').toLowerCase();
            const key = `${contractAddr}-${item.tokenId}`;
            if (!groupedByNFT.has(key)) {
                groupedByNFT.set(key, []);
            }
            groupedByNFT.get(key)!.push(item);
            
            console.log(`   Item: ${contractAddr} #${item.tokenId} (listingId: ${item.listingId}, active: ${item.active}, isListed: ${item.isListed})`);
        }
        
        console.log(`   Unique NFTs: ${groupedByNFT.size}`);
        
        // Find duplicates (NFTs with more than 1 entry)
        let duplicateCount = 0;
        let deletedCount = 0;
        
        for (const [key, items] of groupedByNFT.entries()) {
            if (items.length > 1) {
                duplicateCount++;
                const [contractAddress, tokenId] = key.split('-');
                
                console.log(`\n📦 Duplicate found: ${contractAddress} #${tokenId}`);
                console.log(`   Total entries: ${items.length}`);
                
                // Sort by priority:
                // 1. active=true AND isListed=true (current listing)
                // 2. Most recent syncedAt
                items.sort((a, b) => {
                    // Priority 1: active AND isListed
                    const aActive = a.active && a.isListed;
                    const bActive = b.active && b.isListed;
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
                    
                    // Priority 2: Most recent sync
                    const aDate = a.syncedAt ? new Date(a.syncedAt).getTime() : 0;
                    const bDate = b.syncedAt ? new Date(b.syncedAt).getTime() : 0;
                    return bDate - aDate;
                });
                
                // Keep the first one (highest priority), delete the rest
                const toKeep = items[0];
                const toDelete = items.slice(1);
                
                console.log(`   ✅ KEEPING:  listingId=${toKeep.listingId}, active=${toKeep.active}, isListed=${toKeep.isListed}`);
                
                for (const item of toDelete) {
                    console.log(`   ❌ DELETING: listingId=${item.listingId}, active=${item.active}, isListed=${item.isListed}`);
                    await marketplaceItems.deleteOne({ _id: item._id });
                    deletedCount++;
                }
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`   Total items before: ${allItems.length}`);
        console.log(`   Unique NFTs: ${groupedByNFT.size}`);
        console.log(`   Duplicates found: ${duplicateCount}`);
        console.log(`   Items deleted: ${deletedCount}`);
        console.log(`   Items remaining: ${allItems.length - deletedCount}`);
        
        // Verify no more duplicates
        console.log('\n🔍 Verifying cleanup...');
        const remainingItems = await marketplaceItems.find({}).toArray();
        const remainingGrouped = new Map<string, number>();
        
        for (const item of remainingItems) {
            const key = `${item.contractAddress?.toLowerCase()}-${item.tokenId}`;
            remainingGrouped.set(key, (remainingGrouped.get(key) || 0) + 1);
        }
        
        const stillDuplicated = Array.from(remainingGrouped.values()).filter(count => count > 1).length;
        
        if (stillDuplicated > 0) {
            console.log(`   ⚠️  Still have ${stillDuplicated} duplicates!`);
        } else {
            console.log('   ✅ No duplicates remaining!');
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

cleanupDuplicates();

/**
 * Migration: Consolidate duplicate nft_metadata entries with ownership history
 * 
 * Problem: Multiple nft_metadata documents for same NFT with different owners
 * Solution: Keep ONE document per NFT, add ownershipHistory array
 * 
 * Process:
 * 1. Find duplicates (same contractAddress + tokenId)
 * 2. Sort by updatedAt/createdAt to determine order
 * 3. Keep newest as current, add older ones to ownershipHistory
 * 4. Delete old documents
 * 
 * Usage: npx tsx scripts/maintenance/migrate-nft-metadata-with-history.ts
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

async function migrateWithHistory() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔄 Starting nft_metadata consolidation with ownership history...\n');

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
        const nftMetadata = db.collection('nft_metadata');
        
        console.log('🔍 Finding duplicate NFTs...');
        
        // Find all documents
        const allDocs = await nftMetadata.find({}).toArray();
        console.log(`   Total documents: ${allDocs.length}`);
        
        // Group by contractAddress (lowercase) + tokenId
        const groupedByNFT = new Map<string, any[]>();
        
        for (const doc of allDocs) {
            const contractAddr = String(doc.contractAddress || '').toLowerCase();
            const key = `${contractAddr}-${doc.tokenId}`;
            if (!groupedByNFT.has(key)) {
                groupedByNFT.set(key, []);
            }
            groupedByNFT.get(key)!.push(doc);
        }
        
        console.log(`   Unique NFTs: ${groupedByNFT.size}`);
        
        // Find duplicates
        const duplicates = Array.from(groupedByNFT.entries()).filter(([_, docs]) => docs.length > 1);
        console.log(`   Duplicates found: ${duplicates.length}\n`);
        
        if (duplicates.length === 0) {
            console.log('✅ No duplicates to consolidate!');
        } else {
            let consolidated = 0;
            let historyEntriesAdded = 0;
            let documentsDeleted = 0;
            
            for (const [key, docs] of duplicates) {
                const [contractAddress, tokenId] = key.split('-');
                console.log(`📦 NFT: ${contractAddress} #${tokenId} (${docs.length} documents)`);
                
                // Sort by newest first (prefer documents with blockchain.owner)
                docs.sort((a, b) => {
                    // Priority 1: Has blockchain.owner
                    if (a.blockchain?.owner && !b.blockchain?.owner) return -1;
                    if (!a.blockchain?.owner && b.blockchain?.owner) return 1;
                    
                    // Priority 2: Most recent updatedAt/createdAt
                    const aDate = a.updatedAt || a.blockchain?.lastSyncedAt || a.createdAt;
                    const bDate = b.updatedAt || b.blockchain?.lastSyncedAt || b.createdAt;
                    
                    if (!aDate && !bDate) return 0;
                    if (!aDate) return 1;
                    if (!bDate) return -1;
                    
                    return new Date(bDate).getTime() - new Date(aDate).getTime();
                });
                
                // Keep the first (newest/best) document
                const keeper = docs[0];
                const toMerge = docs.slice(1);
                
                console.log(`   ✅ KEEPING: owner=${keeper.blockchain?.owner || keeper.contract?.owner || 'unknown'}`);
                
                // Build ownership history from older documents
                const ownershipHistory: any[] = keeper.ownershipHistory || [];
                
                for (const oldDoc of toMerge) {
                    const oldOwner = oldDoc.blockchain?.owner || oldDoc.contract?.owner;
                    
                    if (oldOwner) {
                        const historyEntry = {
                            owner: oldOwner.toLowerCase(),
                            from: oldDoc.createdAt || new Date(),
                            to: oldDoc.updatedAt || oldDoc.blockchain?.lastSyncedAt || new Date(),
                            detectedAt: new Date(),
                            source: 'migration' // Mark as migrated data
                        };
                        
                        ownershipHistory.push(historyEntry);
                        historyEntriesAdded++;
                        
                        console.log(`   📜 HISTORY: owner=${oldOwner} (${historyEntry.from} → ${historyEntry.to})`);
                    }
                    
                    console.log(`   ❌ DELETING: owner=${oldOwner || 'unknown'}, id=${oldDoc._id}`);
                }
                
                // Update keeper with consolidated history
                await nftMetadata.updateOne(
                    { _id: keeper._id },
                    {
                        $set: {
                            ownershipHistory: ownershipHistory,
                            updatedAt: new Date()
                        }
                    }
                );
                
                // Delete old documents
                const idsToDelete = toMerge.map(doc => doc._id);
                await nftMetadata.deleteMany({ _id: { $in: idsToDelete } });
                documentsDeleted += idsToDelete.length;
                
                consolidated++;
                console.log('');
            }
            
            console.log('📊 Summary:');
            console.log(`   NFTs consolidated: ${consolidated}`);
            console.log(`   Ownership history entries added: ${historyEntriesAdded}`);
            console.log(`   Documents deleted: ${documentsDeleted}`);
            console.log(`   Remaining documents: ${allDocs.length - documentsDeleted}\n`);
        }
        
        // Verify no more duplicates
        console.log('🔍 Verifying...');
        const remainingDocs = await nftMetadata.find({}).toArray();
        const remainingGrouped = new Map<string, number>();
        
        for (const doc of remainingDocs) {
            const contractAddr = String(doc.contractAddress || '').toLowerCase();
            const key = `${contractAddr}-${doc.tokenId}`;
            remainingGrouped.set(key, (remainingGrouped.get(key) || 0) + 1);
        }
        
        const stillDuplicated = Array.from(remainingGrouped.values()).filter(count => count > 1).length;
        
        if (stillDuplicated > 0) {
            console.log(`   ⚠️  Still have ${stillDuplicated} duplicates!`);
        } else {
            console.log('   ✅ No duplicates remaining!');
        }

        console.log('\n✅ Migration complete!');

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

migrateWithHistory();

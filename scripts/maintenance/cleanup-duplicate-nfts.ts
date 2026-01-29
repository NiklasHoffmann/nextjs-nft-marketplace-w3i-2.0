/**
 * MongoDB Cleanup Script
 * 
 * Removes duplicate entries from nft_metadata collection
 * Keeps the most recent entry for each (contractAddress, tokenId) pair
 * 
 * Run with: node --loader ts-node/esm scripts/maintenance/cleanup-duplicate-nfts.ts
 */

import { getDatabase } from '../../src/lib/mongodb';

async function cleanupDuplicateNFTs() {
    try {
        console.log('🧹 [Cleanup] Starting duplicate NFT removal...\n');

        const db = await getDatabase();
        const collection = db.collection('nft_metadata');

        // Find all documents
        const allDocs = await collection.find({}).toArray();
        console.log(`📊 Total documents in nft_metadata: ${allDocs.length}`);

        // Group by contractAddress + tokenId
        const grouped = new Map<string, any[]>();

        for (const doc of allDocs) {
            const key = `${doc.contractAddress}:${doc.tokenId}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(doc);
        }

        console.log(`📊 Unique NFTs: ${grouped.size}`);

        // Find duplicates
        let duplicateCount = 0;
        let deletedCount = 0;

        for (const [key, docs] of grouped.entries()) {
            if (docs.length > 1) {
                duplicateCount++;
                console.log(`\n🔍 Found ${docs.length} duplicates for ${key}:`);

                // Sort by updatedAt (keep most recent)
                docs.sort((a, b) => {
                    const aTime = a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
                    const bTime = b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
                    return bTime - aTime; // Descending (newest first)
                });

                // Keep first (most recent), delete others
                const toKeep = docs[0];
                const toDelete = docs.slice(1);

                console.log(`  ✅ Keeping: ${toKeep._id} (updated: ${toKeep.updatedAt || toKeep.createdAt})`);

                for (const doc of toDelete) {
                    console.log(`  ❌ Deleting: ${doc._id} (updated: ${doc.updatedAt || doc.createdAt})`);
                    await collection.deleteOne({ _id: doc._id });
                    deletedCount++;
                }
            }
        }

        console.log('\n📊 Summary:');
        console.log(`  Total documents: ${allDocs.length}`);
        console.log(`  Unique NFTs: ${grouped.size}`);
        console.log(`  Duplicate sets: ${duplicateCount}`);
        console.log(`  Documents deleted: ${deletedCount}`);
        console.log(`  Documents remaining: ${allDocs.length - deletedCount}`);

        console.log('\n✅ Cleanup completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDuplicateNFTs();

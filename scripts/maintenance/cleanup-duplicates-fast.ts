/**
 * MongoDB Cleanup - Remove Duplicates using MongoDB Aggregation
 * 
 * Fast cleanup using MongoDB's aggregation pipeline
 */

import { getDatabase } from '../../src/lib/mongodb';

async function cleanupDuplicates() {
    try {
        console.log('🧹 Starting duplicate cleanup...\n');

        const db = await getDatabase();
        const collection = db.collection('nft_metadata');

        // Count before cleanup
        const totalBefore = await collection.countDocuments();
        console.log(`📊 Documents before cleanup: ${totalBefore}`);

        // Find duplicates using aggregation
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: {
                        contractAddress: '$contractAddress',
                        tokenId: '$tokenId'
                    },
                    ids: { $push: '$_id' },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();

        console.log(`🔍 Found ${duplicates.length} duplicate sets\n`);

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found!');
            process.exit(0);
        }

        let deletedTotal = 0;

        for (const dup of duplicates) {
            const contract = dup._id.contractAddress;
            const token = dup._id.tokenId;
            const ids = dup.ids;

            console.log(`NFT: ${contract}/${token} - ${ids.length} duplicates`);

            // Get all documents for this NFT
            const docs = await collection.find({
                _id: { $in: ids }
            }).toArray();

            // Sort by updatedAt/createdAt (keep newest)
            docs.sort((a, b) => {
                const aTime = a.updatedAt?.getTime?.() || a.createdAt?.getTime?.() || 0;
                const bTime = b.updatedAt?.getTime?.() || b.createdAt?.getTime?.() || 0;
                return bTime - aTime;
            });

            // Keep first, delete rest
            const toKeep = docs[0];
            const toDelete = docs.slice(1);

            console.log(`  ✅ Keeping: ${toKeep._id}`);

            for (const doc of toDelete) {
                await collection.deleteOne({ _id: doc._id });
                console.log(`  ❌ Deleted: ${doc._id}`);
                deletedTotal++;
            }

            console.log('');
        }

        // Count after cleanup
        const totalAfter = await collection.countDocuments();

        console.log('📊 Summary:');
        console.log(`  Before: ${totalBefore} documents`);
        console.log(`  Deleted: ${deletedTotal} documents`);
        console.log(`  After: ${totalAfter} documents`);
        console.log(`  Duplicate sets fixed: ${duplicates.length}\n`);

        console.log('✅ Cleanup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDuplicates();

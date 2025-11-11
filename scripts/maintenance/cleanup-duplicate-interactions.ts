/**
 * Cleanup Script: Remove Duplicate User Interactions
 * 
 * Finds and removes duplicate entries in:
 * - user_favorites (wallet + contractAddress + tokenId)
 * - user_watchlist (wallet + contractAddress + tokenId)
 * - user_ratings (wallet + contractAddress + tokenId)
 * 
 * Keeps only the LATEST entry (by createdAt or _id) for each unique combination.
 * 
 * Usage:
 *   npm run cleanup:duplicates          # Dry run (shows what would be deleted)
 *   npm run cleanup:duplicates -- --execute  # Actually delete duplicates
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'Ideationmarket_v2';  // Deine Atlas DB

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('💡 Make sure .env.local exists with MONGODB_URI');
    process.exit(1);
}

interface DuplicateGroup {
    wallet: string;
    contractAddress: string;
    tokenId: string;
    count: number;
    ids: ObjectId[];
    dates: Date[];
}

async function findDuplicates(
    collectionName: string,
    client: MongoClient
): Promise<DuplicateGroup[]> {
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(collectionName);

    console.log(`\n🔍 Analyzing ${collectionName}...`);

    // Group by wallet + contractAddress + tokenId and find duplicates
    const pipeline = [
        {
            $group: {
                _id: {
                    wallet: '$wallet',
                    contractAddress: '$contractAddress',
                    tokenId: '$tokenId'
                },
                count: { $sum: 1 },
                ids: { $push: '$_id' },
                dates: { $push: '$createdAt' }
            }
        },
        {
            $match: {
                count: { $gt: 1 }  // Only groups with duplicates
            }
        }
    ];

    const duplicates = await collection.aggregate(pipeline).toArray();

    return duplicates.map(dup => ({
        wallet: dup._id.wallet,
        contractAddress: dup._id.contractAddress,
        tokenId: dup._id.tokenId,
        count: dup.count,
        ids: dup.ids,
        dates: dup.dates
    }));
}

async function cleanupDuplicates(
    collectionName: string,
    duplicates: DuplicateGroup[],
    client: MongoClient,
    dryRun: boolean
): Promise<number> {
    if (duplicates.length === 0) {
        console.log(`✅ No duplicates found in ${collectionName}`);
        return 0;
    }

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(collectionName);
    
    let totalDeleted = 0;

    for (const group of duplicates) {
        // Fetch all documents for this group to determine which to keep
        const docs = await collection.find({
            wallet: group.wallet,
            contractAddress: group.contractAddress,
            tokenId: group.tokenId
        }).toArray();

        // Sort by createdAt DESC (newest first), or by _id DESC if no createdAt
        docs.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a._id.getTimestamp().getTime();
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b._id.getTimestamp().getTime();
            return dateB - dateA;  // Newest first
        });

        // Keep the first (newest), delete the rest
        const [keepDoc, ...deleteDoc] = docs;
        
        if (!keepDoc) {
            console.warn(`⚠️  No documents found for group, skipping...`);
            continue;
        }
        
        const idsToDelete = deleteDoc.map(d => d._id);

        console.log(`\n📋 Duplicate Group in ${collectionName}:`);
        console.log(`   Wallet: ${group.wallet}`);
        console.log(`   NFT: ${group.contractAddress}/${group.tokenId}`);
        console.log(`   Total entries: ${docs.length}`);
        console.log(`   ✅ KEEP: ${keepDoc._id} (${keepDoc.createdAt || keepDoc._id.getTimestamp()})`);
        
        for (const doc of deleteDoc) {
            console.log(`   ❌ DELETE: ${doc._id} (${doc.createdAt || doc._id.getTimestamp()})`);
        }

        if (!dryRun) {
            const result = await collection.deleteMany({
                _id: { $in: idsToDelete }
            });
            totalDeleted += result.deletedCount;
            console.log(`   🗑️  Deleted ${result.deletedCount} duplicate(s)`);
        } else {
            totalDeleted += idsToDelete.length;
            console.log(`   🔍 DRY RUN: Would delete ${idsToDelete.length} duplicate(s)`);
        }
    }

    return totalDeleted;
}

async function recalculateStats(
    client: MongoClient,
    affectedNFTs: Set<string>,
    dryRun: boolean
): Promise<void> {
    if (affectedNFTs.size === 0) return;

    console.log(`\n📊 Recalculating stats for ${affectedNFTs.size} affected NFTs...`);

    const db = client.db(DATABASE_NAME);
    const favoritesCollection = db.collection('user_favorites');
    const watchlistCollection = db.collection('user_watchlist');
    const ratingsCollection = db.collection('user_ratings');
    const statsCollection = db.collection('nft_stats');

    for (const nftKey of affectedNFTs) {
        const [contractAddress, tokenId] = nftKey.split('::');

        // Count actual entries after cleanup
        const favoriteCount = await favoritesCollection.countDocuments({
            contractAddress,
            tokenId
        });

        const watchlistCount = await watchlistCollection.countDocuments({
            contractAddress,
            tokenId
        });

        const ratings = await ratingsCollection.find({
            contractAddress,
            tokenId
        }).toArray();

        const ratingCount = ratings.length;
        const averageRating = ratingCount > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
            : 0;

        console.log(`   📝 ${contractAddress}/${tokenId}:`);
        console.log(`      Favorites: ${favoriteCount}, Watchlist: ${watchlistCount}, Ratings: ${ratingCount} (avg: ${averageRating.toFixed(2)})`);

        if (!dryRun) {
            await statsCollection.updateOne(
                { contractAddress, tokenId },
                {
                    $set: {
                        favoriteCount,
                        watchlistCount,
                        ratingCount,
                        averageRating,
                        lastUpdated: new Date()
                    }
                },
                { upsert: true }
            );
        }
    }

    if (dryRun) {
        console.log(`   🔍 DRY RUN: Stats recalculation skipped`);
    } else {
        console.log(`   ✅ Stats recalculated for ${affectedNFTs.size} NFTs`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   🧹 User Interactions Duplicate Cleanup Script           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log();
    
    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made');
        console.log('   Run with --execute flag to actually delete duplicates\n');
    } else {
        console.log('🚨 EXECUTE MODE - Duplicates WILL be deleted!\n');
    }

    const client = new MongoClient(MONGODB_URI!);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const collections = ['user_favorites', 'user_watchlist', 'user_ratings'];
        let totalDuplicatesRemoved = 0;
        const affectedNFTs = new Set<string>();

        for (const collectionName of collections) {
            const duplicates = await findDuplicates(collectionName, client);
            
            // Track affected NFTs for stats recalculation
            for (const dup of duplicates) {
                affectedNFTs.add(`${dup.contractAddress}::${dup.tokenId}`);
            }

            const deleted = await cleanupDuplicates(collectionName, duplicates, client, dryRun);
            totalDuplicatesRemoved += deleted;
        }

        // Recalculate stats for affected NFTs
        if (affectedNFTs.size > 0) {
            await recalculateStats(client, affectedNFTs, dryRun);
        }

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   📊 Summary                                              ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`Total duplicates ${dryRun ? 'found' : 'removed'}: ${totalDuplicatesRemoved}`);
        console.log(`Affected NFTs: ${affectedNFTs.size}`);
        
        if (dryRun) {
            console.log('\n💡 Run with --execute flag to actually delete duplicates');
        } else {
            console.log('\n✅ Cleanup completed successfully!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

main();

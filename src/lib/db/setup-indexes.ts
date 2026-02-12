/**
 * MongoDB Index Setup
 * 
 * Creates all necessary indexes for optimal performance and data integrity
 * Run on server startup
 */

import { getDatabase } from '@/lib/mongodb';
import { devLog } from '@/utils';

export async function setupMongoDBIndexes() {
    try {
        devLog.info('🔧 [MongoDB] Setting up indexes...');
        const db = await getDatabase();

        // ============================================
        // nft_metadata collection
        // ============================================
        const nftMetadata = db.collection('nft_metadata');

        // CRITICAL: Unique compound index to prevent duplicate NFTs
        await nftMetadata.createIndex(
            { contractAddress: 1, tokenId: 1 },
            { 
                unique: true, 
                name: 'unique_nft',
                background: true 
            }
        );
        devLog.info('  ✅ nft_metadata: unique_nft index');

        // Query indexes
        await nftMetadata.createIndex(
            { 'blockchain.owner': 1 },
            { name: 'owner_lookup', background: true }
        );
        devLog.info('  ✅ nft_metadata: owner_lookup index');

        await nftMetadata.createIndex(
            { isListed: 1 },
            { name: 'is_listed', background: true }
        );
        devLog.info('  ✅ nft_metadata: is_listed index');

        await nftMetadata.createIndex(
            { 'blockchain.lastSyncedAt': 1 },
            { name: 'last_synced', background: true }
        );
        devLog.info('  ✅ nft_metadata: last_synced index');

        // ============================================
        // marketplace_items collection
        // ============================================
        const marketplaceItems = db.collection('marketplace_items');

        // Unique compound index for listings
        await marketplaceItems.createIndex(
            { contractAddress: 1, tokenId: 1, listingId: 1 },
            { 
                unique: true, 
                name: 'unique_listing',
                background: true 
            }
        );
        devLog.info('  ✅ marketplace_items: unique_listing index');

        // Query indexes
        await marketplaceItems.createIndex(
            { isListed: 1, active: 1 },
            { name: 'active_listings', background: true }
        );
        devLog.info('  ✅ marketplace_items: active_listings index');

        await marketplaceItems.createIndex(
            { seller: 1 },
            { name: 'seller_lookup', background: true }
        );
        devLog.info('  ✅ marketplace_items: seller_lookup index');

        await marketplaceItems.createIndex(
            { chainId: 1 },
            { name: 'chain_id', background: true }
        );
        devLog.info('  ✅ marketplace_items: chain_id index');

        // ============================================
        // nft_stats collection
        // ============================================
        const nftStats = db.collection('nft_stats');

        // Unique compound index for stats
        await nftStats.createIndex(
            { contractAddress: 1, tokenId: 1 },
            { 
                unique: true, 
                name: 'unique_nft_stats',
                background: true 
            }
        );
        devLog.info('  ✅ nft_stats: unique_nft_stats index');

        // Sorting indexes
        await nftStats.createIndex(
            { viewCount: -1 },
            { name: 'view_count_desc', background: true }
        );
        devLog.info('  ✅ nft_stats: view_count_desc index');

        await nftStats.createIndex(
            { likeCount: -1 },
            { name: 'like_count_desc', background: true }
        );
        devLog.info('  ✅ nft_stats: like_count_desc index');

        await nftStats.createIndex(
            { averageRating: -1 },
            { name: 'rating_desc', background: true }
        );
        devLog.info('  ✅ nft_stats: rating_desc index');

        // ============================================
        // admin_nft_insights collection
        // ============================================
        const insights = db.collection('admin_nft_insights');

        // Index for collection-wide and item-specific lookups
        await insights.createIndex(
            { contractAddress: 1, tokenId: 1 },
            { name: 'insights_lookup', background: true }
        );
        devLog.info('  ✅ admin_nft_insights: insights_lookup index');

        await insights.createIndex(
            { category: 1 },
            { name: 'category_filter', background: true }
        );
        devLog.info('  ✅ admin_nft_insights: category_filter index');

        await insights.createIndex(
            { rarity: 1 },
            { name: 'rarity_filter', background: true }
        );
        devLog.info('  ✅ admin_nft_insights: rarity_filter index');

        devLog.info('✅ [MongoDB] All indexes created successfully');

    } catch (error: any) {
        // Index already exists errors are OK
        if (error.code === 85 || error.message?.includes('already exists')) {
            devLog.info('  ℹ️  Some indexes already exist (this is OK)');
        } else {
            devLog.error('❌ [MongoDB] Index creation failed:', error);
            throw error;
        }
    }
}

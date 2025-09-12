/**
 * MongoDB Index Setup Script
 * Run this script to create optimized indexes for better query performance
 * 
 * Usage: npx tsx src/scripts/setup-indexes.ts
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nft-marketplace';

async function setupIndexes() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db();
        
        // NFT Insights Collection Indexes
        const nftInsightsCollection = db.collection('nft_insights');
        
        // 1. Compound index for primary queries (contractAddress + tokenId)
        await nftInsightsCollection.createIndex(
            { contractAddress: 1, tokenId: 1 },
            { unique: true, name: 'contract_token_unique' }
        );
        
        // 2. Index for filtering by category
        await nftInsightsCollection.createIndex(
            { category: 1, updatedAt: -1 },
            { name: 'category_updated' }
        );
        
        // 3. Index for user-specific queries
        await nftInsightsCollection.createIndex(
            { createdBy: 1, updatedAt: -1 },
            { name: 'creator_updated' }
        );
        
        // 4. Index for favorites and watchlist
        await nftInsightsCollection.createIndex(
            { isFavorite: 1, updatedAt: -1 },
            { name: 'favorite_updated', sparse: true }
        );
        
        await nftInsightsCollection.createIndex(
            { isWatchlisted: 1, updatedAt: -1 },
            { name: 'watchlisted_updated', sparse: true }
        );
        
        // 5. Index for tags (array field)
        await nftInsightsCollection.createIndex(
            { tags: 1 },
            { name: 'tags_index' }
        );
        
        // 6. Text search index for full-text search
        await nftInsightsCollection.createIndex(
            {
                title: 'text',
                description: 'text',
                customName: 'text',
                category: 'text'
            },
            { name: 'text_search' }
        );
        
        // 7. Time-based queries
        await nftInsightsCollection.createIndex(
            { createdAt: -1 },
            { name: 'created_desc' }
        );
        
        await nftInsightsCollection.createIndex(
            { updatedAt: -1 },
            { name: 'updated_desc' }
        );
        
        // 8. Performance tracking index
        await nftInsightsCollection.createIndex(
            { viewCount: -1 },
            { name: 'view_count_desc', sparse: true }
        );
        
        console.log('✅ NFT Insights indexes created successfully');
        
        // Collection Insights Collection Indexes
        const collectionInsightsCollection = db.collection('collection_insights');
        
        await collectionInsightsCollection.createIndex(
            { contractAddress: 1 },
            { unique: true, name: 'contract_unique' }
        );
        
        await collectionInsightsCollection.createIndex(
            { updatedAt: -1 },
            { name: 'updated_desc' }
        );
        
        await collectionInsightsCollection.createIndex(
            { floorPrice: 1 },
            { name: 'floor_price', sparse: true }
        );
        
        console.log('✅ Collection Insights indexes created successfully');
        
        // Performance Metrics Collection (if you add performance tracking)
        const performanceCollection = db.collection('performance_metrics');
        
        await performanceCollection.createIndex(
            { timestamp: -1 },
            { expireAfterSeconds: 60 * 60 * 24 * 7, name: 'timestamp_ttl' } // 7 days TTL
        );
        
        await performanceCollection.createIndex(
            { name: 1, timestamp: -1 },
            { name: 'metric_timestamp' }
        );
        
        console.log('✅ Performance Metrics indexes created successfully');
        
        // Create compound indexes for common query patterns
        const commonQueries: Array<Record<string, 1 | -1>> = [
            // Query by contract and category with sorting
            { contractAddress: 1, category: 1, updatedAt: -1 },
            // Query by user with filtering
            { createdBy: 1, isFavorite: 1, updatedAt: -1 },
            // Query for marketplace integration
            { isForSale: 1, category: 1, updatedAt: -1 }
        ];
        
        for (const [index, indexDef] of commonQueries.entries()) {
            await nftInsightsCollection.createIndex(
                indexDef as any,
                { name: `compound_query_${index + 1}` }
            );
        }
        
        console.log('✅ Compound indexes created successfully');
        
        // Print index statistics
        const indexes = await nftInsightsCollection.listIndexes().toArray();
        console.log('\n📊 Current indexes on nft_insights collection:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Get collection stats
        const stats = await db.command({ collStats: 'nft_insights' });
        console.log(`\n📈 Collection stats:`);
        console.log(`  - Documents: ${stats.count}`);
        console.log(`  - Size: ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
        console.log(`  - Indexes: ${stats.nindexes}`);
        console.log(`  - Index size: ${Math.round(stats.totalIndexSize / 1024 / 1024 * 100) / 100} MB`);
        
    } catch (error) {
        console.error('❌ Error setting up indexes:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n✅ Database connection closed');
    }
}

// Run the setup
if (require.main === module) {
    setupIndexes().catch(console.error);
}

export { setupIndexes };
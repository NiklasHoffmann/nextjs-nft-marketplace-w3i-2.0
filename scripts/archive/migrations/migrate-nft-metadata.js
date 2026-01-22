/**
 * NFT Metadata Migration Script
 *
 * Migrates existing marketplace_items data to the new nft_metadata collection.
 * This enables instant wallet loading and separates NFT data from marketplace listings.
 *
 * Usage: node scripts/migrate-nft-metadata.js
 */

require('dotenv/config');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { MongoClient } = require('mongodb');

async function migrateNFTMetadata() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(process.env.MONGODB_DB || 'Ideationmarket_v2');

        // Get collections
        const marketplaceCollection = db.collection('marketplace_items');
        const metadataCollection = db.collection('nft_metadata');

        // Count existing marketplace items
        const totalMarketplaceItems = await marketplaceCollection.countDocuments();
        console.log(`📊 Found ${totalMarketplaceItems} marketplace items to migrate`);

        if (totalMarketplaceItems === 0) {
            console.log('⚠️  No marketplace items found. Nothing to migrate.');
            return;
        }

        // Check if indexes already exist (skip index creation to avoid conflicts)
        console.log('🔧 Checking NFT metadata indexes...');
        const existingIndexes = await metadataCollection.listIndexes().toArray();
        const hasUniqueIndex = existingIndexes.some(idx =>
            idx.key.contractAddress === 1 && idx.key.tokenId === 1
        );
        const hasOwnerIndex = existingIndexes.some(idx =>
            idx.key.currentOwner === 1
        );

        if (hasUniqueIndex && hasOwnerIndex) {
            console.log('✅ All required indexes exist');
        } else {
            console.log('⚠️  Some indexes missing - this may affect performance');
        }

        // Get all marketplace items
        const marketplaceItems = await marketplaceCollection.find({}).toArray();
        console.log(`📦 Loaded ${marketplaceItems.length} items from database`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;
        const startTime = Date.now();

        // Process each item
        for (let i = 0; i < marketplaceItems.length; i++) {
            const item = marketplaceItems[i];
            const progress = `[${i + 1}/${marketplaceItems.length}]`;

            if (!item || !item.contractAddress || !item.tokenId) {
                console.log(`${progress} Skipping invalid item`);
                continue;
            }

            try {
                console.log(`${progress} Processing ${item.contractAddress}#${item.tokenId}...`);

                // Check if NFT already exists
                const existing = await metadataCollection.findOne({
                    contractAddress: item.contractAddress.toLowerCase(),
                    tokenId: item.tokenId.toString()
                });

                if (existing) {
                    console.log(`  ⏭️  Already exists - skipping`);
                    skipped++;
                    continue;
                }

                // Create NFT metadata document
                const nftMetadata = {
                    contractAddress: item.contractAddress.toLowerCase(),
                    tokenId: item.tokenId.toString(),
                    metadata: {
                        name: item.metadata?.name || item.name || null,
                        description: item.metadata?.description || null,
                        image: item.metadata?.image || item.image || null,
                        animationUrl: item.metadata?.animation_url || null,
                        externalUrl: item.metadata?.external_url || null,
                        attributes: item.metadata?.attributes || []
                    },
                    contract: {
                        name: item.contract?.name || item.contractName || null,
                        symbol: item.contract?.symbol || item.contractSymbol || null,
                        totalSupply: item.contract?.totalSupply || null,
                        contractType: item.contract?.contractType || 'ERC721',
                        tokenURI: item.contract?.tokenURI || null,
                        owner: item.contract?.owner || null,
                        ownerBalance: item.contract?.ownerBalance || null,
                        approved: item.contract?.approved || null
                    },
                    currentOwner: item.seller?.toLowerCase() || null,
                    ownerHistory: item.seller ? [{
                        owner: item.seller.toLowerCase(),
                        acquiredAt: item.createdAt || new Date().toISOString(),
                        source: 'unknown'
                    }] : [],
                    lastVerified: new Date().toISOString(),
                    lastMetadataUpdate: item.updatedAt || new Date().toISOString(),
                    firstSeen: item.createdAt || new Date().toISOString(),
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Insert to nft_metadata collection
                await metadataCollection.insertOne(nftMetadata);

                console.log(`  ✅ Migrated successfully`);
                migrated++;

            } catch (error) {
                console.error(`  ❌ Error migrating ${item.nftAddress}#${item.tokenId}:`, error.message || error);
                errors++;
            }
        }

        const duration = Date.now() - startTime;
        const finalCount = await metadataCollection.countDocuments();

        console.log(`\n✅ Migration completed in ${duration}ms`);
        console.log(`📊 Results:`);
        console.log(`   - Total marketplace items: ${totalMarketplaceItems}`);
        console.log(`   - Successfully migrated: ${migrated}`);
        console.log(`   - Skipped (already exist): ${skipped}`);
        console.log(`   - Errors: ${errors}`);
        console.log(`   - Final nft_metadata count: ${finalCount}`);

        if (finalCount > 0) {
            console.log('\n🎉 Migration successful! Wallet NFTs should now load instantly from database.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Run the migration
if (require.main === module) {
    migrateNFTMetadata().catch(console.error);
}

module.exports = { migrateNFTMetadata };
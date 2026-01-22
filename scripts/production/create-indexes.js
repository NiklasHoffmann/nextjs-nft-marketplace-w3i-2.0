// MongoDB Indexes erstellen
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function createIndexes() {
    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('🔌 Verbinde mit MongoDB...');
        await client.connect();

        const db = client.db();
        const collection = db.collection('enriched_nfts');

        console.log('📑 Erstelle Indexes...\n');

        // 1. Text Index für Full-Text Search
        console.log('  1️⃣  Text Index (name, description, tags, customTitle)...');
        await collection.createIndex(
            {
                'metadata.name': 'text',
                'metadata.description': 'text',
                'insights.tags': 'text',
                'insights.customTitle': 'text'
            },
            { name: 'metadata_text_index' }
        );
        console.log('     ✅ Erstellt');

        // 2. Compound Index für NFT Lookups (mit listingId!)
        console.log('  2️⃣  Compound Index (nftAddress + tokenId + listingId)...');
        await collection.createIndex(
            { nftAddress: 1, tokenId: 1, listingId: 1 },
            { unique: true, name: 'nft_listing_unique_index' }
        );
        console.log('     ✅ Erstellt');

        // 3. Marketplace Filters
        console.log('  3️⃣  Marketplace Filter Indexes...');
        await collection.createIndex({ 'marketplace.isListed': 1 }, { name: 'listed_index' });
        await collection.createIndex({ 'marketplace.price': 1 }, { name: 'price_index' });
        await collection.createIndex({ 'marketplace.seller': 1 }, { name: 'seller_index' });
        console.log('     ✅ Erstellt');

        // 4. Stats Indexes
        console.log('  4️⃣  Stats Indexes...');
        await collection.createIndex({ 'stats.viewCount': -1 }, { name: 'views_index' });
        await collection.createIndex({ 'stats.likeCount': -1 }, { name: 'likes_index' });
        await collection.createIndex({ 'stats.averageRating': -1 }, { name: 'rating_index' });
        console.log('     ✅ Erstellt');

        // 5. Category & Rarity
        console.log('  5️⃣  Category & Rarity Indexes...');
        await collection.createIndex({ 'insights.category': 1 }, { name: 'category_index' });
        await collection.createIndex({ 'insights.rarity': 1 }, { name: 'rarity_index' });
        console.log('     ✅ Erstellt');

        // Zeige alle Indexes
        console.log('\n📊 Alle Indexes:');
        const indexes = await collection.listIndexes().toArray();
        indexes.forEach((idx, i) => {
            console.log(`   ${i + 1}. ${idx.name}`);
        });

        console.log('\n✅ Alle Indexes erfolgreich erstellt!');

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    } finally {
        await client.close();
        console.log('👋 Verbindung geschlossen');
    }
}

createIndexes();

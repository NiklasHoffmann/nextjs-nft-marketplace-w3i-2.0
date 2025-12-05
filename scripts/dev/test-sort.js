// Test Script: Prüft die Sortierung in MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testSort() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'nft-marketplace');
        const collection = db.collection('marketplace_items');

        console.log('🔍 Test Sortierung\n');

        // Test 1: Ascending (niedrigste zuerst)
        console.log('1️⃣ Aufsteigend (ASC - niedrigste zuerst):');
        const asc = await collection.find({ 'marketplace.isListed': true })
            .sort({ 'marketplace.price': 1 })
            .limit(5)
            .toArray();
        
        asc.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.metadata?.name || 'Unnamed'}: ${item.marketplace?.price} Wei`);
        });

        // Test 2: Descending (höchste zuerst)
        console.log('\n2️⃣ Absteigend (DESC - höchste zuerst):');
        const desc = await collection.find({ 'marketplace.isListed': true })
            .sort({ 'marketplace.price': -1 })
            .limit(5)
            .toArray();
        
        desc.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.metadata?.name || 'Unnamed'}: ${item.marketplace?.price} Wei`);
        });

        console.log('\n✅ Test abgeschlossen');

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    } finally {
        await client.close();
    }
}

testSort().catch(console.error);

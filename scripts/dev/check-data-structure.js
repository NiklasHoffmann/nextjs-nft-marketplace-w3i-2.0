// Check Data Structure: Prüft Price und Approval Status
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDataStructure() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'nft-marketplace');
        const collection = db.collection('marketplace_items');

        console.log('🔍 Datenstruktur-Check\n');

        // Hole ein Beispiel NFT
        const sample = await collection.findOne({ 'marketplace.isListed': true });

        console.log('📝 Beispiel NFT Struktur:\n');
        console.log('NFT Address:', sample.nftAddress);
        console.log('Token ID:', sample.tokenId);
        console.log('\n--- MARKETPLACE ---');
        console.log(JSON.stringify(sample.marketplace, null, 2));
        console.log('\n--- CONTRACT ---');
        console.log(JSON.stringify(sample.contract, null, 2));
        console.log('\n--- DATA QUALITY ---');
        console.log(JSON.stringify(sample.dataQuality, null, 2));

        // Prüfe Price Format
        console.log('\n\n📊 Price Format Check:');
        const items = await collection.find({ 'marketplace.isListed': true }).limit(5).toArray();
        items.forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.metadata?.name || 'Unnamed'}`);
            console.log(`   marketplace.price: ${item.marketplace?.price} (${typeof item.marketplace?.price})`);
            console.log(`   contract.approvedAddress: ${item.contract?.approvedAddress}`);
            console.log(`   contract.owner: ${item.contract?.owner}`);
        });

        // Prüfe Approval Status
        console.log('\n\n🔐 Approval Status Check:');
        const withApproval = await collection.countDocuments({ 
            'marketplace.isListed': true,
            'contract.approvedAddress': { $ne: null, $ne: '0x0000000000000000000000000000000000000000' }
        });
        const listed = await collection.countDocuments({ 'marketplace.isListed': true });
        console.log(`   NFTs mit Approval: ${withApproval}/${listed}`);

        // Prüfe Price Sortierung
        console.log('\n\n💰 Price Sorting Test:');
        const sortedByPrice = await collection.find({ 'marketplace.isListed': true })
            .sort({ 'marketplace.price': 1 })
            .limit(3)
            .toArray();
        
        console.log('   Niedrigste Preise:');
        sortedByPrice.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.marketplace?.price} Wei (${typeof item.marketplace?.price})`);
        });

        console.log('\n✅ Check abgeschlossen');

    } catch (error) {
        console.error('❌ Fehler:', error.message);
    } finally {
        await client.close();
    }
}

checkDataStructure().catch(console.error);

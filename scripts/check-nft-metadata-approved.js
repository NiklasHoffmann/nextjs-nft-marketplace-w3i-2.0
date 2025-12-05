/**
 * Check if nft_metadata collection has approved field
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'Ideationmarket_v2';

async function checkApprovedField() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('nft_metadata');

        // Check if any documents have contract.approved field
        const docsWithApproved = await collection.find({
            'contract.approved': { $exists: true }
        }).limit(5).toArray();

        console.log('\n📊 Documents with contract.approved field:');
        console.log(`Found: ${docsWithApproved.length} documents\n`);

        if (docsWithApproved.length > 0) {
            console.log('Sample document:');
            console.log(JSON.stringify(docsWithApproved[0], null, 2));
        } else {
            console.log('❌ No documents found with contract.approved field!');
            console.log('\n🔍 Checking sample document structure:');
            const sample = await collection.findOne({});
            if (sample) {
                console.log('Contract fields:', Object.keys(sample.contract || {}));
                console.log('\nFull contract object:');
                console.log(JSON.stringify(sample.contract, null, 2));
            }
        }

        // Check for specific NFT from error log
        console.log('\n\n🔍 Checking specific NFT: 0x99576db3f507fd6c1c411699f05262bb6424bc8c / 381');
        const specificNFT = await collection.findOne({
            contractAddress: '0x99576db3f507fd6c1c411699f05262bb6424bc8c',
            tokenId: '381'
        });

        if (specificNFT) {
            console.log('✅ Found NFT in nft_metadata');
            console.log('Contract fields:', Object.keys(specificNFT.contract || {}));
            console.log('Has approved?', !!specificNFT.contract?.approved);
            console.log('Approved value:', specificNFT.contract?.approved);
        } else {
            console.log('❌ NFT not found in nft_metadata collection');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkApprovedField();

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'Ideationmarket_v2';

async function checkApprovedField() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const nftMetadata = db.collection('nft_metadata');

        // Check total documents
        const totalCount = await nftMetadata.countDocuments();
        console.log(`📊 Total nft_metadata documents: ${totalCount}\n`);

        // Check documents with approved field
        const withApproved = await nftMetadata.countDocuments({
            'contract.approved': { $exists: true, $ne: null }
        });
        console.log(`✅ Documents with contract.approved: ${withApproved}`);

        const withoutApproved = await nftMetadata.countDocuments({
            $or: [
                { 'contract.approved': { $exists: false } },
                { 'contract.approved': null }
            ]
        });
        console.log(`❌ Documents without contract.approved: ${withoutApproved}\n`);

        // Find specific NFT (People of History #381)
        const specificNFT = await nftMetadata.findOne({
            contractAddress: '0x99576db3f507fd6c1c411699f05262bb6424bc8c',
            tokenId: '381'
        });

        if (specificNFT) {
            console.log('🔍 NFT #381 found:');
            console.log('   - contractAddress:', specificNFT.contractAddress);
            console.log('   - tokenId:', specificNFT.tokenId);
            console.log('   - contract.approved:', specificNFT.contract?.approved || 'MISSING');
            console.log('   - contract.owner:', specificNFT.contract?.owner || 'MISSING');
            console.log('   - contract.ownerBalance:', specificNFT.contract?.ownerBalance || 'MISSING');
            console.log('\n📄 Full contract object:', JSON.stringify(specificNFT.contract, null, 2));
        } else {
            console.log('❌ NFT #381 not found in nft_metadata collection\n');
        }

        // Show sample document with approved field
        const sampleWithApproved = await nftMetadata.findOne({
            'contract.approved': { $exists: true, $ne: null }
        });

        if (sampleWithApproved) {
            console.log('\n✅ Sample document WITH approved field:');
            console.log('   - contractAddress:', sampleWithApproved.contractAddress);
            console.log('   - tokenId:', sampleWithApproved.tokenId);
            console.log('   - contract.approved:', sampleWithApproved.contract?.approved);
            console.log('   - contract.name:', sampleWithApproved.contract?.name);
        }

        // Show sample document without approved field
        const sampleWithoutApproved = await nftMetadata.findOne({
            $or: [
                { 'contract.approved': { $exists: false } },
                { 'contract.approved': null }
            ]
        });

        if (sampleWithoutApproved) {
            console.log('\n❌ Sample document WITHOUT approved field:');
            console.log('   - contractAddress:', sampleWithoutApproved.contractAddress);
            console.log('   - tokenId:', sampleWithoutApproved.tokenId);
            console.log('   - contract.approved:', sampleWithoutApproved.contract?.approved || 'MISSING');
            console.log('   - contract.name:', sampleWithoutApproved.contract?.name);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n✅ Connection closed');
    }
}

checkApprovedField();

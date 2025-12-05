/**
 * Script to fetch and update approved addresses for all NFTs in nft_metadata collection
 * This will query the blockchain for current approval status
 */

const { MongoClient } = require('mongodb');
const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

// ERC721 ABI for getApproved function
const ERC721_ABI = [
    {
        name: 'getApproved',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }]
    }
];

async function updateApprovedAddresses() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }

    const rpcUrl = process.env.JSON_RPC_URL || process.env.ALCHEMY_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
    if (!rpcUrl) {
        console.error('❌ RPC URL not found in environment variables (tried JSON_RPC_URL, ALCHEMY_URL, NEXT_PUBLIC_SEPOLIA_RPC_URL)');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl)
    });

    try {
        await client.connect();
        console.log('🔌 Connected to MongoDB');

        const db = client.db('Ideationmarket_v2');
        const collection = db.collection('nft_metadata');

        // Get all NFTs
        const nfts = await collection.find({}).toArray();
        console.log(`📊 Found ${nfts.length} NFTs to process`);

        let updated = 0;
        let errors = 0;

        for (let i = 0; i < nfts.length; i++) {
            const nft = nfts[i];
            console.log(`\n[${i + 1}/${nfts.length}] Processing ${nft.contractAddress}/#${nft.tokenId}`);

            try {
                // Get approved address from blockchain
                const approvedAddress = await publicClient.readContract({
                    address: nft.contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'getApproved',
                    args: [BigInt(nft.tokenId)]
                });

                const approvedLower = approvedAddress ? approvedAddress.toLowerCase() : null;
                const isApproved = approvedLower && approvedLower !== '0x0000000000000000000000000000000000000000';

                console.log(`  ✅ Approved: ${isApproved ? approvedLower : 'None'}`);

                // Update in MongoDB
                const updateResult = await collection.updateOne(
                    {
                        contractAddress: nft.contractAddress,
                        tokenId: nft.tokenId
                    },
                    {
                        $set: {
                            'contract.approved': isApproved ? approvedLower : null,
                            'contract.approvedAddress': isApproved ? approvedLower : null,
                            'contract.lastApprovalCheck': new Date()
                        }
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    updated++;
                    console.log(`  📝 Updated in database`);
                }

                // Small delay to avoid rate limits
                if (i % 10 === 0 && i > 0) {
                    console.log(`\n⏸️  Pausing to avoid rate limits...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                console.error(`  ❌ Error: ${error.message}`);
                errors++;
            }
        }

        console.log(`\n✅ Summary:`);
        console.log(`  - Total NFTs: ${nfts.length}`);
        console.log(`  - Updated: ${updated}`);
        console.log(`  - Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
updateApprovedAddresses().catch(console.error);
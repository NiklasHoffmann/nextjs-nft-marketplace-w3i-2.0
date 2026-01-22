const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
});

const ERC721_ABI = [
    {
        "type": "function",
        "name": "ownerOf",
        "inputs": [{ "name": "tokenId", "type": "uint256" }],
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "isApprovedForAll",
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "operator", "type": "address" }
        ],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    }
];

async function checkNFT() {
    try {
        const NFT_ADDRESS = '0xfdbc878ad5560de5f205a0c428d983d992c7406a';
        const TOKEN_ID = 214;
        const EXPECTED_SELLER = '0xf034e8ad11f249c8081d9da94852be1734bc11a4';
        const MARKETPLACE = '0xF422A7779D2feB884CcC1773b88d98494A946604';

        console.log('\n🔍 Checking NFT Ownership & Approval...\n');
        console.log('NFT Contract:', NFT_ADDRESS);
        console.log('Token ID:', TOKEN_ID);
        console.log('Expected Seller:', EXPECTED_SELLER);
        console.log('Marketplace:', MARKETPLACE);
        console.log('═══════════════════════════════════════════\n');

        // Check owner
        const owner = await publicClient.readContract({
            address: NFT_ADDRESS,
            abi: ERC721_ABI,
            functionName: 'ownerOf',
            args: [BigInt(TOKEN_ID)]
        });

        console.log('✅ Current Owner:', owner);
        console.log('   Match:', owner.toLowerCase() === EXPECTED_SELLER.toLowerCase() ? '✅ YES' : '❌ NO - NFT WAS TRANSFERRED!');

        // Check approval
        const isApproved = await publicClient.readContract({
            address: NFT_ADDRESS,
            abi: ERC721_ABI,
            functionName: 'isApprovedForAll',
            args: [owner, MARKETPLACE]
        });

        console.log('\n✅ Marketplace Approved:', isApproved);
        console.log('   Status:', isApproved ? '✅ YES' : '❌ NO - NOT APPROVED!');

        console.log('\n\n💡 DIAGNOSIS:');
        console.log('═══════════════════════════════════════════');

        if (owner.toLowerCase() !== EXPECTED_SELLER.toLowerCase()) {
            console.log('❌ PROBLEM FOUND: NFT owner changed!');
            console.log(`   TheGraph says: ${EXPECTED_SELLER}`);
            console.log(`   Blockchain says: ${owner}`);
            console.log('   → The NFT was transferred/sold after listing was created');
            console.log('   → Seller can no longer sell it');
        } else if (!isApproved) {
            console.log('❌ PROBLEM FOUND: Marketplace not approved!');
            console.log('   → Seller must call setApprovalForAll(marketplace, true)');
        } else {
            console.log('✅ Owner & Approval are correct!');
            console.log('   → The problem must be in the contract logic');
            console.log('   → Possible causes:');
            console.log('     - Whitelist enabled but buyer not whitelisted');
            console.log('     - Listing was cancelled');
            console.log('     - Contract has additional checks we don\'t know about');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkNFT();

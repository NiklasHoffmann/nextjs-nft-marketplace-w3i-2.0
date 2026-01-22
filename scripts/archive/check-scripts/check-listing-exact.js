const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
});

// Minimal ABI for raw data reading
const MINIMAL_ABI = [
    {
        "type": "function",
        "name": "getListingByListingId",
        "inputs": [{ "name": "listingId", "type": "uint128" }],
        "outputs": [{
            "name": "", "type": "tuple", "components": [
                { "name": "nftAddress", "type": "address" },
                { "name": "tokenId", "type": "uint256" },
                { "name": "seller", "type": "address" },
                { "name": "price", "type": "uint256" },
                { "name": "currency", "type": "address" },
                { "name": "erc1155QuantityListed", "type": "uint256" },
                { "name": "active", "type": "bool" },
                { "name": "desiredTokenAddress", "type": "address" },
                { "name": "desiredTokenId", "type": "uint256" },
                { "name": "desiredErc1155Quantity", "type": "uint256" }
            ]
        }],
        "stateMutability": "view"
    }
];

async function checkListing() {
    try {
        console.log('\n🔍 Fetching EXACT blockchain data for Listing 7...\n');

        // Try raw call with minimal struct
        const result = await publicClient.call({
            to: MARKETPLACE_ADDRESS,
            data: '0x34ab8a44' + '0000000000000000000000000000000000000000000000000000000000000007' // getListingByListingId(7)
        });

        console.log('📦 Raw Response:', result.data);
        console.log('\n📊 Decoding...\n');

        // Manual decode of the response
        const data = result.data.slice(2); // Remove 0x

        // Each field is 32 bytes (64 hex chars)
        const nftAddress = '0x' + data.slice(24, 64); // address is last 20 bytes
        const tokenId = BigInt('0x' + data.slice(64, 128));
        const seller = '0x' + data.slice(152, 192);
        const price = BigInt('0x' + data.slice(192, 256));
        const currency = '0x' + data.slice(280, 320);
        const erc1155Qty = BigInt('0x' + data.slice(320, 384));
        const active = data.slice(384, 448) !== '0'.repeat(64);
        const desiredTokenAddr = '0x' + data.slice(472, 512);
        const desiredTokenId = BigInt('0x' + data.slice(512, 576));
        const desiredErc1155Qty = BigInt('0x' + data.slice(576, 640));

        console.log('✅ BLOCKCHAIN LISTING DATA (Listing ID 7):');
        console.log('═══════════════════════════════════════════');
        console.log('NFT Address:', nftAddress);
        console.log('Token ID:', tokenId.toString());
        console.log('Seller:', seller);
        console.log('Price:', price.toString(), `(${Number(price) / 1e18} ETH)`);
        console.log('Currency:', currency);
        console.log('ERC1155 Qty Listed:', erc1155Qty.toString());
        console.log('Active:', active);
        console.log('Desired Token Address:', desiredTokenAddr);
        console.log('Desired Token ID:', desiredTokenId.toString());
        console.log('Desired ERC1155 Qty:', desiredErc1155Qty.toString());

        console.log('\n\n🔎 OUR PURCHASE PARAMETERS:');
        console.log('═══════════════════════════════════════════');
        console.log('expectedPrice:', price.toString(), '✓');
        console.log('expectedCurrency:', '0x0000000000000000000000000000000000000000', currency === '0x0000000000000000000000000000000000000000' ? '✓' : '❌');
        console.log('expectedErc1155Quantity:', '1', erc1155Qty.toString() === '1' ? '✓' : `❌ SHOULD BE ${erc1155Qty.toString()}`);
        console.log('expectedDesiredTokenAddress:', '0x0000000000000000000000000000000000000000', desiredTokenAddr === '0x0000000000000000000000000000000000000000' ? '✓' : `❌ SHOULD BE ${desiredTokenAddr}`);
        console.log('expectedDesiredTokenId:', '0', desiredTokenId.toString() === '0' ? '✓' : `❌ SHOULD BE ${desiredTokenId.toString()}`);
        console.log('expectedDesiredErc1155Quantity:', '0', desiredErc1155Qty.toString() === '0' ? '✓' : `❌ SHOULD BE ${desiredErc1155Qty.toString()}`);

        console.log('\n\n💡 PROBLEM FOUND:');
        if (erc1155Qty.toString() !== '1') {
            console.log(`❌ expectedErc1155Quantity mismatch! We send 1, but blockchain has ${erc1155Qty.toString()}`);
        }
        if (desiredTokenAddr !== '0x0000000000000000000000000000000000000000') {
            console.log(`❌ expectedDesiredTokenAddress mismatch! We send 0x00..00, but blockchain has ${desiredTokenAddr}`);
        }
        if (desiredTokenId.toString() !== '0') {
            console.log(`❌ expectedDesiredTokenId mismatch! We send 0, but blockchain has ${desiredTokenId.toString()}`);
        }
        if (desiredErc1155Qty.toString() !== '0') {
            console.log(`❌ expectedDesiredErc1155Quantity mismatch! We send 0, but blockchain has ${desiredErc1155Qty.toString()}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkListing();

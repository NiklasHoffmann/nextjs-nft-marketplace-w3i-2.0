const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const { keccak256, toHex } = require('viem');
require('dotenv').config({ path: '.env.local' });

const marketplaceAbi = require('../src/constants/marketplace.abi.json');

async function checkDiamondFunctions() {
    const client = createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
    });

    const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

    console.log('🔍 Checking Diamond Proxy functions...\n');
    console.log('Marketplace Address:', marketplaceAddress);

    try {
        // Get all facets
        const facets = await client.readContract({
            address: marketplaceAddress,
            abi: marketplaceAbi,
            functionName: 'facets'
        });

        console.log('\n📦 Available Facets:', facets.length);

        for (let i = 0; i < facets.length; i++) {
            const facet = facets[i];
            console.log(`\n--- Facet ${i + 1} ---`);
            console.log('Address:', facet.facetAddress);
            console.log('Function Selectors:', facet.functionSelectors.length);

            // Show all selectors
            facet.functionSelectors.forEach(selector => {
                console.log('  -', selector);
            });
        }

        // Check for purchaseListing function selector
        const purchaseListingSig = 'purchaseListing(uint128,uint256,uint256,address,uint256,uint256,uint256,address)';
        const purchaseListingSelector = keccak256(toHex(purchaseListingSig)).slice(0, 10);
        console.log('\n🔍 Looking for purchaseListing function...');
        console.log('Expected selector:', purchaseListingSelector);
        console.log('Full signature:', purchaseListingSig);

        try {
            const facetAddress = await client.readContract({
                address: marketplaceAddress,
                abi: marketplaceAbi,
                functionName: 'facetAddress',
                args: [purchaseListingSelector]
            });
            console.log('✅ FOUND! Facet address:', facetAddress);
        } catch (err) {
            console.log('❌ NOT FOUND! Function is not registered in the diamond.');
            console.log('Error:', err.shortMessage || err.message);
        }

    } catch (err) {
        console.error('❌ Error:', err.shortMessage || err.message);
        console.error('Full error:', err);
    }
}

checkDiamondFunctions();

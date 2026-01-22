const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const marketplaceAbi = require('../src/constants/marketplace.abi.json');

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

async function checkFacets() {
  try {
    console.log('🔍 Checking Diamond Facets...\n');

    // Get all facets
    const facets = await publicClient.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'facets',
    });

    console.log(`Found ${facets.length} facet(s):\n`);

    facets.forEach((facet, index) => {
      console.log(`Facet ${index + 1}:`);
      console.log(`  Address: ${facet.facetAddress}`);
      console.log(`  Selectors: ${facet.functionSelectors.length}`);
      facet.functionSelectors.forEach((selector) => {
        console.log(`    - ${selector}`);
      });
      console.log('');
    });

    // Check if createListing selector exists
    const createListingSelector = '0xcf4dffa1';
    console.log(`\n🔎 Looking for createListing (${createListingSelector})...`);

    let found = false;
    facets.forEach((facet) => {
      if (facet.functionSelectors.includes(createListingSelector)) {
        console.log(`✅ FOUND in facet: ${facet.facetAddress}`);
        found = true;
      }
    });

    if (!found) {
      console.log(`❌ NOT FOUND - This explains the Diamond__FunctionDoesNotExist error!`);
    }

    // Get all facet addresses
    const facetAddresses = await publicClient.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'facetAddresses',
    });

    console.log(`\n📋 Facet Addresses:`);
    facetAddresses.forEach((addr, i) => {
      console.log(`  ${i + 1}. ${addr}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFacets();

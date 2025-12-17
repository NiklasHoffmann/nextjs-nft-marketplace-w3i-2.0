const { createPublicClient, http, toFunctionSelector } = require('viem');
const { sepolia } = require('viem/chains');
const localAbi = require('../src/constants/marketplace.abi.json');

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

async function compareAbi() {
  try {
    console.log('🔍 Comparing deployed contract with local ABI...\n');

    // Get all facets from contract
    const facets = await publicClient.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: localAbi,
      functionName: 'facets',
    });

    // Collect all deployed selectors
    const deployedSelectors = new Set();
    facets.forEach((facet) => {
      facet.functionSelectors.forEach((selector) => {
        deployedSelectors.add(selector.toLowerCase());
      });
    });

    console.log(`📊 Contract has ${deployedSelectors.size} function selectors\n`);

    // Get all selectors from local ABI
    const localFunctions = localAbi.filter(item => item.type === 'function');
    const localSelectors = new Map();
    
    localFunctions.forEach((fn) => {
      const selector = toFunctionSelector(fn).toLowerCase();
      localSelectors.set(selector, fn.name);
    });

    console.log(`📋 Local ABI has ${localSelectors.size} functions\n`);

    // Find missing in contract
    console.log('❌ Functions in LOCAL ABI but NOT in DEPLOYED CONTRACT:');
    let missingInContract = 0;
    localSelectors.forEach((name, selector) => {
      if (!deployedSelectors.has(selector)) {
        console.log(`   ${selector} - ${name}`);
        missingInContract++;
      }
    });
    if (missingInContract === 0) {
      console.log('   (none)');
    }
    console.log('');

    // Find extra in contract
    console.log('⚠️  Functions in DEPLOYED CONTRACT but NOT in LOCAL ABI:');
    let extraInContract = 0;
    deployedSelectors.forEach((selector) => {
      if (!localSelectors.has(selector)) {
        console.log(`   ${selector} - (unknown function)`);
        extraInContract++;
      }
    });
    if (extraInContract === 0) {
      console.log('   (none)');
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log(`   Contract functions:    ${deployedSelectors.size}`);
    console.log(`   Local ABI functions:   ${localSelectors.size}`);
    console.log(`   Missing from contract: ${missingInContract}`);
    console.log(`   Extra in contract:     ${extraInContract}`);
    console.log(`   Match status:          ${missingInContract === 0 && extraInContract === 0 ? '✅ PERFECT MATCH' : '⚠️  MISMATCH DETECTED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (extraInContract > 0) {
      console.log('\n💡 TIP: Unknown functions might have different signatures.');
      console.log('   Check Etherscan Write Contract page for parameter details.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareAbi();

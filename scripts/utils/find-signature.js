const { toFunctionSelector } = require('viem');

const target = '0x34ab8a44';
console.log('🔍 Searching for signature that produces:', target);
console.log('');

// All possible parameter combinations for createListing
const paramCombinations = [
  // Struct-based (single param)
  '(address,uint256,address,uint256,address,uint256,uint256,uint256,bool,bool,address[])',
  '(address,uint256,uint256,address,uint256,uint256,uint256,bool,bool,address[])',
  // Multiple structs
  '(address,uint256,uint256),(address,uint256,uint256)',
  '(address,uint256),(uint256,address,uint256,uint256)',
  // Mixed struct + params
  '(address,uint256,address,uint256,address,uint256,uint256,uint256,bool,bool),address[]',
  // Int128/uint128 instead of uint256
  'address,uint128,uint256',
  'address,uint256,uint128',
  // Different types
  'address,uint256,uint256,bytes',
  'address,uint256,bytes',
];

console.log('Testing variations...\n');

paramCombinations.forEach((params) => {
  const sig = `createListing(${params})`;
  const selector = toFunctionSelector(sig);
  
  if (selector === target) {
    console.log('✅ MATCH FOUND!');
    console.log(`   Signature: ${sig}`);
    console.log(`   Selector:  ${selector}`);
    console.log('');
  } else {
    console.log(`❌ ${selector} - createListing(${params})`);
  }
});

console.log('\n🔍 Target was:', target);

const { keccak256, toHex } = require('viem');

const functionsToCheck = [
    'purchaseListing(uint128,uint256,uint256,address,uint256,uint256,uint256,address)',
    'createListing(address,uint256,address,uint256,address,address,uint256,uint256,uint256,bool,bool,address[])',
    'cancelListing(uint128)',
    'updateListing(uint128,uint256,address,uint256,uint256,uint256,bool,bool,address[])',
    'getListingByListingId(uint128)',
    'getListingsByNFT(address,uint256)'
];

console.log('Function Selectors:');
console.log('');

functionsToCheck.forEach(sig => {
    const selector = keccak256(toHex(sig)).slice(0, 10);
    const name = sig.split('(')[0];
    console.log(`${name.padEnd(25)} ${selector}`);
});

console.log('\n\nFacet 4 has these selectors:');
console.log('0x34ab8a44');
console.log('0xc333bac7');
console.log('0x8e3d2fb2');
console.log('0x807a8be0');
console.log('0xc5152275');
console.log('0xfeff3454');

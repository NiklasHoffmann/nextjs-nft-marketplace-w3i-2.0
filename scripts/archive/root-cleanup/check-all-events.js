const { keccak256, toHex } = require('viem');

const events = [
    'ListingCreated(uint128,address,uint256,uint256,uint256,uint32,address,bool,bool,address,uint256,uint256)',
    'ListingPurchased(uint128,address,uint256,uint256,bool,uint256,uint32,address,address,address,uint256,uint256)',
    'ListingCanceled(uint128,address,uint256,address,address)',
    'ListingUpdated(uint128,address,uint256,uint256,uint256,uint32,address,bool,bool,address,uint256,uint256)'
];

const receivedSig = '0x01d722b1eb1f8d0a1331c6b9d4df6f88a8169986a749e715c3b7cdf79c354d28';

console.log('Received signature:', receivedSig);
console.log('\nChecking marketplace events:\n');

events.forEach(event => {
    const hash = keccak256(toHex(event));
    const match = hash === receivedSig;
    console.log(match ? '✅' : '❌', event);
    console.log('   ', hash);
    if (match) console.log('   >>> MATCH! <<<');
});

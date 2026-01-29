const { keccak256, toHex } = require('viem');

// UPDATED signature with currency parameter
const eventSignature = 'ListingCreated(uint128,address,uint256,uint256,uint256,address,uint32,address,bool,bool,address,uint256,uint256)';
const hash = keccak256(toHex(eventSignature));

const receivedSig = '0x01d722b1eb1f8d0a1331c6b9d4df6f88a8169986a749e715c3b7cdf79c354d28';

console.log('Event:', eventSignature);
console.log('Calculated:', hash);
console.log('Received:  ', receivedSig);
console.log('');
console.log(hash === receivedSig ? '✅ MATCH! Event wird jetzt dekodiert werden!' : '❌ No match');

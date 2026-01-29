const { keccak256, toHex } = require('viem');

const eventSignature = 'ListingCreated(uint128,address,uint256,uint256,uint256,uint32,address,bool,bool,address,uint256,uint256)';
const hash = keccak256(toHex(eventSignature));

console.log('Event:', eventSignature);
console.log('Calculated signature:', hash);
console.log('Received signature:  ', '0x01d722b1eb1f8d0a1331c6b9d4df6f88a8169986a749e715c3b7cdf79c354d28');
console.log('Match:', hash === '0x01d722b1eb1f8d0a1331c6b9d4df6f88a8169986a749e715c3b7cdf79c354d28');

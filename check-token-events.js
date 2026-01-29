const { keccak256, toHex } = require('viem');

// Common ERC721/ERC1155 events
const tokenEvents = [
    'Transfer(address,address,uint256)',
    'Approval(address,address,uint256)',
    'ApprovalForAll(address,address,bool)',
    'TransferSingle(address,address,address,uint256,uint256)',
    'TransferBatch(address,address,address,uint256[],uint256[])',
    'URI(string,uint256)'
];

const receivedSig = '0x01d722b1eb1f8d0a1331c6b9d4df6f88a8169986a749e715c3b7cdf79c354d28';

console.log('Received signature:', receivedSig);
console.log('\nChecking ERC721/ERC1155 events:\n');

tokenEvents.forEach(event => {
    const hash = keccak256(toHex(event));
    const match = hash === receivedSig;
    console.log(match ? '✅' : '❌', event);
    console.log('   ', hash);
    if (match) console.log('   >>> MATCH! <<<');
});

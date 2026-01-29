const fs = require('fs');
const path = require('path');

// Load local ABI
const localAbiPath = path.join(__dirname, 'src', 'config', 'abis', 'marketplace.ts');
const localAbiContent = fs.readFileSync(localAbiPath, 'utf8');

// Extract ABI array from TypeScript file
const match = localAbiContent.match(/export const MARKETPLACE_ABI = (\[[\s\S]*\]);/);
if (!match) {
    console.error('❌ Could not parse local ABI');
    process.exit(1);
}

const localAbiString = match[1];
const localAbi = eval(localAbiString);

console.log('📊 Local ABI Analysis:');
console.log('Total entries:', localAbi.length);

const types = {};
const events = [];
const functions = [];
const errors = [];

localAbi.forEach(item => {
    types[item.type] = (types[item.type] || 0) + 1;

    if (item.type === 'event') {
        events.push(item.name);
    } else if (item.type === 'function') {
        functions.push(item.name);
    } else if (item.type === 'error') {
        errors.push(item.name);
    }
});

console.log('\n📋 Breakdown:');
console.log('  Events:', types.event || 0);
console.log('  Functions:', types.function || 0);
console.log('  Errors:', types.error || 0);
console.log('  Constructor:', types.constructor || 0);

console.log('\n📝 Events:');
events.forEach(name => console.log('  -', name));

console.log('\n🔧 Functions (first 10):');
functions.slice(0, 10).forEach(name => console.log('  -', name));

console.log('\n\n⚠️ NEXT STEP:');
console.log('1. Go to: https://sepolia.etherscan.io/address/0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC#code');
console.log('2. Scroll to "Contract ABI" section');
console.log('3. Click "Copy ABI to clipboard"');
console.log('4. Paste into a file named "deployed-abi.json"');
console.log('5. Run: node compare-abis.js');

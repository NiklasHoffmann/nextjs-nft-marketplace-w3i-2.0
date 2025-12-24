const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
});

// Check common pausable/admin functions
const CHECK_FUNCTIONS = [
    {
        name: 'paused',
        abi: [{
            "type": "function",
            "name": "paused",
            "inputs": [],
            "outputs": [{ "type": "bool" }],
            "stateMutability": "view"
        }]
    },
    {
        name: 'getFeeRate',
        abi: [{
            "type": "function",
            "name": "getFeeRate",
            "inputs": [],
            "outputs": [{ "type": "uint256" }],
            "stateMutability": "view"
        }]
    },
    {
        name: 'owner',
        abi: [{
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [{ "type": "address" }],
            "stateMutability": "view"
        }]
    }
];

async function checkContract() {
    console.log('\n🔍 Checking Marketplace Contract State...\n');
    console.log('Contract:', MARKETPLACE_ADDRESS);
    console.log('═══════════════════════════════════════════\n');

    for (const func of CHECK_FUNCTIONS) {
        try {
            const result = await publicClient.readContract({
                address: MARKETPLACE_ADDRESS,
                abi: func.abi,
                functionName: func.name
            });

            console.log(`✅ ${func.name}():`, result.toString ? result.toString() : result);

            if (func.name === 'paused' && result === true) {
                console.log('   ❌ CONTRACT IS PAUSED! This is why purchases fail!');
            }

            if (func.name === 'getFeeRate') {
                console.log(`   → Fee: ${result.toString()} basis points (${Number(result) / 100}%)`);
            }
        } catch (error) {
            console.log(`ℹ️  ${func.name}(): Function not found or error`);
        }
    }

    console.log('\n\n💡 DIAGNOSIS:');
    console.log('═══════════════════════════════════════════');
    console.log('If contract is paused, only owner can unpause it.');
    console.log('If not paused, the issue is in the purchase logic.');
    console.log('\nTesting simulateContract for detailed error...\n');

    // Try to simulate a purchase to get the exact error
    try {
        const MARKETPLACE_ABI = require('../src/constants/marketplace.abi.json');

        await publicClient.simulateContract({
            address: MARKETPLACE_ADDRESS,
            abi: MARKETPLACE_ABI,
            functionName: 'purchaseListing',
            args: [
                BigInt(8), // listingId
                BigInt('5000000000000000'), // expectedPrice
                '0x0000000000000000000000000000000000000000', // expectedCurrency
                BigInt(0), // expectedErc1155Quantity
                '0x0000000000000000000000000000000000000000', // expectedDesiredTokenAddress
                BigInt(0), // expectedDesiredTokenId
                BigInt(0), // expectedDesiredErc1155Quantity
                BigInt(1), // erc1155PurchaseQuantity
                '0x0000000000000000000000000000000000000000' // desiredErc1155Holder
            ],
            account: '0x8bba5e9b30e986c55465feac4d3417791065d1bb',
            value: BigInt('5000000000000000')
        });

        console.log('✅ Simulation succeeded! Should work on blockchain.');
    } catch (error) {
        console.log('❌ Simulation failed!');
        console.log('Error:', error.message);

        if (error.metaMessages) {
            console.log('\nContract Error:');
            error.metaMessages.forEach(msg => console.log('  ', msg));
        }

        if (error.cause?.message) {
            console.log('\nCause:', error.cause.message);
        }
    }
}

checkContract();

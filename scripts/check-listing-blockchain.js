const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
require('dotenv').config({ path: '.env.local' });

const MARKETPLACE_ABI = require('../src/constants/marketplace.abi.json');

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)
});

async function checkListing() {
    try {
        console.log('🔍 Found revert reason: IdeationMarket__ListingTermsChanged()\n');
        console.log('This means the listing has been modified since page load.\n');

        // Get current listing using raw eth_call to avoid boolean parsing
        const { encodeFunctionData, decodeFunctionResult } = require('viem');

        const data = encodeFunctionData({
            abi: MARKETPLACE_ABI,
            functionName: 'getListingByListingId',
            args: [BigInt(7)]
        });

        const result = await publicClient.call({
            to: MARKETPLACE_ADDRESS,
            data: data
        });

        console.log('📋 Raw blockchain data (hex):', result.data);

        // Manual decode to avoid boolean issue - just show hex values
        const hexData = result.data;

        console.log('\n🔍 Trying to decode listing state...');
        console.log('If this fails with boolean error, the listing struct has changed.');
        console.log('The contract may have been upgraded with different return values.\n');

        // Try simple checks
        try {
            // Check if listing exists by calling with minimal decode
            const listingIdCheck = await publicClient.readContract({
                address: MARKETPLACE_ADDRESS,
                abi: [{
                    "type": "function",
                    "name": "getListingByListingId",
                    "inputs": [{ "name": "listingId", "type": "uint128" }],
                    "outputs": [{ "name": "", "type": "bytes" }],
                    "stateMutability": "view"
                }],
                functionName: 'getListingByListingId',
                args: [BigInt(7)]
            });

            console.log('Raw bytes length:', listingIdCheck.length);
        } catch (e) {
            console.log('Cannot decode - struct mismatch:', e.message);
        }

        console.log('\n💡 SOLUTION:');
        console.log('1. The MongoDB sync may be outdated');
        console.log('2. Run: npm run sync:marketplace');
        console.log('3. Or refresh the page to fetch latest listing data');
        console.log('4. The listing price/terms may have changed on-chain');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkListing();

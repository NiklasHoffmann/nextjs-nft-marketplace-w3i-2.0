/**
 * Verify Price and Currency Flow
 * 
 * Tests:
 * 1. MongoDB price storage (BigInt → String conversion)
 * 2. Currency address → Symbol conversion
 * 3. Price display formatting
 * 
 * Run: node scripts/dev/verify-price-and-currency.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Token configs (sync with src/config/tokens.ts)
const TOKENS = {
    "31337": { // Hardhat
        WETH: { address: "0x0000000000000000000000000000000000000000", symbol: "WETH" },
        USDC: { address: "0xEaefa01B8c4c8126226A8B2DA2cF6Eb0E5B0bD26", symbol: "USDC" },
        MERC20: { address: "0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e", symbol: "MERC20" }
    },
    "11155111": { // Sepolia
        WETH: { address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", symbol: "WETH" },
        USDC: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC" }
    }
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Helper: Get currency symbol from address
function getCurrencySymbol(chainId, currencyAddress) {
    if (!currencyAddress || currencyAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
        return 'ETH';
    }

    const networkTokens = TOKENS[chainId.toString()];
    if (!networkTokens) return 'UNKNOWN';

    const addressLower = currencyAddress.toLowerCase();
    for (const [key, token] of Object.entries(networkTokens)) {
        if (token.address.toLowerCase() === addressLower) {
            return token.symbol;
        }
    }

    return 'UNKNOWN';
}

// Helper: Format Wei to ETH
function formatEther(wei) {
    if (!wei) return '0';
    const weiStr = wei.toString();
    const ethValue = BigInt(weiStr) / BigInt(10 ** 18);
    const remainder = BigInt(weiStr) % BigInt(10 ** 18);

    // Format: 1.234567890123456789 ETH
    const decimals = remainder.toString().padStart(18, '0');
    return `${ethValue}.${decimals}`.replace(/\.?0+$/, '') || '0';
}

async function verifyPriceAndCurrency() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not found in environment');
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('Ideationmarket_v2'); // Case-sensitive!
        const marketplaceItems = db.collection('marketplace_items');

        // Test 1: Check raw price storage
        console.log('📊 TEST 1: Price Storage Format');
        console.log('━'.repeat(60));

        // First check total count
        const totalCount = await marketplaceItems.countDocuments({});
        console.log(`Total listings in DB: ${totalCount}`);

        const activeCount = await marketplaceItems.countDocuments({ status: 'active' });
        console.log(`Active listings: ${activeCount}`);

        // Get sample items (try all statuses if no active ones)
        let sampleItems = await marketplaceItems
            .find({ status: 'active' })
            .limit(5)
            .toArray();

        if (sampleItems.length === 0) {
            console.log('\n⚠️  No active listings, checking ALL listings...\n');
            sampleItems = await marketplaceItems
                .find({})
                .limit(5)
                .toArray();
        }

        if (sampleItems.length === 0) {
            console.log('❌ No listings found in database at all!');
        } else {
            console.log(`Found ${sampleItems.length} active listings:\n`);

            for (const item of sampleItems) {
                const priceRaw = item.price;
                const priceType = typeof priceRaw;
                const currencyRaw = item.currency || ZERO_ADDRESS;
                const chainId = item.chainId || '31337';

                console.log(`Listing ID: ${item.listingId}`);
                console.log(`  NFT: ${item.contractAddress}#${item.tokenId}`);
                console.log(`  Price (raw): ${priceRaw} (type: ${priceType})`);

                // Check if conversion needed
                let priceStr;
                if (priceType === 'string') {
                    priceStr = priceRaw;
                    console.log(`  ✅ Price is already String`);
                } else if (priceType === 'object' && priceRaw.toString) {
                    // MongoDB Long/BigInt
                    priceStr = priceRaw.toString();
                    console.log(`  ⚠️  Price is MongoDB Long/BigInt - needs $toString in aggregation`);
                } else if (priceType === 'number') {
                    priceStr = priceRaw.toString();
                    console.log(`  ❌ Price is Number - PRECISION LOSS RISK!`);
                } else {
                    console.log(`  ❌ Unknown price type: ${priceType}`);
                    priceStr = '0';
                }

                const priceEth = formatEther(priceStr);
                console.log(`  Price (ETH): ${priceEth}`);

                // Test currency conversion
                const currencySymbol = getCurrencySymbol(chainId, currencyRaw);
                console.log(`  Currency: ${currencyRaw}`);
                console.log(`  Symbol: ${currencySymbol}`);
                console.log('');
            }
        }

        // Test 2: Aggregation Pipeline (wie API es macht)
        console.log('\n📊 TEST 2: API Aggregation Pipeline');
        console.log('━'.repeat(60));

        const aggregatedItems = await marketplaceItems.aggregate([
            { $match: { status: 'active' } },
            { $limit: 3 },
            {
                $addFields: {
                    // CRITICAL: Convert price to STRING
                    priceString: { $toString: { $ifNull: ['$price', '0'] } },
                    currencyAddress: { $ifNull: ['$currency', ZERO_ADDRESS] }
                }
            },
            {
                $project: {
                    listingId: 1,
                    contractAddress: 1,
                    tokenId: 1,
                    priceRaw: '$price',
                    priceString: 1,
                    currencyAddress: 1,
                    chainId: 1
                }
            }
        ]).toArray();

        if (aggregatedItems.length > 0) {
            console.log(`✅ Aggregation returned ${aggregatedItems.length} items:\n`);

            for (const item of aggregatedItems) {
                const chainId = item.chainId || '31337';
                const currencySymbol = getCurrencySymbol(chainId, item.currencyAddress);
                const priceEth = formatEther(item.priceString);

                console.log(`Listing: ${item.listingId}`);
                console.log(`  Price (raw): ${typeof item.priceRaw} = ${item.priceRaw}`);
                console.log(`  Price (string): ${typeof item.priceString} = ${item.priceString}`);
                console.log(`  Price (formatted): ${priceEth} ${currencySymbol}`);
                console.log('');
            }
        }

        // Test 3: Check for different currencies
        console.log('\n📊 TEST 3: Currency Distribution');
        console.log('━'.repeat(60));

        const currencyStats = await marketplaceItems.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: { $ifNull: ['$currency', ZERO_ADDRESS] },
                    count: { $sum: 1 },
                    avgPrice: { $avg: { $toLong: { $ifNull: ['$price', 0] } } }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        if (currencyStats.length > 0) {
            console.log('Currency usage across all active listings:\n');
            for (const stat of currencyStats) {
                const currencySymbol = getCurrencySymbol('31337', stat._id);
                const avgPriceEth = formatEther(stat.avgPrice.toString());
                console.log(`  ${currencySymbol} (${stat._id})`);
                console.log(`    Count: ${stat.count} listings`);
                console.log(`    Avg Price: ${avgPriceEth} ${currencySymbol}`);
                console.log('');
            }
        } else {
            console.log('No currency statistics available');
        }

        // Test 4: Potential Issues
        console.log('\n🔍 TEST 4: Potential Issues Check');
        console.log('━'.repeat(60));

        // Check for Number types (precision loss)
        const numberPrices = await marketplaceItems
            .find({
                status: 'active',
                price: { $type: 'double' } // MongoDB type for Number
            })
            .count();

        if (numberPrices > 0) {
            console.log(`❌ CRITICAL: ${numberPrices} listings have Number-type prices (precision loss risk!)`);
        } else {
            console.log(`✅ No Number-type prices found (good!)`);
        }

        // Check for missing currency field
        const missingCurrency = await marketplaceItems
            .find({
                status: 'active',
                currency: { $exists: false }
            })
            .count();

        if (missingCurrency > 0) {
            console.log(`⚠️  ${missingCurrency} listings missing currency field (will default to ETH)`);
        } else {
            console.log(`✅ All listings have currency field`);
        }

        // Check for zero prices
        const zeroPrices = await marketplaceItems
            .find({
                status: 'active',
                $or: [
                    { price: '0' },
                    { price: 0 },
                    { price: { $exists: false } }
                ]
            })
            .count();

        if (zeroPrices > 0) {
            console.log(`⚠️  ${zeroPrices} listings with zero or missing price`);
        } else {
            console.log(`✅ All listings have non-zero prices`);
        }

        console.log('\n' + '━'.repeat(60));
        console.log('✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// Run verification
verifyPriceAndCurrency()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

// Sync Script: Holt echte NFT-Daten von The Graph und speichert sie in MongoDB
// Supports both HTTP polling and WebSocket subscriptions (if available)
// NEW: Separates NFT metadata (nft_metadata) from marketplace listings (marketplace_items)
const { MongoClient } = require('mongodb');
const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const https = require('https');
const {
    upsertNFTMetadata,
    upsertMarketplaceListing,
    hasListingChanged
} = require('./lib/sync-helpers');

require('dotenv').config({ path: '.env.local' });

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const SUBGRAPH_WS_URL = process.env.NEXT_PUBLIC_SUBGRAPH_WS_URL; // Optional WebSocket URL
const MONGODB_URI = process.env.MONGODB_URI;
const RPC_URL = process.env.ALCHEMY_URL || process.env.JSON_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

// Feature flags
const USE_SUBSCRIPTIONS = !!SUBGRAPH_WS_URL; // Enable if WS URL is provided
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

console.log('🔧 Sync Configuration:');
console.log(`  - HTTP Endpoint: ${SUBGRAPH_URL}`);
console.log(`  - WebSocket: ${SUBGRAPH_WS_URL || 'Not configured (using polling)'}`);
console.log(`  - Mode: ${USE_SUBSCRIPTIONS ? '🔔 Subscriptions (real-time)' : '⏱️  Polling (30s interval)'}`);
console.log(`  - Blockchain: Ethereum Sepolia (Chain ID: 11155111)`);

// ERC721 ABI (minimal)
const ERC721_ABI = [
    {
        inputs: [],
        name: 'name',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'getApproved',
        outputs: [{ type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    }
];

// GraphQL Query für alle aktiven Listings
const ACTIVE_ITEMS_QUERY = `
  query GetActiveItems($first: Int!, $skip: Int!) {
    items(
      first: $first
      skip: $skip
      where: { isListed: true }
      orderBy: listingId
      orderDirection: desc
    ) {
      listingId
      nftAddress
      tokenId
      isListed
      price
      seller
      buyer
      desiredNftAddress
      desiredTokenId
    }
  }
`;

// GraphQL Query ausführen
async function fetchGraphQL(query, variables = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(SUBGRAPH_URL);
        const postData = JSON.stringify({ query, variables });

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errors) {
                        reject(new Error(result.errors[0].message));
                    } else {
                        resolve(result.data);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// IPFS Metadata laden
async function fetchMetadata(ipfsHash) {
    if (!ipfsHash) return null;

    const hash = ipfsHash.replace('ipfs://', '');
    const gateways = [
        `https://ipfs.io/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`
    ];

    for (const url of gateways) {
        try {
            return await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                https.get(url, { timeout: 5000 }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        clearTimeout(timeout);
                        try {
                            const parsed = JSON.parse(data);

                            // Parse in standardisiertes Format
                            let imageUrl = parsed.image || null;
                            if (imageUrl && imageUrl.startsWith('ipfs://')) {
                                const imgHash = imageUrl.replace('ipfs://', '');
                                imageUrl = `https://ipfs.io/ipfs/${imgHash}`;
                            }

                            let attributes = [];
                            if (Array.isArray(parsed.attributes)) {
                                attributes = parsed.attributes.map(attr => ({
                                    trait_type: attr.trait_type || attr.name || 'Unknown',
                                    value: attr.value,
                                    display_type: attr.display_type
                                }));
                            }

                            resolve({
                                name: parsed.name || 'Unnamed NFT',
                                description: parsed.description || null,
                                image: imageUrl,
                                animationUrl: parsed.animation_url || null,
                                externalUrl: parsed.external_url || null,
                                attributes
                            });
                        } catch {
                            reject(new Error('Invalid JSON'));
                        }
                    });
                }).on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        } catch (error) {
            console.log(`  ⚠️  IPFS Gateway ${gateways.indexOf(url) + 1} failed, trying next...`);
            continue;
        }
    }

    return null;
}

// NFT Contract Info laden mit viem
async function fetchContractInfo(publicClient, nftAddress, tokenId) {
    try {
        console.log(`      🔍 Contract Call für ${nftAddress}...`);

        const [owner, tokenURI, contractName, contractSymbol, totalSupply] = await Promise.all([
            publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)]
            }).catch((err) => { console.log(`      ⚠️  ownerOf failed: ${err.message.slice(0, 50)}`); return null; }),
            publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)]
            }).catch((err) => { console.log(`      ⚠️  tokenURI failed: ${err.message.slice(0, 50)}`); return null; }),
            publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'name'
            }).catch(() => null),
            publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'symbol'
            }).catch(() => null),
            publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'totalSupply'
            }).catch(() => null)
        ]);

        // Get owner balance if we have an owner
        let ownerBalance = null;
        if (owner) {
            const balance = await publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: 'balanceOf',
                args: [owner]
            }).catch(() => null);

            if (balance) ownerBalance = Number(balance);
        }

        // Get approved address
        const approvedAddress = await publicClient.readContract({
            address: nftAddress,
            abi: ERC721_ABI,
            functionName: 'getApproved',
            args: [BigInt(tokenId)]
        }).catch(() => null);

        return {
            owner,
            tokenURI,
            contractName,
            contractSymbol,
            totalSupply: totalSupply ? Number(totalSupply) : null,
            ownerBalance,
            approvedAddress
        };
    } catch (error) {
        console.log(`    ⚠️  Contract-Fehler: ${error.message}`);
        return {
            owner: null,
            tokenURI: null,
            contractName: null,
            contractSymbol: null,
            totalSupply: null,
            ownerBalance: null,
            approvedAddress: null
        };
    }
}

// Insights laden aus admin_nft_insights Collection
async function fetchInsights(db, nftAddress, tokenId) {
    const insightsCollection = db.collection('admin_nft_insights');

    try {
        // 1. Versuche NFT-spezifische Insights zu finden (mit tokenId)
        const nftSpecificInsights = await insightsCollection.findOne({
            contractAddress: nftAddress.toLowerCase(),
            tokenId: tokenId
        });

        // Prüfe ob die NFT-spezifischen Insights wirklich spezifisch sind
        if (nftSpecificInsights && hasNFTSpecificInsights(nftSpecificInsights)) {
            console.log(`    ✅ NFT-specific insights gefunden`);
            return mapInsightsToSchema(nftSpecificInsights);
        }

        // 2. Fallback: Collection-level Insights (tokenId: "" oder null)
        const collectionInsights = await insightsCollection.findOne({
            contractAddress: nftAddress.toLowerCase(),
            $or: [
                { tokenId: null },
                { tokenId: "" },
                { tokenId: { $exists: false } }
            ]
        });

        if (collectionInsights) {
            console.log(`    ℹ️  Collection-level insights verwendet`);
            return mapInsightsToSchema(collectionInsights);
        }

        // 3. Keine Insights gefunden
        console.log(`    ⚠️  Keine Insights verfügbar`);
        return getDefaultInsights();

    } catch (error) {
        console.error(`    ❌ Fehler beim Laden der Insights:`, error.message);
        return getDefaultInsights();
    }
}

// Prüft ob NFT-spezifische Insights vorhanden sind (nicht nur empty/null)
function hasNFTSpecificInsights(insights) {
    if (!insights) return false;

    // Prüfe ob mindestens eines der Felder einen sinnvollen Wert hat
    const hasCustomTitle = insights.customTitle && insights.customTitle.trim().length > 0;
    const hasCardDesc = insights.cardDescriptions && insights.cardDescriptions.length > 0;
    const hasProjectDesc = insights.projectDescriptions && Object.keys(insights.projectDescriptions).length > 0;
    const hasFunctionalityDesc = insights.functionalitiesDescriptions && Object.keys(insights.functionalitiesDescriptions).length > 0;

    return hasCustomTitle || hasCardDesc || hasProjectDesc || hasFunctionalityDesc;
}

// Mappt Insights aus admin_nft_insights zum marketplace_items Schema
function mapInsightsToSchema(adminInsights) {
    return {
        customTitle: adminInsights.customTitle || null,
        category: adminInsights.category || null,
        tags: adminInsights.tags || [],
        rarity: adminInsights.rarity || null,
        cardDescriptions: adminInsights.cardDescriptions || null,
        projectDescriptions: adminInsights.projectDescriptions || null,
        functionalitiesDescriptions: adminInsights.functionalitiesDescriptions || null,
        projectWebsite: adminInsights.projectWebsite || null,
        projectTwitter: adminInsights.projectTwitter || null,
        projectDiscord: adminInsights.projectDiscord || null,
        partnerships: adminInsights.partnerships || null
    };
}

// Default Insights wenn keine gefunden wurden
function getDefaultInsights() {
    return {
        customTitle: null,
        category: null,
        tags: [],
        rarity: null,
        cardDescriptions: null,
        projectDescriptions: null,
        functionalitiesDescriptions: null,
        projectWebsite: null,
        projectTwitter: null,
        projectDiscord: null,
        partnerships: null
    };
}

async function syncMarketplaceData() {
    const client = new MongoClient(MONGODB_URI);

    // Create viem public client
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(RPC_URL)
    });

    try {
        console.log('🔌 Verbinde mit MongoDB...');
        await client.connect();

        const dbName = process.env.MONGODB_DB || 'nft-marketplace';
        const db = client.db(dbName);
        const collection = db.collection('marketplace_items');
        const metadataCollection = db.collection('nft_metadata');
        console.log(`   Using database: ${dbName}`);
        console.log(`   Using RPC: ${RPC_URL}`);

        // Check if this is initial sync or incremental
        const existingCount = await collection.countDocuments();
        const isInitialSync = existingCount === 0;

        if (isInitialSync) {
            console.log('🆕 Initial sync - loading all items...');
        } else {
            console.log(`📊 Incremental sync - ${existingCount} items already in database`);
        }

        console.log('📡 Lade Marketplace-Daten von The Graph...');

        let skip = 0;
        const batchSize = 100;
        let hasMore = true;
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalNew = 0;
        const changedContracts = new Set(); // Track which collections need update

        while (hasMore) {
            const data = await fetchGraphQL(ACTIVE_ITEMS_QUERY, { skip, first: batchSize });
            const items = data.items || [];

            if (items.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`\n📦 Batch ${Math.floor(skip / batchSize) + 1}: ${items.length} Items geladen`);

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const progress = `[${i + 1}/${items.length}]`;

                console.log(`  ${progress} Verarbeite NFT ${item.nftAddress.slice(0, 6)}...${item.nftAddress.slice(-4)} #${item.tokenId}`);

                // Check if NFT already exists
                const existingNFT = await collection.findOne({ listingId: item.listingId });

                // Skip if nothing changed (incremental optimization)
                if (existingNFT && !isInitialSync) {
                    if (!hasListingChanged(existingNFT, item)) {
                        console.log(`    ⏭️  Unchanged - skipping`);
                        totalProcessed++;
                        continue;
                    }

                    console.log(`    🔄 Changes detected - updating`);
                }

                // Track that this collection needs update
                changedContracts.add(item.nftAddress);

                // 1. Lade Contract-Daten (immer aktualisieren wegen owner changes)
                console.log(`    📝 Lade Contract-Daten...`);
                const contractData = await fetchContractInfo(publicClient, item.nftAddress, item.tokenId);

                if (contractData.owner) {
                    console.log(`    ✅ Contract: Owner ${contractData.owner.slice(0, 6)}...`);
                } else {
                    console.log(`    ⚠️  Contract: Keine Owner-Daten (NFT existiert möglicherweise nicht)`);
                }

                // 2. Lade Metadata nur wenn neu oder wenn noch nicht vorhanden
                let metadata = existingNFT?.metadata || null;
                let metadataSource = existingNFT?.dataQuality?.metadataSource || 'none';

                if (!metadata && contractData.tokenURI) {
                    console.log(`    📥 Lade Metadata von IPFS...`);
                    metadata = await fetchMetadata(contractData.tokenURI);
                    if (metadata) {
                        console.log(`    ✅ Metadata geladen: ${metadata.name}`);
                        metadataSource = 'ipfs';
                    } else {
                        console.log(`    ❌ Metadata konnte nicht geladen werden`);
                        metadataSource = 'none';
                    }
                } else if (metadata) {
                    console.log(`    ℹ️  Metadata bereits vorhanden: ${metadata.name}`);
                } else if (!contractData.tokenURI) {
                    console.log(`    ⚠️  Keine tokenURI verfügbar, Metadata kann nicht geladen werden`);
                }

                // 3. Lade Insights (mit Hierarchie: NFT-specific > Collection-level)
                const insights = await fetchInsights(db, item.nftAddress, item.tokenId);
                const hasInsights = insights.category !== null ||
                    insights.rarity !== null ||
                    (insights.cardDescriptions && insights.cardDescriptions.length > 0);

                // 4. Save to new architecture (separated collections)

                // 4a. Upsert NFT metadata (always update, as metadata/contract can change)
                await upsertNFTMetadata(metadataCollection, {
                    nftAddress: item.nftAddress,
                    tokenId: item.tokenId,
                    metadata,
                    contract: contractData,
                    insights,
                    seller: item.seller // Current owner
                });

                // 4b. Upsert marketplace listing (only listing-specific data)
                await upsertMarketplaceListing(collection, {
                    listingId: item.listingId,
                    nftAddress: item.nftAddress,
                    tokenId: item.tokenId,
                    isListed: item.isListed,
                    price: item.price,
                    seller: item.seller,
                    buyer: item.buyer,
                    desiredNftAddress: item.desiredNftAddress,
                    desiredTokenId: item.desiredTokenId
                });

                if (existingNFT) {
                    console.log(`    ✅ Updated (metadata + listing)`);
                    totalUpdated++;
                } else {
                    console.log(`    ✨ Created (metadata + listing)`);
                    totalNew++;
                }

                totalProcessed++;
            }

            skip += batchSize;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n✅ ${totalProcessed} NFTs processed (${totalNew} new, ${totalUpdated} updated, ${totalProcessed - totalNew - totalUpdated} unchanged)`);
        console.log(`📦 ${changedContracts.size} collections affected by changes`);

        // Jetzt Metadata im Hintergrund laden (nur für erste 20 Items)
        console.log('\n📸 Lade Metadata für erste 20 Items...');
        const itemsToEnrich = await collection.find({ 'metadata': null }).limit(20).toArray();

        for (let i = 0; i < itemsToEnrich.length; i++) {
            const item = itemsToEnrich[i];
            console.log(`  [${i + 1}/20] Lade Metadata für #${item.tokenId}...`);

            // Hier müssten wir eigentlich tokenURI vom Contract holen
            // Für jetzt überspringen wir das
            console.log(`    ⏩ Übersprungen (benötigt Contract-Call)`);
        }

        // Zeige Zusammenfassung
        const total = await collection.countDocuments();
        const listed = await collection.countDocuments({ 'marketplace.isListed': true });
        const withMetadata = await collection.countDocuments({ 'metadata': { $ne: null } });

        console.log('\n📊 Datenbank-Status:');
        console.log(`   Gesamt NFTs: ${total}`);
        console.log(`   Aktiv gelistet: ${listed}`);
        console.log(`   Mit Metadata: ${withMetadata}`);
        console.log(`   Ohne Metadata: ${total - withMetadata}`);

        // Return changed contracts for incremental collection sync
        return changedContracts;

    } catch (error) {
        console.error('❌ Fehler:', error.message);
        throw error;
    } finally {
        await client.close();
        console.log('\n👋 Verbindung geschlossen');
    }
}

// ===== COLLECTION SYNC =====
/**
 * Sync collections from marketplace_items
 * Aggregates statistics and enriches with insights
 * @param {Set<string>} changedContracts - Optional set of contract addresses that changed (for incremental sync)
 */
async function syncCollections(changedContracts = null) {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const dbName = process.env.MONGODB_DB || 'nft-marketplace';
        const db = client.db(dbName);
        const marketplaceCollection = db.collection('marketplace_items');
        const collectionsCollection = db.collection('marketplace_collections');

        // Determine which contracts to sync
        let contractsToSync;
        if (changedContracts && changedContracts.size > 0) {
            console.log(`\n📊 Incremental collection sync (${changedContracts.size} changed)...`);
            contractsToSync = Array.from(changedContracts);
        } else {
            console.log('\n📊 Full collection sync...');
            contractsToSync = await marketplaceCollection.distinct('nftAddress');
            console.log(`   Found ${contractsToSync.length} unique collections`);
        }

        let successCount = 0;
        let errorCount = 0;

        for (const contractAddress of contractsToSync) {
            if (!contractAddress) continue;

            try {
                // Get all items for this collection (only with tokenId to avoid wallet items)
                const allItems = await marketplaceCollection.find({
                    nftAddress: contractAddress,
                    tokenId: { $ne: null, $exists: true } // Only items with valid tokenId
                }).toArray();

                // Filter to only actually listed items (marketplace.isListed === true)
                const items = allItems.filter(item => item.marketplace?.isListed === true);

                if (items.length === 0) continue;

                // Calculate statistics (only from items with valid prices)
                // Items are stored with nested marketplace.price structure
                const prices = items
                    .filter(item => {
                        const price = item.marketplace?.price || item.price;
                        return price && !isNaN(parseFloat(price));
                    })
                    .map(item => parseFloat(item.marketplace?.price || item.price))
                    .filter(p => p > 0);

                // Store prices as Numbers, not Strings (consistent with marketplace_items)
                const floorPrice = prices.length > 0 ? Math.min(...prices) : null;
                const totalValue = prices.reduce((sum, p) => sum + p, 0);
                const averagePrice = prices.length > 0
                    ? (prices.reduce((sum, p) => sum + p, 0) / prices.length)
                    : null;

                // Get preview images (up to 6, filter out nulls)
                // Images can be in metadata.image or image field
                const previewImages = items
                    .map(item => item.metadata?.image || item.image)
                    .filter(img => img && img !== null && img !== '')
                    .slice(0, 6);

                // Get first valid item for metadata (prefer items with all data)
                const firstItem = items.find(item =>
                    item.contract?.name || item.contractName || item.metadata?.name || item.name
                ) || items[0];

                // Fetch admin insights
                const insightsCollection = db.collection('admin_collection_insights');
                const insights = await insightsCollection.findOne({
                    contractAddress: contractAddress.toLowerCase()
                });

                // Aggregate social stats from nft_stats collection
                const statsCollection = db.collection('nft_stats');
                const socialStats = await statsCollection.aggregate([
                    { $match: { contractAddress: contractAddress.toLowerCase() } },
                    {
                        $group: {
                            _id: null,
                            totalLikes: { $sum: '$likeCount' },
                            totalViews: { $sum: '$viewCount' },
                            totalWatchlist: { $sum: '$watchlistCount' },
                            totalRatings: { $sum: '$ratingCount' },
                            // Only average ratings for NFTs that actually have ratings (ratingCount > 0)
                            avgRating: {
                                $avg: {
                                    $cond: [
                                        { $gt: ['$ratingCount', 0] },
                                        '$averageRating',
                                        null // Exclude NFTs without ratings from average
                                    ]
                                }
                            }
                        }
                    }
                ]).toArray();

                const social = socialStats[0] || {
                    totalLikes: 0,
                    totalViews: 0,
                    totalWatchlist: 0,
                    totalRatings: 0,
                    avgRating: 0
                };

                // Calculate unique owners from items
                const uniqueOwners = new Set(
                    items
                        .map(item => item.marketplace?.seller || item.seller)
                        .filter(seller => seller && seller !== 'Unknown')
                ).size;

                // Get totalSupply from contract data or insights (prefer blockchain data)
                const blockchainTotalSupply = firstItem.contract?.totalSupply || null;
                const insightsTotalSupply = insights?.totalSupply || insights?.blockchainTotalSupply || null;
                const finalTotalSupply = blockchainTotalSupply || insightsTotalSupply || 0;

                // Debug log for totalSupply
                if (finalTotalSupply === 0) {
                    console.log(`   ⚠️  ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}: totalSupply = 0 (blockchain: ${blockchainTotalSupply}, insights: ${insightsTotalSupply})`);
                }

                // Build collection document
                const collectionDoc = {
                    contractAddress,
                    contractName: firstItem.contract?.name || firstItem.contractName || firstItem.metadata?.name || firstItem.name || null,
                    contractSymbol: firstItem.contract?.symbol || firstItem.contractSymbol || firstItem.symbol || null,
                    imageUrl: previewImages[0] || null,
                    description: insights?.description || null,
                    bannerImageUrl: null,
                    totalSupply: finalTotalSupply,
                    deployedAt: null,
                    stats: {
                        itemCount: items.length,
                        floorPrice,
                        totalValue,
                        averagePrice,
                        soldCount: 0,
                        totalVolume: '0'
                    },
                    socialStats: {
                        totalLikes: social.totalLikes || 0,
                        totalViews: social.totalViews || 0,
                        totalWatchlist: social.totalWatchlist || 0,
                        totalRatings: social.totalRatings || 0,
                        averageRating: social.avgRating ? Number(social.avgRating.toFixed(1)) : 0,
                        uniqueOwners: uniqueOwners
                    },
                    previewImages,
                    itemRefs: items
                        .filter(item => item.tokenId) // Only include items with tokenId
                        .map(item => ({
                            tokenId: item.tokenId,
                            seller: item.marketplace?.seller || item.seller || 'Unknown',
                            price: (item.marketplace?.price || item.price || '0').toString(),
                            listedAt: item.createdAt || item.itemCreatedAt || new Date().toISOString()
                        })),
                    insights: insights ? {
                        customTitle: insights.customTitle || null,
                        category: insights.category || null,
                        tags: insights.tags || [],
                        rarity: insights.rarity || null,
                        description: insights.description || null,
                        totalSupply: finalTotalSupply, // Use combined totalSupply
                        blockchainTotalSupply: blockchainTotalSupply || insights.blockchainTotalSupply,
                        hasInsights: true
                    } : (blockchainTotalSupply ? {
                        // Even without insights, include blockchain totalSupply
                        customTitle: null,
                        category: null,
                        tags: [],
                        rarity: null,
                        description: null,
                        totalSupply: finalTotalSupply,
                        blockchainTotalSupply: blockchainTotalSupply,
                        hasInsights: false
                    } : null),
                    updatedAt: new Date(),
                    lastSyncedAt: new Date(),
                    syncStatus: 'active',
                    syncError: null
                };

                // Upsert collection
                await collectionsCollection.updateOne(
                    { contractAddress },
                    {
                        $set: collectionDoc,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                successCount++;
                const stats = `${items.length} items, ${prices.length} priced, floor: ${floorPrice || 'N/A'}, images: ${previewImages.length}`;
                console.log(`   ✅ ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}: ${stats}`);

            } catch (error) {
                errorCount++;
                console.error(`   ❌ Error syncing ${contractAddress}:`, error.message);
            }
        }

        const totalContracts = contractsToSync.length;
        console.log(`\n✅ Collections sync complete: ${successCount}/${totalContracts} success, ${errorCount} errors`);

    } catch (error) {
        console.error('❌ Collection sync failed:', error);
    } finally {
        await client.close();
    }
}

// ===== SUBSCRIPTION MODE (Real-time via WebSocket) =====
async function startSubscriptionMode() {
    if (!USE_SUBSCRIPTIONS) {
        console.log('⚠️  WebSocket subscriptions not configured');
        return false;
    }

    try {
        const { createClient } = require('graphql-ws');
        const WebSocket = require('ws');

        console.log('\n🔔 Starting subscription mode...');
        console.log(`   WebSocket URL: ${SUBGRAPH_WS_URL}`);

        const wsClient = createClient({
            url: SUBGRAPH_WS_URL,
            webSocketImpl: WebSocket,
            retryAttempts: 5,
            shouldRetry: () => true,
            on: {
                connected: () => console.log('✅ WebSocket connected'),
                closed: () => console.log('❌ WebSocket closed'),
                error: (error) => console.error('❌ WebSocket error:', error)
            }
        });

        // Subscription Query für neue/geänderte Items
        const ITEMS_SUBSCRIPTION = `
            subscription OnItemsChanged {
                itemListeds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
                    id
                    listingId
                    nftAddress
                    tokenId
                    seller
                    price
                    desiredNftAddress
                    desiredTokenId
                    blockTimestamp
                }
                itemBoughts(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
                    id
                    listingId
                    nftAddress
                    tokenId
                    buyer
                    blockTimestamp
                }
                itemCanceleds(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
                    id
                    listingId
                    nftAddress
                    tokenId
                    blockTimestamp
                }
            }
        `;

        // Subscribe to marketplace changes
        const subscription = wsClient.iterate({
            query: ITEMS_SUBSCRIPTION
        });

        console.log('👂 Listening for marketplace events...\n');

        // Handle incoming events
        for await (const event of subscription) {
            if (event.data) {
                console.log('� New event received:', new Date().toISOString());

                // Trigger incremental sync for changed items
                const { itemListeds, itemBoughts, itemCanceleds } = event.data;

                if (itemListeds?.length > 0) {
                    console.log('  🆕 New listing detected');
                    await syncSingleItem(itemListeds[0]);
                }

                if (itemBoughts?.length > 0) {
                    console.log('  💰 NFT bought detected');
                    await markItemAsSold(itemBoughts[0]);
                }

                if (itemCanceleds?.length > 0) {
                    console.log('  🚫 Listing cancelled detected');
                    await markItemAsCancelled(itemCanceleds[0]);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Subscription mode failed:', error.message);
        console.log('⏱️  Falling back to polling mode...');
        return false;
    }
}

// Sync a single item (for subscription updates)
async function syncSingleItem(item) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('marketplace_items');

        console.log(`    🔄 Syncing ${item.nftAddress}/${item.tokenId}...`);

        // Fetch contract data
        const contractData = await fetchContractInfo(item.nftAddress, item.tokenId);

        // Fetch metadata if not exists
        let metadata = null;
        const existing = await collection.findOne({
            nftAddress: item.nftAddress,
            tokenId: item.tokenId
        });

        if (!existing?.metadata && contractData?.tokenURI) {
            metadata = await fetchMetadata(contractData.tokenURI);
        }

        // Fetch insights
        const insightsCollection = db.collection('admin_nft_insights');
        const insights = await fetchInsights(item.nftAddress, item.tokenId, insightsCollection);

        // Upsert item
        await collection.updateOne(
            { nftAddress: item.nftAddress, tokenId: item.tokenId },
            {
                $set: {
                    listingId: item.listingId,
                    'marketplace.isListed': true,
                    'marketplace.listingId': item.listingId,
                    'marketplace.price': parseFloat(item.price) || 0,
                    'marketplace.seller': item.seller?.toLowerCase(),
                    'contract': contractData,
                    'insights': insights,
                    lastUpdated: new Date()
                },
                $setOnInsert: {
                    nftAddress: item.nftAddress,
                    tokenId: item.tokenId,
                    metadata: metadata || existing?.metadata || null,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log(`    ✅ Synced successfully`);
    } catch (error) {
        console.error(`    ❌ Error syncing item:`, error.message);
    } finally {
        await client.close();
    }
}

// Mark item as sold
async function markItemAsSold(item) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('marketplace_items');

        await collection.updateOne(
            { listingId: item.listingId },
            {
                $set: {
                    'marketplace.isListed': false,
                    'marketplace.buyer': item.buyer?.toLowerCase(),
                    lastUpdated: new Date()
                }
            }
        );

        console.log(`    ✅ Marked as sold`);
    } catch (error) {
        console.error(`    ❌ Error:`, error.message);
    } finally {
        await client.close();
    }
}

// Mark item as cancelled
async function markItemAsCancelled(item) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('marketplace_items');

        await collection.updateOne(
            { listingId: item.listingId },
            {
                $set: {
                    'marketplace.isListed': false,
                    lastUpdated: new Date()
                }
            }
        );

        console.log(`    ✅ Marked as cancelled`);
    } catch (error) {
        console.error(`    ❌ Error:`, error.message);
    } finally {
        await client.close();
    }
}

// ===== POLLING MODE (Fallback every 30 seconds) =====
async function startPollingMode() {
    console.log('\n⏱️  Starting polling mode (30s interval)...\n');

    // Initial sync (full)
    let changedContracts = await syncMarketplaceData();
    // Force full collection sync on startup to update totalSupply values
    await syncCollections(null); // Pass null to force full sync

    // Poll every 30 seconds (incremental)
    setInterval(async () => {
        console.log('\n⏱️  Polling for updates...');
        try {
            changedContracts = await syncMarketplaceData();
            if (changedContracts && changedContracts.size > 0) {
                await syncCollections(changedContracts);
            } else {
                console.log('✅ No changes detected - skipping collection sync');
            }
        } catch (error) {
            console.error('❌ Polling error:', error.message);
        }
    }, POLLING_INTERVAL);
}

// ===== MAIN ENTRY POINT =====
async function main() {
    console.log('🚀 NFT Marketplace Sync gestartet...\n');

    // Try subscription mode first
    if (USE_SUBSCRIPTIONS) {
        const subscriptionStarted = await startSubscriptionMode();

        if (subscriptionStarted) {
            console.log('✅ Running in subscription mode (real-time updates)');
            // Keep process alive
            return;
        }
    }

    // Fallback to polling mode
    await startPollingMode();
}

// Script ausführen
main().catch(console.error);

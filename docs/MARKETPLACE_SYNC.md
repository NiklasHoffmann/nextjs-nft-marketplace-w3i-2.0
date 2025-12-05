# Marketplace Data Synchronization

Complete documentation of how NFT marketplace data is fetched, processed, and stored in MongoDB.

## 📋 Table of Contents

- [Overview](#overview)
- [Data Flow](#data-flow)
- [Script Architecture](#script-architecture)
- [Data Sources](#data-sources)
- [Sync Process Steps](#sync-process-steps)
- [Data Structure](#data-structure)
- [Configuration](#configuration)
- [Running the Sync](#running-the-sync)
- [Troubleshooting](#troubleshooting)

---

## Overview

The marketplace sync script (`sync-marketplace-data.js`) is the **main production script** that populates the MongoDB database with NFT marketplace data. It runs automatically on server boot and synchronizes data from multiple sources into a unified structure.

### Key Features
- ✅ Fetches marketplace events from TheGraph subgraph
- ✅ Retrieves on-chain contract data via viem
- ✅ Parses metadata from IPFS
- ✅ Loads curated insights from admin collection
- ✅ Smart updates: preserves existing metadata, updates marketplace/contract data
- ✅ Numerical price format for correct MongoDB sorting
- ✅ Automatic retry logic for failed operations
- ✅ **Hybrid sync mode**: WebSocket subscriptions (if available) OR HTTP polling fallback

### Sync Modes

#### 1. WebSocket Subscriptions (Real-time)
- ⚡ Instant updates (< 1 second latency)
- 🎯 Only changed items synced
- 🔔 Real-time marketplace events
- ⚠️ Requires self-hosted Graph Node
- **Status**: Supported but requires setup

#### 2. HTTP Polling (Current Default)
- ⏱️ Updates every 30 seconds
- 🔄 Full sync each poll
- ✅ Works with TheGraph Studio
- ✅ No additional infrastructure
- **Status**: ✅ Active and working

### Current Status
- **Active listings**: 61 NFTs
- **Blockchain**: Ethereum Sepolia (Chain ID: 11155111)
- **Sync mode**: HTTP Polling (30 seconds)
- **WebSocket support**: ✅ Ready (requires Graph Node setup)
- **Auto-start**: ✅ Enabled on server boot

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC PROCESS FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. TheGraph Subgraph
   ↓ GraphQL Query
   ├─ ItemListed events
   ├─ ItemBought events  
   └─ ItemCanceled events
   
2. Marketplace Events Data
   ↓ For each listing
   ├─ nftAddress
   ├─ tokenId
   ├─ listingId
   ├─ price (in Wei)
   ├─ seller address
   └─ desired NFT info (if trade)

3. Smart Contract Calls (viem)
   ↓ For each NFT
   ├─ Contract Name (ERC721.name())
   ├─ Contract Symbol (ERC721.symbol())
   ├─ Owner Address (ERC721.ownerOf(tokenId))
   ├─ Token URI (ERC721.tokenURI(tokenId))
   ├─ Total Supply (ERC721.totalSupply())
   ├─ Owner Balance (ERC721.balanceOf(owner))
   └─ Approved Address (ERC721.getApproved(tokenId))

4. IPFS Metadata
   ↓ Parse tokenURI
   ├─ Fetch from IPFS gateway
   ├─ Parse JSON metadata
   └─ Extract:
      ├─ name
      ├─ description
      ├─ image URL
      ├─ animation_url
      ├─ external_url
      └─ attributes[]

5. Admin Insights (MongoDB)
   ↓ Query admin_nft_insights
   ├─ Try NFT-specific (nftAddress + tokenId)
   ├─ Fallback to collection-level (nftAddress + tokenId:"")
   └─ Extract:
      ├─ customTitle
      ├─ category
      ├─ rarity
      ├─ tags[]
      ├─ cardDescriptions[]
      └─ project info

6. MongoDB Storage
   ↓ Upsert to marketplace_items
   └─ Complete EnrichedNFTDocument with:
      ├─ marketplace data (price, seller, listing)
      ├─ metadata (name, image, attributes)
      ├─ contract data (owner, tokenURI, approved)
      ├─ insights (category, rarity, descriptions)
      └─ timestamps (createdAt, lastUpdated)
```

---

## Script Architecture

### File Location
```
scripts/sync-marketplace-data.js
```

### Dependencies
```javascript
const { MongoClient } = require('mongodb');
const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const https = require('https');
require('dotenv').config({ path: '.env.local' });
```

### Environment Variables Required
```bash
NEXT_PUBLIC_SUBGRAPH_URL    # TheGraph subgraph endpoint (HTTP)
NEXT_PUBLIC_SUBGRAPH_WS_URL # TheGraph WebSocket endpoint (Optional - for subscriptions)
MONGODB_URI                  # MongoDB connection string
ALCHEMY_URL                  # Alchemy RPC endpoint (Ethereum Sepolia)
# or
JSON_RPC_URL                 # Alternative RPC endpoint
```

**Note**: `NEXT_PUBLIC_SUBGRAPH_WS_URL` is optional. If not set, the script uses HTTP polling (current default).

See **[WEBSOCKET_SUBSCRIPTIONS.md](./WEBSOCKET_SUBSCRIPTIONS.md)** for WebSocket setup guide.

### Key Components

#### 1. **TheGraph Query Function**
```javascript
async function querySubgraph(query)
```
- Executes GraphQL queries against TheGraph subgraph
- Returns marketplace events (ItemListed, ItemBought, ItemCanceled)

#### 2. **Contract Data Fetcher**
```javascript
async function fetchContractInfo(nftAddress, tokenId)
```
- Uses viem public client to call smart contract functions
- Returns: owner, tokenURI, contract name/symbol, supply, balance, approval

#### 3. **Metadata Parser**
```javascript
async function fetchMetadata(tokenURI)
```
- Handles IPFS URLs (ipfs://, https://ipfs.io, https://gateway.pinata.cloud)
- Parses JSON metadata
- Extracts name, description, image, attributes

#### 4. **Insights Loader**
```javascript
async function fetchInsights(nftAddress, tokenId, insightsCollection)
```
- Queries admin_nft_insights collection
- Hierarchy: NFT-specific → Collection-level → Default
- Returns curated metadata and project info

#### 5. **Main Sync Function**
```javascript
async function syncMarketplaceData()
```
- Orchestrates entire sync process
- Handles updates vs new insertions
- Implements retry logic

---

## Data Sources

### 1. TheGraph Subgraph (Marketplace Events)

**Endpoint**: `process.env.NEXT_PUBLIC_SUBGRAPH_URL`

**Query**:
```graphql
{
  itemListeds(first: 1000, orderBy: blockTimestamp, orderDirection: desc) {
    id
    listingId
    nftAddress
    tokenId
    seller
    buyer
    price
    desiredNftAddress
    desiredTokenId
    blockNumber
    blockTimestamp
    transactionHash
  }
  itemBoughts(first: 1000) { ... }
  itemCanceleds(first: 1000) { ... }
}
```

**Provides**:
- Listing ID
- NFT address and token ID
- Seller and buyer addresses
- Price (in Wei as string)
- Trade details (desired NFT)
- Blockchain metadata (block, timestamp, tx hash)

### 2. Ethereum Sepolia Blockchain (Contract Data)

**Network**: Ethereum Sepolia Testnet
**Chain ID**: 11155111
**RPC**: Alchemy (`process.env.ALCHEMY_URL`)

**Smart Contract Calls**:
```javascript
// ERC721 Standard Functions
contract.name()                    // Contract name
contract.symbol()                  // Contract symbol
contract.ownerOf(tokenId)         // Current owner
contract.tokenURI(tokenId)        // Metadata URI
contract.totalSupply()            // Total NFTs in collection
contract.balanceOf(owner)         // Owner's NFT count
contract.getApproved(tokenId)     // Approved marketplace address
```

**Provides**:
- Contract information (name, symbol, supply)
- Ownership data (current owner, balance)
- Token URI for metadata fetching
- Marketplace approval status

### 3. IPFS (NFT Metadata)

**Gateways Used**:
- `https://ipfs.io/ipfs/{hash}`
- `https://gateway.pinata.cloud/ipfs/{hash}`
- Direct IPFS URI parsing

**Metadata Format** (ERC721 Standard):
```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://Qm.../image.png",
  "animation_url": "ipfs://Qm.../animation.mp4",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue",
      "display_type": "string"
    }
  ]
}
```

**Provides**:
- Display name and description
- Image and animation URLs
- External links
- NFT attributes/traits

### 4. MongoDB admin_nft_insights (Curated Data)

**Collection**: `admin_nft_insights`

**Query Logic** (Hierarchy):
```javascript
// 1. Try NFT-specific insight
{ nftAddress: "0x...", tokenId: "123" }

// 2. Fallback to collection-level
{ nftAddress: "0x...", tokenId: "" }

// 3. Use default if none found
```

**Schema**:
```javascript
{
  nftAddress: String,
  tokenId: String,  // "" for collection-level
  customTitle: String,
  category: String,
  tags: [String],
  rarity: String,
  cardDescriptions: [String],
  projectDescriptions: Object,
  functionalitiesDescriptions: Object,
  projectWebsite: String,
  projectTwitter: String,
  projectDiscord: String,
  partnerships: [String]
}
```

**Provides**:
- Custom titles and categories
- Rarity classification
- Card descriptions for UI
- Project information and links
- Tags for filtering

---

## Sync Process Steps

### Detailed Step-by-Step

#### Step 1: Connect to MongoDB
```javascript
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db('test');
const collection = db.collection('marketplace_items');
const insightsCollection = db.collection('admin_nft_insights');
```

#### Step 2: Query TheGraph for Marketplace Events
```javascript
const itemListeds = await querySubgraph(ITEMS_LISTED_QUERY);
const itemBoughts = await querySubgraph(ITEMS_BOUGHT_QUERY);
const itemCanceleds = await querySubgraph(ITEMS_CANCELED_QUERY);
```

**Processing Logic**:
- `ItemListed` → NFT is available for sale
- `ItemBought` → NFT was purchased (mark as not listed)
- `ItemCanceled` → Listing was cancelled (mark as not listed)

#### Step 3: Build Listing Map
```javascript
const listingMap = new Map();

// Add active listings
itemListeds.forEach(item => {
  const key = `${item.nftAddress}-${item.tokenId}`;
  listingMap.set(key, { ...item, isListed: true });
});

// Mark bought items as not listed
itemBoughts.forEach(item => {
  const key = `${item.nftAddress}-${item.tokenId}`;
  if (listingMap.has(key)) {
    listingMap.get(key).isListed = false;
  }
});

// Mark cancelled items as not listed
itemCanceleds.forEach(item => {
  const key = `${item.nftAddress}-${item.tokenId}`;
  if (listingMap.has(key)) {
    listingMap.get(key).isListed = false;
  }
});
```

#### Step 4: For Each NFT - Fetch Contract Data
```javascript
const contractInfo = await fetchContractInfo(nftAddress, tokenId);
```

**What it fetches**:
- Owner address
- Token URI (IPFS link to metadata)
- Contract name and symbol
- Total supply
- Owner balance
- Approved marketplace address

**Error Handling**:
- Retries 3 times on failure
- Logs errors but continues with other NFTs
- Returns partial data if some calls fail

#### Step 5: For Each NFT - Parse IPFS Metadata
```javascript
const metadata = await fetchMetadata(contractInfo.tokenURI);
```

**Process**:
1. Convert `ipfs://` to HTTPS gateway URL
2. Fetch JSON from IPFS
3. Parse and validate structure
4. Extract all metadata fields
5. Handle missing fields gracefully

**Fallback**:
- If IPFS fetch fails, use empty metadata
- Logs warning but continues

#### Step 6: For Each NFT - Load Insights
```javascript
const insights = await fetchInsights(nftAddress, tokenId, insightsCollection);
```

**Hierarchy**:
1. **NFT-Specific**: Try exact match (address + tokenId)
2. **Collection-Level**: Try collection match (address + tokenId="")
3. **Default**: Return empty insights object

#### Step 7: Build Complete NFT Document
```javascript
const nftDocument = {
  // Core identification
  nftAddress: item.nftAddress.toLowerCase(),
  tokenId: item.tokenId,
  listingId: item.listingId || null,

  // Marketplace data
  marketplace: {
    listingId: item.listingId || null,
    isListed: item.isListed ?? false,
    price: parseFloat(item.price) || 0,  // Convert to number!
    seller: item.seller?.toLowerCase() || null,
    buyer: item.buyer?.toLowerCase() || null,
    desiredNftAddress: item.desiredNftAddress?.toLowerCase() || null,
    desiredTokenId: item.desiredTokenId || null
  },

  // IPFS metadata
  metadata: {
    name: metadata.name || `NFT #${item.tokenId}`,
    description: metadata.description || null,
    image: metadata.image || null,
    animationUrl: metadata.animation_url || null,
    externalUrl: metadata.external_url || null,
    attributes: metadata.attributes || []
  },

  // Contract data
  contract: {
    owner: contractInfo.owner?.toLowerCase() || null,
    tokenURI: contractInfo.tokenURI || null,
    contractName: contractInfo.contractName || null,
    contractSymbol: contractInfo.contractSymbol || null,
    totalSupply: contractInfo.totalSupply || null,
    ownerBalance: contractInfo.ownerBalance || null,
    approvedAddress: contractInfo.approvedAddress?.toLowerCase() || null
  },

  // Insights
  insights: {
    customTitle: insights.customTitle || null,
    category: insights.category || null,
    tags: insights.tags || [],
    rarity: insights.rarity || null,
    cardDescriptions: insights.cardDescriptions || null,
    projectDescriptions: insights.projectDescriptions || null,
    functionalitiesDescriptions: insights.functionalitiesDescriptions || null,
    projectWebsite: insights.projectWebsite || null,
    projectTwitter: insights.projectTwitter || null,
    projectDiscord: insights.projectDiscord || null,
    partnerships: insights.partnerships || null
  },

  // Data quality flags
  dataQuality: {
    hasMetadata: !!metadata.name,
    hasInsights: !!insights.category,
    metadataSource: metadata.name ? 'ipfs' : 'none'
  },

  // Timestamps
  createdAt: new Date(),
  lastUpdated: new Date(),
  metadataLastUpdated: metadata.name ? new Date() : null,
  insightsLastUpdated: insights.category ? new Date() : null
};
```

#### Step 8: Smart Update Logic
```javascript
const existing = await collection.findOne({
  nftAddress: nftDocument.nftAddress,
  tokenId: nftDocument.tokenId
});

if (existing) {
  // EXISTING NFT - Smart Update
  // Keep existing metadata, only update marketplace/contract data
  
  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        // Update marketplace data (price, listing status)
        'marketplace.listingId': nftDocument.marketplace.listingId,
        'marketplace.isListed': nftDocument.marketplace.isListed,
        'marketplace.price': nftDocument.marketplace.price,
        'marketplace.seller': nftDocument.marketplace.seller,
        
        // Update contract data (owner, approval)
        'contract.owner': nftDocument.contract.owner,
        'contract.approvedAddress': nftDocument.contract.approvedAddress,
        'contract.ownerBalance': nftDocument.contract.ownerBalance,
        
        // Update timestamp
        lastUpdated: new Date()
      },
      // Preserve existing metadata and insights!
      $setOnInsert: {
        metadata: existing.metadata,
        insights: existing.insights,
        createdAt: existing.createdAt
      }
    }
  );
} else {
  // NEW NFT - Full Insert
  await collection.insertOne(nftDocument);
}
```

**Why Smart Updates?**
- ✅ Preserves manually curated metadata
- ✅ Preserves expensive IPFS fetches
- ✅ Only updates dynamic data (price, owner, listing status)
- ✅ Faster execution (no redundant IPFS calls)

#### Step 9: Log Results
```javascript
console.log(`✅ Synced ${listingArray.length} NFTs to MongoDB`);
console.log(`📊 Active listings: ${activeCount}`);
console.log(`📊 Sold/Cancelled: ${inactiveCount}`);
```

---

## Data Structure

### MongoDB Collection: marketplace_items

**Schema**: `EnrichedNFTDocument` (see `src/types/marketplace/enriched-nft.ts`)

```typescript
{
  _id: ObjectId,
  
  // Core identification
  nftAddress: string,        // Contract address (lowercase)
  tokenId: string,           // Token ID
  listingId: string | null,  // Marketplace listing ID
  
  // Marketplace data (from TheGraph)
  marketplace: {
    listingId: string | null,
    isListed: boolean,
    price: number,            // Wei as NUMBER (for sorting!)
    seller: string | null,
    buyer: string | null,
    desiredNftAddress: string | null,
    desiredTokenId: string | null
  },
  
  // Metadata (from IPFS)
  metadata: {
    name: string,
    description: string | null,
    image: string | null,
    animationUrl: string | null,
    externalUrl: string | null,
    attributes: Array<{
      trait_type: string,
      value: any,
      display_type?: string
    }>
  },
  
  // Contract data (from blockchain)
  contract: {
    owner: string | null,
    tokenURI: string | null,
    contractName: string | null,
    contractSymbol: string | null,
    totalSupply: number | null,
    ownerBalance: number | null,
    approvedAddress: string | null
  },
  
  // Insights (from admin_nft_insights)
  insights: {
    customTitle: string | null,
    category: string | null,
    tags: string[],
    rarity: string | null,
    cardDescriptions: string[] | null,
    projectDescriptions: any | null,
    functionalitiesDescriptions: any | null,
    projectWebsite: string | null,
    projectTwitter: string | null,
    projectDiscord: string | null,
    partnerships: string[] | null
  },
  
  // Data quality
  dataQuality: {
    hasMetadata: boolean,
    hasInsights: boolean,
    metadataSource: 'ipfs' | 'cache' | 'none'
  },
  
  // Timestamps
  createdAt: Date,
  lastUpdated: Date,
  metadataLastUpdated: Date | null,
  insightsLastUpdated: Date | null
}
```

### Important Notes

#### Price Format
```javascript
// ❌ WRONG - String causes alphabetic sorting
marketplace.price: "1000000000000000"  // "2.5" sorts before "100"

// ✅ CORRECT - Number enables numerical sorting
marketplace.price: parseFloat(item.price) || 0
```

#### Address Format
```javascript
// All addresses stored as lowercase for consistent queries
nftAddress: item.nftAddress.toLowerCase()
seller: item.seller?.toLowerCase() || null
```

#### Collection-Level Insights
```javascript
// tokenId = "" means collection-wide insight
{
  nftAddress: "0x123...",
  tokenId: "",  // Empty string = applies to all tokens
  category: "Art",
  rarity: "Common"
}
```

---

## Configuration

### Environment Setup

**Required Variables** (`.env.local`):
```bash
# TheGraph Subgraph
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../marketplace-subgraph/version/latest

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Alchemy RPC (Ethereum Sepolia)
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Alternative: Generic RPC
JSON_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
```

### Network Configuration

```javascript
// Current: Ethereum Sepolia Testnet
const { sepolia } = require('viem/chains');

// Chain ID: 11155111
// RPC: Alchemy or Infura
```

**Why Sepolia?**
- ✅ Stable testnet (successor to Rinkeby/Goerli)
- ✅ Free Alchemy tier sufficient
- ✅ Active NFT ecosystem for testing
- ✅ Compatible with TheGraph subgraphs

### IPFS Configuration

```javascript
// Primary gateway
https://ipfs.io/ipfs/{hash}

// Fallback gateway
https://gateway.pinata.cloud/ipfs/{hash}

// Timeout: 10 seconds
// Retry: 3 attempts
```

---

## Running the Sync

### Manual Execution

```bash
# One-time sync
node scripts/sync-marketplace-data.js

# With output
node scripts/sync-marketplace-data.js 2>&1 | tee sync.log
```

### Automatic Execution (Production)

**Server Boot Hook**:
```javascript
// Auto-start on Next.js server initialization
// Location: server startup code

// Polling interval: 30 seconds
setInterval(async () => {
  await syncMarketplaceData();
}, 30000);
```

### Cron Job (Alternative)

```bash
# Every 30 seconds
* * * * * cd /path/to/project && node scripts/sync-marketplace-data.js
* * * * * sleep 30 && cd /path/to/project && node scripts/sync-marketplace-data.js
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Error: Could not connect to MongoDB
```

**Solution**:
- Check `MONGODB_URI` in `.env.local`
- Verify IP whitelist in MongoDB Atlas
- Test connection: `mongosh "mongodb+srv://..."`

#### 2. RPC Connection Failed
```
Error: Failed to fetch contract data
```

**Solution**:
- Check `ALCHEMY_URL` is set
- Verify API key is valid
- Check rate limits (free tier: 300 req/sec)
- Try alternative RPC: `JSON_RPC_URL`

#### 3. IPFS Timeout
```
Warning: IPFS fetch timed out for tokenURI...
```

**Solution**:
- IPFS gateways can be slow
- Script continues with empty metadata
- Retry will fetch on next sync
- Consider running gateway locally

#### 4. Subgraph Error
```
Error: Subgraph query failed
```

**Solution**:
- Check `NEXT_PUBLIC_SUBGRAPH_URL`
- Verify subgraph is deployed and synced
- Check TheGraph Studio dashboard
- Ensure query syntax is correct

#### 5. Price Sorting Wrong
```
NFTs sort: 26T, 2.6T, 100P (wrong!)
```

**Solution**:
- Check prices are stored as numbers, not strings
- Run: `node scripts/dev/test-sort.js` to verify
- Re-sync if needed to convert strings to numbers

### Debug Mode

```javascript
// Enable verbose logging
console.log('🔍 Debug:', {
  nftAddress,
  tokenId,
  contractInfo,
  metadata,
  insights
});
```

### Verification

```bash
# Check data structure
node scripts/dev/check-data-structure.js

# Verify stats separation
node scripts/dev/verify-stats-separation.js

# Test MongoDB sorting
node scripts/dev/test-sort.js

# Check NFT stats
node scripts/dev/check-nft-stats.js
```

---

## Performance Metrics

### Current Stats
- **Total NFTs**: 65 in database
- **Active Listings**: 61
- **Sync Time**: ~30-60 seconds (full sync)
- **Update Time**: ~5-10 seconds (incremental)

### Bottlenecks
1. **IPFS Gateway** - Can be slow (5-10s per fetch)
2. **Smart Contract Calls** - ~200ms per NFT (7 calls each)
3. **MongoDB Writes** - Minimal (~10ms per document)

### Optimizations Applied
- ✅ Parallel contract calls (Promise.all)
- ✅ Smart updates (skip unchanged data)
- ✅ IPFS caching (preserve existing metadata)
- ✅ Connection pooling (MongoDB)
- ✅ Retry logic with exponential backoff

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor sync logs for errors
- Check active listing count

**Weekly**:
- Verify data quality flags
- Review IPFS gateway performance

**Monthly**:
- Cleanup old/invalid listings
- Update indexes if schema changes

### Monitoring

```bash
# Check last sync time
db.marketplace_items.find().sort({lastUpdated: -1}).limit(1)

# Count active listings
db.marketplace_items.countDocuments({'marketplace.isListed': true})

# Find NFTs without metadata
db.marketplace_items.find({'dataQuality.hasMetadata': false})

# Find NFTs without insights
db.marketplace_items.find({'dataQuality.hasInsights': false})
```

---

## Related Documentation

- **[API Documentation](./API.md)** - API endpoints and usage
- **[Architecture](./ARCHITECTURE.md)** - System architecture
- **[Development Guide](./DEVELOPMENT.md)** - Development setup
- **[Scripts Overview](../scripts/README.md)** - All available scripts

---

## Summary

The marketplace sync script is a **robust, production-ready system** that:

✅ Fetches data from 4 sources (TheGraph, Blockchain, IPFS, MongoDB)
✅ Handles errors gracefully with retry logic
✅ Implements smart updates to preserve data
✅ Uses numerical price format for correct sorting
✅ Supports NFT-specific and collection-level insights
✅ Auto-runs every 30 seconds in production
✅ Currently syncing 61 active NFT listings

**Result**: A complete, enriched NFT marketplace database ready for querying and display.

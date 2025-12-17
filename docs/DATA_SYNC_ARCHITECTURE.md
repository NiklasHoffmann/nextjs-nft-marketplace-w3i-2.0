# Data Sync Architecture - Optimized Plan

## 📊 Data Sources & Update Strategy

### 1. TheGraph Subgraph Sync (CRITICAL - Real-time)
**Source:** TheGraph v2 Subgraph  
**Target:** `marketplace_items` collection  
**Frequency:** Every 30 seconds (keep current)  
**Priority:** HIGHEST

**What to sync:**
- ✅ listingId, chainId, tokenAddress, tokenId
- ✅ seller, price, active, status
- ✅ buyerWhitelistEnabled, desiredTokenAddress, desiredTokenId
- ✅ createdAt, updatedAt

**What NOT to sync here:**
- ❌ owner (comes from blockchain)
- ❌ approved (comes from blockchain)
- ❌ metadata (comes from IPFS, stored in nft_metadata)
- ❌ insights (separate collection: admin_nft_insights)
- ❌ stats (separate collection: nft_stats)

**Actions:**
```typescript
graph-subscription-v2.ts:
1. Poll subgraph every 30s
2. Upsert to marketplace_items (listing data ONLY)
3. For NEW listings: Trigger immediate blockchain sync (owner + approved)
4. For UPDATED listings: Trigger blockchain sync if seller changed
```

---

### 2. Blockchain State Sync (ON-DEMAND)
**Source:** Blockchain RPC  
**Target:** `marketplace_items` (approved), `nft_metadata` (owner, approved)  
**Frequency:** ON-DEMAND (not scheduled!)  
**Priority:** HIGH (when needed)

**When to sync:**
1. ✅ New listing detected (immediately)
2. ✅ NFT detail page loaded (if data older than 5min)
3. ✅ User clicks "Refresh" button
4. ✅ Before listing creation (ensure current state)

**What to fetch:**
- `owner` via `ownerOf(tokenId)`
- `approved` via `getApproved(tokenId)` or `isApprovedForAll(owner, marketplace)`

**Cache Strategy:**
- ❌ NO server-side cache for owner/approved
- ✅ Store in MongoDB with `lastSyncedAt` timestamp
- ✅ Client can cache for 30s max

**Implementation:**
```typescript
// NEW: blockchain-state-sync.ts
export async function syncBlockchainState(contractAddress: string, tokenId: string) {
    const owner = await publicClient.readContract({ functionName: 'ownerOf', ... });
    const approved = await publicClient.readContract({ functionName: 'getApproved', ... });
    
    // Update both collections
    await marketplaceItems.updateOne(
        { contractAddress, tokenId },
        { $set: { approved, lastSyncedAt: new Date() } }
    );
    
    await nftMetadata.updateOne(
        { contractAddress, tokenId },
        { $set: { 'blockchain.owner': owner, 'blockchain.approved': approved, updatedAt: new Date() } }
    );
}
```

---

### 3. IPFS Metadata Sync (ONE-TIME)
**Source:** IPFS (via tokenURI)  
**Target:** `nft_metadata` collection  
**Frequency:** ONCE (then cached forever)  
**Priority:** LOW (can be lazy-loaded)

**What to sync:**
- ✅ name, description, image
- ✅ attributes, external_url
- ✅ animation_url, background_color

**Cache Strategy:**
- ✅ Infinite cache (IPFS is immutable)
- ✅ Only fetch if `metadata` field is missing in nft_metadata
- ✅ Store in `nft_metadata.metadata` (separate from blockchain data)

**Implementation:**
```typescript
// Check if metadata exists
const existing = await nftMetadata.findOne({ contractAddress, tokenId, 'metadata.name': { $exists: true } });

if (!existing) {
    // Fetch from IPFS (one-time)
    const tokenURI = await getTokenURI(contractAddress, tokenId);
    const metadata = await fetchIPFSMetadata(tokenURI);
    
    await nftMetadata.updateOne(
        { contractAddress, tokenId },
        { $set: { metadata, metadataFetchedAt: new Date() } },
        { upsert: true }
    );
}
```

---

### 4. Insights (Admin-Managed)
**Source:** Admin API (`/api/admin/insights`)  
**Target:** `admin_nft_insights` collection (SEPARATE!)  
**Frequency:** ON-DEMAND (only when admin changes)  
**Priority:** LOW

**What to store:**
- ✅ category, subcategory, rarity
- ✅ tags[], featured, priority
- ✅ customTitle, customDescription, customImage
- ✅ tokenId (optional: null = collection-wide, set = item-specific)

**Why separate collection?**
- ✅ Collection-wide + item-specific insights work seamlessly
- ✅ No data duplication needed
- ✅ Simple $lookup with fallback logic in APIs
- ✅ Admin UI stays simple

**No automatic sync needed** - only updated via admin actions.

---

### 5. Stats (User Interactions)
**Source:** User actions (views, likes, watchlist)  
**Target:** `nft_stats` collection (separate!)  
**Frequency:** Real-time (on each action)  
**Priority:** MEDIUM

**What to track:**
- ✅ viewCount (increment on page view)
- ✅ likeCount (increment/decrement on like/unlike)
- ✅ watchlistCount (increment/decrement on add/remove)
- ✅ lastViewedAt, lastLikedAt

**Implementation:**
```typescript
// On NFT detail page view
await nftStats.updateOne(
    { contractAddress, tokenId },
    { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
    { upsert: true }
);
```

---

## 🏗️ New Architecture

### MongoDB Collections

#### `marketplace_items` - Listing Data + Quick Access Fields
```typescript
{
    listingId: string,
    chainId: number,
    contractAddress: string,
    tokenId: string,
    
    // Subgraph data (updated every 30s)
    seller: string,
    price: string,
    active: boolean,
    status: string,
    buyerWhitelistEnabled: boolean,
    desiredTokenAddress: string,
    desiredTokenId: string,
    createdAt: Date,
    updatedAt: Date,
    
    // Blockchain data (on-demand)
    approved: string,  // Quick access (duplicated from nft_metadata)
    lastSyncedAt: Date,  // When was blockchain data last fetched?
    
    // Timestamps
    syncedAt: Date  // When was listing data synced from subgraph?
}
```

#### `nft_metadata` - NFT Blockchain & IPFS Data
```typescript
{
    contractAddress: string,
    tokenId: string,
    
    // Blockchain data (on-demand)
    blockchain: {
        owner: string,
        approved: string,
        tokenURI: string,
        contractName: string,
        contractSymbol: string,
        lastSyncedAt: Date
    },
    
    // IPFS data (one-time fetch)
    metadata: {
        name: string,
        description: string,
        image: string,
        attributes: Array,
        external_url: string
    },
    metadataFetchedAt: Date,
    
    createdAt: Date,
    updatedAt: Date
}
```

#### `admin_nft_insights` - Admin-Managed Insights (SEPARATE!)
```typescript
{
    contractAddress: string,
    tokenId?: string,  // Optional: null/missing = collection-wide, set = item-specific
    
    // Admin insights
    category: string,
    subcategory: string,
    rarity: string,
    tags: string[],
    featured: boolean,
    priority: number,
    customTitle: string,
    customDescription: string,
    customImage: string,
    
    createdAt: Date,
    updatedAt: Date
}
```

**Why separate?**
- ✅ Collection-wide insights (contractAddress only) work seamlessly
- ✅ Item-specific insights (contractAddress + tokenId) work in parallel
- ✅ Simple $lookup in APIs with fallback logic
- ✅ No data duplication needed
- ✅ Admin UI stays simple

#### `nft_stats` - User Interactions (separate for performance)
```typescript
{
    contractAddress: string,
    tokenId: string,
    viewCount: number,
    likeCount: number,
    watchlistCount: number,
    lastViewedAt: Date,
    lastLikedAt: Date,
    updatedAt: Date
}
```

---

## 🔄 Sync Services

### ✅ KEEP (with modifications)
1. **graph-subscription-v2.ts** - Subgraph polling (30s)
   - Remove: metadata/approval fetching
   - Add: Trigger blockchain-state-sync for new listings

2. **marketplace-sync API** - Manual sync trigger
   - Keep current implementation

### ❌ REMOVE/REPLACE
1. **metadata-sync.ts** - DELETE
   - Too slow, mixes concerns
   - Replace with on-demand blockchain-state-sync

### 🆕 CREATE NEW
1. **blockchain-state-sync.ts** - On-demand blockchain data
   - Fetch owner + approved when needed
   - No scheduled runs
   - Called by:
     - graph-subscription-v2 (new listings)
     - NFT detail page API (if stale)
     - Listing creation API (before creating)

2. **ipfs-metadata-sync.ts** - Lazy IPFS fetching
   - Only fetch if missing
   - Called by NFT detail page API
   - Infinite cache

---

## 📡 API Routes Updates

### `/api/marketplace/items` (Marketplace listing)
```typescript
// Return data from marketplace_items + nft_metadata (join)
// No blockchain fetch - use cached approved from marketplace_items
// If no metadata, lazy-load from nft_metadata

const items = await marketplaceItems.aggregate([
    { $match: { active: true } },
    {
        $lookup: {
            from: 'nft_metadata',
            localField: 'contractAddress',
            foreignField: 'contractAddress',
            let: { tokenId: '$tokenId' },
            pipeline: [
                { $match: { $expr: { $eq: ['$tokenId', '$$tokenId'] } } }
            ],
            as: 'metadata'
        }
    },
    { $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true } }
]);
```

### `/api/nft/[contractAddress]/[tokenId]` (NFT Detail)
```typescript
// 1. Get from nft_metadata
// 2. If blockchain data is stale (>5min), fetch fresh
// 3. If IPFS metadata missing, fetch from IPFS
// 4. Join with nft_stats

const nft = await nftMetadata.findOne({ contractAddress, tokenId });

// Check if blockchain data is stale
if (!nft?.blockchain?.lastSyncedAt || isOlderThan(nft.blockchain.lastSyncedAt, 5 * 60 * 1000)) {
    await syncBlockchainState(contractAddress, tokenId);
    nft = await nftMetadata.findOne({ contractAddress, tokenId });
}

// Lazy-load IPFS metadata if missing
if (!nft?.metadata?.name) {
    await fetchAndStoreIPFSMetadata(contractAddress, tokenId);
    nft = await nftMetadata.findOne({ contractAddress, tokenId });
}

// Join with stats
const stats = await nftStats.findOne({ contractAddress, tokenId });

return { ...nft, stats };
```

---

## ⚡ Performance Benefits

1. **Faster marketplace loading** - No metadata/approval fetching during sync
2. **Accurate blockchain state** - Fetched on-demand when needed
3. **No unnecessary IPFS calls** - Only fetch once, cache forever
4. **Scalable stats** - Separate collection, can shard by popularity
5. **Clear separation of concerns** - Each data type has its own sync strategy

---

## 🚀 Migration Plan

### Phase 1: Create new sync service
1. Create `blockchain-state-sync.ts`
2. Create `ipfs-metadata-lazy-sync.ts`
3. Update `graph-subscription-v2.ts` to trigger blockchain sync

### Phase 2: Update API routes
1. Update `/api/marketplace/items` (remove metadata-sync dependency)
2. Update `/api/nft/[contractAddress]/[tokenId]` (on-demand sync)
3. Update listing creation API (ensure fresh blockchain state)

### Phase 3: Clean up
1. Remove `metadata-sync.ts`
2. Remove metadata sync from marketplace sync API
3. Remove unnecessary caches
4. Update MongoDB indexes

### Phase 4: Test
1. Test marketplace loading (should be faster)
2. Test NFT detail page (should show current owner/approved)
3. Test listing creation (should have correct approval)
4. Monitor sync performance

---

## 📝 Summary

**Old Architecture Problems:**
- ❌ metadata-sync runs every 30s for ALL NFTs (slow, wasteful)
- ❌ 2h cache for metadata API (stale approved data)
- ❌ Mixed static (IPFS) and dynamic (blockchain) data in one sync
- ❌ No clear separation of concerns

**New Architecture Benefits:**
- ✅ Subgraph sync: Only listing data (fast)
- ✅ Blockchain state: On-demand (accurate)
- ✅ IPFS metadata: One-time fetch (efficient)
- ✅ Clear data ownership (each collection has specific responsibility)
- ✅ Faster marketplace, accurate NFT details

# API Migration Guide - Optimized Data Sync

## 🎯 Overview

This guide documents the migration from old marketplace APIs to the new optimized data sync architecture.

## 📊 API Comparison

### ❌ OLD API (Deprecated)
```typescript
GET /api/marketplace/nft/[contractAddress]/[tokenId]
```

**Problems:**
- ❌ No on-demand blockchain sync
- ❌ `approved` data may be stale
- ❌ No cache control
- ❌ Always queries marketplace_items first

**Response Structure:**
```typescript
{
  success: true,
  data: {
    contractAddress: string,
    tokenId: string,
    marketplace: { ... },
    metadata: { ... },
    contract: {
      approved: string  // ← May be stale!
    },
    insights: { ... }
  }
}
```

---

### ✅ NEW API (Optimized)
```typescript
GET /api/nft/detail?contractAddress=...&tokenId=...&refresh=true
```

**Benefits:**
- ✅ On-demand blockchain sync (owner + approved)
- ✅ 5 minute cache with smart refresh
- ✅ Lazy-loads IPFS metadata
- ✅ Always fresh blockchain state
- ✅ Works for listed AND unlisted NFTs

**Response Structure:**
```typescript
{
  contractAddress: string,
  tokenId: string,
  
  metadata: {
    name: string,
    description: string,
    image: string,
    attributes: Array
  },
  
  contract: {
    name: string,
    symbol: string,
    tokenURI: string
  },
  
  blockchain: {
    owner: string,           // ← Always fresh!
    approved: string,        // ← Always fresh!
    isApprovedForAll: boolean,
    lastSyncedAt: Date      // ← Know when synced
  },
  
  marketplace: {
    listingId: string | null,
    price: string | null,
    seller: string | null,
    active: boolean
  },
  
  insights: { ... },
  stats: { ... },
  
  cached: boolean,          // ← Was it from cache?
  loadTime: number          // ← Performance metric
}
```

---

## 🔄 Migration Steps

### 1. Update Hook Usage

**Before:**
```typescript
// Old hook (deprecated)
const { nft, loading } = useNFTDetail({
  contractAddress,
  tokenId
});

// approved data may be stale!
const approved = nft?.contract?.approved;
```

**After:**
```typescript
// New hook (optimized)
const { nft, loading } = useNFTDetail({
  contractAddress,
  tokenId
});

// approved is always fresh (max 5min old)
const approved = nft?.contract?.approved;

// Force refresh if needed
const { refetch } = useNFTDetail({ ... });
await refetch(); // Fresh blockchain data!
```

### 2. Update Direct API Calls

**Before:**
```typescript
const response = await fetch(
  `/api/marketplace/nft/${contractAddress}/${tokenId}`
);
const data = await response.json();
const approved = data.data.contract.approved; // Stale!
```

**After:**
```typescript
const response = await fetch(
  `/api/nft/detail?contractAddress=${contractAddress}&tokenId=${tokenId}&refresh=true`
);
const data = await response.json();
const approved = data.blockchain.approved; // Fresh!
```

### 3. Handle New Response Structure

**Key Changes:**
- `contract.approved` → `blockchain.approved`
- `contract.owner` → `blockchain.owner`
- Added `blockchain.lastSyncedAt` (know freshness)
- Added `cached` flag (was it from cache?)
- Added `loadTime` (performance tracking)

---

## 🎯 Use Cases

### Use Case 1: NFT Detail Page
**Requirement:** Show current owner and approval status

```typescript
const { nft } = useNFTDetail({ contractAddress, tokenId });

// Blockchain state auto-refreshed if > 5min old
const owner = nft?.blockchain?.owner;
const approved = nft?.blockchain?.approved;
const lastSynced = nft?.blockchain?.lastSyncedAt;
```

### Use Case 2: Listing Creation
**Requirement:** Check approval before creating listing

```typescript
// Force fresh data
const response = await fetch(
  `/api/nft/detail?contractAddress=${contractAddress}&tokenId=${tokenId}&refresh=true`
);
const data = await response.json();

if (data.blockchain.approved !== MARKETPLACE_ADDRESS) {
  // Show approval required message
}
```

### Use Case 3: Marketplace Browsing
**Requirement:** Fast loading, stale data acceptable

```typescript
// Use /api/marketplace/items (existing endpoint)
// No blockchain sync needed for browsing
// approved may be stale, but that's OK for listing view
```

---

## 📈 Performance Impact

### Old Architecture
```
NFT Detail Page Load:
1. Fetch from /api/marketplace/nft (200ms)
2. Data may be stale
3. No refresh mechanism
Total: ~200ms (but stale data)
```

### New Architecture
```
NFT Detail Page Load (Fresh Data):
1. Fetch from /api/nft/detail (50ms from DB)
2. Check if stale (>5min)
3. If stale: Blockchain sync (500ms)
4. Return fresh data
Total: ~550ms (guaranteed fresh)

NFT Detail Page Load (Cached):
1. Fetch from /api/nft/detail (50ms from DB)
2. Data is fresh (<5min)
3. Return immediately
Total: ~50ms (10x faster!)
```

---

## 🚀 Migration Checklist

### Completed ✅
- [x] Created `/api/nft/detail` endpoint
- [x] Created `blockchain-state-sync` service
- [x] Created `ipfs-metadata-lazy-sync` service
- [x] Updated `useNFTDetail` hook
- [x] Marked old API as deprecated
- [x] Updated documentation

### Remaining 🔄
- [ ] Migrate all direct API calls to new endpoint
- [ ] Update components using old data structure
- [ ] Add migration warnings in old API responses
- [ ] Monitor performance metrics
- [ ] Remove old API after migration complete

---

## ⚠️ Breaking Changes

### Response Structure Changes
```typescript
// OLD
{
  success: true,
  data: {
    contract: {
      approved: string  // ← HERE
    }
  }
}

// NEW
{
  blockchain: {
    approved: string  // ← MOVED
  }
}
```

### Cache Behavior Changes
- **Old:** No cache control, always stale after first fetch
- **New:** 5 minute smart cache, auto-refreshes when stale

---

## 📝 Best Practices

### When to Use New API
✅ NFT detail pages (need fresh data)
✅ Listing creation (need approval check)
✅ User wallet view (need current owner)
✅ Admin tools (need accurate state)

### When Old API is OK
⚠️ Marketplace browsing (stale OK)
⚠️ Search results (stale OK)
⚠️ Analytics (stale OK)

### Force Refresh Strategy
```typescript
// Only force refresh when user explicitly needs it
<button onClick={() => refetch()}>
  Refresh Blockchain Data
</button>

// Don't force refresh on every page load!
// Let the 5min cache work
```

---

## 🐛 Troubleshooting

### Issue: approved still shows old value
**Solution:** Force refresh with `?refresh=true`

### Issue: Slow page loads
**Check:** Are you force-refreshing on every load?
**Solution:** Remove `refresh=true`, use cache

### Issue: 404 for unlisted NFTs
**Expected:** Old API only returns marketplace items
**Solution:** New API returns ALL NFTs (listed + unlisted)

---

## 📞 Support

For questions about the migration:
- Check DATA_SYNC_ARCHITECTURE.md
- Check DATA_SYNC_OPTIMIZATION_COMPLETE.md
- Review blockchain-state-sync.ts implementation

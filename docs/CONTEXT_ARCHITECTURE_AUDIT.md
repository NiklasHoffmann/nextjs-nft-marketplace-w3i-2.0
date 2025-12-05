# Context Architecture Audit 🔍

**Status:** ⚠️ REDUNDANTE API CALLS IDENTIFIZIERT  
**Date:** 2025-01-16  
**Priority:** HIGH - Performance Impact

---

## 🎯 Executive Summary

MongoDB `marketplace_items` collection enthält **COMPLETE enriched NFT data** (metadata + insights + contract + marketplace), aber das Frontend macht **redundante API calls** über NFTContext, die dieselben Daten von Blockchain/IPFS/admin_nft_insights holen.

---

## 📊 MongoDB Data Structure (marketplace_items)

### Complete Document Schema

```json
{
  "_id": "...",
  "tokenId": "359",
  "nftAddress": "0x41655ae49482de69eec8f6875c34a8ada01965e2",
  
  "metadata": {
    "name": "People of History #359",
    "description": "The People of History are...",
    "image": "https://ipfs.io/ipfs/Qm...",
    "animationUrl": null,
    "externalUrl": "https://...",
    "attributes": [
      { "trait_type": "Background", "value": "Arcade" },
      { "trait_type": "Body", "value": "Tracksuit" }
    ]
  },
  
  "insights": {
    "customTitle": null,
    "category": "Sports",
    "rarity": "epic",
    "tags": [],
    "cardDescriptions": ["Description 1", "Description 2"],
    "projectDescriptions": { "titleDescriptionPairs": [] },
    "functionalitiesDescriptions": { "titleDescriptionPairs": [] },
    "projectWebsite": null,
    "projectTwitter": null,
    "projectDiscord": null,
    "partnerships": []
  },
  
  "contract": {
    "owner": "0xf034e8ad11F249c8081d9da94852bE1734bc11a4",
    "tokenURI": "ipfs://QmVt9ZwL3kNbe2u1JRZ5beovUpiPstsVdUuATeDYkXCSTe",
    "contractName": "People of History - Bolivar",
    "contractSymbol": "PoHB",
    "totalSupply": 36,
    "ownerBalance": 28,
    "approvedAddress": "0x6B6825FbDA1dF2C890086E6E1F31f5D573788224"
  },
  
  "marketplace": {
    "listingId": "586",
    "isListed": true,
    "price": 6000000000000000,
    "seller": "0xf034e8ad11f249c8081d9da94852be1734bc11a4",
    "buyer": null,
    "desiredNftAddress": "0x0000000000000000000000000000000000000000",
    "desiredTokenId": "0"
  },
  
  "dataQuality": {
    "hasMetadata": true,
    "hasInsights": true,
    "metadataSource": "ipfs"
  },
  
  "lastSync": {
    "marketplace": "2025-11-13T18:22:31.250Z",
    "metadata": "2025-11-14T09:20:44.596Z",
    "insights": "2025-11-14T19:39:58.910Z",
    "validation": "2025-11-14T10:58:47.956Z"
  },
  
  "createdAt": "2025-11-16T11:01:34.995Z",
  "lastUpdated": "2025-11-16T11:44:56.695Z"
}
```

---

## 🔴 PROBLEM: Redundante Datenflüsse

### Current (Problematic) Flow

```
┌─────────────┐
│  TheGraph   │ (marketplace events)
└──────┬──────┘
       │
       ├─────────────────────────────┐
       │                             │
       v                             v
┌──────────────┐            ┌────────────────┐
│ useActiveItems│            │ MongoDB Sync   │
│   (GraphQL)   │            │ (Background)   │
└───────┬───────┘            └────────┬───────┘
        │                             │
        │ loadMultipleNFTs()          │ Stores to marketplace_items
        v                             v
┌──────────────────┐          ┌──────────────────┐
│   NFTContext     │          │ marketplace_items│ (COMPLETE DATA)
│  (925 lines)     │          │   Collection     │
└────────┬─────────┘          └──────────────────┘
         │                             ↑
         │ fetchNFTMetadata()          │ (SHOULD USE THIS!)
         │ fetchNFTInsights()          │
         │ fetchNFTStats()             │
         v                             │
┌─────────────────────┐                │
│  API Routes:        │                │
│  /api/nft/metadata  │────────────────┤ (REDUNDANT!)
│  /api/nft/insights  │────────────────┤ (REDUNDANT!)
│  /api/nft/stats     │                │
└──────────┬──────────┘                │
           │                           │
           │ Fetches from:             │
           │ - Blockchain (viem)       │
           │ - IPFS gateways           │
           │ - admin_nft_insights      │
           │                           │
           v                           │
    ┌──────────────┐                  │
    │  Components  │                  │
    │   NFTCard    │◄─────────────────┘
    └──────────────┘     MarketplaceCacheContext
                         (SHOULD BE ONLY PATH!)
```

### 🚨 REDUNDANCY Issues

1. **NFTContext** (925 lines)
   - Caches NFT data with 15min TTL
   - Makes API calls to `/api/nft/metadata`, `/api/nft/insights`
   - **Problem:** Data already in MongoDB!

2. **API Routes** (`/api/nft/metadata`, `/api/nft/insights`)
   - Fetch from Blockchain/IPFS/admin_nft_insights
   - **Problem:** `sync-marketplace-data.js` already did this!

3. **useActiveItems** hook
   - Calls `loadMultipleNFTs()` from NFTContext
   - **Problem:** Triggers API calls for data already synced

---

## ✅ OPTIMAL: Simplified Flow

```
┌─────────────┐
│  TheGraph   │ (marketplace events)
└──────┬──────┘
       │
       v
┌────────────────────┐
│  MongoDB Sync      │ (sync-marketplace-data.js)
│  (Background)      │
└──────┬─────────────┘
       │
       │ Fetches from:
       │ - TheGraph (marketplace events)
       │ - Blockchain (contract data via viem)
       │ - IPFS (metadata)
       │ - admin_nft_insights (insights)
       │
       v
┌──────────────────────┐
│  marketplace_items   │ (COMPLETE ENRICHED DATA)
│    Collection        │
└──────┬───────────────┘
       │
       │ /api/marketplace/items (read from MongoDB)
       v
┌────────────────────────┐
│ MarketplaceCacheContext│ (5min TTL)
└──────┬─────────────────┘
       │
       v
┌──────────────┐
│  Components  │
│   NFTCard    │
└──────────────┘
```

### ✅ Benefits

1. **Single Source of Truth:** MongoDB marketplace_items
2. **No Redundant API Calls:** Metadata/insights already synced
3. **Better Performance:** No Blockchain/IPFS calls on page load
4. **Simpler Architecture:** Eliminate NFTContext (925 lines)
5. **Faster Load Times:** Direct MongoDB queries vs API chains

---

## 📝 Context Layer Analysis

### Current Contexts (src/contexts/)

| Context | Lines | Purpose | Status |
|---------|-------|---------|--------|
| **NFTContext** | 925 | Caches NFT data, makes API calls | ⚠️ **REDUNDANT** |
| **NFTStatsContext** | ~400 | Manages social stats (favorites, ratings) | ✅ **KEEP** (separate collection) |
| **MarketplaceCacheContext** | ~300 | Caches marketplace_items | ✅ **KEEP** (primary data source) |
| **CurrencyContext** | ~200 | ETH/USD conversion | ✅ **KEEP** (price conversion) |
| **CartContext** | ~300 | Shopping cart | ✅ **KEEP** (UI state) |

### NFTContext Usage (IDENTIFIED)

```typescript
// src/components/nft/NFTCard.tsx (LINE 239)
const { nft: contextNFT, isLoading: contextLoading, refresh } = useModernNFT(
  nftAddress,
  tokenId,
  true
);

// src/hooks/nfts/nft-hooks-optimized.ts (LINE 14)
import { useModernNFT, useModernNFTContext } from '@/contexts/NFTContext';

// src/components/marketplace/ActiveItemsList.tsx (LINE 21)
import { useNFTContext } from '@/contexts/NFTContext';

// src/contexts/NFTStatsContext.tsx (LINE 21)
import { useNFTContext } from './NFTContext';

// src/components/admin/core/AdminNFTInsightsManager.tsx (LINE 98)
const nftContext = useNFTContext();
```

---

## 🔧 Refactoring Plan

### Phase 1: Analyze Dependencies ✅ DONE

- [x] Identify NFTContext usage across codebase
- [x] Verify marketplace_items has complete data
- [x] Check if stats come from separate collection (nft_stats)

### Phase 2: Create MongoDB-First API Route

**New:** `/api/marketplace/item/[address]/[tokenId]`

```typescript
// app/api/marketplace/item/[address]/[tokenId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string; tokenId: string } }
) {
  const collection = await getCollection('marketplace_items');
  
  const item = await collection.findOne({
    nftAddress: params.address.toLowerCase(),
    tokenId: params.tokenId
  });
  
  if (!item) {
    return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
  }
  
  // Return complete enriched data
  return NextResponse.json({
    metadata: item.metadata,
    insights: item.insights,
    contract: item.contract,
    marketplace: item.marketplace,
    dataQuality: item.dataQuality
  });
}
```

### Phase 3: Migrate Components

**Components to update:**

1. **NFTCard** (src/components/nft/NFTCard.tsx)
   - Remove `useModernNFT()` call
   - Use marketplace data directly (already has it from parent)
   - Keep `useNFTStatsContext()` for social stats

2. **useActiveItems** (src/hooks/nfts/nft-hooks-optimized.ts)
   - Remove `loadMultipleNFTs()` call
   - Data already enriched from GraphQL → MongoDB sync

3. **ActiveItemsList** (src/components/marketplace/ActiveItemsList.tsx)
   - Remove NFTContext import
   - Use MarketplaceCacheContext only

4. **AdminNFTInsightsManager**
   - Check if NFTContext usage can be removed
   - Might only need direct API calls for admin operations

### Phase 4: Remove Obsolete Code

**Files to REMOVE:**

- [ ] `src/contexts/NFTContext.tsx` (925 lines)
- [ ] `src/utils/api/nft.ts` (280+ lines)
- [ ] `/api/nft/metadata/route.ts` (if not used elsewhere)
- [ ] `/api/nft/insights/route.ts` (if not used elsewhere)

**Keep for backward compatibility during migration:**
- NFTStatsContext (separate nft_stats collection)
- MarketplaceCacheContext (primary data source)

---

## 🎯 Expected Performance Improvements

### Before (Current)

```
Page Load → useActiveItems (GraphQL) → loadMultipleNFTs (NFTContext)
  ↓
/api/nft/metadata (Blockchain RPC + IPFS fetch) ~2-5s per NFT
  ↓
/api/nft/insights (MongoDB query) ~100ms per NFT
  ↓
Component Render

Total: ~2-5 seconds per NFT (sequential API calls)
```

### After (Optimized)

```
Page Load → MongoDB (marketplace_items query) ~50-100ms for 20 NFTs
  ↓
MarketplaceCacheContext (5min TTL)
  ↓
Component Render

Total: ~100ms for ALL NFTs (single MongoDB query, already enriched)
```

### Metrics

- **Load Time:** 2-5s per NFT → 100ms for ALL NFTs (~95% faster)
- **API Calls:** 2-3 per NFT → 1 for all NFTs (bulk fetch)
- **Code Complexity:** -1200 lines (NFTContext + API utils removed)
- **Cache Efficiency:** Better (single source of truth)

---

## 🚨 Migration Risks & Mitigation

### Risk 1: NFTContext Used for Fresh Data

**Risk:** Components might rely on NFTContext for real-time blockchain data

**Mitigation:**
- Background sync runs every 30s
- For critical operations (buying/listing), trigger manual sync
- Add `refresh()` function to MarketplaceCacheContext

### Risk 2: Admin Tools Need Direct Access

**Risk:** Admin tools might need to fetch non-synced NFTs

**Mitigation:**
- Keep `/api/nft/metadata` and `/api/nft/insights` for admin-only use
- Add feature flag: `USE_MONGODB_CACHE` (default: true)
- Admin tools can bypass cache when needed

### Risk 3: Image URLs Might Change

**Risk:** IPFS gateway URLs cached in MongoDB might become stale

**Mitigation:**
- Sync script already handles gateway rotation
- Add health check for image URLs
- Cache images in Next.js public folder (already done)

---

## 📈 Success Criteria

### Must Have ✅

- [ ] NFTCard loads data from MongoDB (not API calls)
- [ ] Page load time < 500ms for 20 NFTs
- [ ] No redundant `/api/nft/metadata` or `/api/nft/insights` calls
- [ ] Stats still work (useNFTStatsContext)
- [ ] All existing features work (filtering, sorting, detail page)

### Nice to Have 🎯

- [ ] Remove NFTContext completely
- [ ] Remove unused API routes
- [ ] Reduce bundle size by 1200+ lines
- [ ] Add Storybook examples with MongoDB data

---

## 🔍 Testing Plan

### Unit Tests

- [ ] Test MongoDB query for marketplace_items
- [ ] Test MarketplaceCacheContext with complete data
- [ ] Test NFTCard with marketplace data only

### Integration Tests

- [ ] Test marketplace page load (GraphQL → MongoDB → Components)
- [ ] Test detail page (MongoDB single item → Stats context)
- [ ] Test filtering/sorting with MongoDB data

### Performance Tests

- [ ] Measure page load time (before vs after)
- [ ] Measure API call count (before vs after)
- [ ] Measure MongoDB query time (bulk fetch)

---

## 📚 Related Documentation

- [MARKETPLACE_SYNC.md](./MARKETPLACE_SYNC.md) - Complete sync process
- [MARKETPLACE_SYNC_QUICK.md](./MARKETPLACE_SYNC_QUICK.md) - Quick reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

## 🎬 Next Steps

1. **Review this document** with team
2. **Create Phase 2** (MongoDB-first API route)
3. **Test performance** with current setup
4. **Migrate one component** (NFTCard) as proof of concept
5. **Measure impact** before full rollout

---

**Last Updated:** 2025-01-16  
**Owner:** Architecture Team  
**Status:** ⚠️ ACTION REQUIRED

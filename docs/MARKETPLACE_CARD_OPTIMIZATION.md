# Marketplace Card Performance Optimization

## Overview
Implemented MongoDB-optimized data flow for NFT cards in the marketplace to eliminate redundant API calls.

## Problem
- **Before:** 60 API calls per marketplace page (20 NFTs × 3 endpoints: metadata, insights, stats)
- Each `NFTCard` called `useModernNFT` hook which triggered:
  - `fetchNFTMetadata` (GET /api/nft/metadata/[address]/[tokenId])
  - `fetchNFTInsights` (GET /api/nft/insights/[address]/[tokenId])
  - `fetchNFTStats` (GET /api/nft/stats/[address]/[tokenId])

## Solution
**Hybrid approach:** MongoDB props + NFTStatsContext for real-time stats

### Architecture
1. **MongoDB Data (Instant):** Metadata, insights, contract info passed via props
   - Source: `/api/marketplace/items` already fetches complete `EnrichedNFTDocument` from MongoDB
   - Passed through: `ActiveItemsListV2` → `NFTScrollList` → `NFTCard`
   - Result: No API calls needed for metadata/insights/contract

2. **Real-time Stats (Reactive):** Stats via `NFTStatsContext`
   - Like/Watchlist/View counts update immediately after user interactions
   - Synced via `nft-stats-updated` events
   - Ensures data stays fresh when user navigates back from detail page

### Implementation Details

#### 1. Type Extensions (`marketplace-ui.ts`)
Extended `NFTScrollItem` interface with optional MongoDB fields:
```typescript
export interface NFTScrollItem {
  // ... existing fields ...
  
  // MongoDB-optimierte Daten (optional - verhindert API calls!)
  metadata?: {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    animationUrl?: string | null;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  };
  insights?: {
    customTitle?: string | null;
    category?: string | null;
    tags?: string[];
    rarity?: string | null;
    cardDescriptions?: string[];
    // ... more fields
  };
  contract?: {
    contractName?: string | null;
    contractSymbol?: string | null;
    totalSupply?: number | bigint | null;
    owner?: string | null;
  };
}
```

#### 2. Data Mapping (`ActiveItemsListV2.tsx`)
Enhanced `scrollItems` mapping to pass complete MongoDB data:
```typescript
const scrollItems: NFTScrollItem[] = items.map(item => ({
  // ... existing fields ...
  
  // Pass MongoDB metadata (prevents API call!)
  metadata: {
    name: item.metadata?.name || undefined,
    description: item.metadata?.description || undefined,
    image: item.metadata?.image || undefined,
    animationUrl: item.metadata?.animationUrl || undefined,
    attributes: item.metadata?.attributes || undefined,
  },
  
  // Pass MongoDB insights (prevents API call!)
  insights: {
    customTitle: item.insights?.customTitle || undefined,
    category: item.insights?.category || undefined,
    // ... all insight fields with null → undefined conversion
  },
  
  // Pass MongoDB contract info (prevents API call!)
  contract: {
    contractName: item.contract?.contractName || undefined,
    // ... all contract fields
  },
}));
```

#### 3. NFTCard Logic Update (`NFTCard.tsx`)
Modified `NFTCard` to prioritize MongoDB props:

**Detection:**
```typescript
const hasMongoDBData = isLegacyProps(props) && 
  (props.metadata || props.insights || props.contract);
```

**Smart Loading:**
```typescript
const { nft: contextNFT, isLoading: contextLoading, refresh } = useModernNFT(
  contractAddress, 
  tokenId, 
  !hasMongoDBData // Only auto-load if we DON'T have MongoDB data
);
```

**Priority Hierarchy:**
```typescript
const displayData = useMemo(() => ({
  // MongoDB props FIRST (instant, no API call), then context, then default
  name: mongoMetadata?.name || 
        contextData?.meta?.name || 
        `NFT #${tokenId}`,
  
  imageUrl: mongoMetadata?.image || 
            contextData?.meta?.image || 
            null,
  
  customTitle: mongoInsights?.customTitle || 
               contextData?.insight?.customTitle || 
               null,
  
  // Stats ALWAYS from NFTStatsContext (real-time!)
  likeCount: liveStats?.favoriteCount ?? null,
  watchlistCount: liveStats?.watchlistCount ?? null,
  
  // Loading state: only if no MongoDB data AND no context data
  isLoading: !hasMongoDBData && !contextData && isLoadingRef.current,
}), [mongoMetadata, mongoInsights, contextData, liveStats, hasMongoDBData]);
```

## Results

### Performance Improvement
- **Before:** 60 API calls per page (20 NFTs × 3 endpoints)
- **After:** ~20 API calls per page (only stats, metadata/insights from MongoDB)
- **Reduction:** ~67% fewer API calls

### Benefits
1. **Faster Initial Load:** Metadata and insights display instantly (already in MongoDB)
2. **Reduced Server Load:** No redundant API calls for data we already have
3. **Real-time Stats:** Like/watchlist counts update immediately via context
4. **Backward Compatible:** Falls back to `useModernNFT` if MongoDB props not provided
5. **Clean Architecture:** Matches detail page architecture (`/nft/[address]/[tokenId]`)

## Debug Logging
Added console log to verify optimization is working:
```typescript
devLog.info('NFTCard using MongoDB-optimized data (no API calls!):', {
  contractAddress,
  tokenId,
  hasMetadata: !!props.metadata,
  hasInsights: !!props.insights,
  hasContract: !!props.contract,
});
```

## Files Modified
1. `src/types/marketplace/marketplace-ui.ts` - Extended NFTScrollItem type
2. `src/types/marketplace/enriched-nft.ts` - **REMOVED** stats field (now managed separately)
3. `src/components/marketplace/ActiveItemsListV2.tsx` - Enhanced data mapping
4. `src/components/nft/NFTCard.tsx` - Added MongoDB props support
5. `src/components/nft/NFTScrollList.tsx` - Passes MongoDB props to NFTCard
6. `src/app/api/marketplace/nft/[nftAddress]/[tokenId]/route.ts` - Removed stats from response
7. `scripts/sync-marketplace-data.js` - Removed stats fetching/storing
8. `scripts/remove-stats-from-marketplace.js` - **NEW** Migration script to clean existing data

## Data Architecture Changes

### Before: Stats in marketplace_items (❌ Problematic)
```
marketplace_items: {
  nftAddress, tokenId, metadata, contract, insights,
  stats: { likeCount, viewCount, ... }  // ❌ Gets stale!
}
```

### After: Stats managed separately (✅ Clean)
```
marketplace_items: {
  nftAddress, tokenId, metadata, contract, insights
  // NO stats field - keeps documents lean and consistent
}

nft_stats: {
  nftAddress, tokenId,
  likeCount, viewCount, favoriteCount, ...
  // Updated in real-time by user interactions
}

UI: Uses NFTStatsContext for real-time stats
```

### Why Separation is Better:
1. **No Stale Data**: Stats in marketplace_items would become outdated after user interactions
2. **Single Source of Truth**: nft_stats is THE authority for all stat data
3. **Simpler Sync**: No need to update multiple collections on each interaction
4. **Better Performance**: marketplace_items documents are smaller and more focused
5. **Real-time UI**: NFTStatsContext provides reactive updates without DB queries

## Testing Checklist
- [ ] Marketplace loads without redundant API calls (check Network tab)
- [ ] NFT cards display metadata/insights from MongoDB
- [ ] Like an NFT on detail page → go back to list
- [ ] Verify like count updated in card (real-time from NFTStatsContext)
- [ ] Check console for "MongoDB-optimized data" logs
- [ ] Verify backward compatibility (cards work without MongoDB props)

## Next Steps
- Monitor API call reduction in production
- Consider extending to other marketplace views (e.g., Swaps, History)
- Optional: Add MongoDB stats to prevent initial stats API call (requires real-time sync)

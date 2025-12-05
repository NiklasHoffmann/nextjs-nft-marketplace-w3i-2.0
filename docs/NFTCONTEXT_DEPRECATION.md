# NFTContext Deprecation Notice

**Date**: November 17, 2025  
**Status**: DEPRECATED ⚠️

## Summary

`NFTContext` has been deprecated and replaced with MongoDB-backed context architecture. All active usage has been removed from the codebase.

## Migration Path

### Old Architecture (Deprecated)
```typescript
// ❌ OLD - Do not use
import { useModernNFTContext, useModernNFT } from '@/contexts/NFTContext';

const nftContext = useModernNFTContext();
const { nft, isLoading } = useModernNFT(contractAddress, tokenId);
```

### New Architecture (Current)
```typescript
// ✅ NEW - Use these instead

// For marketplace items
import { useMarketplaceCache } from '@/contexts/MarketplaceCacheContext';
const { items } = useMarketplaceCache();

// For collection metadata
import { useCollections } from '@/contexts/CollectionsContext';
const { collections } = useCollections();

// For user's NFTs
import { useWalletNFTs } from '@/contexts/WalletNFTsContext';
const { ownedNFTs } = useWalletNFTs();

// For stats tracking
import { useNFTStatsContext } from '@/contexts/NFTStatsContext';
const statsContext = useNFTStatsContext();
const stats = statsContext.getStats(contractAddress, tokenId);
```

## Context Responsibilities

| Context | Purpose | Data Source |
|---------|---------|-------------|
| **MarketplaceCacheContext** | Listed marketplace items | MongoDB `marketplace_items` |
| **CollectionsContext** | Collection metadata & stats | MongoDB `marketplace_collections` |
| **WalletNFTsContext** | User-owned NFTs | Alchemy/Moralis API + enrichment |
| **NFTStatsContext** | Social stats (likes, views, etc.) | MongoDB `nft_stats` |
| ~~NFTContext~~ | ~~Legacy aggregation~~ | ~~Deprecated~~ |

## Components Refactored

### ✅ NFTCard
**Before:**
- Used `useModernNFT()` to fetch metadata and insights
- Complex context loading logic
- Mixed data sources

**After:**
- Fully props-based (receives data from parent)
- Data comes from MongoDB `marketplace_items`
- No context dependencies (except stats)

### ✅ NFTInsightsPanel
**Before:**
- Used `useModernNFTContext()` to load insights
- Context-based loading state

**After:**
- Direct API fetch via `/api/nft/insights`
- Simple loading state management
- No context dependency

## Removed Files

None yet - `NFTContext.tsx` kept for backward compatibility but marked as deprecated.

## Future Cleanup

Consider removing in next major version:
- [ ] `src/contexts/NFTContext.tsx`
- [ ] Related types in `@/types/core/core-nft-modern`
- [ ] Utility functions in `@/utils` used only by NFTContext

## Benefits of New Architecture

1. **Better Performance**
   - Pre-aggregated data from MongoDB
   - No duplicate API calls
   - Efficient caching per context

2. **Clearer Separation of Concerns**
   - Each context has single responsibility
   - Easier to debug and maintain
   - Better TypeScript types

3. **Real-time Sync**
   - MongoDB sync service runs every 30s
   - Automatic data updates
   - No stale data issues

4. **Scalability**
   - MongoDB aggregation is 60x faster than TheGraph
   - Can handle thousands of items
   - Incremental sync optimizations

## Notes

- NFTStatsContext is still used for live stats tracking (likes, views, ratings)
- This is intentional - stats need real-time updates
- Marketplace data is synced via background service

## Questions?

See:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system design
- [MARKETPLACE_REFACTOR_SUMMARY.md](./MARKETPLACE_REFACTOR_SUMMARY.md) - Migration details
- [PHASE_7_SUMMARY.md](./PHASE_7_SUMMARY.md) - Collections migration

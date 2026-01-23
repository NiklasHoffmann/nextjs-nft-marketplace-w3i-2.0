# Marketplace Types

TypeScript definitions for marketplace operations, smart contract events, and listing management.

## Files Overview

### `contract-events.ts`
Blockchain event types emitted by the marketplace smart contract.

**Key Types:**
```typescript
// Raw blockchain events
RawItemListedEvent
RawItemBoughtEvent  
RawItemCanceledEvent
RawItemUpdatedEvent

// Processed events (normalized)
ProcessedItemListedEvent
ProcessedItemBoughtEvent
ProcessedItemCanceledEvent
ProcessedItemUpdatedEvent
ProcessedMarketplaceEvent // Union type
```

**Usage:**
```typescript
import type { ProcessedItemListedEvent } from '@/types';

const handleListing = (event: ProcessedItemListedEvent) => {
  console.log(`NFT ${event.tokenId} listed for ${event.price} ETH`);
};
```

---

### `enriched-nft.ts`
NFTs enriched with marketplace data, stats, and insights.

**Key Types:**
```typescript
EnrichedNFT          // Full NFT with all enrichment
EnrichedNFTDocument  // MongoDB document version
NFTListingInfo       // Marketplace listing data
NFTStatsInfo         // View/like counts
```

**Structure:**
```typescript
interface EnrichedNFT {
  // Base NFT data
  contractAddress: string;
  tokenId: string;
  name?: string;
  image?: string;
  
  // Marketplace data
  listing: {
    price: string;
    seller: string;
    isActive: boolean;
  } | null;
  
  // User interactions
  stats: {
    viewCount: number;
    likeCount: number;
  };
  
  // Admin insights
  insights?: {
    featured: boolean;
    category: string;
  };
}
```

---

### `listing-v2.ts`
Subgraph v2 listing schema (Ideation Market).

**Key Types:**
```typescript
ListingV2         // Main listing entity
TokenStandard     // 'ERC721' | 'ERC1155'
ListingType       // 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP'
ListingStatus     // 'LISTED' | 'SOLD_OUT' | 'CANCELED' | etc
```

**Why "v2"?**
This represents the second version of the subgraph schema with enhanced features like partial fills and whitelisted buyers.

---

### `marketplace-contract.ts`
Smart contract interaction parameters.

**Key Types:**
```typescript
MarketplaceContractParams  // Function call parameters
ListingParams              // Create/update listing
PurchaseParams             // Buy NFT
CancelParams               // Cancel listing
```

**Usage:**
```typescript
import type { ListingParams } from '@/types';

const params: ListingParams = {
  nftAddress: '0x...',
  tokenId: '123',
  price: '1000000000000000000', // 1 ETH in Wei
  listingType: 'sale'
};
```

---

### `marketplace-ui.ts`
UI component types for marketplace features.

**Key Types:**
```typescript
MarketplaceFilterState  // Filter/sort state
ListingCardProps        // Listing card component
MarketplaceGridProps    // Grid layout props
```

---

## Common Patterns

### Event Processing Pipeline
```
Blockchain Event (Raw)
       ↓
Process & Normalize (Processed)
       ↓
MongoDB Sync
       ↓
UI Update (EnrichedNFT)
```

### Type Guards
```typescript
function isProcessedListingEvent(
  event: ProcessedMarketplaceEvent
): event is ProcessedItemListedEvent {
  return event.type === 'ItemListed';
}
```

### Enrichment Flow
```typescript
// 1. Base NFT
const nft: NFT = { contractAddress, tokenId, ... };

// 2. Add listing data
const withListing = { ...nft, listing: {...} };

// 3. Add stats
const withStats = { ...withListing, stats: {...} };

// 4. Final enriched NFT
const enriched: EnrichedNFT = { ...withStats, insights: {...} };
```

---

## MongoDB Integration

Types map directly to MongoDB collections:

- `EnrichedNFTDocument` → `marketplace_items` collection
- `ListingV2` → Synced from The Graph subgraph
- `NFTStatsInfo` → `nft_stats` collection

---

## Best Practices

1. **Use Processed Events** - Always use processed event types in application code
2. **Type-Safe Contracts** - Use `MarketplaceContractParams` for contract calls
3. **Enrichment Pattern** - Build up NFT data through enrichment layers
4. **Version Suffixes** - Keep `-v2` suffix for schema versions (not implementations)

---

See [main README](../README.md) for more type documentation.

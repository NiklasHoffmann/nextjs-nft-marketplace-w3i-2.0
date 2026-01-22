# types/ - TypeScript Type Definitions

Centralized type system for the entire application.

## Quick Reference

### **NFT Types** (`nft.ts`)
```typescript
import type { NFT, NFTMetadata, NFTAttribute } from '@/types/nft';

// Core NFT interface
interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: NFTAttribute[];
  // ... more fields
}

// Metadata structure
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  external_url?: string;
}
```

### **API Types** (`api.ts`)
```typescript
import type { ApiResponse, ApiError } from '@/types/api';

// Standard API response
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
}
```

### **Marketplace Types** (`marketplace.ts`)
```typescript
import type { MarketplaceItem, ListingType } from '@/types/marketplace';

interface MarketplaceItem {
  nftAddress: string;
  tokenId: string;
  price: string;
  seller: string;
  buyer?: string;
  status: 'active' | 'sold' | 'cancelled';
  listingType: 'sale' | 'swap';
  createdAt: Date;
}
```

### **Event Types** (`events.ts`)
```typescript
import type { NFTStatsUpdateEvent } from '@/types/events';

// Custom event data
interface NFTStatsUpdateDetail {
  contractAddress: string;
  tokenId: string;
  stats: NFTStats;
  source: string;
}
```

## Type Organization

```
types/
├── index.ts              # Central export (import from '@/types')
├── nft.ts               # NFT-related types
├── api.ts               # API request/response types
├── marketplace.ts       # Marketplace types
├── events.ts            # Custom event types
├── blockchain.ts        # Web3/blockchain types
├── ui.ts                # UI component types
└── database.ts          # MongoDB document types
```

## Usage Patterns

### ✅ Import from Central Index
```typescript
// ✅ Good - Import from central index
import type { NFT, MarketplaceItem, ApiResponse } from '@/types';

// ❌ Avoid - Direct file imports
import type { NFT } from '@/types/nft';
```

### Type-Safe API Responses
```typescript
import type { ApiResponse, NFT } from '@/types';

async function getNFT(): Promise<ApiResponse<NFT>> {
  const response = await fetch('/api/nft');
  return response.json();
}
```

### Generic Types
```typescript
// Use generics for flexible typing
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache: CacheEntry<NFT> = {
  data: nft,
  timestamp: Date.now(),
  ttl: 60
};
```

## Best Practices

### ✅ DO:
- Use **`type`** for unions/intersections: `type Status = 'active' | 'sold'`
- Use **`interface`** for objects: `interface NFT { ... }`
- Export all types from `index.ts`
- Use **explicit types** for API responses
- Document complex types with JSDoc

### ❌ DON'T:
- Don't use `any` - use `unknown` or proper types
- Don't duplicate types - reuse and extend
- Don't put types in component files - centralize here
- Don't skip null/undefined handling

## Type Utilities

```typescript
// Utility types for common patterns
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Example usage
type NFTInput = Optional<NFT, 'description' | 'image'>;
```

## Related Documentation

- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)
- **API**: [/docs/api/routes.md](/docs/api/routes.md)

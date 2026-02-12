# Types Layer - TypeScript Type Definitions

**Comprehensive type system** for the entire NFT marketplace application with strict type safety.

## 📂 Directory Structure

```
types/
├── api/                # API request/response types
│   ├── api-responses.ts
│   └── index.ts
├── core/               # Core domain types (NFT, Currency)
│   ├── core-nft-modern.ts
│   ├── core-currency.ts
│   └── index.ts
├── features/           # Feature-specific types
│   ├── nft-detail.ts
│   ├── nft-insights.ts
│   ├── user-interactions.ts
│   └── index.ts
├── insights/           # NFT insights & analytics
│   ├── insights-main.ts
│   ├── insights-public.ts
│   └── index.ts
├── marketplace/        # Marketplace & smart contract types
│   ├── contract-events.ts
│   ├── enriched-nft.ts
│   ├── listing-v2.ts
│   ├── marketplace-contract.ts
│   ├── marketplace-ui.ts
│   └── index.ts
├── ui/                 # UI component types
│   ├── ui-components.ts
│   └── index.ts
├── events.ts           # Custom DOM events
├── game.ts             # Game mechanics types
├── multisig.ts         # Multisig wallet types
├── multisig-wallet.ts  # Extended multisig types
├── nft-metadata.ts     # NFT metadata structures
├── index.ts            # Central barrel export
└── README.md
```

---

## 🔥 Core Type Categories

### 🎯 Core Types (`core/`)

**Purpose:** Fundamental domain types used throughout the application

**Key Files:**

- `core-nft-modern.ts` - Modern NFT interface with ownership history
- `core-currency.ts` - Currency, pricing, and exchange rate types

**Usage Example:**

```typescript
import type { NFT, NFTAttribute, CurrencyRate } from "@/types";

const nft: NFT = {
  contractAddress: "0x...",
  tokenId: "123",
  name: "Cool NFT",
  image: "ipfs://...",
  attributes: [{ trait_type: "Rarity", value: "Epic" }],
};
```

**Key Types:**

- `NFT` - Core NFT interface with metadata
- `NFTAttribute` - Trait_type/value pairs
- `NFTOwnershipHistory` - Ownership transfer tracking
- `CurrencyRate` - EUR/USD exchange rates

---

### 🎨 UI Types (`ui/`)

**Purpose:** Component props, states, and UI-specific interfaces

**Key Files:**

- `ui-components.ts` - Component props, loading states, modals

**Usage Example:**

```typescript
import type { LoadingState, ModalState, TabItem } from "@/types";

const loadingState: LoadingState = {
  isLoading: true,
  error: null,
  progress: 50,
};
```

**Key Types:**

- `LoadingState` - Loading, error, progress tracking
- `ModalState` - Modal open/close state management
- `TabItem` - Tab navigation configuration
- `ButtonVariant` - Button styling variants

---

### 🔌 API Types (`api/`)

**Purpose:** HTTP request/response structures, error handling, pagination

**Key Files:**

- `api-responses.ts` - Standardized API response formats

**Usage Example:**

```typescript
import type { ApiResponse, ApiError } from "@/types";

async function fetchNFT(): Promise<ApiResponse<NFT>> {
  const res = await fetch("/api/nft/123");
  return res.json();
}
```

**Standard Response Format:**

```typescript
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
```

---

### 🛒 Marketplace Types (`marketplace/`)

**Purpose:** Smart contract interactions, listings, events

**Key Files:**

- `contract-events.ts` - Blockchain event types (ItemListed, ItemBought, etc.)
- `enriched-nft.ts` - NFTs with marketplace data enrichment
- `listing-v2.ts` - Subgraph v2 listing schema
- `marketplace-contract.ts` - Smart contract parameter types
- `marketplace-ui.ts` - Marketplace UI component types

**Usage Example:**

```typescript
import type {
  ProcessedItemListedEvent,
  EnrichedNFT,
  MarketplaceContractParams,
} from "@/types";
import { devLog } from "@/utils";

// Event handling
const handleListing = (event: ProcessedItemListedEvent) => {
  devLog.info(`Listed: ${event.tokenId} for ${event.price} ETH`);
};

// Enriched NFT with marketplace data
const enrichedNFT: EnrichedNFT = {
  ...nft,
  listing: {
    price: "1000000000000000000", // 1 ETH in Wei
    seller: "0x...",
    isActive: true,
  },
  stats: {
    viewCount: 100,
    likeCount: 25,
  },
};
```

**Key Types:**

- `ProcessedItemListedEvent` - New listing event
- `ProcessedItemBoughtEvent` - Purchase event
- `ProcessedItemCanceledEvent` - Cancellation event
- `EnrichedNFT` - NFT + listing + stats + insights
- `ListingV2` - Subgraph v2 listing entity
- `MarketplaceContractParams` - Smart contract call parameters

---

### 📊 Insights Types (`insights/`)

**Purpose:** NFT analytics, admin insights, public metadata

**Key Files:**

- `insights-main.ts` - Admin-managed insights
- `insights-public.ts` - Public insights data

**Usage Example:**

```typescript
import type { NFTInsight, PublicInsight } from "@/types";

const insight: NFTInsight = {
  contractAddress: "0x...",
  tokenId: "123",
  category: "art",
  tags: ["digital", "generative"],
  featured: true,
  description: "Amazing artwork",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

**Key Types:**

- `NFTInsight` - Admin-managed insight data
- `PublicInsight` - Public-facing insight view
- `InsightCategory` - Categorization types
- `InsightTag` - Tagging system

---

### ⚡ Feature Types (`features/`)

**Purpose:** Feature-specific interfaces (detail pages, user interactions)

**Key Files:**

- `nft-detail.ts` - NFT detail page types
- `nft-insights.ts` - Insights feature types
- `user-interactions.ts` - Likes, views, watchlist

**Usage Example:**

```typescript
import type { NFTDetailPageProps, UserInteraction } from "@/types";

const interaction: UserInteraction = {
  userAddress: "0x...",
  contractAddress: "0x...",
  tokenId: "123",
  type: "like",
  timestamp: new Date(),
};
```

---

### 🎮 Specialized Types

#### Events (`events.ts`)

Custom DOM events for cross-component communication

```typescript
import type { NFTStatsUpdateEvent } from "@/types";
import { devLog } from "@/utils";

window.addEventListener("nftStatsUpdate", (e: NFTStatsUpdateEvent) => {
  devLog.info("Stats updated:", e.detail);
});
```

#### Game (`game.ts`)

Game mechanics and progression types

```typescript
import type { GameState, PlayerStats } from "@/types";
```

#### Multisig (`multisig.ts`, `multisig-wallet.ts`)

Multi-signature wallet operations

```typescript
import type { MultisigTransaction, DiamondOperation } from "@/types";
```

#### NFT Metadata (`nft-metadata.ts`)

Comprehensive NFT metadata structures

```typescript
import type { NFTMetadataSyncResult } from "@/types";
```

---

## 🎯 Usage Patterns

### ✅ Centralized Imports

```typescript
// ✅ GOOD - Import from central index
import type { NFT, ApiResponse, LoadingState } from "@/types";

// ❌ AVOID - Direct file imports
import type { NFT } from "@/types/core/core-nft-modern";
```

### Type-Safe API Calls

```typescript
import type { ApiResponse, NFT } from "@/types";

async function fetchNFT(id: string): Promise<ApiResponse<NFT>> {
  const res = await fetch(`/api/nft/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
```

### Generic Type Patterns

```typescript
// Cache with generic data type
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const nftCache: CacheEntry<NFT> = {
  data: nft,
  timestamp: Date.now(),
  ttl: 300000,
};
```

### Event Typing

```typescript
import type { ProcessedItemListedEvent } from "@/types";

// Type-safe event handling
const handleEvent = (event: ProcessedItemListedEvent) => {
  const { contractAddress, tokenId, price } = event;
  // TypeScript knows all properties
};
```

---

## 📝 Best Practices

### Type vs Interface

```typescript
// ✅ Use 'type' for unions and intersections
type Status = "active" | "pending" | "completed";
type Combined = TypeA & TypeB;

// ✅ Use 'interface' for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Interfaces can be extended
interface AdminUser extends User {
  permissions: string[];
}
```

### Null Safety

```typescript
// ✅ Explicit null handling
interface NFT {
  name: string;
  description?: string; // Optional
  owner: string | null; // Explicit null
}

// ❌ Avoid 'any'
// any - NO!
// unknown - Better (requires type checking)
// specific type - Best
```

### Type Utilities

```typescript
// Make specific fields optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type NFTInput = Optional<NFT, "description" | "image">;

// Make specific fields required
type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
type NFTComplete = RequiredFields<NFT, "description" | "image">;

// Pick subset of properties
type NFTBasic = Pick<NFT, "contractAddress" | "tokenId" | "name">;

// Omit specific properties
type NFTWithoutMetadata = Omit<NFT, "attributes" | "metadata">;
```

---

## 🔧 Type Organization

### Barrel Exports

All subdirectories use `index.ts` for clean imports:

```typescript
// types/marketplace/index.ts
export * from "./contract-events";
export * from "./enriched-nft";
export * from "./listing-v2";
export * from "./marketplace-contract";
export * from "./marketplace-ui";
```

### Centralized Export

Main `types/index.ts` exports everything:

```typescript
export * from "./core";
export * from "./ui";
export * from "./api";
export * from "./marketplace";
export * from "./insights";
export * from "./features";
// ... etc
```

---

## 🧪 Type Validation

### Runtime Validation with Zod

```typescript
import { z } from "zod";
import type { NFT } from "@/types";

const NFTSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenId: z.string(),
  name: z.string().optional(),
  // ... more fields
});

// Type inference from schema
type ValidatedNFT = z.infer<typeof NFTSchema>;
```

### Type Guards

```typescript
function isEnrichedNFT(nft: any): nft is EnrichedNFT {
  return (
    "listing" in nft &&
    "stats" in nft &&
    typeof nft.contractAddress === "string"
  );
}

if (isEnrichedNFT(data)) {
  // TypeScript knows data is EnrichedNFT
  devLog.info(data.listing.price);
}
```

---

## 📊 Type Statistics

- **Total Type Files:** 27
- **Subdirectories:** 6
- **Export Indexes:** 7
- **Core Interfaces:** 50+
- **Type Aliases:** 30+

---

## 🔄 Migration Notes

### Recent Updates (January 2026)

- ✅ No deprecated types found
- ✅ All types follow kebab-case naming
- ✅ Consistent barrel export pattern
- ✅ Comprehensive JSDoc documentation

### Breaking Changes

None - type system is stable and production-ready.

---

## 📚 Additional Resources

- [Architecture Overview](../docs/architecture/README.md)
- [API Documentation](../docs/api/README.md)
- [Database Schemas](../docs/database/schemas/)
- [Services Layer](../services/README.md)

---

**Last Updated:** January 23, 2026  
**Version:** 2.0.0 (Stable & Production-Ready)
message: string;
code?: string;
}

````

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
````

### **Event Types** (`events.ts`)

```typescript
import type { NFTStatsUpdateEvent } from "@/types/events";

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
import type { NFT, MarketplaceItem, ApiResponse } from "@/types";

// ❌ Avoid - Direct file imports
import type { NFT } from "@/types/nft";
```

### Type-Safe API Responses

```typescript
import type { ApiResponse, NFT } from "@/types";

async function getNFT(): Promise<ApiResponse<NFT>> {
  const response = await fetch("/api/nft");
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
  ttl: 60,
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
type NFTInput = Optional<NFT, "description" | "image">;
```

## Related Documentation

- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)
- **API**: [/docs/api/routes.md](/docs/api/routes.md)

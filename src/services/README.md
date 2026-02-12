# Services Layer - Business Logic & Infrastructure

**Enterprise-grade service architecture** for blockchain interactions, data synchronization, and cache management.

## 📂 Directory Structure

```
services/
├── blockchain/          # Smart contract interactions & blockchain data
├── cache/              # Multi-layer caching with TTL strategies
├── marketplace/        # Marketplace event handling & synchronization
├── multisig/           # Multi-signature wallet operations
├── nft-sync/           # NFT data synchronization services
└── validation/         # Data invalidation & cache management
```

---

## 🔥 Core Services

### 🔗 Blockchain Services (`blockchain/`)

**Purpose:** Direct blockchain interaction, smart contract calls, NFT metadata fetching

**Key Files:**

- `TransactionService.ts` - Centralized transaction handling with progress tracking
- `contracts.ts` - Contract ABIs, addresses, and utilities
- `contract-calls.ts` - Smart contract interaction with retry logic
- `nft-fetcher.ts` - Comprehensive NFT data fetching (metadata, ownership, approvals)
- `nft-helpers.ts` - NFT-specific utility functions
- `rpc-config.ts` - RPC provider management with fallback clients

**Usage Example:**

```typescript
import { TransactionService } from "@/services/blockchain";
import { devLog } from "@/utils";

// Purchase NFT with progress tracking
const result = await TransactionService.purchaseNFT({
  contractAddress: "0x...",
  tokenId: "123",
  price: "0.1",
  onProgress: (step) => {
    devLog.info(`${step.action}: ${step.status}`);
  },
});

// Create listing
await TransactionService.createListing({
  contractAddress: "0x...",
  tokenId: "123",
  price: "0.5",
  listingType: "sale",
  onProgress: (step) => {
    /* ... */
  },
});
```

**Features:**

- ✅ Multi-step transaction flow with progress callbacks
- ✅ Automatic gas estimation with safety margins
- ✅ Error handling & retry logic
- ✅ Approval management (ERC-721)
- ✅ Transaction validation & confirmation tracking

---

### 💾 Cache Services (`cache/`)

**Purpose:** Multi-layer caching for blockchain data with intelligent TTL strategies

**Key Files:**

- `smart-cache.ts` - LRU caches for contract properties, ownership, metadata, approvals

**Cache Layers:**

```typescript
import {
  contractPropertiesCache, // TTL: 24h - Static contract data
  ownershipCache, // TTL: 5min - Dynamic ownership data
  tokenMetadataCache, // TTL: 12h - IPFS metadata
  approvalCache, // TTL: 2min - Approval states
  tokenURICache, // TTL: 24h - Token URIs
} from "@/services/cache";
```

**Cache Strategy:**

- **Contract Properties:** 24h TTL (name, symbol, totalSupply - rarely changes)
- **Ownership Data:** 5min TTL (owner, balance - changes on trades)
- **Token Metadata:** 12h TTL (IPFS data - immutable but validate)
- **Approvals:** 2min TTL (approval states - frequent changes)
- **Token URIs:** 24h TTL (tokenURI calls - immutable)

**Automatic Cleanup:**

- Runs every 10 minutes
- Removes expired entries
- Memory-efficient with max sizes

---

### 🎯 Marketplace Services (`marketplace/`)

**Purpose:** Real-time marketplace event handling and synchronization

**Key Files:**

- `event-listener.ts` - WebSocket-based blockchain event listening
- `event-mongodb-sync.ts` - MongoDB synchronization for marketplace events
- `event-invalidation-bridge.ts` - Routes events to invalidation system

**Architecture:**

```
Blockchain Events → Event Listener → MongoDB Sync → Invalidation Bridge → UI Update
                         ↓
                  < 1s latency
```

**Usage Example:**

```typescript
import { getMarketplaceEventListener } from "@/services/marketplace";

const eventListener = getMarketplaceEventListener();
eventListener.start(); // Auto-start in production

// Events trigger automatic:
// - MongoDB updates
// - Cache invalidation
// - UI refreshes
```

**Supported Events:**

- `ItemListed` - New NFT listed for sale
- `ItemBought` - NFT purchased
- `ItemCanceled` - Listing canceled
- `ItemUpdated` - Price/terms updated

---

### 🔄 NFT Sync Services (`nft-sync/`)

**Purpose:** Hybrid real-time + polling synchronization for NFT data

**Architecture:**

```
Real-time: WebSocket Events (< 1s)
Fallback:  The Graph v2 Polling (30s)
On-demand: Blockchain State Sync
           IPFS Metadata Sync
```

**Key Files:**

- `index.ts` - Main NFT Sync Service orchestrator
- `graph-subscription.ts` - The Graph polling (listing data)
- `blockchain-state-sync.ts` - On-demand blockchain state fetching
- `ipfs-metadata-lazy-sync.ts` - Lazy IPFS metadata synchronization
- `stats-sync.ts` - User interaction stats aggregation
- `insights-sync.ts` - Admin insights synchronization

**Usage Example:**

```typescript
import { getNFTSyncService } from "@/services/nft-sync";

const syncService = getNFTSyncService();
syncService.start(); // Auto-starts all sync services

// On-demand sync
import { blockchainStateSync } from "@/services/nft-sync";
await blockchainStateSync(nftAddress, tokenId);
```

**Sync Strategy:**

1. **Real-time Events** (WebSocket) - Instant updates
2. **The Graph Polling** (30s) - Fallback for missed events
3. **On-demand Sync** - Called when data needed
4. **Periodic Stats** - Aggregates view counts, likes, etc.

---

### ✅ Validation Services (`validation/`)

**Purpose:** Data invalidation and cache busting for real-time UI updates

**Key Files:**

- `data-invalidation.ts` - Central invalidation system

**Usage Example:**

```typescript
import {
  invalidateAfterListing,
  invalidateAfterPurchase,
  invalidateAfterCancelListing,
  onDataInvalidation,
} from "@/services/validation";

// Invalidate after listing
await invalidateAfterListing(contractAddress, tokenId);

// Listen for invalidation events
const cleanup = onDataInvalidation((event) => {
  if (event.type === "nft-purchased") {
    refetchData();
  }
});
```

**Invalidation Events:**

- `listing-created` - New listing created
- `listing-canceled` - Listing canceled
- `nft-purchased` - NFT bought
- `nft-transferred` - NFT transferred
- `graph-update` - The Graph data updated
- `manual-refresh` - Manual refresh triggered

**Connected Systems:**

- `WalletNFTsContext` - User's NFT collection
- `CollectionsContext` - Collection aggregations
- `MarketplaceItemsContext` - Listed items
- `NFTContext` - Individual NFT data

---

### 🔐 Multisig Services (`multisig/`)

**Purpose:** Multi-signature wallet operations for Diamond Standard contracts

**Key Files:**

- `MultisigService.ts` - Safe integration, transaction building, status tracking

**Usage Example:**

```typescript
import {
  createDiamondTransactionRequest,
  enhancePendingTransaction,
  getTransactionStatusLabel,
} from "@/services/multisig";

// Create multisig transaction
const txRequest = createDiamondTransactionRequest({
  operation: "addFunction",
  args: [facetAddress, selector],
});

// Enhance pending transaction
const enhanced = await enhancePendingTransaction(transaction);
```

---

## 🎯 Service Layer Architecture

### Data Flow

```
┌──────────────┐
│  Blockchain  │
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────┐   ┌──────────┐
│ WebSocket│   │The Graph │
│ Events   │   │ Polling  │
└─────┬────┘   └────┬─────┘
      │             │
      └──────┬──────┘
             ▼
      ┌──────────────┐
      │ NFT Sync     │
      │ Service      │
      └──────┬───────┘
             │
             ├─────────────┬─────────────┐
             ▼             ▼             ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ MongoDB  │  │  Cache   │  │Validation│
      └──────────┘  └──────────┘  └──────┬───┘
                                          │
                                          ▼
                                   ┌──────────┐
                                   │ UI Update│
                                   └──────────┘
```

### Performance Metrics

- **Event Latency:** < 1s (WebSocket)
- **The Graph Fallback:** 30s polling
- **Cache Hit Rate:** ~85% (production)
- **DB Query Time:** ~50ms (MongoDB)
- **Total Load Time:** ~100ms (cached data)

---

## 🚀 Quick Start

### Initialize Services (Server-Side)

```typescript
// instrumentation.ts or server startup
import { initializeServices } from "@/lib/init-services";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await initializeServices();
  }
}
```

### Use in Components

```typescript
import { useTransactionService } from "@/services/blockchain";
import { onDataInvalidation } from "@/services/validation";
import { getNFTSyncService } from "@/services/nft-sync";

// Transaction handling
const { purchaseNFT } = useTransactionService();

// Listen for updates
useEffect(() => {
  const cleanup = onDataInvalidation((event) => {
    // Handle invalidation
  });
  return cleanup;
}, []);
```

---

## 🔧 Configuration

### Environment Variables

```env
# Blockchain
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://...
NEXT_PUBLIC_ALCHEMY_API_KEY=...

# The Graph
NEXT_PUBLIC_SUBGRAPH_HTTP_URL=https://...
NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://...

# MongoDB
MONGODB_URI=mongodb+srv://...
```

### Service Features

- ✅ **Auto-start:** Services start automatically in production
- ✅ **Graceful Shutdown:** Clean service termination
- ✅ **Error Recovery:** Automatic retry with exponential backoff
- ✅ **Rate Limiting:** Intelligent request throttling
- ✅ **Cache Management:** Automatic cleanup and invalidation
- ✅ **Event Deduplication:** Prevents duplicate processing

---

## 📊 Monitoring & Debugging

### Dev Logs

```typescript
import { devLog } from "@/utils";

// Logs are categorized by service
devLog.info("nft-sync", "Starting sync service");
devLog.error("blockchain", "Transaction failed", error);
```

### Performance Tracking

```typescript
import { measurePerformance } from "@/utils/performance";

const metrics = await measurePerformance("fetch-nft", async () => {
  return await fetchNFTData(address, tokenId);
});

devLog.info(`Operation took ${metrics.duration}ms`);
```

### Cache Statistics

```typescript
import { getCacheStats } from "@/services/cache";

const stats = getCacheStats();
devLog.info(`Cache hit rate: ${stats.hitRate}%`);
```

---

## 🧪 Testing

### Unit Tests

```typescript
import { fetchComprehensiveNFTDataNew } from "@/services/blockchain/nft-fetcher";

test("fetches NFT data with cache", async () => {
  const data = await fetchComprehensiveNFTDataNew(address, tokenId);
  expect(data.owner).toBeDefined();
});
```

### Integration Tests

```typescript
import { getNFTSyncService } from "@/services/nft-sync";

test("sync service processes events", async () => {
  const service = getNFTSyncService();
  await service.start();
  // Trigger event and verify DB update
});
```

---

## 📝 Best Practices

### Service Usage

1. **Always use service layer** - Never call blockchain directly from components
2. **Use hooks for UI** - `useTransactionService()` for React components
3. **Handle errors gracefully** - Services provide detailed error messages
4. **Monitor performance** - Use dev logs in development
5. **Cache intelligently** - Leverage multi-layer caching

### Performance Optimization

1. **Batch operations** - Group multiple calls when possible
2. **Use cache layers** - Check cache before blockchain calls
3. **Lazy load metadata** - Only fetch when needed
4. **Debounce updates** - Prevent excessive re-renders
5. **Monitor metrics** - Track service performance

### Error Handling

1. **Retry with backoff** - Automatic retry for transient errors
2. **Fallback strategies** - Use The Graph when WebSocket fails
3. **User notifications** - Clear error messages via notification system
4. **Log everything** - Comprehensive logging for debugging
5. **Graceful degradation** - Continue working with partial data

---

## 🔄 Migration Notes

### Recent Changes (January 2026)

- ✅ **Moved:** `DataInvalidationService.ts` → `validation/data-invalidation.ts`
- ✅ **Moved:** `blockchain/smart-cache.ts` → `cache/smart-cache.ts`
- ✅ **Created:** Index files for all service directories
- ✅ **Removed:** Old `.OLD` files from archives
- ✅ **Updated:** All imports across codebase

### Breaking Changes

```typescript
// ❌ OLD
import { invalidateAfterListing } from "@/services/DataInvalidationService";
import { contractPropertiesCache } from "@/services/blockchain/smart-cache";

// ✅ NEW
import { invalidateAfterListing } from "@/services/validation";
import { contractPropertiesCache } from "@/services/cache";
```

---

## 📚 Additional Resources

- [API Routes Documentation](../docs/api/README.md)
- [Database Schema](../docs/database/README.md)
- [Architecture Overview](../docs/architecture/README.md)
- [Development Setup](../docs/development/README.md)

---

**Last Updated:** January 23, 2026  
**Version:** 2.0.0 (Reorganized & Production-Ready)

- ✅ Transaction receipt validation

**Progress Steps:**

```typescript
type TransactionStep = {
  action: "preparing" | "signing" | "pending" | "confirming" | "success";
  status: "in-progress" | "completed" | "failed";
  txHash?: string;
  error?: string;
};
```

### **Data Invalidation Service** (`DataInvalidationService.ts`)

```typescript
import { DataInvalidationService } from "@/services/DataInvalidationService";

// Invalidate all caches for an NFT
DataInvalidationService.invalidateNFT(contractAddress, tokenId);

// Invalidate marketplace cache
DataInvalidationService.invalidateMarketplace();

// Invalidate user data
DataInvalidationService.invalidateUserData(walletAddress);
```

**Trigger Events:**

- NFT purchase → Invalidate marketplace + wallet caches
- Listing created → Invalidate marketplace + NFT caches
- Rating/Favorite → Invalidate stats cache

### **NFT Sync Service** (`nft-sync/`)

```typescript
// Background service - auto-starts on server boot
// Syncs TheGraph → MongoDB every 30 seconds
// See: scripts/production/sync-marketplace-data.js
```

**Architecture:**

```
TheGraph (Blockchain Events)
      ↓
Polling Service (30s interval)
      ↓
MongoDB (marketplace_items)
      ↓
API Routes
      ↓
React Contexts
```

### **Marketplace Service** (`marketplace/`)

- Listing validation
- Price calculations
- Fee computation
- Whitelist checks

## Service Architecture

### Transaction Flow

```
1. User Action (Button Click)
      ↓
2. TransactionService Method
      ↓
3. Progress Callback (UI Updates)
      ↓
4. Smart Contract Interaction
      ↓
5. Wait for Confirmation
      ↓
6. Cache Invalidation
      ↓
7. Success Callback
```

### Error Handling

```typescript
try {
  await TransactionService.purchaseNFT({ ... });
} catch (error) {
  if (error.code === 'USER_REJECTED') {
    // User cancelled in wallet
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Not enough ETH
  } else {
    // Other errors
  }
}
```

## Best Practices

### ✅ DO:

- Keep services **stateless** (no React state)
- Return **typed results**
- Provide **progress callbacks** for long operations
- Handle **all error cases**
- Invalidate caches after mutations

### ❌ DON'T:

- Don't mix UI logic in services
- Don't store state in services
- Don't forget error handling
- Don't skip cache invalidation

## Service Organization

```
services/
├── blockchain/              # Blockchain interactions
│   └── TransactionService.ts
├── marketplace/            # Marketplace logic
├── nft-sync/              # Background sync services
└── DataInvalidationService.ts  # Cache invalidation
```

## Related Documentation

- **API Routes**: [/docs/api/routes.md](/docs/api/routes.md)
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)
- **Caching**: [/docs/architecture/caching.md](/docs/architecture/caching.md)

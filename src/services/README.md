# services/ - Business Logic Services

Service layer for complex business operations, blockchain interactions, and data synchronization.

## Quick Reference

### **Transaction Service** (`blockchain/TransactionService.ts`)
```typescript
import { TransactionService } from '@/services/blockchain/TransactionService';

// Purchase NFT
const result = await TransactionService.purchaseNFT({
  contractAddress: '0x...',
  tokenId: '123',
  price: '0.1',
  onProgress: (step) => {
    console.log(`Step: ${step.action}, Status: ${step.status}`);
  }
});

// Create Listing
await TransactionService.createListing({
  contractAddress: '0x...',
  tokenId: '123',
  price: '0.5',
  listingType: 'sale',
  onProgress: (step) => { /* ... */ }
});

// Update Listing
await TransactionService.updateListing({
  contractAddress: '0x...',
  tokenId: '123',
  newPrice: '0.6',
  onProgress: (step) => { /* ... */ }
});

// Cancel Listing
await TransactionService.cancelListing({
  contractAddress: '0x...',
  tokenId: '123',
  onProgress: (step) => { /* ... */ }
});
```

**Features:**
- ✅ Multi-step transaction flow
- ✅ Progress callbacks
- ✅ Automatic gas estimation
- ✅ Error handling & retries
- ✅ Transaction receipt validation

**Progress Steps:**
```typescript
type TransactionStep = {
  action: 'preparing' | 'signing' | 'pending' | 'confirming' | 'success';
  status: 'in-progress' | 'completed' | 'failed';
  txHash?: string;
  error?: string;
};
```

### **Data Invalidation Service** (`DataInvalidationService.ts`)
```typescript
import { DataInvalidationService } from '@/services/DataInvalidationService';

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

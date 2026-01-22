# contexts/ - React Context State Management

Global state management for NFT marketplace data, user interactions, and UI state.

## Quick Reference

### **Wallet NFTs Context** (`wallet-nfts/`)
```typescript
import { useWalletNFTs } from '@/contexts/wallet-nfts/WalletNFTsContext';

function MyComponent() {
  const { 
    nfts,           // User's NFTs (DB-first, instant ~50ms)
    loading,        // Loading state
    error,          // Error state
    refetch,        // Manual refetch
    hasMore,        // Pagination
    loadMore        // Load next page
  } = useWalletNFTs();
}
```

**Features:**
- ✅ DB-first loading (instant)
- ✅ Automatic background sync
- ✅ Alchemy fallback
- ✅ Ownership tracking

### **Marketplace Items Context** (`marketplace-items/`)
```typescript
import { useMarketplaceCache } from '@/contexts/marketplace-items/MarketplaceCacheContext';

function MyComponent() {
  const { 
    items,          // Active marketplace listings
    loading,
    error,
    refetch,
    invalidate      // Clear cache
  } = useMarketplaceCache();
}
```

**Features:**
- ✅ TheGraph → MongoDB sync (30s polling)
- ✅ Real-time updates
- ✅ Smart caching

### **Collections Context** (`collections/`)
```typescript
import { useCollections } from '@/contexts/collections/CollectionsContext';

function MyComponent() {
  const { 
    collections,    // Aggregated collections
    loading,
    insights        // Collection insights
  } = useCollections();
}
```

### **NFT Stats Context** (`nft-stats/`)
```typescript
import { useNFTStats } from '@/contexts/nft-stats/NFTStatsContext';

function MyComponent() {
  const {
    // User Interactions
    favorites,      // Set<nftId>
    watchlist,      // Set<nftId>
    ratings,        // Map<nftId, rating>
    
    // Actions
    toggleFavorite,
    toggleWatchlist,
    setRating,
    
    // Stats
    getStats        // Get stats for NFT
  } = useNFTStats();
}
```

**Features:**
- ✅ Optimistic updates
- ✅ Persistent storage (logged-in users)
- ✅ Event-driven updates
- ✅ Cache invalidation

### **Currency Context** (`CurrencyContext.tsx`)
```typescript
import { useCurrency } from '@/contexts/CurrencyContext';

function MyComponent() {
  const { 
    currency,           // Current currency (ETH, USD, EUR)
    setCurrency,        // Change currency
    convertPrice,       // Convert price
    formatPrice         // Format with symbol
  } = useCurrency();
}
```

### **Cart Context** (`CartContext.tsx`)
```typescript
import { useCart } from '@/contexts/CartContext';

function MyComponent() {
  const {
    items,              // Cart items
    itemCount,          // Total count
    totalPrice,         // Sum in ETH
    addToCart,
    removeFromCart,
    clearCart,
    isInCart
  } = useCart();
}
```

### **Notifications Context** (`notifications/`)
```typescript
import { useNotifications } from '@/contexts/notifications/NotificationContext';

function MyComponent() {
  const { notify } = useNotifications();
  
  notify.success('Transaction successful!');
  notify.error('Something went wrong');
  notify.loading('Processing...', { txHash: '0x...' });
  notify.warning('Please confirm in wallet');
}
```

## Context Architecture

### Data Flow
```
Blockchain/API
      ↓
   Context
      ↓
  Components
```

### Cache Invalidation
```typescript
// Automatic invalidation on events
dispatchNFTStatsUpdate({ contractAddress, tokenId, stats });

// Manual invalidation
invalidateAllCachesForNFT(contractAddress, tokenId);
```

## Best Practices

### ✅ DO:
- Use context for **global** state (user data, marketplace items)
- Provide loading/error states
- Implement optimistic updates
- Use event system for cross-context communication

### ❌ DON'T:
- Use context for **local** component state
- Create too many contexts (bundle related state)
- Forget to handle loading/error states

## Related Documentation

- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)
- **Caching**: [/docs/architecture/caching.md](/docs/architecture/caching.md)
- **Events**: [/docs/architecture/events.md](/docs/architecture/events.md)

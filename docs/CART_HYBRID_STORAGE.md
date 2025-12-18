# Shopping Cart - Hybrid Storage System

## Overview
Wallet-based cart with cross-device synchronization using hybrid localStorage + MongoDB storage.

## Architecture

### Storage Strategy
```
┌─────────────────────────────────────────────────────┐
│  User State                                         │
├─────────────────────────────────────────────────────┤
│  Wallet Connected    → MongoDB (cross-device sync) │
│  Not Connected       → localStorage (fallback)     │
│  Optimistic Updates  → UI instant, DB background   │
└─────────────────────────────────────────────────────┘
```

### Data Flow
1. **User adds NFT to cart**
   - Fetch metadata from `/api/nft/detail`
   - Add to React state (instant UI update)
   - Save to localStorage (cache)
   - If connected: Sync to MongoDB (debounced 500ms)

2. **User opens cart page**
   - Load from MongoDB if connected
   - Fallback to localStorage if offline
   - Enrich missing metadata via API

3. **Wallet connects**
   - Load cart from MongoDB
   - Merge with localStorage cart
   - Sync merged cart to MongoDB

4. **Wallet disconnects**
   - Keep cart in localStorage
   - Continue using localStorage until reconnect

## Database Schema

### Collection: `user_carts`
```typescript
{
  walletAddress: string;      // lowercase, unique index
  items: CartItem[];
  updatedAt: Date;            // TTL index (90 days)
}

interface CartItem {
  listingId: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  seller: string;
  name?: string;              // Enriched from MongoDB
  imageUrl?: string;          // Enriched from MongoDB
}
```

### Indexes
- `walletAddress_unique`: Fast wallet lookups
- `updatedAt_asc`: Cleanup queries
- `cart_ttl`: Auto-delete after 90 days

## API Endpoints

### GET `/api/cart?walletAddress=0x...`
Returns cart items for wallet
```json
{
  "success": true,
  "data": {
    "items": [...],
    "updatedAt": "2025-12-18T..."
  }
}
```

### POST `/api/cart`
Save/update entire cart
```json
{
  "walletAddress": "0x...",
  "items": [...]
}
```

### DELETE `/api/cart?walletAddress=0x...`
Clear cart for wallet

## Features

### ✅ Cross-Device Sync
- Add to cart on desktop → see on mobile
- Wallet-based, not browser-based
- Real-time sync via MongoDB

### ✅ Offline Support
- Works without wallet connection
- localStorage fallback
- Automatic sync when connected

### ✅ Metadata Enrichment
- Lazy-load NFT images & names
- Cache enriched data in localStorage
- Persist to MongoDB for future sessions

### ✅ Data Privacy
- Only NFT IDs + wallet addresses
- No personal data
- User controls data via wallet

### ✅ Performance
- Instant UI updates (optimistic)
- Debounced DB writes (500ms)
- Cached reads from localStorage

### ✅ Data Retention
- Auto-cleanup after 90 days (TTL)
- Manual clear via UI
- Survives browser refreshes

## Usage

### CartContext Hook
```typescript
import { useCart } from '@/contexts';

function MyComponent() {
  const {
    items,           // CartItem[]
    itemCount,       // number
    totalPrice,      // bigint
    addToCart,       // (item: ActiveItem) => Promise<void>
    removeFromCart,  // (listingId: string) => void
    clearCart,       // () => Promise<void>
    isInCart,        // (listingId: string) => boolean
    updateCartItem   // (listingId, updates) => void
  } = useCart();
}
```

### Adding to Cart
```typescript
const item: ActiveItem = {
  listingId: '123',
  contractAddress: '0x...',
  tokenId: '456',
  price: '1000000000000000000', // 1 ETH in wei
  seller: '0x...'
};

await addToCart(item);
// → Fetches metadata
// → Saves to localStorage
// → Syncs to MongoDB (if connected)
```

## Migration from localStorage-only

The system automatically migrates existing carts:
1. On wallet connect → Load from MongoDB
2. If MongoDB empty but localStorage has items → Sync to MongoDB
3. Future loads → Use MongoDB as source of truth

## Monitoring

### Console Logs
```
💾 Saved to localStorage: 3 items
📡 Syncing to MongoDB for: 0x8bba...1bb
✅ Synced to DB: 3 items
```

### DevTools
- LocalStorage: `nft-marketplace-cart`
- MongoDB: `user_carts` collection
- Network: `/api/cart` requests

## Performance Metrics

- **Add to cart**: ~50ms (metadata fetch) + 500ms (DB sync debounced)
- **Load cart**: ~50ms (MongoDB) or instant (localStorage cache)
- **Cross-device sync**: Real-time on wallet connect
- **Storage cost**: ~1KB per 10 items

## Future Enhancements

- [ ] Cart expiration warnings (>7 days old)
- [ ] Price change notifications
- [ ] NFT availability check (sold out warnings)
- [ ] Cart sharing (generate shareable link)
- [ ] Analytics (abandoned cart recovery)
- [ ] Multi-wallet support
- [ ] Wishlist integration

## Security

- ✅ Wallet address validation
- ✅ Rate limiting on API endpoints
- ✅ No sensitive data storage
- ✅ User owns their cart data
- ✅ TTL-based automatic cleanup

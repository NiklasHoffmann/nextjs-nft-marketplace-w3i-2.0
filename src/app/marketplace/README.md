# 🛒 /marketplace - NFT Marketplace Route

Browse and purchase NFTs listed on the marketplace.

## 🎯 Purpose

Public marketplace listing page displaying all NFTs available for purchase.

## 🗂️ Structure

```
marketplace/
├── README.md           # This file
├── page.tsx            # Main marketplace page
├── layout.tsx          # Marketplace layout
├── components/         # Route-specific components
└── context.tsx         # Marketplace context (optional)
```

## 🚀 Features

- **Grid View**: Display all listed NFTs in responsive grid
- **Filters**: Filter by price, collection, rarity
- **Search**: Search by name, token ID, contract address
- **Sort**: Sort by price, likes, views, recent
- **Quick View**: NFT preview cards with essential info
- **Cart Integration**: Add to cart for batch purchase

## 🔗 Data Source

### MongoDB Integration
```typescript
// Fetches from marketplace_items collection
const items = await MarketplaceItem.find({ isListed: true })
  .populate('nft_metadata')
  .sort({ createdAt: -1 });
```

### Real-time Updates
- Sync service runs every 30 seconds
- TheGraph → MongoDB pipeline
- Instant UI updates via polling

## 📊 Collection Aggregation

### Available via CollectionsContext
```typescript
import { useCollections } from '@/contexts/collections-context';

const { collections, loading } = useCollections();
// Collections with insights, floor price, volume, etc.
```

## 🎨 Component Usage

### NFT Cards
```typescript
import { NFTCard } from '@/components/nft/NFTCard';

<NFTCard
  nft={nft}
  showPrice
  showQuickView
  onAddToCart={handleAddToCart}
/>
```

### Filters
```typescript
import { MarketplaceFilters } from '@/components/marketplace/Filters';

<MarketplaceFilters
  onFilterChange={setFilters}
  collections={collections}
/>
```

## 🔧 Configuration

### Pagination
```typescript
const ITEMS_PER_PAGE = 24;
const MAX_ITEMS = 1000;
```

### Cache Strategy
- MongoDB caching (instant load)
- Background sync (30s interval)
- Stale-while-revalidate pattern

## 📝 Common Use Cases

### Filter by Collection
```typescript
const filteredItems = items.filter(item => 
  item.contractAddress === selectedCollection
);
```

### Sort by Price
```typescript
const sortedItems = [...items].sort((a, b) => 
  parseFloat(a.price) - parseFloat(b.price)
);
```

### Add to Cart
```typescript
import { useCart } from '@/contexts/cart/CartContext';

const { addToCart } = useCart();
addToCart(nft);
```

## 🐛 Troubleshooting

### "No items found"
→ Check marketplace sync status
→ Run manual sync: `POST /api/marketplace/sync`

### Slow loading
→ MongoDB indexes configured correctly
→ Check network tab for slow API calls

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-20

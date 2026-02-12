# 🛒 /cart - Shopping Cart Route

Manage selected NFTs before checkout.

## 🎯 Purpose

Shopping cart for batch NFT purchases with price calculation and checkout flow.

## 🗂️ Structure

```
cart/
├── README.md           # This file
├── page.tsx            # Cart page wrapper
├── layout.tsx          # Cart layout
└── components/
    ├── CartPage.tsx    # Main cart implementation
    └── index.ts        # Barrel exports
```

## 🚀 Features

- **Batch Management**: Add/remove multiple NFTs
- **Price Calculation**: Total price with fee breakdown
- **Empty State**: Friendly message when cart is empty
- **Quick Actions**: Remove items, clear cart
- **Checkout**: Navigate to purchase flow
- **Persistence**: Cart saved to localStorage

## 🔗 Data Source

### CartContext (Global State)

```typescript
import { useCart } from "@/contexts/cart/CartContext";
import { devLog } from "@/utils";

const {
  items, // CartItem[]
  addToCart, // (nft) => void
  removeFromCart, // (key) => void
  clearCart, // () => void
  totalPrice, // string
  itemCount, // number
} = useCart();
```

### Cart Item Structure

```typescript
interface CartItem {
  key: string; // Unique identifier
  nft: AggregatedNFT; // Full NFT data
  price: string; // Listing price
  seller: string; // Seller address
  listingId: string; // Marketplace listing ID
}
```

## 🎨 Component Structure

### CartPage Component

- Header with item count
- Item list with thumbnails
- Price breakdown
- Checkout button
- Empty state

### CartItem Component

```typescript
<CartItem
  item={item}
  onRemove={removeFromCart}
/>
```

## 📝 Common Use Cases

### Add to Cart (from Marketplace)

```typescript
import { useCart } from "@/contexts/cart/CartContext";

const { addToCart } = useCart();

const handleAddToCart = (nft: AggregatedNFT) => {
  if (!nft.listing) {
    devLog.error("NFT is not listed");
    return;
  }

  addToCart(nft);
  toast.success("Added to cart");
};
```

### Remove from Cart

```typescript
const { removeFromCart } = useCart();

removeFromCart(nft.key);
```

### Calculate Total with Fees

```typescript
import { useMarketplaceFees } from "@/hooks/marketplace";

const { calculateFees } = useMarketplaceFees();
const { platformFee, totalWithFee } = calculateFees(totalPrice);
```

### Clear Cart After Purchase

```typescript
const { clearCart } = useCart();

const handleCheckout = async () => {
  // Process purchase...
  await purchaseNFTs(items);

  // Clear cart on success
  clearCart();
  router.push("/wallet");
};
```

### Check if NFT in Cart

```typescript
const { items } = useCart();

const isInCart = items.some((item) => item.nft.key === nft.key);
```

## 🔧 Configuration

### LocalStorage Persistence

```typescript
const CART_STORAGE_KEY = "nft-marketplace-cart";
```

### Max Items

```typescript
const MAX_CART_ITEMS = 50; // Prevent excessive cart size
```

## 💳 Checkout Flow

1. **Cart Review**: User reviews items in cart
2. **Price Confirmation**: Total price + fees displayed
3. **Wallet Connection**: Ensure wallet connected
4. **Balance Check**: Verify sufficient funds
5. **Batch Purchase**: Execute all purchases
6. **Success**: Clear cart, show confirmation

## 🎨 Styling

### Empty State

```typescript
<EmptyState
  icon={ShoppingCart}
  title="Your cart is empty"
  description="Browse the marketplace to find NFTs"
  action={{
    label: "Browse Marketplace",
    href: "/marketplace"
  }}
/>
```

## 🐛 Troubleshooting

### "Items disappear after refresh"

→ Check localStorage is enabled
→ Verify CART_STORAGE_KEY is consistent

### "Total price incorrect"

→ Verify all NFTs have valid listing.price
→ Check fee calculation logic

### "Can't add to cart"

→ Ensure NFT has listing data (nft.listed === true)
→ Check NFT is not already in cart

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-20

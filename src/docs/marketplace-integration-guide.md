# Marketplace Integration Recommendations

## 🏆 **Empfohlene Architektur: Funktionale Gruppierung**

Ich habe deine Marketplace-Funktionen in **4 logische Gruppen** aufgeteilt:

### 📁 **Dateistruktur**
```
src/hooks/marketplace/
├── useMarketplaceListing.ts    # Create, Update, Cancel Listings
├── useMarketplacePurchase.ts   # Purchase/Buy Listings
├── useMarketplaceData.ts       # Read/View Functions
├── useMarketplaceAdmin.ts      # Admin & Proceeds Functions
└── index.ts                    # Centralized Exports
```

## 🔥 **Funktionen pro Hook**

### 1️⃣ **useMarketplaceListing** (Create, Update, Cancel)
```typescript
const { createListing, updateListing, cancelListing } = useMarketplaceListing(MARKETPLACE_ADDRESS);

// Create listing
await createListing({
  tokenAddress: "0x...",
  tokenId: "123",
  price: "1.5", // ETH
  buyerWhitelistEnabled: false
});

// Update price
await updateListing({
  listingId: "456",
  newPrice: "2.0"
});
```

### 2️⃣ **useMarketplacePurchase** (Buy/Swap)
```typescript
const { purchaseListing, isSwapListing } = useMarketplacePurchase(MARKETPLACE_ADDRESS);

// Buy with ETH
await purchaseListing({
  listingId: "456",
  expectedPrice: "1.5"
});

// NFT Swap
await purchaseListing({
  listingId: "789",
  expectedPrice: "0",
  expectedDesiredTokenAddress: "0x...",
  expectedDesiredTokenId: "321"
});
```

### 3️⃣ **useMarketplaceData** (Read Data)
```typescript
const { useListingById, useUserProceeds } = useMarketplaceData(MARKETPLACE_ADDRESS);

// Get listing details
const listing = useListingById("456");

// Get user earnings
const proceeds = useUserProceeds(userAddress);
```

### 4️⃣ **useMarketplaceAdmin** (Admin Functions)
```typescript
const { withdrawProceeds, setInnovationFee } = useMarketplaceAdmin(MARKETPLACE_ADDRESS);

// Withdraw earnings
await withdrawProceeds();

// Set marketplace fee (admin only)
await setInnovationFee(250); // 2.5%
```

## 🚀 **Verwendung in Komponenten**

### Example: NFT Listing Component
```typescript
"use client";
import { useMarketplaceListing, MARKETPLACE_CONFIG } from '@/hooks/marketplace';

export default function ListNFT({ tokenAddress, tokenId }: Props) {
  const { createListing, isLoading, error } = useMarketplaceListing(
    MARKETPLACE_CONFIG.ADDRESS
  );

  const handleCreateListing = async () => {
    try {
      await createListing({
        tokenAddress,
        tokenId,
        price: "1.0",
        buyerWhitelistEnabled: false
      });
    } catch (err) {
      console.error('Listing failed:', err);
    }
  };

  return (
    <button 
      onClick={handleCreateListing}
      disabled={isLoading}
    >
      {isLoading ? 'Creating...' : 'List NFT'}
    </button>
  );
}
```

## 🛠 **Alternative Architekturen**

### Option 2: Ein Hook für alles
```typescript
// ❌ Nicht empfohlen - zu groß und unübersichtlich
const marketplace = useMarketplace();
marketplace.createListing();
marketplace.purchaseListing();
marketplace.withdrawProceeds();
// ... 15+ Funktionen in einem Hook
```

### Option 3: Ein Hook pro Funktion
```typescript
// ❌ Nicht empfohlen - zu viele Hook-Dateien
const { createListing } = useCreateListing();
const { updateListing } = useUpdateListing();
const { cancelListing } = useCancelListing();
// ... 15+ separate Hooks
```

## ✅ **Warum die gewählte Architektur optimal ist**

### **Vorteile:**
1. **🎯 Logische Gruppierung** - Ähnliche Funktionen zusammen
2. **🔧 Einzelne Verantwortung** - Jeder Hook hat klaren Zweck
3. **📦 Tree-Shaking** - Nur importieren was gebraucht wird
4. **🧪 Testbar** - Einfach zu mocken und testen
5. **🔄 Wiederverwendbar** - Hooks in verschiedenen Komponenten nutzbar
6. **📚 Übersichtlich** - Nicht zu viele, nicht zu wenige Dateien

### **Usage Patterns:**
- **Seller Flow**: useMarketplaceListing + useMarketplaceAdmin
- **Buyer Flow**: useMarketplacePurchase + useMarketplaceData  
- **Admin Panel**: useMarketplaceAdmin
- **Marketplace View**: useMarketplaceData

## 🔧 **Environment Setup**

Vergiss nicht, deine Marketplace-Adresse zu konfigurieren:

```env
# .env.local
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...YourMarketplaceAddress
```

## 🎉 **Ready to Use!**

Die Hooks sind implementiert und können sofort verwendet werden. Jeder Hook:
- ✅ Enthält Error Handling
- ✅ Loading States
- ✅ TypeScript Types
- ✅ Transaction Confirmation
- ✅ Optimized für deine ABI

**Import alles aus einem Place:**
```typescript
import { 
  useMarketplaceListing,
  useMarketplacePurchase,
  MARKETPLACE_CONFIG 
} from '@/hooks/marketplace';
```
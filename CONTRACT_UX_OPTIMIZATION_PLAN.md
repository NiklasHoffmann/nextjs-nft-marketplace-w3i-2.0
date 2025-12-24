# Contract UX Optimization Plan
**Datum:** 19. Dezember 2025  
**Ziel:** Optimale User Experience für alle Contract-Aktionen mit Notifications & State Management

---

## 🎯 **Übersicht**

### **Aktuelle Situation:**
✅ **TransactionService existiert** (459 LOC)
- Purchase NFT ✅
- Update Listing ✅
- Cancel Listing ✅
- Create Listing ✅

✅ **Notification System existiert**
- `useNotifications()` Hook
- Success, Error, Warning, Info, Loading
- Auto-dismiss funktionalität
- TX Hash anzeigen

⚠️ **Was fehlt:**
1. **Notification Flow** ist nicht optimal implementiert
2. **State Updates** nach Contract-Aktionen fehlen
3. **Batch Purchase** nicht implementiert (CartPage TODO)
4. **Post-Transaction Redirects** fehlen
5. **Cache Invalidation** nach Kauf nicht automatisch

---

## 📋 **Optimierungsziele**

### **1. Optimaler Notification Flow**

**Gewünschter Ablauf:**
```
1. User drückt "Kaufen"
   → Notification: "Bitte bestätigen Sie in Ihrer Wallet..." (Loading)

2. User bestätigt in Wallet
   → Notification updated: "Transaktion wird verarbeitet..." (Loading)

3. Blockchain Confirmation
   → Notification updated: "Kauf erfolgreich!" (Success)
   → Redirect: `/wallet` nach 2 Sekunden
```

**Pro Contract-Aktion:**

#### **Purchase (Kaufen)**
```typescript
Step 1: preparing    → Loading: "Preparing transaction..."
Step 2: signing      → Loading: "Please confirm in wallet..."
Step 3: pending      → Loading: "Processing transaction..."
Step 4: confirming   → Loading: "Waiting for confirmation..."
Step 5: success      → Success: "Purchase successful!"
                     → Update: Remove NFT from marketplace cache
                     → Update: Add NFT to wallet cache
                     → Redirect: /wallet (after 2s)
```

#### **Update Listing**
```typescript
Step 1: preparing    → Loading: "Preparing update..."
Step 2: signing      → Loading: "Please confirm in wallet..."
Step 3: pending      → Loading: "Updating listing..."
Step 4: success      → Success: "Listing updated!"
                     → Update: Refresh marketplace cache
                     → Close modal
```

#### **Cancel Listing**
```typescript
Step 1: preparing    → Loading: "Preparing cancellation..."
Step 2: signing      → Loading: "Please confirm in wallet..."
Step 3: pending      → Loading: "Cancelling listing..."
Step 4: success      → Success: "Listing cancelled!"
                     → Update: Remove from marketplace cache
                     → Update: Add to wallet cache
                     → Close modal or redirect to /wallet
```

#### **Create Listing**
```typescript
Step 1: preparing    → Loading: "Preparing listing..."
Step 2: signing      → Loading: "Please confirm in wallet..."
Step 3: pending      → Loading: "Creating listing..."
Step 4: success      → Success: "Listing created!"
                     → Update: Add to marketplace cache
                     → Update: Remove from wallet cache (if exclusive listing)
                     → Redirect: /marketplace oder NFT detail page
```

#### **Batch Purchase (CartPage - NEU)**
```typescript
Step 1: preparing    → Loading: "Preparing batch purchase..."
Step 2: signing      → Loading: "Please confirm in wallet..."
Step 3: pending      → Loading: "Processing X NFTs..."
Step 4: success      → Success: "Purchased X NFTs!"
                     → Update: Remove all from marketplace cache
                     → Update: Add all to wallet cache
                     → Update: Clear cart
                     → Redirect: /wallet
```

---

### **2. State Management nach Contract-Aktionen**

**Problem:**
Nach einem Kauf ist das NFT noch auf dem Marketplace sichtbar, bis die Seite neu geladen wird.

**Lösung: Cache Invalidation System**

#### **A. WalletNFTsContext**
```typescript
// Already has invalidate() and refresh() methods
cache.invalidate(walletAddress); // Clear cache for specific wallet
refreshNFTs(); // Force re-fetch from API
```

#### **B. MarketplaceCacheContext**
```typescript
// Needs new methods:
invalidateListing(listingId); // Remove specific listing
invalidateContract(contractAddress, tokenId); // Remove by NFT
refreshMarketplace(); // Force re-fetch
```

#### **C. Post-Transaction Updates**

**Nach Purchase:**
```typescript
1. Remove from MarketplaceCache
2. Invalidate WalletNFTsCache for buyer
3. Optional: Refresh wallet NFTs in background
```

**Nach Cancel Listing:**
```typescript
1. Remove from MarketplaceCache
2. Invalidate WalletNFTsCache for seller
```

**Nach Create Listing:**
```typescript
1. Add to MarketplaceCache (or invalidate to force refresh)
2. Invalidate WalletNFTsCache for seller (if exclusive)
```

---

### **3. Batch Purchase Implementation**

**Aktueller TODO:** `src/app/cart/CartPage.tsx` Line 104

**Benötigt:**
1. `batchPurchaseNFTs()` Methode in TransactionService
2. Contract call für batch purchase (wenn verfügbar)
3. Fallback: Sequential purchases mit progress tracking
4. Notification mit "X/Y NFTs purchased" Progress

**Implementation:**
```typescript
// Option 1: Smart Contract Batch (wenn verfügbar)
contract.batchPurchase([listingId1, listingId2, ...], totalPrice)

// Option 2: Sequential Fallback
for (const item of cartItems) {
  await purchaseNFT(item);
  updateProgress(index, total);
}
```

---

## 🛠️ **Implementation Plan**

### **Phase 1: Enhanced TransactionService Notifications** (1-2h)

**Files to modify:**
- `src/services/blockchain/TransactionService.ts`

**Changes:**
1. Add `notificationId` tracking
2. Update notifications instead of creating new ones
3. Add post-transaction callbacks

```typescript
export interface PurchaseNFTParams {
  // ... existing params
  onSuccess?: (result: TransactionResult) => void; // NEW
  onPostTransaction?: () => Promise<void>; // NEW - for cache updates
}

async purchaseNFT(params) {
  // Track notification ID
  let notifId: string | null = null;

  try {
    // Step 1: Preparing
    notifId = notifications.loading(
      'Preparing Transaction',
      'Setting up your purchase...'
    );
    
    // Step 2: Signing
    notifications.removeNotification(notifId);
    notifId = notifications.loading(
      'Confirm in Wallet',
      'Please confirm the transaction in your wallet'
    );
    
    await purchaseHook.purchaseListing(...);
    
    // Step 3: Pending
    notifications.removeNotification(notifId);
    notifId = notifications.loading(
      'Processing Transaction',
      'Your purchase is being processed...'
    );
    
    // Wait for confirmation...
    
    // Step 4: Success
    notifications.removeNotification(notifId);
    notifications.success(
      'Purchase Successful!',
      'Your NFT has been transferred to your wallet',
      { 
        txHash: result.txHash,
        duration: 5000 
      }
    );
    
    // Post-transaction updates
    if (params.onPostTransaction) {
      await params.onPostTransaction();
    }
    
    // Success callback
    if (params.onSuccess) {
      params.onSuccess(result);
    }
    
    return result;
    
  } catch (error) {
    // Clear loading notification
    if (notifId) notifications.removeNotification(notifId);
    
    // Show error
    const errorMessage = parseTransactionError(error);
    notifications.error('Purchase Failed', errorMessage);
    
    throw error;
  }
}
```

---

### **Phase 2: MarketplaceCache Invalidation** (1h)

**Files to modify:**
- `src/contexts/marketplace-cache/MarketplaceCacheContext.tsx`

**New methods:**
```typescript
// Remove specific listing from cache
const removeListing = useCallback((listingId: string) => {
  setMarketplaceItems(prev => 
    prev.filter(item => item.marketplace.listingId !== listingId)
  );
}, []);

// Remove by contract address + tokenId
const removeNFT = useCallback((contractAddress: string, tokenId: string) => {
  setMarketplaceItems(prev => 
    prev.filter(item => 
      !(item.contractAddress === contractAddress && item.tokenId === tokenId)
    )
  );
}, []);

// Force refresh
const refreshMarketplace = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/marketplace');
    const data = await response.json();
    setMarketplaceItems(data.items);
  } finally {
    setLoading(false);
  }
}, []);
```

---

### **Phase 3: BuyNowModal Integration** (30min)

**File:** `src/components/nft/modals/BuyNowModal.tsx`

**Changes:**
```typescript
import { useRouter } from 'next/navigation';
import { useMarketplaceCache } from '@/contexts/marketplace-cache';
import { useWalletNFTs } from '@/contexts/wallet-nfts';

function BuyNowModal({ ... }) {
  const router = useRouter();
  const { removeNFT } = useMarketplaceCache();
  const { invalidateCache } = useWalletNFTs();
  
  const handlePurchase = async () => {
    const result = await txService.purchaseNFT({
      // ... existing params
      onSuccess: () => {
        // Schedule redirect after 2 seconds
        setTimeout(() => {
          router.push('/wallet');
        }, 2000);
      },
      onPostTransaction: async () => {
        // Update caches
        removeNFT(contractAddress, tokenId);
        invalidateCache(buyer); // buyer's wallet
      }
    });
  };
}
```

---

### **Phase 4: UpdateListingModal Integration** (20min)

**File:** `src/components/nft/modals/UpdateListingModal.tsx`

**Changes:**
```typescript
const handleUpdate = async () => {
  await txService.updateListing({
    // ... params
    onPostTransaction: async () => {
      // Force refresh marketplace to get new price
      await refreshMarketplace();
    }
  });
};
```

---

### **Phase 5: CancelListingModal Integration** (20min)

**File:** `src/components/nft/modals/CancelListingModal.tsx`

**Changes:**
```typescript
const handleCancel = async () => {
  await txService.cancelListing({
    // ... params
    onSuccess: () => {
      // Option: Redirect to wallet or close modal
      onClose();
    },
    onPostTransaction: async () => {
      removeNFT(contractAddress, tokenId);
      invalidateCache(seller);
    }
  });
};
```

---

### **Phase 6: Batch Purchase Implementation** (2-3h)

**File:** `src/app/cart/CartPage.tsx`

**New method in TransactionService:**
```typescript
// src/services/blockchain/TransactionService.ts

export interface BatchPurchaseParams {
  items: Array<{
    listingId: string;
    price: string;
    contractAddress: string;
    tokenId: string;
  }>;
  onProgress?: (current: number, total: number) => void;
  onSuccess?: () => void;
  onPostTransaction?: () => Promise<void>;
}

const batchPurchaseNFTs = useCallback(async (
  params: BatchPurchaseParams
): Promise<TransactionResult[]> => {
  const { items, onProgress, onSuccess, onPostTransaction } = params;
  const results: TransactionResult[] = [];
  let notifId: string | null = null;
  
  try {
    // Initial notification
    notifId = notifications.loading(
      'Batch Purchase',
      `Preparing to purchase ${items.length} NFTs...`
    );
    
    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Update notification
      notifications.removeNotification(notifId);
      notifId = notifications.loading(
        'Purchasing NFTs',
        `Processing ${i + 1}/${items.length}...`
      );
      
      // Purchase
      const result = await purchaseNFT({
        ...item,
        seller: item.seller || '',
        onProgress: undefined, // Suppress individual notifications
        onError: undefined
      });
      
      results.push(result);
      onProgress?.(i + 1, items.length);
      
      // Small delay between purchases
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Success notification
    notifications.removeNotification(notifId);
    notifications.success(
      'Batch Purchase Complete!',
      `Successfully purchased ${items.length} NFTs`,
      { duration: 6000 }
    );
    
    // Post-transaction updates
    if (onPostTransaction) {
      await onPostTransaction();
    }
    
    onSuccess?.();
    
    return results;
    
  } catch (error) {
    if (notifId) notifications.removeNotification(notifId);
    
    const errorMessage = parseTransactionError(error);
    notifications.error(
      'Batch Purchase Failed',
      `${errorMessage}. ${results.length}/${items.length} NFTs purchased.`
    );
    
    throw error;
  }
}, [purchaseNFT, notifications]);
```

**CartPage Integration:**
```typescript
// src/app/cart/CartPage.tsx

const handleBatchPurchase = async () => {
  if (!isConnected || itemCount === 0) return;
  
  setBatchPurchasing(true);
  
  try {
    await txService.batchPurchaseNFTs({
      items: enrichedItems.map(item => ({
        listingId: item.marketplace.listingId,
        price: item.marketplace.price,
        contractAddress: item.contractAddress,
        tokenId: item.tokenId,
        seller: item.marketplace.seller
      })),
      onProgress: (current, total) => {
        console.log(`Progress: ${current}/${total}`);
      },
      onSuccess: () => {
        // Redirect to wallet after 2s
        setTimeout(() => router.push('/wallet'), 2000);
      },
      onPostTransaction: async () => {
        // Clear cart
        await clearCart();
        
        // Update marketplace cache
        enrichedItems.forEach(item => {
          removeNFT(item.contractAddress, item.tokenId);
        });
        
        // Invalidate wallet cache
        invalidateCache(address);
      }
    });
    
  } catch (error) {
    console.error('Batch purchase failed:', error);
  } finally {
    setBatchPurchasing(false);
  }
};
```

---

## 📊 **Summary**

### **Was wird implementiert:**

✅ **1. Enhanced Notifications**
- Progressive update statt neue Notifications
- Klare Status-Messages pro Step
- Auto-dismiss nach Success
- TX Hash anzeigen

✅ **2. Cache Management**
- Automatic invalidation nach Purchase
- Automatic invalidation nach Cancel
- Automatic refresh nach Update
- Marketplace + Wallet sync

✅ **3. Post-Transaction Actions**
- Redirect to /wallet nach Purchase
- Redirect to NFT detail nach Create Listing
- Close modal nach Update/Cancel
- Clear cart nach Batch Purchase

✅ **4. Batch Purchase**
- Sequential purchase mit Progress
- Single notification mit Counter
- Bulk cache updates
- Error handling (partial success)

---

## ⏱️ **Zeitaufwand**

| Phase | Beschreibung | Zeit |
|-------|-------------|------|
| Phase 1 | TransactionService Notifications | 1-2h |
| Phase 2 | MarketplaceCache Invalidation | 1h |
| Phase 3 | BuyNowModal Integration | 30min |
| Phase 4 | UpdateListingModal Integration | 20min |
| Phase 5 | CancelListingModal Integration | 20min |
| Phase 6 | Batch Purchase | 2-3h |
| **Testing** | **Alle Flows testen** | **1-2h** |

**Total:** ~6-9 Stunden (1-1.5 Tage)

---

## 🎯 **Priority Order**

### **High Priority (Heute/Morgen):**
1. ✅ Phase 1: Enhanced Notifications (CORE)
2. ✅ Phase 2: MarketplaceCache Invalidation (CORE)
3. ✅ Phase 3: BuyNowModal Integration (USER-FACING)

### **Medium Priority (Morgen/Übermorgen):**
4. ✅ Phase 4: UpdateListingModal
5. ✅ Phase 5: CancelListingModal
6. ✅ Phase 6: Batch Purchase

### **Testing:**
- Manual testing pro Modal
- Test mit real testnet transactions
- Verify cache updates
- Verify redirects

---

## 🚀 **Nächste Schritte**

**Möchtest du:**
1. **Direkt starten** mit Phase 1 (Enhanced Notifications)?
2. **Erst diskutieren** über specific implementation details?
3. **Priorisierung ändern** (z.B. Batch Purchase zuerst)?

**Ich empfehle:** Phase 1 → Phase 2 → Phase 3 durchziehen, dann testen, dann weiter.

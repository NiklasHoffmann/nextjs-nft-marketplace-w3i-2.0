# Data Invalidation System

## Überblick

Das Data Invalidation System sorgt dafür, dass alle NFT-Listen automatisch aktualisiert werden, wenn sich Daten ändern (z.B. nach Contract-Aktionen oder The Graph Updates).

## Architektur

```
Contract Action (z.B. NFT listen)
         ↓
DataInvalidationService
    (emitDataInvalidation)
         ↓
   Custom Event
         ↓
    Contexts lauschen
    (WalletNFTsContext, MarketplaceItemsContext, etc.)
         ↓
   Cache invalidieren + Neu laden
         ↓
    UI aktualisiert sich automatisch
```

## Service: DataInvalidationService

Zentraler Service für Data Invalidation Events.

### Location
```
src/services/DataInvalidationService.ts
```

### Event Types
```typescript
type InvalidationType = 
    | 'listing-created'      // NFT wurde gelistet
    | 'listing-canceled'     // Listing wurde abgebrochen
    | 'nft-purchased'        // NFT wurde gekauft
    | 'nft-transferred'      // NFT wurde übertragen (Trade)
    | 'graph-update'         // The Graph Daten wurden aktualisiert
    | 'manual-refresh';      // Manueller Refresh vom User
```

### Usage

#### Nach dem Listen eines NFTs
```typescript
import { invalidateAfterListing } from '@/services/DataInvalidationService';

// Nachdem ein NFT erfolgreich gelistet wurde
invalidateAfterListing(contractAddress, tokenId, listingId);
```

#### Nach dem Kauf eines NFTs
```typescript
import { invalidateAfterPurchase } from '@/services/DataInvalidationService';

// Nachdem ein NFT erfolgreich gekauft wurde
invalidateAfterPurchase(contractAddress, tokenId, buyerAddress, listingId);
```

#### Nach dem Abbrechen eines Listings
```typescript
import { invalidateAfterCancelListing } from '@/services/DataInvalidationService';

// Nachdem ein Listing abgebrochen wurde
invalidateAfterCancelListing(contractAddress, tokenId, listingId);
```

#### Nach einem NFT Transfer (Trade)
```typescript
import { invalidateAfterTransfer } from '@/services/DataInvalidationService';

// Nachdem ein NFT übertragen wurde
invalidateAfterTransfer(contractAddress, tokenId, fromAddress, toAddress);
```

#### Alle Daten invalidieren
```typescript
import { invalidateAll } from '@/services/DataInvalidationService';

// Nach The Graph Update oder bei kompletten Cache Clear
invalidateAll();
```

#### Manueller Refresh
```typescript
import { triggerManualRefresh } from '@/services/DataInvalidationService';

// User klickt auf "Refresh" Button
triggerManualRefresh();
```

## Context Integration

### WalletNFTsContext

**Location**: `src/contexts/wallet-nfts/WalletNFTsContext.tsx`

**Reaktion auf Events**:
- `manual-refresh` → Cache löschen + Neu laden
- `graph-update` → Cache löschen + Neu laden
- Events mit `walletAddress` → Nur refreshen wenn es die eigene Wallet ist

**Implementierung**:
```typescript
useEffect(() => {
    const unsubscribe = onDataInvalidation((detail) => {
        const shouldRefresh = 
            detail.type === 'manual-refresh' ||
            detail.type === 'graph-update' ||
            (detail.walletAddress && address && 
             detail.walletAddress.toLowerCase() === address.toLowerCase());

        if (shouldRefresh && address) {
            cache.invalidate(address);
            fetchWalletNFTs(address);
        }
    });

    return unsubscribe;
}, [address, cache, fetchWalletNFTs]);
```

### MarketplaceItemsContext

**Location**: `src/contexts/marketplace-items/MarketplaceItemsContext.tsx`

**Reaktion auf Events**:
- `listing-created` → Kompletten Cache invalidieren (neue Listings anzeigen)
- `listing-canceled` → Spezifisches NFT aus Cache entfernen
- `nft-purchased` → Spezifisches NFT aus Cache entfernen
- `nft-transferred` → Spezifisches NFT aus Cache entfernen
- `graph-update` → Kompletten Cache invalidieren
- `manual-refresh` → Kompletten Cache invalidieren

**Implementierung**:
```typescript
useEffect(() => {
    const unsubscribe = onDataInvalidation((detail) => {
        switch (detail.type) {
            case 'listing-created':
                service.invalidate(); // Alle Caches
                break;

            case 'listing-canceled':
            case 'nft-purchased':
            case 'nft-transferred':
                if (detail.contractAddress && detail.tokenId) {
                    service.removeNFT(detail.contractAddress, detail.tokenId);
                }
                break;

            case 'graph-update':
            case 'manual-refresh':
                service.invalidate();
                break;
        }
    });

    return unsubscribe;
}, [service]);
```

## Implementierung in Components

### 1. Sell Page (NFT Listen) ✅ IMPLEMENTIERT

**Location**: `src/app/sell/SellPage.tsx`

```typescript
import { invalidateAfterListing } from '@/services/DataInvalidationService';

useEffect(() => {
    if (listingSuccess && listingTxHash && currentListingStep !== 'success') {
        // ... Success handling ...

        // Invalidate data
        if (transactionData.selectedNFT) {
            invalidateAfterListing(
                transactionData.selectedNFT.core.contractAddress,
                transactionData.selectedNFT.core.tokenId
            );
        }
    }
}, [listingSuccess, listingTxHash, currentListingStep, transactionData.selectedNFT]);
```

### 2. Transaction Service (Kaufen, Update, Cancel) ✅ IMPLEMENTIERT

**Location**: `src/services/blockchain/TransactionService.ts`

Alle Contract-Aktionen triggern automatisch Data Invalidation:

#### Purchase NFT (Kaufen)
```typescript
const result: TransactionResult = {
    success: true,
    txHash: hash
};

// Invalidate data to refresh all NFT lists
if (params.contractAddress && params.tokenId && params.buyer) {
    console.log('🔄 Invalidating data after purchase');
    invalidateAfterPurchase(
        params.contractAddress,
        params.tokenId,
        params.buyer,
        listingId
    );
}
```

#### Update Listing (Preis ändern)
```typescript
// Invalidate data to refresh all NFT lists (update = cancel + create)
if (params.contractAddress && params.tokenId) {
    console.log('🔄 Invalidating data after update listing');
    invalidateAfterListing(
        params.contractAddress,
        params.tokenId,
        listingId
    );
}
```

#### Cancel Listing (Listing abbrechen)
```typescript
// Invalidate data to refresh all NFT lists
if (params.contractAddress && params.tokenId) {
    console.log('🔄 Invalidating data after cancel listing');
    invalidateAfterCancelListing(
        params.contractAddress,
        params.tokenId,
        listingId
    );
}
```

### 3. BuyNowModal ✅ IMPLEMENTIERT

**Location**: `src/components/nft/modals/BuyNowModal.tsx`

```typescript
const result = await txService.purchaseNFT({
    listingId,
    price: formatEther(price),
    seller,
    buyer, // ✅ Für data invalidation
    contractAddress,
    tokenId,
    // ... rest
});

// TransactionService handled automatisch:
// - invalidateAfterPurchase() nach erfolgreicher Transaktion
// - WalletNFTsContext refreshed automatisch
// - MarketplaceItemsContext entfernt NFT aus allen Listings
```

## Implementierte Contract-Aktionen

| Aktion | Service | Status | Event Type |
|--------|---------|--------|------------|
| **NFT Listen** | SellPage | ✅ Implementiert | `listing-created` |
| **NFT Kaufen** | TransactionService | ✅ Implementiert | `nft-purchased` |
| **Listing Updaten** | TransactionService | ✅ Implementiert | `listing-created` |
| **Listing Canceln** | TransactionService | ✅ Implementiert | `listing-canceled` |
| **NFT Transfer** | - | ⏳ Zu implementieren | `nft-transferred` |
| **The Graph Sync** | - | ⏳ Zu implementieren | `graph-update` |

### Manual Refresh Button

**Location**: Beliebige Component mit Refresh Button

```typescript
import { triggerManualRefresh } from '@/services/DataInvalidationService';

const RefreshButton = () => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        triggerManualRefresh();
        
        // Wait for contexts to refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    return (
        <button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
    );
};
```

## The Graph Integration

**Location**: The Graph Sync Service (zu implementieren)

```typescript
import { invalidateAll } from '@/services/DataInvalidationService';

// Nach erfolgreichem Sync mit The Graph
const syncWithTheGraph = async () => {
    try {
        // ... Sync logic ...
        
        // Invalidate all data after sync
        invalidateAll();
        
        console.log('The Graph sync completed, all data invalidated');
    } catch (error) {
        console.error('The Graph sync failed:', error);
    }
};
```

## Event Flow Beispiel

### Beispiel: User listet NFT

1. **User klickt "List NFT"**
   - SellPage führt Contract-Transaktion aus

2. **Transaktion wird bestätigt**
   ```typescript
   // SellPage.tsx
   invalidateAfterListing(contractAddress, tokenId, listingId);
   ```

3. **Event wird emitted**
   ```typescript
   // DataInvalidationService.ts
   emitDataInvalidation({
       type: 'listing-created',
       contractAddress,
       tokenId,
       listingId,
       timestamp: Date.now()
   });
   ```

4. **Contexts reagieren**
   - **WalletNFTsContext**: Wallet NFTs neu laden (User sieht NFT jetzt als "listed")
   - **MarketplaceItemsContext**: Cache invalidieren (Marketplace zeigt neues Listing)

5. **UI aktualisiert sich**
   - Wallet Dashboard zeigt aktualisierte NFT Liste
   - Marketplace zeigt neues Listing
   - Alle Collections werden aktualisiert

## Debugging

### Event Logging

Alle Invalidation Events werden geloggt:

```typescript
// In Browser Console
devLog.info('data-invalidation', '📝 Invalidating after listing: 0x123.../456');
devLog.info('wallet-nfts', '🔔 Received invalidation event:', detail);
devLog.info('marketplace-items', '🔄 Auto-refreshing after listing-created');
```

### Manual Testing

```typescript
// In Browser Console
import { invalidateAll } from '@/services/DataInvalidationService';

// Trigger manual refresh
invalidateAll();
```

## Best Practices

### ✅ DO

- **Immer nach erfolgreicher Contract-Transaktion invalidieren**
- **Spezifische Invalidation verwenden** (z.B. `invalidateAfterListing` statt `invalidateAll`)
- **Event Type korrekt wählen** (z.B. `listing-created` vs `nft-purchased`)
- **Contract + Token ID mitgeben** für granulare Updates

### ❌ DON'T

- **Nicht vor Transaction Confirmation invalidieren** (nur nach `tx.wait()`)
- **Nicht zu oft `invalidateAll()` aufrufen** (Performance!)
- **Nicht in Loops invalidieren** (einmal am Ende reicht)
- **Nicht ohne Fehlerbehandlung** (try/catch!)

## Performance Considerations

### Cache Strategy

- **WalletNFTsContext**: 5 Minuten TTL, invalidiert nur spezifische Wallet
- **MarketplaceItemsContext**: 5 Minuten TTL, invalidiert nur betroffene Filter Keys
- **The Graph**: 30 Sekunden Polling Interval

### Optimierungen

1. **Granulare Invalidation**: Nur betroffene Daten neu laden
2. **Debouncing**: Mehrere Events in kurzer Zeit zu einem Request zusammenfassen
3. **Background Refresh**: Alte Daten anzeigen während neu geladen wird
4. **Smart Caching**: TTL-basiert, nicht bei jedem Event alles neu laden

## Zukünftige Erweiterungen

### WebSocket Integration

```typescript
// Real-time updates via WebSocket
const socket = new WebSocket('ws://...');

socket.on('marketplace-update', (data) => {
    invalidateAfterListing(data.contractAddress, data.tokenId);
});
```

### Optimistic Updates

```typescript
// Update UI immediately, dann invalidieren
updateItemInCache(filterKey, contractAddress, tokenId, {
    marketplace: { isListed: true, price: '1000000000000000000' }
});

// Dann echte Transaktion
await listNFT();
invalidateAfterListing(contractAddress, tokenId);
```

### Smart Refresh

```typescript
// Nur refreshen wenn Daten älter als X Minuten
const shouldRefresh = (lastFetched: number) => {
    const age = Date.now() - lastFetched;
    return age > 5 * 60 * 1000; // 5 Minuten
};
```

## Zusammenfassung

Das Data Invalidation System:

✅ **Automatische Updates** nach Contract-Aktionen  
✅ **Zentrale Event-Verwaltung** via DataInvalidationService  
✅ **Context-übergreifend** (WalletNFTs, MarketplaceItems, etc.)  
✅ **Granulare Invalidation** für bessere Performance  
✅ **The Graph Integration** ready  
✅ **Debugging-freundlich** mit ausführlichem Logging  

**Jetzt werden alle NFT-Listen automatisch aktualisiert!** 🎉

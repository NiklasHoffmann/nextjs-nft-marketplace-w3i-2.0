# Dynamic Fee System

## Overview
Das Marketplace-System verwendet jetzt **dynamische Gebühren**, die direkt vom Smart Contract abgerufen werden, anstatt hardcodierte Werte zu verwenden.

## Implementation

### Hook: `useMarketplaceFees`
**Location:** `src/app/sell/hooks/useMarketplaceFees.ts`

Dieser Hook holt die aktuellen Gebühren vom Marketplace Contract:

```typescript
const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
    marketplaceAddress,
    contractAddress: nft.contractAddress,
    tokenId: nft.tokenId
});
```

#### Parameters
- `marketplaceAddress`: Adresse des Marketplace Contracts
- `contractAddress`: (optional) Adresse des NFT Contracts für Royalty-Abfrage
- `tokenId`: (optional) Token ID des NFTs für Royalty-Abfrage

#### Returns
- `innovationFee`: Innovation Fee in Basis Points (z.B. 250 = 2.5%)
- `innovationFeePercentage`: Innovation Fee als Dezimalzahl (z.B. 0.025)
- `royaltyBasisPoints`: Royalty Fee in Basis Points (z.B. 750 = 7.5%)
- `royaltyFeePercentage`: Royalty Fee als Dezimalzahl (z.B. 0.075)
- `calculateFees(price)`: Funktion zur Berechnung aller Fees für einen Preis
- `isLoading`: Loading-Status

#### calculateFees Return
```typescript
{
    marketplaceFee: number;      // Absolute Marketplace-Gebühr
    royaltyFee: number;          // Absolute Royalty-Gebühr
    totalFees: number;           // Summe aller Gebühren
    youReceive: number;          // Verkäufer erhält (price - totalFees)
    marketplaceFeePercentage: number;  // Prozentsatz der Marketplace-Gebühr
    royaltyFeePercentage: number;      // Prozentsatz der Royalty-Gebühr
}
```

## Smart Contract Functions

### getInnovationFee()
Holt die aktuelle Marketplace-Gebühr vom Contract:
```solidity
function getInnovationFee() external view returns (uint32 innovationFee);
```
Gibt die Gebühr in **Basis Points** zurück (z.B. 250 = 2.5%)

### royaltyInfo() (ERC2981)
Holt die Royalty-Informationen vom NFT Contract:
```solidity
function royaltyInfo(uint256 _tokenId, uint256 _salePrice) 
    external view returns (address receiver, uint256 royaltyAmount);
```

**Note:** Wenn der NFT-Contract ERC2981 nicht unterstützt, wird ein Default von 7.5% verwendet.

## Updated Components

Die folgenden Komponenten wurden aktualisiert, um dynamische Fees zu verwenden:

### 1. UnifiedListingForm
- **File:** `src/app/sell/components/UnifiedListingForm.tsx`
- **Usage:** Zeigt Gebühren in Echtzeit beim Erstellen eines Listings
- **Display:** Marketplace-Gebühr und Royalty-Gebühr mit dynamischen Prozentsätzen

### 2. TransactionPreview
- **File:** `src/app/sell/components/TransactionPreview.tsx`
- **Usage:** Vorschau der Gebühren vor dem Erstellen eines Single Listings
- **Display:** Detaillierte Aufschlüsselung der Fees

### 3. BatchTransactionPreview
- **File:** `src/app/sell/components/BatchTransactionPreview.tsx`
- **Usage:** Vorschau der Gebühren für Batch Listings
- **Display:** Gesamte Fees über alle NFTs hinweg

### 4. BuyNowModal
- **File:** `src/components/nft/modals/BuyNowModal.tsx`
- **Usage:** Anzeige der Gebühren beim Kauf eines NFTs
- **Display:** Platform Fee und Creator Royalty

## Benefits

### ✅ Vorteile
1. **Accuracy:** Fees sind immer aktuell und stimmen mit dem Contract überein
2. **Flexibility:** Contract-Owner kann Fees ändern ohne Frontend-Update
3. **Transparency:** User sieht exakte Fees basierend auf dem aktuellen Contract-Status
4. **NFT-Specific:** Royalty Fees sind spezifisch für jeden NFT/Collection
5. **Future-Proof:** Unterstützt zukünftige Fee-Änderungen automatisch

### ⚡ Performance
- Fees werden gecached durch Wagmi's useReadContract
- Re-fetching nur bei Wallet-Wechsel oder manueller Invalidierung
- Minimale zusätzliche RPC Calls

## Default Values

Falls Contract Calls fehlschlagen oder NFT kein ERC2981 implementiert:

- **Marketplace Fee:** 2.5% (250 basis points)
- **Royalty Fee:** 7.5% (750 basis points)

Diese Defaults entsprechen den aktuellen Contract-Werten.

## Examples

### Example 1: Single Listing
```typescript
const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
    marketplaceAddress,
    contractAddress: selectedNFT.contractAddress,
    tokenId: selectedNFT.tokenId
});

const fees = calculateFees(parseFloat(price));
// fees.marketplaceFee = 0.025 ETH (bei 1 ETH Preis und 2.5% Fee)
// fees.royaltyFee = 0.075 ETH (bei 1 ETH Preis und 7.5% Fee)
// fees.youReceive = 0.9 ETH
```

### Example 2: Display Percentage
```tsx
<span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
<span>{fees.marketplaceFee.toFixed(4)} ETH</span>
```

## Testing

Um die dynamischen Fees zu testen:

1. **Contract Fee ändern:**
   ```solidity
   contract.setInnovationFee(300); // 3% statt 2.5%
   ```

2. **Frontend überprüfen:**
   - Listings sollten automatisch neue Fee anzeigen
   - Keine Frontend-Änderungen nötig

3. **Royalty testen:**
   - NFT Contract muss ERC2981 implementieren
   - Falls nicht: Default 7.5% wird verwendet

## Migration Notes

### Old Code (Hardcoded)
```typescript
const marketplaceFee = price * 0.025; // ❌ Hardcoded
const royaltyFee = price * 0.075;     // ❌ Hardcoded
```

### New Code (Dynamic)
```typescript
const { calculateFees } = useMarketplaceFees({ marketplaceAddress, contractAddress, tokenId });
const fees = calculateFees(price); // ✅ Dynamic from contract
```

## Troubleshooting

### Problem: Fees werden nicht geladen
**Solution:** 
- Prüfen ob `marketplaceAddress` korrekt ist
- Wagmi Provider korrekt eingebunden?
- RPC Connection funktioniert?

### Problem: Royalty Fee ist immer Default (7.5%)
**Solution:**
- NFT Contract implementiert wahrscheinlich kein ERC2981
- Oder `contractAddress`/`tokenId` fehlen beim Hook Call

### Problem: Prozentsatz ändert sich nicht nach Contract Update
**Solution:**
- Browser Cache leeren
- Wagmi Query Cache invalidieren
- Wallet reconnecten

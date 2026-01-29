# WETH Integration Anleitung

## ✅ Was bereits gemacht wurde:

### 1. **Config-Dateien erstellt**
- ✅ `src/config/tokens.ts` - WETH Adressen pro Netzwerk
- ✅ `src/config/abis/weth.ts` - WETH Contract ABI
- ✅ `src/hooks/tokens/useWETH.ts` - Hook für WETH Interaktionen

### 2. **Funktionen verfügbar**
Der `useWETH` Hook bietet:
- `wrap(amount)` - ETH → WETH konvertieren
- `unwrap(amount)` - WETH → ETH konvertieren
- `approve(amount)` - WETH für Marketplace freigeben
- `hasEnoughAllowance(amount)` - Prüfen ob Allowance ausreicht
- Balance-Abfragen (WETH + ETH)

---

## 📋 Was du noch tun musst:

### 1. **UI Components für WETH erstellen**

#### A) **Currency Selector Component**
Erstelle eine Komponente für die Währungsauswahl (ETH vs WETH):

```tsx
// src/components/marketplace/CurrencySelector.tsx
'use client';

import { useState } from 'react';
import { ZERO_ADDRESS, getWETHAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';

interface CurrencySelectorProps {
    value: string; // currency address
    onChange: (currency: string) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
    const chainId = useChainId();
    const wethAddress = getWETHAddress(chainId);

    return (
        <div className="flex gap-2">
            <button
                onClick={() => onChange(ZERO_ADDRESS)}
                className={`px-4 py-2 rounded-lg ${
                    value === ZERO_ADDRESS 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                }`}
            >
                ETH
            </button>
            <button
                onClick={() => onChange(wethAddress || '')}
                className={`px-4 py-2 rounded-lg ${
                    value === wethAddress 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                }`}
            >
                WETH
            </button>
        </div>
    );
}
```

#### B) **WETH Wrap/Unwrap Component**
Komponente zum Konvertieren zwischen ETH und WETH:

```tsx
// src/components/tokens/WETHConverter.tsx
'use client';

import { useState } from 'react';
import { useWETH } from '@/hooks/tokens';
import { useMarketplaceContracts } from '@/hooks/marketplace';

export function WETHConverter() {
    const { marketplaceAddress } = useMarketplaceContracts();
    const { 
        wrap, 
        unwrap, 
        approve,
        ethBalance, 
        wethBalance, 
        allowance,
        hasEnoughAllowance,
        isWrapping, 
        isUnwrapping,
        isApproving
    } = useWETH({ marketplaceAddress });

    const [amount, setAmount] = useState('');

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold">WETH Converter</h3>
            
            {/* Balances */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">ETH Balance</p>
                    <p className="font-mono">{parseFloat(ethBalance).toFixed(4)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">WETH Balance</p>
                    <p className="font-mono">{parseFloat(wethBalance).toFixed(4)}</p>
                </div>
            </div>

            {/* Amount Input */}
            <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-2 border rounded-lg"
            />

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => wrap(amount)}
                    disabled={isWrapping || !amount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                    {isWrapping ? 'Wrapping...' : 'Wrap'}
                </button>
                
                <button
                    onClick={() => unwrap(amount)}
                    disabled={isUnwrapping || !amount}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                    {isUnwrapping ? 'Unwrapping...' : 'Unwrap'}
                </button>

                <button
                    onClick={() => approve(amount)}
                    disabled={isApproving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                >
                    {isApproving ? 'Approving...' : 'Approve'}
                </button>
            </div>

            {/* Allowance Info */}
            {marketplaceAddress && (
                <div className="text-sm text-gray-600">
                    <p>Marketplace Allowance: {parseFloat(allowance).toFixed(4)} WETH</p>
                </div>
            )}
        </div>
    );
}
```

### 2. **Listing-Formular erweitern**

In `src/app/sell/page.tsx` oder wo auch immer dein Listing-Formular ist:

```tsx
import { CurrencySelector } from '@/components/marketplace/CurrencySelector';
import { ZERO_ADDRESS } from '@/config/tokens';
import { useWETH } from '@/hooks/tokens';

// Im Component State:
const [currency, setCurrency] = useState(ZERO_ADDRESS); // Default: ETH

// Vor dem Listing erstellen:
const { hasEnoughAllowance, approve } = useWETH({ marketplaceAddress });

// WETH Approval check before listing
if (currency !== ZERO_ADDRESS && !hasEnoughAllowance(price)) {
    await approve(); // Approve unlimited WETH
}

// Dann createListing mit currency Parameter:
await createListing({
    tokenAddress,
    tokenId,
    price,
    currency, // ← WICHTIG: currency hinzufügen
    // ... rest
});
```

### 3. **Purchase-Flow erweitern**

In `src/hooks/marketplace/useMarketplacePurchase.ts`:

```typescript
// Bei WETH-Käufen:
// 1. Kein ETH value senden
// 2. WETH Allowance prüfen
// 3. WETH approve wenn nötig

const isWETHPurchase = expectedCurrency !== ZERO_ADDRESS;
const ethValue = isWETHPurchase ? BigInt(0) : parseEther(expectedPrice);

// Vor Purchase:
if (isWETHPurchase) {
    const { hasEnoughAllowance, approve } = useWETH({ marketplaceAddress });
    if (!hasEnoughAllowance(expectedPrice)) {
        await approve(expectedPrice);
    }
}

// Purchase call:
await writeContractAsync({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'purchaseListing',
    args: [
        BigInt(listingId),
        parseEther(expectedPrice),
        expectedCurrency as `0x${string}`, // ← WETH address statt 0x0
        // ... rest
    ],
    value: ethValue // 0 für WETH, price für ETH
});
```

### 4. **UI Anpassungen**

#### A) **NFT Card - Currency Badge anzeigen**
```tsx
{listing.currency !== ZERO_ADDRESS && (
    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
        WETH
    </span>
)}
```

#### B) **Price Display - Currency Symbol**
```tsx
const currencySymbol = listing.currency === ZERO_ADDRESS ? 'ETH' : 'WETH';
<p>{price} {currencySymbol}</p>
```

### 5. **Backend/API Updates**

#### MongoDB Schema erweitern:
```typescript
// In marketplace_items collection
{
    // ... existing fields
    currency: string; // "0x0" für ETH, WETH address für WETH
}
```

#### API Route updaten:
```typescript
// In /api/marketplace/items/route.ts
// Currency field in aggregation pipeline hinzufügen:
{
    $addFields: {
        currency: '$currency',
        // ...
    }
}
```

---

## 🎯 Reihenfolge der Implementation:

1. ✅ **Config & Hooks erstellt** (bereits gemacht)
2. **UI Components** erstellen:
   - CurrencySelector
   - WETHConverter
3. **Listing Flow** erweitern:
   - Currency selection im Formular
   - WETH approval vor listing
   - Currency parameter an Contract übergeben
4. **Purchase Flow** erweitern:
   - Currency detection
   - WETH approval vor purchase
   - Korrekten value senden (0 bei WETH)
5. **UI Updates**:
   - Currency badges
   - Price displays
6. **Backend**:
   - MongoDB schema
   - API aggregation

---

## 🧪 Testing Checklist:

- [ ] WETH wrappen (ETH → WETH)
- [ ] WETH unwrappen (WETH → ETH)
- [ ] WETH für Marketplace approven
- [ ] NFT mit WETH listen
- [ ] NFT mit WETH kaufen
- [ ] NFT mit ETH kaufen (weiterhin möglich)
- [ ] Balance updates korrekt
- [ ] UI zeigt richtige Currency an

---

## 📚 Nützliche Links:

- **Sepolia WETH**: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
- **Mainnet WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **WETH Docs**: https://weth.io/

---

## ⚠️ Wichtige Hinweise:

1. **WETH muss genehmigt werden** vor dem Listing/Purchase (wie NFT approval)
2. **Kein ETH value senden** bei WETH-Transaktionen (value: 0)
3. **Currency 0x0 = ETH**, WETH address = WETH
4. **Unlimited approval** ist Standard (kann optional limited sein)
5. **Gas costs** sind bei WETH etwas höher (zusätzliche ERC20 calls)

---

## 💡 Optional - Weitere Features:

- **Auto-Wrap**: Automatisch ETH zu WETH wrappen wenn nötig
- **Multi-Currency**: USDC, DAI, etc. unterstützen
- **Best Price**: Automatisch günstigste Currency wählen
- **Conversion Display**: "X ETH = Y WETH" anzeigen

# 💰 Payment Token System - Complete Guide

## 📌 **Zusammenfassung**

**Frage:** Wenn ich einen NFT für MERC20 liste, in welcher Form bekomme ich das Geld?

**Antwort:** Sie bekommen das Geld **im selben Token, mit dem der Käufer zahlt** - das wird durch den `currency` Parameter beim Listing bestimmt.

---

## 🔍 **Wie funktioniert das Payment System?**

### **1. Marketplace Contract Logik**

Der Smart Contract `createListing()` hat einen `currency` Parameter:

```solidity
function createListing(
    address tokenAddress,    // Ihr NFT Contract
    uint256 tokenId,        // Ihre NFT Token ID
    address erc1155Holder,
    uint256 price,          // Preis in Token-Units (z.B. 1 MERC20 = 1e18)
    address currency,       // 🎯 WICHTIG: Payment Token Address
    ...
) external
```

### **2. Currency Optionen**

| Currency Value | Payment Token | Sie erhalten |
|---------------|--------------|--------------|
| `0x0000...0000` (Zero Address) | Native ETH | ETH |
| `0xC740...456e` (Hardhat) | MERC20 | **MERC20 Tokens** |
| `0x7b79...E7f9` (Sepolia) | WETH | WETH |
| `0x1c7D...7238` (Sepolia) | USDC | USDC |
| Beliebige ERC20 Address | Custom Token | Custom Token |

---

## 🛠️ **Implementierung im Frontend**

### **Listing erstellen (mit MERC20)**

```typescript
import { getTokenConfig } from '@/config/tokens';

// 1. Token Address holen
const merc20Config = getTokenConfig(chainId, 'MOCK_ERC20');
const merc20Address = merc20Config?.address; // 0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e

// 2. Listing erstellen
await createListing({
    tokenAddress: nftContract,
    tokenId: nftTokenId,
    price: "1.0", // 1 MERC20
    currency: merc20Address, // 🎯 Käufer zahlt mit MERC20
    ...
});
```

### **Was passiert beim Kauf?**

```typescript
// Käufer ruft auf:
await purchaseListing({
    listingId: "123",
    expectedPrice: parseEther("1.0"),
    expectedCurrency: "0xC740Ee33A12c21Fa7F3cdd426D6051e16EaB456e", // MERC20
});

// Flow:
// 1. Contract checkt MERC20 allowance des Käufers
// 2. transferFrom(buyer, marketplace, 1 MERC20)
// 3. Marketplace speichert proceeds[seller] += 1 MERC20
// 4. NFT wird an Käufer transferiert
```

### **Proceeds abholen**

```typescript
// Als Seller:
await withdrawProceeds();

// Contract sendet Ihnen:
// - Ihre MERC20 Balance (minus Marketplace Fee & Royalties)
```

---

## 💡 **Wichtige Details**

### **Fees werden im gleichen Token abgezogen**

```typescript
// Beispiel: 1 MERC20 Listing
Verkaufspreis:     1.0000 MERC20
Marketplace Fee:  -0.0250 MERC20 (2.5%)
Royalty Fee:      -0.0100 MERC20 (1.0%)
────────────────────────────
Sie erhalten:      0.9650 MERC20
```

### **UI zeigt jetzt korrektes Token Symbol**

**Vorher:**
```
Verkaufspreis: 1.0000 WETH  ❌ (falsch, auch wenn MERC20 gewählt)
```

**Jetzt (nach Fix):**
```
Verkaufspreis: 1.0000 MERC20  ✅ (korrekt)
Sie erhalten:  0.9650 MERC20  ✅
```

---

## 🔧 **Code Änderungen**

### **UnifiedListingForm.tsx**

```typescript
// Vorher (hardcoded):
{form.values.currency === ZERO_ADDRESS ? 'ETH' : 'WETH'}

// Nachher (dynamisch):
{form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
```

### **Token Lookup erweitert**

```typescript
// Jetzt alle Mock Tokens supported:
const tokens = [
    'WETH', 'USDC', 'DAI',           // Production
    'MOCK_ERC20', 'MOCK_WBTC',       // Development
    'MOCK_EURS', 'MOCK_USDT'
] as const;
```

---

## 📊 **Verfügbare Payment Tokens**

### **Hardhat Local (chainId: 31337)**

| Symbol | Address | Decimals | Verwendung |
|--------|---------|----------|------------|
| ETH | `0x0000...0000` | 18 | Native Currency |
| WETH | TBD | 18 | Wrapped Ether |
| USDC | `0xEaef...bD26` | 6 | Stablecoin |
| **MERC20** | `0xC740...456e` | 18 | **Mock Token (Development)** |
| MWBTC | `0xB1A8...fAb2` | 8 | Mock Bitcoin |
| MEURS | `0xe06E...791a` | 2 | Mock Euro Stablecoin |
| MUSDT | `0xd11D...0d74` | 6 | Mock Tether |

### **Sepolia Testnet (chainId: 11155111)**

| Symbol | Address | Decimals |
|--------|---------|----------|
| ETH | `0x0000...0000` | 18 |
| WETH | `0x7b79...E7f9` | 18 |
| USDC | `0x1c7D...7238` | 6 |
| DAI | `0x6819...D574` | 18 |

---

## ⚠️ **Wichtige Hinweise**

### **1. Buyer muss Token Allowance geben**

```typescript
// Vor dem Kauf notwendig:
await tokenContract.approve(
    marketplaceAddress,
    price // oder MAX_UINT256 für unbegrenzt
);
```

### **2. Seller braucht KEINE Allowance**

- Seller gibt nur NFT Allowance (ERC721.setApprovalForAll)
- Payment Token Allowance ist nur für Buyer relevant

### **3. Proceeds werden pro Token akkumuliert**

```typescript
// Contract intern:
mapping(address seller => mapping(address token => uint256 amount)) proceeds;

// Beispiel:
proceeds[seller][MERC20] = 0.965 ether;
proceeds[seller][USDC]   = 10_000000; // 10 USDC (6 decimals)
```

### **4. withdrawProceeds() zahlt ALLE Tokens aus**

```typescript
// Wenn Sie haben:
// - 5 MERC20 aus NFT Sales
// - 100 USDC aus anderen Sales

await withdrawProceeds();

// Bekommen Sie:
// - 5 MERC20 + 100 USDC in EINER Transaktion
```

---

## 🎯 **Best Practices**

### **1. Token Approval UI**

```typescript
// Zeige Approval Warning nur wenn:
- currency !== ZERO_ADDRESS (nicht ETH)
- Allowance < Listing Price
```

### **2. Token Balance Check**

```typescript
// Validiere vor Listing:
if (selectedTokenConfig) {
    const buyerBalance = await tokenContract.balanceOf(buyerAddress);
    if (buyerBalance < price) {
        throw new Error(`Insufficient ${selectedTokenConfig.symbol} balance`);
    }
}
```

### **3. Decimal Handling**

```typescript
// WICHTIG: Different tokens haben different decimals
MERC20: 18 decimals → 1 Token = 1e18
USDC:    6 decimals → 1 Token = 1e6
MWBTC:   8 decimals → 1 Token = 1e8

// Immer mit parseUnits arbeiten:
import { parseUnits } from 'viem';
const priceInWei = parseUnits(priceString, tokenDecimals);
```

---

## 🔍 **Debugging Tipps**

### **Contract Events checken**

```typescript
// ItemListed Event zeigt currency:
event ItemListed(
    uint128 indexed listingId,
    address indexed seller,
    address indexed tokenAddress,
    uint256 tokenId,
    uint256 price,
    address currency  // 🔍 Hier sehen Sie welches Token
);
```

### **Proceeds abrufen**

```typescript
// Via Contract Read:
const merc20Proceeds = await marketplaceContract.read.getProceeds([
    sellerAddress,
    merc20Address
]);

console.log('MERC20 Proceeds:', formatEther(merc20Proceeds));
```

---

## 📚 **Zusammenfassung**

✅ **Payment Token = Currency Parameter beim Listing**  
✅ **Käufer zahlt mit diesem Token**  
✅ **Seller bekommt diesen Token (minus Fees)**  
✅ **UI zeigt jetzt korrektes Token Symbol**  
✅ **Funktioniert mit allen ERC20 Tokens**

**Beispiel MERC20 Listing:**
```
Listing: 1 NFT für 10 MERC20
→ Käufer braucht 10 MERC20 + Approval
→ Seller bekommt ~9.65 MERC20 (nach Fees)
→ Contract hält Proceeds in MERC20
→ withdrawProceeds() sendet MERC20 an Seller
```

---

**Status:** ✅ Implementiert  
**Files Changed:** UnifiedListingForm.tsx  
**Testing:** Verwenden Sie CurrencySelector und prüfen Sie Token-Symbol in UI

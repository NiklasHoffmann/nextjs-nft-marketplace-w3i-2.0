# 🏪 Marketplace Refactoring Plan

> **Erstellt am:** ${new Date().toLocaleDateString('de-DE')}  
> **Zweck:** Strukturanalyse und Optimierungsplan für den NFT-Marktplatz

---

## 📊 Aktuelle Struktur - Überblick

### ✅ **Was bereits gut funktioniert**

#### 1. **Smart Contract Hooks** (bereits implementiert)
- ✅ Funktional gruppiert in 5 spezialisierte Hooks
- ✅ Klare Trennung: Listing, Purchase, Data, Admin, User
- ✅ TypeScript-typisiert mit vollständiger ABI-Integration
- ✅ Error Handling und Loading States vorhanden

**Dateien:**
```
src/hooks/marketplace/
├── useMarketplaceListing.ts    # Create, Update, Cancel
├── useMarketplacePurchase.ts   # Buy & NFT Swaps
├── useMarketplaceData.ts       # Read-only Queries
├── useMarketplaceAdmin.ts      # Admin Functions
├── useMarketplaceUser.ts       # User Proceeds
└── index.ts                    # Zentrale Exports
```

#### 2. **API-Infrastruktur** (optimal strukturiert)
- ✅ Server-side marketplace listing route implementiert
- ✅ TheGraph Integration für on-chain Daten
- ✅ CSP-Bypass durch Server-side Queries

**API Routes:**
```
src/app/api/marketplace/
└── listing/[nftAddress]/[tokenId]/route.ts
```

#### 3. **Marketplace Components** (teilweise implementiert)
- ✅ `ActiveItemsList` - Live marketplace data mit Filtering
- ✅ `WalletNFTsList` - User's NFT collection
- ✅ `NFTScrollList` - Reusable NFT display
- ✅ `NFTFilterBar` & `NFTFilterSidebar` - Advanced filtering
- ✅ `CollectionsTable` - Collection overview

---

## 🔍 Identifizierte Probleme & Verbesserungspotenziale

### ⚠️ **1. Sell/Trade Page - Unvollständige Integration**

**Aktueller Zustand:**
- ❌ Mock-Daten statt echte Blockchain-Calls
- ❌ `listNFTForSale()` und `createTradeOffer()` sind leere Funktionen
- ❌ Keine Integration mit `useMarketplaceListing` Hook
- ❌ Keine echte NFT-Daten aus User Wallet
- ❌ Transaction Preview ohne echte Contract-Interaction

**Betroffene Dateien:**
```
src/app/sell/
├── SellTradePage.tsx          # ❌ Mock data & empty functions
├── components/
    ├── SellForm.tsx           # ✅ UI fertig, aber keine Contract-Calls
    ├── TradeForm.tsx          # ✅ UI fertig, aber keine Contract-Calls
    ├── NFTUserSelector.tsx    # ❌ Zeigt nur Mock NFTs
    └── TransactionPreview.tsx # ❌ Keine echte Transaktion
```

**Fehlende Features:**
1. Integration mit `useMarketplaceListing` für NFT Listings
2. Integration mit `useAccount` & `useWalletNFTs` für echte User NFTs
3. NFT Approval Flow (ERC721 `setApprovalForAll`)
4. Transaction Confirmation & Error Handling
5. Success/Failure Feedback mit Redirect
6. Marketplace Fee Calculation (echte On-Chain Daten)

---

### ⚠️ **2. Fehlende Buy/Purchase UI**

**Problem:**
- ✅ `useMarketplacePurchase` Hook existiert
- ❌ Keine dedizierte UI für NFT Käufe
- ❌ Kaufen nur über NFT Detail Page möglich (?)
- ❌ Keine Batch-Purchase Möglichkeit
- ❌ Keine Shopping Cart Funktionalität

**Empfohlene neue Pages:**
```
src/app/marketplace/           # ❌ FEHLT
├── page.tsx                   # Marketplace Browse Page
├── buy/
    └── [listingId]/
        └── page.tsx           # Checkout Page für Listing
```

---

### ⚠️ **3. Marktplatz-Navigation fehlt**

**Problem:**
- ❌ Kein zentraler `/marketplace` Entry Point
- ❌ User wird auf `/history-towers` umgeleitet (Spiel!)
- ❌ Marketplace Features versteckt/schwer zu finden
- ❌ Keine intuitive Navigation zwischen Buy/Sell/Browse

**Aktueller Flow:**
```
/ (Home) → /history-towers (Spiel)
           └── Marketplace versteckt in Wallet/Sell Pages
```

**Gewünschter Flow:**
```
/ (Home) → /marketplace (Browse)
           ├── /marketplace/buy
           ├── /marketplace/sell
           ├── /marketplace/my-listings
           └── /marketplace/collections
```

---

### ⚠️ **4. Komponenten-Duplikation & Verwirrung**

**Problem:**
- `ActiveItemsList` - Zeigt marketplace items (gut!)
- `WalletNFTsList` - Zeigt user NFTs (gut!)
- Aber: Beide Komponenten haben ähnliche Props/Logik
- Keine klare Wiederverwendung im Sell/Buy Flow

**Verbesserungspotenzial:**
- Shared `NFTGrid` Komponente für beide Use Cases
- Klare Trennung: "Marketplace Items" vs "User Owned NFTs"
- Reusable Filter/Sort Logic

---

### ⚠️ **5. Fehlende User Features**

**Implementiert:**
- ✅ View Active Listings
- ✅ View Wallet NFTs
- ✅ Filter & Sort

**FEHLT:**
- ❌ My Listings Management (View, Cancel, Update Price)
- ❌ Purchase History / Transaction History
- ❌ Watchlist für Listings
- ❌ Offer System (Make Offers below asking price)
- ❌ Notification System (Listing sold, Offer received)

---

## 🎯 Refactoring Plan - Priorisierung

### **Phase 1: Sell/Trade Integration** (Höchste Priorität)

#### 1.1 SellTradePage - Smart Contract Integration
- [ ] Integration mit `useMarketplaceListing` Hook
- [ ] NFT Approval Flow implementieren
- [ ] Echte Transaction Handling (Success/Error)
- [ ] Loading States & User Feedback
- [ ] Redirect nach erfolgreicher Listung

**Code Changes:**
```typescript
// src/app/sell/SellTradePage.tsx

import { useMarketplaceListing } from '@/hooks/marketplace';
import { useWalletNFTs } from '@/hooks'; // Echte User NFTs

const { createListing, isLoading, error } = useMarketplaceListing(MARKETPLACE_ADDRESS);

const listNFTForSale = async () => {
  // 1. Check NFT Approval
  // 2. If not approved, request approval
  // 3. Create listing via smart contract
  // 4. Handle success/error
  // 5. Redirect to marketplace or show confirmation
};
```

#### 1.2 NFTUserSelector - Echte Wallet Integration
- [ ] Replace Mock Data mit `useWalletNFTs(address)`
- [ ] Loading States während NFT Fetch
- [ ] Empty State wenn keine NFTs
- [ ] Filter: "Already Listed" vs "Not Listed"

#### 1.3 SellForm & TradeForm - Fee Calculation
- [ ] Echte Marketplace Fee vom Contract abfragen
- [ ] Royalty Info vom NFT Contract holen
- [ ] Dynamic Fee Breakdown basierend auf Chain

---

### **Phase 2: Marketplace Browse Page** (Hohe Priorität)

#### 2.1 Neue Route: `/marketplace`
- [ ] Marketplace Landing Page erstellen
- [ ] Integration mit `ActiveItemsList`
- [ ] Advanced Filters & Search
- [ ] Collection Highlights
- [ ] Trending/New Listings Sections

#### 2.2 NFT Detail Page - Buy Button
- [ ] Purchase Modal/Flow auf NFT Detail Page
- [ ] Integration mit `useMarketplacePurchase`
- [ ] Price Comparison (Floor Price, etc.)
- [ ] Transaction Confirmation

#### 2.3 Checkout Flow
- [ ] Dedicated Checkout Page für Listing
- [ ] Payment Method Selection (ETH, wrapped tokens)
- [ ] Transaction Preview
- [ ] Success Page mit Receipt

---

### **Phase 3: User Dashboard** (Mittlere Priorität)

#### 3.1 My Listings Page
- [ ] `/marketplace/my-listings` Route
- [ ] List all user's active listings
- [ ] Update Price Funktion
- [ ] Cancel Listing Funktion
- [ ] Sales History

#### 3.2 Purchase History
- [ ] `/marketplace/purchases` Route
- [ ] List all user's purchases
- [ ] Transaction Details
- [ ] Export to CSV

#### 3.3 Offers & Negotiations
- [ ] Offer System Backend (Smart Contract?)
- [ ] Make Offer UI
- [ ] Accept/Reject Offers
- [ ] Notification System

---

### **Phase 4: UI/UX Verbesserungen** (Niedrige Priorität)

#### 4.1 Komponenten-Refactoring
- [ ] Shared `NFTGrid` Komponente
- [ ] Reusable `FilterSidebar` für alle Listen
- [ ] Standardized Loading States
- [ ] Error Boundary Components

#### 4.2 Performance Optimierungen
- [ ] Image Lazy Loading verbessern
- [ ] Virtual Scrolling für große Listen
- [ ] Optimistic UI Updates
- [ ] Cache-Strategie für Marketplace Data

#### 4.3 Mobile Responsiveness
- [ ] Mobile-optimized Filters
- [ ] Touch-friendly NFT Cards
- [ ] Bottom Sheet Navigation
- [ ] PWA Features

---

## 📁 Empfohlene Dateistruktur (Nach Refactoring)

```
src/
├── app/
│   ├── marketplace/                    # ⭐ NEU
│   │   ├── page.tsx                    # Browse Marketplace
│   │   ├── layout.tsx                  # Marketplace Layout
│   │   ├── buy/
│   │   │   └── [listingId]/
│   │   │       └── page.tsx            # Checkout Page
│   │   ├── sell/                       # ♻️ Move from /sell
│   │   │   ├── page.tsx
│   │   │   ├── SellTradePage.tsx
│   │   │   └── components/
│   │   ├── my-listings/                # ⭐ NEU
│   │   │   └── page.tsx
│   │   ├── purchases/                  # ⭐ NEU
│   │   │   └── page.tsx
│   │   └── collections/                # ⭐ NEU
│   │       └── [address]/
│   │           └── page.tsx
│   │
│   ├── history-towers/                 # Bleibt als Spiel
│   │   └── ...
│   │
│   └── nft/                            # Bleibt für NFT Details
│       └── [nftAddress]/[tokenId]/
│           └── page.tsx
│
├── components/
│   ├── marketplace/
│   │   ├── ActiveItemsList.tsx         # ✅ Behalten
│   │   ├── WalletNFTsList.tsx          # ✅ Behalten
│   │   ├── NFTScrollList.tsx           # ✅ Behalten
│   │   ├── NFTFilterBar.tsx            # ✅ Behalten
│   │   ├── NFTFilterSidebar.tsx        # ✅ Behalten
│   │   ├── CollectionsTable.tsx        # ✅ Behalten
│   │   │
│   │   ├── NFTGrid.tsx                 # ⭐ NEU - Shared component
│   │   ├── PurchaseModal.tsx           # ⭐ NEU - Buy flow
│   │   ├── ListingCard.tsx             # ⭐ NEU - Enhanced NFT card
│   │   ├── OffersList.tsx              # ⭐ NEU - Offers management
│   │   └── TransactionStatus.tsx       # ⭐ NEU - TX feedback
│   │
│   └── sell/                           # ♻️ Move to marketplace folder
│       ├── SellForm.tsx
│       ├── TradeForm.tsx
│       ├── NFTUserSelector.tsx
│       └── TransactionPreview.tsx
│
├── hooks/
│   ├── marketplace/
│   │   ├── useMarketplaceListing.ts    # ✅ Vorhanden
│   │   ├── useMarketplacePurchase.ts   # ✅ Vorhanden
│   │   ├── useMarketplaceData.ts       # ✅ Vorhanden
│   │   ├── useMarketplaceAdmin.ts      # ✅ Vorhanden
│   │   ├── useMarketplaceUser.ts       # ✅ Vorhanden
│   │   │
│   │   ├── useNFTApproval.ts           # ⭐ NEU - Approval flow
│   │   ├── useUserListings.ts          # ⭐ NEU - User's listings
│   │   └── useMarketplaceOffers.ts     # ⭐ NEU - Offer system
│   │
│   └── nfts/
│       └── useWalletNFTs.ts            # ✅ Bereits vorhanden
│
└── app/api/
    └── marketplace/
        ├── listing/[nftAddress]/[tokenId]/route.ts  # ✅ Vorhanden
        ├── offers/                                   # ⭐ NEU
        │   └── route.ts
        └── user-listings/                            # ⭐ NEU
            └── route.ts
```

---

## 🚀 Schnellstart-Empfehlungen

### **Start hier (Quick Wins):**

#### 1. **SellTradePage Integration** (2-3 Stunden)
```typescript
// Minimal viable integration
import { useMarketplaceListing, getMarketplaceAddress } from '@/hooks/marketplace';

const marketplaceAddress = getMarketplaceAddress(chainId);
const { createListing, isLoading, error, txHash } = useMarketplaceListing(marketplaceAddress);

const handleCreateListing = async () => {
  await createListing({
    tokenAddress: selectedNFT.nftAddress,
    tokenId: selectedNFT.tokenId,
    price: formData.price,
  });
  
  // Redirect oder Success Message
  if (txHash) router.push(`/marketplace/my-listings`);
};
```

#### 2. **Marketplace Browse Page** (1-2 Stunden)
```typescript
// src/app/marketplace/page.tsx
import { ActiveItemsList } from '@/components/marketplace';

export default function MarketplacePage() {
  return (
    <div>
      <h1>Browse NFT Marketplace</h1>
      <ActiveItemsList />
    </div>
  );
}
```

#### 3. **Home Page Redirect ändern** (5 Minuten)
```typescript
// src/app/page.tsx
useEffect(() => {
  router.replace('/marketplace'); // ← Instead of /history-towers
}, [router]);
```

---

## 📝 Checkliste - Must-Have Features

### **Sell Flow:**
- [ ] Echte User NFTs laden
- [ ] NFT Approval Check & Request
- [ ] Smart Contract Listing erstellen
- [ ] Transaction Feedback (Loading, Success, Error)
- [ ] Redirect nach Success

### **Buy Flow:**
- [ ] Purchase Button auf NFT Detail Page
- [ ] Transaction Preview
- [ ] Smart Contract Purchase
- [ ] Success Confirmation

### **Browse:**
- [ ] `/marketplace` Landing Page
- [ ] Filter & Sort funktioniert
- [ ] Pagination oder Infinite Scroll
- [ ] Empty States

### **User Dashboard:**
- [ ] My Listings anzeigen
- [ ] Cancel Listing Funktion
- [ ] Update Price Funktion
- [ ] Purchase History

---

## 🎨 Design-Richtlinien

### **Konsistenz:**
- Alle Marketplace-Seiten sollten gleiches Layout verwenden
- NFT Cards überall gleich (oder Varianten mit klaren Props)
- Filter & Sort UI einheitlich

### **User Experience:**
- Klare Call-to-Actions ("List for Sale", "Buy Now")
- Transaction States visuell klar (Loading, Success, Error)
- Error Messages hilfreich & actionable
- Mobile-first Design

### **Performance:**
- Lazy Loading für NFT Images
- Pagination bei großen Listen
- Optimistic UI Updates wo möglich
- Cache TheGraph Queries

---

## 🔗 Nächste Schritte

1. **Review dieses Plans** mit Team/Stakeholdern
2. **Priorisieren:** Welche Phase zuerst?
3. **Ticketing:** Issues/Tasks im GitHub erstellen
4. **Sprint Planning:** Phase 1 in nächsten Sprint
5. **Start Coding!** 🚀

---

## 📚 Ressourcen & Dokumentation

- [Marketplace Integration Guide](./marketplace-integration-guide.md)
- [API Routes Overview](../api_routes_overview.json)
- [Smart Contract Hooks](../src/hooks/marketplace/)
- [TheGraph Queries](../src/constants/subgraph.queries.ts)

---

**Fragen oder Feedback?** → Diskussion im Team oder via GitHub Issues

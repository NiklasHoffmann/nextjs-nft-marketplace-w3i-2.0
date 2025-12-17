# /sell Route - Clean Architecture

Vollständig refactored nach Best Practices mit sauberer Trennung von Verantwortlichkeiten.

## 📁 Ordnerstruktur

```
src/app/sell/
├── page.tsx                    # Next.js page entry point
├── SellPage.tsx               # Main component (refactored)
├── types/                      # TypeScript type definitions
│   └── index.ts               # All types for the route
├── utils/                      # Pure utility functions
│   ├── nft-adapter.ts         # WalletNFT → AggregatedNFT conversion
│   ├── nft-filter.ts          # NFT filtering logic
│   ├── nft-sorter.ts          # NFT sorting logic
│   └── index.ts               # Utility exports
├── hooks/                      # Custom React hooks
│   ├── useUserNFTs.ts         # NFT management hook
│   └── index.ts               # Hook exports
├── lib/                        # Business logic (services)
│   └── listing-service.ts     # Marketplace contract interactions
└── components/                 # UI components
    ├── EmptyState.tsx         # Wallet not connected state
    ├── PageHeader.tsx         # Page title & listing type toggle
    ├── BatchListingInfoBanner.tsx  # Info banner component
    ├── NFTSearchFilter.tsx    # Search & filter controls
    ├── ErrorDisplay.tsx       # Error message display
    ├── NFTUserSelector.tsx    # NFT selection grid
    ├── UnifiedListingForm.tsx # Single listing form
    ├── BatchListingForm.tsx   # Batch listing form
    ├── TransactionPreview.tsx # Single transaction preview
    └── BatchTransactionPreview.tsx  # Batch preview
```

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
- **Types** (`/types`): Alle TypeScript Interfaces & Types
- **Utils** (`/utils`): Pure functions ohne Side Effects
- **Hooks** (`/hooks`): React State Management & Data Fetching
- **Lib** (`/lib`): Business Logic & External API Calls
- **Components** (`/components`): Reine UI Components

### 2. **Component Design**
- Kleine, wiederverwendbare Components
- Props klar definiert mit TypeScript
- Keine Business Logic in UI Components
- Accessibility (a11y) beachtet

### 3. **State Management**
- Custom Hooks für komplexe State Logic
- Lokaler State nur wo nötig
- Context für globale NFT Daten (WalletNFTsContext)

### 4. **Code Organization**
- Ein Export pro File (außer index.ts)
- Barrel exports via index.ts
- JSDoc Kommentare für alle Public Functions
- Konsistente Namenskonventionen

## 📚 Type System

### Core Types
```typescript
ListingType = 'single' | 'batch'
ListingMode = 'sale' | 'trade' | 'hybrid'
Currency = 'ETH' | 'USDC'
SortOption = 'name' | 'price' | 'likes' | 'views' | 'rating' | 'watchlist' | 'recent'
```

### Interfaces
- `TransactionData`: Single listing transaction
- `BatchTransactionData`: Batch listing transaction
- `NFTFilterOptions`: Search & filter state

## 🔧 Custom Hooks

### `useUserNFTs()`
Verwaltet NFT-Liste mit Filtering & Sorting:
```typescript
const {
  allNFTs,           // Alle NFTs
  filteredNFTs,      // Gefilterte & sortierte NFTs
  filterOptions,     // Aktuelle Filter
  updateFilter,      // Filter updaten
  loading,
  error
} = useUserNFTs();
```

### `useListingForm()`
Verwaltet Formular-State:
```typescript
const {
  selectedNFT,
  setSelectedNFT,
  showPreview,
  setShowPreview,
  isLoading,
  setIsLoading,
  resetForm
} = useListingForm();
```

## 🛠 Utilities

### NFT Adapter
```typescript
walletNFTToAggregatedNFT(nft: WalletNFT): AggregatedNFT
```
Konvertiert zwischen WalletNFT und AggregatedNFT Format.

### NFT Filter
```typescript
filterNFTs(nfts: AggregatedNFT[], options: FilterOptions): AggregatedNFT[]
```
Filtert NFTs nach Suchbegriff und Listing-Status.

### NFT Sorter
```typescript
sortNFTs(nfts: AggregatedNFT[], sortBy: SortOption, sortOrder: SortOrder): AggregatedNFT[]
```
Sortiert NFTs nach verschiedenen Kriterien.

## 🔌 Services

### Listing Service
```typescript
listNFTForSale(data: TransactionData): Promise<void>
createTradeOffer(data: TransactionData): Promise<void>
createHybridOffer(data: TransactionData): Promise<void>
createBatchListings(data: BatchTransactionData): Promise<void>
```
Alle Marketplace Contract Interactions.

## 🎨 UI Components

### Layout Components
- **EmptyState**: Wallet nicht verbunden
- **PageHeader**: Titel + Listing Type Toggle
- **BatchListingInfoBanner**: Info Banner für Batch Feature

### Form Components
- **NFTSearchFilter**: Suche & Filter Controls
- **NFTUserSelector**: NFT Auswahl Grid
- **UnifiedListingForm**: Single Listing Formular
- **BatchListingForm**: Batch Listing Formular

### Preview Components
- **TransactionPreview**: Bestätigung für einzelne Listings
- **BatchTransactionPreview**: Bestätigung für Batch Listings

### Utility Components
- **ErrorDisplay**: Fehler-Anzeige

## 🚀 Usage Example

```typescript
import { SellTradePage } from './SellTradePage';

// In Next.jsPage } from './SellPage';

// In Next.js page
export default function Page() {
  return <SellPage />;
}
```

## 🧹 Maintenance Notes

**Cleaned up:**
- ✅ Removed `SellForm.tsx` (replaced by UnifiedListingForm)
- ✅ Removed `TradeForm.tsx` (replaced by UnifiedListingForm)
- ✅ Removed `SellTradePage.old.tsx` (old backup)
- ✅ Renamed `SellTradePage.tsx` → `SellPage.tsx`

**TODO:**
- [ ] Add integration tests for hooks

## 📝 Best Practices Implemented

✅ **TypeScript**: Alle Types definiert, keine `any` types  
✅ **Component Composition**: Kleine, wiederverwendbare Components  
✅ **Custom Hooks**: Logic aus Components extrahiert  
✅ **Pure Functions**: Utils ohne Side Effects  
✅ **Single Responsibility**: Jede Datei hat einen klaren Zweck  
✅ **DRY**: Kein duplizierter Code  
✅ **Naming**: Konsistente, beschreibende Namen  
✅ **Documentation**: JSDoc für alle Public APIs  
✅ **Error Handling**: Proper error states & displays  
✅ **Loading States**: Feedback für async operations  

## 🔄 Migration Guide

Alte Komponente:
```typescript
// 534 lines, alles in einer Datei
<SellTradePage />
``` (SellPage.tsx)

Neue Struktur:
```typescript
// Main: 200 lines
// + 8 separate utilities
// + 2 custom hooks
// + 5 UI components
// + 1 service layer
// = Bessere Wartbarkeit!
```

## 🎯 Performance

- **Memoization**: `useMemo` für gefilterte/sortierte Listen
- **Lazy Loading**: Components nur wenn benötigt
- **Optimized Re-renders**: State nur wo nötig

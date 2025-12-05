# 🔧 Marketplace Refactoring - Bestehender Code

> **Fokus:** Code-Optimierung ohne neue Features  
> **Ziel:** Bessere Struktur, weniger Duplikate, konsistente Types  
> **Datum:** 12. November 2025

---

## 🎯 Refactoring-Ziele

### Keine neuen Features!
- ❌ Keine neuen UI-Komponenten
- ❌ Keine neuen API-Routen
- ❌ Keine neuen Hooks
- ✅ Nur Code-Optimierung und Strukturverbesserungen

### Was wird optimiert:
1. **Type Definitions** - Zentrale Organisation, Duplikate entfernen
2. **Component Structure** - Konsistenz, weniger Props-Drilling
3. **Code Duplication** - DRY-Prinzip anwenden
4. **Performance** - useMemo, useCallback optimieren
5. **Import Organization** - Konsistente Pfade, barrel exports

---

## 📊 Analyse: Aktuelle Probleme

### 1. Type Definitions verstreut

**Problem:**
```typescript
// NFTFilterBar.tsx
export interface NFTFilters { ... }
export interface NFTSortOptions { ... }

// NFTScrollList.tsx
export interface NFTScrollItem { ... }
export interface NFTScrollListProps { ... }

// useNFTFilters.ts
export type FilterableNFTItem = { ... }
```

**Lösung:**
- Zentrale Type-Datei: `src/types/marketplace/marketplace-ui.ts`
- Alle UI-bezogenen Marketplace Types dort sammeln
- Konsistenter Export über barrel files

---

### 2. Duplikate: `convertToScrollItems` Funktion

**Gefunden in:**
- `ActiveItemsList.tsx` (Line 212)
- `WalletNFTsList.tsx` (Line 224)
- `CollectionPageClient.tsx` (Line 109)

**Problem:**
Gleiche Logik dreimal implementiert!

```typescript
// Alle 3 machen das Gleiche:
const convertToScrollItems = (items: any[]): NFTScrollItem[] => {
    return items.map((item) => ({
        nftAddress: item.contractAddress || item.nftAddress,
        tokenId: item.tokenId,
        price: item.price,
        // ... etc
    }));
};
```

**Lösung:**
- Neue Utility: `src/utils/marketplace/nft-converters.ts`
- Eine Funktion: `convertToScrollItems(items, options?)`
- Wiederverwendbar in allen Komponenten

---

### 3. Inkonsistente Prop-Übergabe

**Beispiel NFTCard Props:**
```typescript
// ActiveItemsList.tsx
<NFTCard
    contractAddress={item.nftAddress}
    tokenId={item.tokenId}
    price={item.price as string | undefined}
    isListed={item.isListed}
    // ... 10+ weitere Props
/>

// WalletNFTsList.tsx
<NFTCard
    contractAddress={nft.nftAddress}
    nftAddress={nft.nftAddress}  // Duplikat?
    tokenId={nft.tokenId}
    // ... ähnlich aber leicht anders
/>
```

**Problem:**
- Zu viele einzelne Props
- Duplikate (`contractAddress` vs `nftAddress`)
- Schwer zu warten

**Lösung:**
- Interface für NFTCard Props vereinfachen
- Entweder: `nft` object prop ODER einzelne Props (nicht beides)
- Dokumentation welche Props required sind

---

### 4. Filter/Sort Logik dupliziert

**Problem:**
- `NFTFilterBar.tsx` definiert `NFTFilters` & `NFTSortOptions`
- `useNFTFilters.ts` hat eigene Filter-Logik
- Keine klare Single Source of Truth

**Lösung:**
- Filter-Types in zentraler Type-Datei
- Filter-Logik NUR im Hook
- Komponenten nutzen Hook-Interface

---

### 5. Barrel Exports unvollständig

**Aktuell:**
```typescript
// src/components/marketplace/index.ts
export { ActiveItemsList } from './ActiveItemsList';
export { default as CollectionsTable } from './CollectionsTable';
export { default as CurrencySelector } from './CurrencySelector';
// ... teilweise named, teilweise default exports
```

**Problem:**
- Mix aus `default` und `named` exports
- Nicht alle Types exportiert
- Inkonsistente Import-Patterns

**Lösung:**
- Konsistent: Entweder alle `named` ODER alle `default`
- Alle Types über barrel exportieren
- Dokumentierte Export-Richtlinien

---

## 🔨 Refactoring-Schritte

### Step 1: Type Consolidation

**Erstelle:**
```
src/types/marketplace/
├── index.ts                    # ✅ Barrel export (bereits vorhanden)
├── marketplace-contract.ts     # ✅ Contract types (bereits vorhanden)
└── marketplace-ui.ts           # ⭐ NEU - UI-spezifische Types
```

**marketplace-ui.ts:**
```typescript
/**
 * MARKETPLACE UI TYPES
 * 
 * UI-Komponenten Types für Marketplace:
 * • Filter & Sort Interfaces
 * • Scroll List Items
 * • Component Props
 */

// Filter & Sort (von NFTFilterBar.tsx hierher verschieben)
export interface NFTFilters {
    categories: string[];
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
    minViews?: number;
    minLikes?: number;
    minWatchlistCount?: number;
    searchTerm?: string;
    rarities: string[];
    minSupply?: number;
    minListedItems?: number;
    minFloorPrice?: number;
}

export interface NFTSortOptions {
    field: 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created' | 'tokenId' | 'rarity';
    direction: 'asc' | 'desc';
}

// Scroll List Items (von NFTScrollList.tsx)
export interface NFTScrollItem {
    nftAddress: string;
    tokenId: string;
    price?: string | bigint;
    isListed?: boolean;
    listingId?: string;
    seller?: string;
    buyer?: string;
    desiredNftAddress?: string;
    desiredTokenId?: string;
    [key: string]: any; // Allow additional properties
}

// Filterable Item (von useNFTFilters.ts)
export interface FilterableNFTItem extends NFTScrollItem {
    contractAddress: string;
    name?: string;
    symbol?: string;
    category?: string;
    rarity?: string;
    averageRating?: number;
    ratingCount?: number;
    favoriteCount?: number;
    watchlistCount?: number;
    viewCount?: number;
    customTitle?: string;
    cardDescriptions?: string[];
    tags?: string[];
    imageUrl?: string;
}

// Component Props
export interface NFTScrollListProps {
    items: NFTScrollItem[];
    title?: string;
    badge?: { text: string; color: string };
    secondaryBadge?: (item: NFTScrollItem) => React.ReactNode;
    enableInsights?: boolean;
    showStats?: boolean;
    priority?: boolean;
    emptyMessage?: string;
    emptyComponent?: React.ReactNode;
    loading?: boolean;
    loadingCount?: number;
    className?: string;
    cardWidth?: string;
    gap?: string;
    padding?: string;
    enableLinks?: boolean;
    linkBuilder?: (item: NFTScrollItem) => string;
    onCardClick?: (item: NFTScrollItem) => void;
    enableViewAll?: boolean;
    gridColumns?: string;
}
```

---

### Step 2: Utility Functions

**Erstelle:**
```
src/utils/marketplace/
├── index.ts                    # Barrel export
├── nft-converters.ts           # ⭐ NEU - Conversion utilities
└── filter-helpers.ts           # ⭐ NEU - Filter utilities (optional)
```

**nft-converters.ts:**
```typescript
import type { NFTScrollItem, FilterableNFTItem } from '@/types/marketplace';

/**
 * Convert various NFT formats to NFTScrollItem
 * Eliminates duplicate conversion logic across components
 */
export function convertToScrollItems(
    items: any[],
    options?: {
        includeMarketplaceData?: boolean;
        priceFormatter?: (price: any) => string | bigint;
    }
): NFTScrollItem[] {
    return items.map((item) => ({
        nftAddress: item.contractAddress || item.nftAddress,
        tokenId: item.tokenId,
        price: options?.priceFormatter 
            ? options.priceFormatter(item.price)
            : item.price,
        isListed: item.isListed,
        listingId: item.listingId,
        seller: item.seller,
        buyer: item.buyer,
        desiredNftAddress: item.desiredNftAddress,
        desiredTokenId: item.desiredTokenId,
        // Preserve additional properties
        ...item
    }));
}

/**
 * Convert to FilterableNFTItem (for filter/sort operations)
 */
export function convertToFilterableItems(
    items: any[]
): FilterableNFTItem[] {
    return items.map((item) => ({
        contractAddress: item.nftAddress || item.contractAddress,
        nftAddress: item.nftAddress || item.contractAddress,
        tokenId: item.tokenId,
        price: item.price,
        isListed: item.isListed,
        listingId: item.listingId,
        seller: item.seller,
        buyer: item.buyer,
        desiredNftAddress: item.desiredNftAddress,
        desiredTokenId: item.desiredTokenId,
        // NFT Context data
        name: item.name,
        symbol: item.symbol,
        category: item.category,
        rarity: item.rarity,
        averageRating: item.averageRating,
        ratingCount: item.ratingCount,
        favoriteCount: item.favoriteCount,
        watchlistCount: item.watchlistCount,
        viewCount: item.viewCount,
        customTitle: item.customTitle,
        cardDescriptions: item.cardDescriptions,
        tags: item.tags,
        imageUrl: item.imageUrl,
    }));
}
```

---

### Step 3: Component Refactoring

#### 3.1 NFTFilterBar.tsx
**Änderungen:**
- ❌ Entferne Type Definitions (nach marketplace-ui.ts verschoben)
- ✅ Import Types: `import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';`
- ✅ Behalte Rest der Logik gleich

#### 3.2 NFTScrollList.tsx
**Änderungen:**
- ❌ Entferne Interface Definitions
- ✅ Import: `import type { NFTScrollItem, NFTScrollListProps } from '@/types/marketplace';`
- ✅ Komponenten-Logik bleibt gleich

#### 3.3 ActiveItemsList.tsx
**Änderungen:**
- ❌ Entferne lokale `convertToScrollItems` Funktion
- ✅ Import: `import { convertToScrollItems, convertToFilterableItems } from '@/utils/marketplace';`
- ✅ Nutze importierte Funktionen
- ✅ useMemo für teure Berechnungen optimieren

#### 3.4 WalletNFTsList.tsx
**Änderungen:**
- ❌ Entferne lokale `convertToScrollItems` Funktion
- ✅ Import: `import { convertToScrollItems } from '@/utils/marketplace';`
- ✅ Nutze importierte Funktion

#### 3.5 CollectionPageClient.tsx
**Änderungen:**
- ❌ Entferne lokale `convertToScrollItems` Funktion
- ✅ Import: `import { convertToScrollItems } from '@/utils/marketplace';`

---

### Step 4: Barrel Exports Update

#### src/types/marketplace/index.ts
```typescript
/**
 * MARKETPLACE TYPES - Central Export
 */

// Contract Types (bereits vorhanden)
export * from './marketplace-contract';

// UI Types (NEU)
export * from './marketplace-ui';
```

#### src/utils/marketplace/index.ts (NEU)
```typescript
/**
 * MARKETPLACE UTILITIES
 */

export * from './nft-converters';
// export * from './filter-helpers'; // Falls benötigt
```

#### src/components/marketplace/index.ts
```typescript
// Marketplace Components - Consistent Named Exports
export { ActiveItemsList } from './ActiveItemsList';
export { CollectionsTable } from './CollectionsTable';
export { CurrencySelector } from './CurrencySelector';
export { NFTFilterBar } from './NFTFilterBar';
export { NFTFilterSidebar } from './NFTFilterSidebar';
export { WalletNFTsList } from './WalletNFTsList';
export { ScrollButtons } from './ScrollButtons';
export { NFTScrollList } from './NFTScrollList';

// Re-export Types from central location
export type {
    NFTScrollItem,
    NFTScrollListProps,
    NFTFilters,
    NFTSortOptions,
    FilterableNFTItem
} from '@/types/marketplace';
```

---

### Step 5: Hook Optimization

#### useNFTFilters.ts
**Änderungen:**
- ✅ Import: `import type { NFTFilters, NFTSortOptions, FilterableNFTItem } from '@/types/marketplace';`
- ❌ Entferne lokale Type Definitions
- ✅ useMemo für Filter-Operations
- ✅ Performance-Optimierungen

---

## 📋 Checklist

### Types
- [ ] `src/types/marketplace/marketplace-ui.ts` erstellen
- [ ] Types aus Komponenten entfernen
- [ ] Barrel export in `src/types/marketplace/index.ts` updaten
- [ ] Alle Imports auf neue Types umstellen

### Utils
- [ ] `src/utils/marketplace/nft-converters.ts` erstellen
- [ ] `convertToScrollItems` implementieren
- [ ] `convertToFilterableItems` implementieren
- [ ] Barrel export `src/utils/marketplace/index.ts` erstellen

### Components
- [ ] `NFTFilterBar.tsx` - Types entfernen, importieren
- [ ] `NFTScrollList.tsx` - Types entfernen, importieren
- [ ] `ActiveItemsList.tsx` - Converter-Funktion ersetzen
- [ ] `WalletNFTsList.tsx` - Converter-Funktion ersetzen
- [ ] `CollectionPageClient.tsx` - Converter-Funktion ersetzen
- [ ] `src/components/marketplace/index.ts` - Konsistente Exports

### Hooks
- [ ] `useNFTFilters.ts` - Types importieren statt definieren

### Testing
- [ ] Alle Komponenten rendern korrekt
- [ ] Keine Type-Errors
- [ ] Filter funktioniert
- [ ] Scroll-Listen funktionieren
- [ ] Keine Performance-Regression

---

## 🎯 Erwartete Verbesserungen

### Code Quality
- ✅ Weniger Code-Duplikation (-3 duplicate functions)
- ✅ Zentrale Type Definitions
- ✅ Bessere Wiederverwendbarkeit
- ✅ Konsistente Imports

### Maintainability
- ✅ Einfacher zu erweitern
- ✅ Klare Struktur
- ✅ Dokumentierte Utilities
- ✅ Single Source of Truth für Types

### Performance
- ✅ Optimierte useMemo/useCallback
- ✅ Keine unnötigen Re-Renders
- ✅ Effiziente Filter-Operations

---

## 🚫 Was NICHT geändert wird

- ❌ Keine neuen UI-Features
- ❌ Keine neuen API-Routen
- ❌ Keine Smart Contract Integration (bleibt für später)
- ❌ Keine neuen Hooks
- ❌ Keine Änderung am Spiel (History Towers)
- ❌ Keine Navigation-Änderungen (User landet weiter im Spiel)

---

## 🚀 Start hier

**Reihenfolge:**
1. Types erstellen (Foundation)
2. Utils erstellen (Reusable functions)
3. Components updaten (Use new types & utils)
4. Barrel exports updaten (Clean imports)
5. Testing (Verify nothing broke)

**Geschätzter Aufwand:** 2-3 Stunden

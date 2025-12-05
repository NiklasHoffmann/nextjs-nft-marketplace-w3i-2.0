# Refactoring & Cleanup Plan

## ✅ Abgeschlossen (Phase 1)

### 1. Toter Code entfernt
- [x] `src/lib/config.ts` gelöscht (wurde nirgends verwendet)
- [x] `src/constants/index.js` gelöscht (direkter Import wird verwendet)
- [x] `src/types/core/core-nft.ts` gelöscht (deprecated, ersetzt durch core-nft-modern.ts)
- [x] Ungenutzter Import in `SellTradePage.tsx` entfernt

### 2. Config konsolidiert
- [x] `src/config/index.ts` erstellt mit zentralen Exports
- [x] Alle aktiven Configs unter `@/config` importierbar

### 3. Docs konsolidiert
- [x] `src/docs/*` nach `/docs/` verschoben
- [x] `src/docs/` Ordner gelöscht

### 4. Scripts aufgeräumt
- [x] `scripts/archive/` gelöscht (alte/ungenutzte Scripts)
- [x] `src/scripts/` bleibt (braucht TypeScript Path Aliases)

---

## ✅ Abgeschlossen (Phase 2)

### Logging-Konsistenz

Alle `console.log/warn/error` in Context-Dateien zu `devLog` migriert:

- [x] `WalletNFTsService.ts`
- [x] `WalletNFTsCache.ts`
- [x] `WalletNFTsEnricher.ts`
- [x] `WalletNFTsContext.tsx`
- [x] `CollectionsService.ts`
- [x] `CollectionsCache.ts`
- [x] `CollectionsContext.tsx`
- [x] `MarketplaceItemsCache.ts`
- [x] `MarketplaceItemsService.ts`
- [x] `MarketplaceItemsContext.tsx`
- [x] `NFTStatsContext.tsx`
- [x] `NFTStatsEvents.ts`
- [x] `CurrencyContext.tsx`
- [x] `CartContext.tsx`

**Ergebnis**: 0 `console.log/warn/error` in `src/contexts/**`

### Zusätzlich migriert (Hooks & Utils)

**Hooks:**
- [x] `useNFTDetail.ts`
- [x] `useMarketplaceV2.ts`
- [x] `useNFTInsights.ts`
- [x] `useUserInteractions.ts`
- [x] `useMarketplaceUser.ts`

**Utils:**
- [x] `formatters/general.ts`
- [x] `blockchain/nft-fetcher.ts`
- [x] `blockchain/contract-calls.ts`
- [x] `blockchain/rpc-config.ts`
- [x] `features/admin-access.ts`
- [x] `performance/monitoring.ts`
- [x] `performance/cache.ts`
- [x] `marketplace/nft-converters.ts`
- [x] `core/bigint.ts`
- [x] `api/nft.ts`
- [x] `api/nft-aggregation.ts`

**Ergebnis**: 0 `console.log/warn/error` in `src/hooks/**` und `src/utils/**` (außer devLog.ts)

---

## Projekt-Überblick

Next.js NFT Marketplace mit:
- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Web3**: wagmi, viem, ethers.js
- **Datenbank**: MongoDB (marketplace_items, nft_metadata, nft_stats)
- **APIs**: Alchemy, TheGraph, IPFS

---

## 🔴 Kritische Probleme

### 1. Doppelte Komponenten

| Komponente | Standort 1 | Standort 2 | Aktion |
|------------|-----------|-----------|--------|
| `LoadingSpinner` | `src/components/ui/Loading.tsx` | `src/app/nft/[...]/components/LoadingSpinner.tsx` | Route-spezifische Version löschen |
| `ErrorDisplay` | `src/components/ui/ErrorDisplay.tsx` | `src/app/nft/[...]/components/ErrorDisplay.tsx` | Route-spezifische Version löschen |
| `formatEther` | `src/utils/formatters/general.ts` | `import { formatEther } from 'viem'` | Konsistent nutzen (eigene Version) |

### 2. Doppelte Type-Definitionen

| Type | Standort 1 | Standort 2 | Aktion |
|------|-----------|-----------|--------|
| `NFTMetadata` | `src/types/core/core-nft.ts` (deprecated) | `src/types/nft-metadata.ts` | Alte Version entfernen |
| `ActiveItem` | `src/types/core/core-nft.ts` (deprecated) | `src/types/core/core-nft-modern.ts` | Alte Version entfernen |
| `NFTDetails` | `src/types/core/core-nft.ts` (deprecated) | - | Zu `AggregatedNFT` migrieren |

### 3. Config-Duplikation

| Config | Standort 1 | Standort 2 |
|--------|-----------|-----------|
| App-Einstellungen | `src/lib/config.ts` | `src/config/app.config.ts` |

---

## 🟡 Struktur-Probleme

### 1. Inkonsistente Ordnerstruktur

**Aktuell (chaotisch):**
```
src/
├── lib/           # Utilities + DB + Blockchain
├── utils/         # Mehr Utilities
├── services/      # Nur nft-sync
├── contexts/      # Gut organisiert
├── hooks/         # Gut organisiert
├── schemas/       # JSON-Schemas (sollte in /types)
├── scripts/       # Build-Scripts (sollte im Root)
├── docs/          # Duplikat zu /docs im Root
```

**Soll (klar):**
```
src/
├── lib/           # Technische Infrastruktur (DB, Config, etc.)
├── utils/         # Pure Functions
├── services/      # Business Logic
├── contexts/      # React Contexts
├── hooks/         # React Hooks
├── types/         # Type-Definitionen
├── components/    # Shared Components
├── app/           # Next.js App Router
```

### 2. Route-spezifische Komponenten vs. Shared Components

**Problem**: Route-Ordner enthalten zu viele Komponenten, die auch shared sein könnten.

**Beispiel** `src/app/nft/[...]/components/`:
- `BuyNowModal.tsx` → Sollte shared sein
- `UpdateListingModal.tsx` → Sollte shared sein
- `LoadingSpinner.tsx` → **DUPLIKAT** von `src/components/ui/Loading.tsx`

---

## 🟢 Cleanup-Aktionen (Priorisiert)

### Phase 1: Duplikate entfernen (Schnell, Hohes Risiko)

#### 1.1 Doppelte UI-Komponenten

```bash
# Zu löschen:
src/app/nft/[contractAddress]/[tokenId]/components/LoadingSpinner.tsx
src/app/nft/[contractAddress]/[tokenId]/components/ErrorDisplay.tsx

# Ersetzungen:
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
```

#### 1.2 Deprecated Types entfernen

```bash
# Datei konsolidieren oder löschen:
src/types/core/core-nft.ts  # Alles mit @deprecated entfernen
```

### Phase 2: Config konsolidieren

#### 2.1 Config-Dateien zusammenführen

**Ziel**: Eine `src/config/index.ts` mit allen Configs:
```typescript
// src/config/index.ts
export * from './app.config';  // Feature-Flags, Redirects
export * from './web3.config'; // Chains, RPC, etc.
export * from './api.config';  // API Keys, Endpoints
export * from './ui.config';   // Pagination, Animation, etc.
```

**Aktionen**:
- `src/lib/config.ts` → `src/config/` verschieben und aufteilen
- `src/config/admin.ts` → Gehört zu Features, nicht Config
- `src/constants/` → In `src/config/` integrieren

### Phase 3: Ordner aufräumen

#### 3.1 Schemas verschieben ✅ ERLEDIGT

```bash
# Verschoben nach:
docs/schemas/*.json  # Dokumentation für MongoDB Collections
```

#### 3.2 Scripts konsolidieren ✅ ERLEDIGT

```bash
# Aktuelle Struktur:
scripts/                 # Root-Level Build-Scripts
├── dev/                # Development & Test Scripts
│   ├── seed-test-data.ts      # (von src/scripts/ verschoben)
│   ├── setup-indexes.ts       # (von src/scripts/ verschoben)
│   └── ...
├── maintenance/        # Cleanup & Fixes
├── lib/                # Shared Helpers
└── *.js               # Migrations & Setup Scripts

# Gelöscht:
src/scripts/            # ✅ Inhalt nach scripts/dev/ verschoben
scripts/archive/        # ✅ Bereits in Phase 1 gelöscht
```

#### 3.3 Docs konsolidieren ✅ ERLEDIGT (Phase 1)

```bash
# Nur ein Docs-Ordner:
docs/                   # Root-Level (behalten)
docs/schemas/           # MongoDB JSON-Schemas (neu hinzugefügt)

# Bereits gelöscht (Phase 1):
src/docs/               # ✅ Inhalt nach docs/ verschoben
```

### Phase 4: Utils/Lib aufräumen ✅ ERLEDIGT

#### 4.1 Klare Trennung

| Ordner | Zweck | Beispiele |
|--------|-------|-----------|
| `lib/` | Infrastruktur (Singletons, DB, Connections) | MongoDB, Apollo, Caching |
| `utils/` | Pure Functions (keine Side Effects) | Formatter, Validator, Helpers |
| `services/` | Business Logic (API Calls, Data Processing) | NFT Sync, Metadata Fetching |

**Durchgeführte Aktionen**:
- ✅ `src/utils/blockchain/` → `src/services/blockchain/` verschoben
- ✅ Pure Functions aus nft-helpers.ts → `src/utils/formatters/nft.ts` extrahiert
- ✅ Validation functions zu `src/utils/validation/general.ts` hinzugefügt
- ✅ 3 Import-Pfade in API-Routes aktualisiert
- ✅ Re-exports in services/blockchain/nft-helpers.ts für Backwards-Compatibility

### Phase 5: Component-Architektur

#### 5.1 NFT-Komponenten konsolidieren

```bash
# Shared NFT Components (bleiben in src/components/nft/):
NFTCard.tsx
LazyNFTCard.tsx
OptimizedNFTImage.tsx

# Route-spezifisch (bleiben in Route-Ordner):
src/app/nft/[...]/components/
├── NFTPriceCard.tsx      # Nur für Detail-Page
├── InfoTabs.tsx          # Nur für Detail-Page
└── ...

# Zu Shared verschieben (werden mehrfach genutzt):
src/app/nft/[...]/components/BuyNowModal.tsx    → src/components/nft/
src/app/nft/[...]/components/CancelListingModal.tsx → src/components/nft/
```

#### 5.2 history-towers isolieren

Das Spiel hat eigene Types/Hooks/Components - das ist **KORREKT**!
Feature-Ordner mit allem was zusammengehört ist Best Practice.

---

## 📁 Ziel-Struktur

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   ├── marketplace/              # Marketplace Page
│   │   └── components/           # Page-spezifische Components
│   ├── nft/                      # NFT Detail Pages
│   │   └── [contractAddress]/
│   │       └── [tokenId]/
│   │           └── components/   # Page-spezifische Components
│   ├── wallet/                   # Wallet Page
│   ├── history-towers/           # Game (eigenständiges Feature)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── engine/
│   └── ...
│
├── components/                   # Shared Components
│   ├── ui/                       # Generische UI (Button, Loading, etc.)
│   ├── nft/                      # NFT-spezifisch (NFTCard, Modals, etc.)
│   ├── shared/                   # Cross-Feature (Filter, Gallery, etc.)
│   ├── layout/                   # Layout Components
│   ├── auth/                     # Auth Components
│   └── admin/                    # Admin Components
│
├── contexts/                     # React Contexts (gut organisiert ✅)
│   ├── marketplace-items/
│   ├── wallet-nfts/
│   ├── collections/
│   ├── nft-stats/
│   └── ...
│
├── hooks/                        # Custom React Hooks (gut organisiert ✅)
│   ├── marketplace/
│   ├── nfts/
│   └── interactions/
│
├── types/                        # TypeScript Types
│   ├── core/                     # Core Types (NFT, Currency, etc.)
│   │   └── index.ts              # Re-exports only modern types
│   ├── features/                 # Feature Types
│   ├── marketplace/              # Marketplace Types
│   ├── api/                      # API Response Types
│   └── index.ts                  # Central Export
│
├── config/                       # Configuration
│   ├── app.config.ts             # App Settings
│   ├── web3.config.ts            # Web3/Blockchain Config
│   └── index.ts                  # Re-exports
│
├── lib/                          # Technical Infrastructure
│   ├── db/                       # Database Helpers
│   ├── api/                      # API Middleware
│   ├── mongodb.ts                # MongoDB Connection
│   ├── cache.ts                  # Cache Singleton
│   └── utils.ts                  # Lib Utils (cn, etc.)
│
├── services/                     # Business Logic
│   ├── nft-sync/                 # NFT Synchronization
│   ├── blockchain/               # Blockchain Interactions
│   └── api/                      # API Services
│
└── utils/                        # Pure Helper Functions
    ├── core/                     # Core Utils (BigInt, Media)
    ├── formatters/               # Formatters
    ├── validation/               # Validators
    └── index.ts                  # Central Export
```

---

## ✅ Prüfliste vor Implementierung

- [ ] Backup erstellen
- [ ] Alle Imports tracken (grep für alte Pfade)
- [ ] Tests laufen lassen
- [ ] Build prüfen
- [ ] TypeScript-Fehler prüfen

---

## 🚀 Reihenfolge der Implementierung

1. **Phase 1**: Duplikate entfernen ✅ ERLEDIGT
   - [x] Toter Code entfernt (config.ts, index.js, core-nft.ts)
   - [x] Config konsolidiert (src/config/index.ts)
   - [x] Docs nach /docs/ verschoben
   - [x] scripts/archive/ gelöscht

2. **Phase 2**: Logging-Konsistenz ✅ ERLEDIGT
   - [x] Alle Contexts zu devLog migriert (14 Dateien)
   - [x] Alle Hooks zu devLog migriert (5 Dateien)
   - [x] Alle Utils zu devLog migriert (11 Dateien)

3. **Phase 3**: Ordner aufräumen ✅ ERLEDIGT
   - [x] Schemas nach docs/schemas/ verschoben
   - [x] src/scripts/ nach scripts/dev/ verschoben und gelöscht

4. **Phase 4**: Utils/Services trennen ✅ ERLEDIGT
   - [x] utils/blockchain → services/blockchain verschoben
   - [x] Pure Functions zu utils/formatters/nft.ts extrahiert
   - [x] Validation functions erweitert
   - [x] Imports aktualisiert

5. **Phase 5**: Components konsolidieren ✅ ERLEDIGT
   - [x] 3 Modals nach src/components/nft/modals/ verschoben:
     - BuyNowModal.tsx
     - CancelListingModal.tsx  
     - UpdateListingModal.tsx
   - [x] Index-Exporte aktualisiert
   - [x] Import in NFTPriceCard.tsx aktualisiert

---

## Logging-Konsistenz

**Problem**: Mischung aus `console.log` und `devLog`.

**Lösung**:
```typescript
// Alle console.log in Services zu devLog migrieren
// Ausnahme: Start/Stop Logs im Server (sollen immer sichtbar sein)

// In nft-sync/graph-subscription.ts → console.log behalten (Server-Logs)
// In WalletNFTsService.ts → zu devLog migrieren
```

---

## Nicht anfassen (ist bereits gut!)

- ✅ `contexts/` - Gut strukturiert mit Cache/Service/Context Pattern
- ✅ `hooks/` - Saubere Organisation nach Feature
- ✅ `app/history-towers/` - Eigenständiges Feature mit eigener Struktur
- ✅ `components/ui/` - Generische UI Components

---

## Geschätzte Zeit

| Phase | Zeit | Risiko |
|-------|------|--------|
| Phase 1 | 1-2h | Mittel (Breaking Changes) |
| Phase 2 | 1h | Niedrig |
| Phase 3 | 2-3h | Niedrig |
| Phase 4 | 2-3h | Mittel |
| Phase 5 | 1-2h | Niedrig |
| **Gesamt** | **7-11h** | |

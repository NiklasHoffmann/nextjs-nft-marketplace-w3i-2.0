# Refactoring Roadmap: nftAddress → contractAddress

## 🎯 Ziel
Komplettes Refactoring von `nftAddress` zu `contractAddress` im gesamten Codebase für vollständige Konsistenz im **Utility Marketplace**.

## 📊 Scope
- **Geschätzte Änderungen**: 500-800 Zeilen
- **Betroffene Dateien**: ~80-100 Dateien
- **Geschätzte Dauer**: 2-3 Sessions
- **Risiko**: HOCH (Breaking Changes überall)

---

## Phase 1: Types & Interfaces (Foundation)
**Priorität**: KRITISCH - Alles andere baut darauf auf

### 1.1 Core Types
- [ ] `src/types/core/core-nft.ts`
  - [ ] `NFTData` interface: `nftAddress` → `contractAddress`
  - [ ] `NFTIdentifier` interface: `nftAddress` → `contractAddress`
  
- [ ] `src/types/core/core-nft-modern.ts`
  - [ ] `ModernNFT` interface: `nftAddress` → `contractAddress`
  
- [ ] `src/types/core/core-nft-legacy.ts`
  - [ ] `LegacyNFT` interface: `nftAddress` → `contractAddress`

### 1.2 Marketplace Types
- [ ] `src/types/marketplace/enriched-nft.ts`
  - [ ] `EnrichedNFT` interface: `nftAddress` → `contractAddress`
  - [ ] `MarketplaceNFT` interface: `nftAddress` → `contractAddress`
  
- [ ] `src/types/marketplace/marketplace-ui.ts`
  - [ ] `UIMarketplaceItem` interface: `nftAddress` → `contractAddress`
  - [ ] `ScrollItem` interface: `nftAddress` → `contractAddress`

### 1.3 Feature Types
- [ ] `src/types/features/nft-detail.ts`
  - [ ] `NFTDetailData` interface: `nftAddress` → `contractAddress`
  
- [ ] `src/types/features/user-interactions.ts`
  - [ ] `UserInteraction` interface: `nftAddress` → `contractAddress`

### 1.4 API Types
- [ ] `src/types/api/api-responses.ts`
  - [ ] `NFTResponse` interface: `nftAddress` → `contractAddress`
  - [ ] Alle Response types prüfen

---

## Phase 2: Utils & Helpers (Business Logic)

### 2.1 NFT Aggregation
- [ ] `src/utils/api/nft-aggregation.ts`
  - [ ] `createNFTKey(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Alle Funktionen die `nftAddress` verwenden

### 2.2 Performance & Context
- [ ] `src/utils/performance/context.ts`
  - [ ] `createEmptyNFTData(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `isValidNFTIdentifier(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `logPerformance()` → nftAddress references

### 2.3 Blockchain Utils
- [ ] `src/utils/blockchain/nft-fetcher.ts`
  - [ ] `fetchComprehensiveNFTDataNew(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Alle internen Variablen: `nftAddress` → `contractAddress`
  
- [ ] `src/utils/blockchain/nft-helpers.ts`
  - [ ] `isValidNFTAddress(address)` → Funktion umbenennen zu `isValidContractAddress`
  - [ ] `createShareableNFTUrl(nftAddress, tokenId)` → Parameter umbenennen

### 2.4 Marketplace Utils
- [ ] `src/utils/marketplace/nft-converters.ts`
  - [ ] `toScrollItem()` - Mapping `nftAddress` → `contractAddress`
  - [ ] `toEnrichedNFT()` - Mapping `nftAddress` → `contractAddress`
  - [ ] ACHTUNG: Backward compatibility für `item.nftAddress || item.contractAddress` entfernen

---

## Phase 3: Contexts (State Management)

### 3.1 NFT Context
- [ ] `src/contexts/NFTContext.tsx`
  - [ ] State: `nftAddress` → `contractAddress` in allen Maps/Caches
  - [ ] Alle Funktionen: `getStats(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Events: `nftAddress` → `contractAddress`

### 3.2 WalletNFTs Context
- [ ] `src/contexts/WalletNFTsContext.tsx`
  - [ ] `getNFT(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Alle Mappings/Caches aktualisieren

### 3.3 Collections Context
- [ ] `src/contexts/CollectionsContext.tsx`
  - [ ] Prüfen ob `nftAddress` verwendet wird
  - [ ] Aggregation queries aktualisieren

---

## Phase 4: Hooks (Component Logic)

### 4.1 Marketplace Hooks
- [ ] `src/hooks/marketplace/useNFTDetail.ts` ⚠️ **AKTUELL GEÖFFNET**
  - [ ] Options interface: `nftAddress` → `contractAddress`
  - [ ] Alle Funktionen: `fetchNFTDetail(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Cache keys: `nft-detail:${nftAddress}:${tokenId}` → aktualisieren
  - [ ] API calls: `/api/marketplace/nft/${nftAddress}/${tokenId}` → URL aktualisieren
  
- [ ] `src/hooks/marketplace/useMarketplaceV2.ts`
  - [ ] Alle `nftAddress` references

- [ ] `src/hooks/marketplace/useMarketplaceUser.ts`
  - [ ] Alle `nftAddress` references

### 4.2 NFT Hooks
- [ ] `src/hooks/nfts/useNFTInsights.ts`
  - [ ] Parameter `nftAddress` → `contractAddress`
  
- [ ] `src/hooks/nfts/useNFTUserActions.ts`
  - [ ] Alle Action functions aktualisieren
  
- [ ] `src/hooks/nfts/useNFTPriceData.ts`
  - [ ] Prüfen ob `nftAddress` verwendet wird

### 4.3 Interaction Hooks
- [ ] `src/hooks/interactions/useUserInteractions.ts`
  - [ ] Alle Funktionen aktualisieren

---

## Phase 5: API Routes (Backend)

### 5.1 Dynamic Route Segments
⚠️ **BREAKING CHANGE** - Folder umbenennen!

- [ ] `src/app/api/marketplace/nft/[nftAddress]/[tokenId]/route.ts`
  - [ ] Folder umbenennen: `[nftAddress]` → `[contractAddress]`
  - [ ] `params.nftAddress` → `params.contractAddress` in route handler
  - [ ] Alle queries bereits ✅ (vorherige Session)

### 5.2 Query Parameter APIs
- [ ] `src/app/api/nft/metadata/route.ts`
  - [ ] Query param: `?nftAddress=` → `?contractAddress=`
  - [ ] `searchParams.get('nftAddress')` → `searchParams.get('contractAddress')`

- [ ] `src/app/api/nft/stats/route.ts`
  - [ ] Bereits ✅ (verwendet `contractAddress` in queries)
  - [ ] Aber prüfen: URL params noch `nftAddress`?

- [ ] `src/app/api/user/interactions/route.ts`
  - [ ] Bereits ✅ (verwendet `contractAddress` in queries)

### 5.3 Other API Routes
- [ ] Alle anderen API routes durchsuchen nach `nftAddress` in:
  - [ ] Request params
  - [ ] Query strings
  - [ ] Response bodies

---

## Phase 6: Services (Background Jobs)

### 6.1 NFT Sync Services
- [ ] `src/services/nft-sync/nft-enricher.ts`
  - [ ] `enrichNFT(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `fetchContractMetadata(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `fetchNFTMetadata(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `fetchOrInitializeStats(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `fetchOrInitializeInsights(nftAddress, tokenId)` → Parameter umbenennen

- [ ] `src/services/nft-sync/metadata-sync.ts`
  - [ ] `loadMetadataForNFT(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] API call: `?nftAddress=` → `?contractAddress=`

- [ ] `src/services/nft-sync/stats-sync.ts`
  - [ ] `syncStatsForNFT(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] API call URL aktualisieren

- [ ] `src/services/nft-sync/insights-sync.ts`
  - [ ] `syncNFT(nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Variable: `const nftAddress = insight.contractAddress` → schon okay

### 6.2 Marketplace Sync
- [ ] `src/lib/services/marketplace-metadata-sync.ts`
  - [ ] Alle `nftAddress` references

---

## Phase 7: Scripts (Maintenance)

### 7.1 Sync Scripts
- [ ] `scripts/sync-marketplace-data.js`
  - [ ] `fetchContractInfo(publicClient, nftAddress, tokenId)` → Parameter umbenennen
  - [ ] `fetchInsights(db, nftAddress, tokenId)` → Parameter umbenennen
  - [ ] Alle Variablen `nftAddress` → `contractAddress`
  - [ ] ACHTUNG: `item.nftAddress` kommt von TheGraph → nach Migration ist es `contractAddress`

- [ ] `scripts/sync-collections.ts`
  - [ ] Queries: `{ nftAddress: contractAddress }` → `{ contractAddress }`

### 7.2 Setup Scripts
- [ ] `src/scripts/setup-indexes.ts`
  - [ ] Prüfen ob `nftAddress` in Index definitions

- [ ] `src/scripts/seed-test-data.ts`
  - [ ] Test data: `nftAddress` → `contractAddress`

---

## Phase 8: Components (Frontend)

### 8.1 NFT Components
- [ ] Alle Components in `src/components/nft/` durchsuchen
  - [ ] Props: `nftAddress` → `contractAddress`
  - [ ] State: `nftAddress` → `contractAddress`
  - [ ] Event handlers aktualisieren

### 8.2 Marketplace Components
- [ ] `src/components/marketplace/NFTCard.tsx`
  - [ ] Props `nftAddress` → `contractAddress`
  - [ ] onClick handlers aktualisieren
  
- [ ] `src/components/marketplace/NFTGrid.tsx`
  - [ ] Mapping functions aktualisieren

### 8.3 Admin Components
- [ ] `src/components/admin/` - alle prüfen

---

## Phase 9: Pages (Routes)

### 9.1 Dynamic Pages
- [ ] `src/app/marketplace/[nftAddress]/[tokenId]/page.tsx`
  - [ ] Folder umbenennen: `[nftAddress]` → `[contractAddress]`
  - [ ] `params.nftAddress` → `params.contractAddress`
  
- [ ] Alle anderen dynamic routes prüfen

### 9.2 Page Components
- [ ] `src/app/marketplace/page.tsx`
  - [ ] Props passing aktualisieren
  
- [ ] `src/app/wallet/page.tsx`
  - [ ] Prüfen ob `nftAddress` verwendet wird

---

## Phase 10: Testing & Validation

### 10.1 TypeScript Compilation
```bash
npm run build
```
- [ ] Alle TypeScript Errors fixen
- [ ] Prüfen: Keine `nftAddress` references mehr (außer Kommentare/Docs)

### 10.2 Funktionale Tests
- [ ] Marketplace: NFT Liste laden
- [ ] Detail Page: NFT Details anzeigen
- [ ] Stats: Like/Rate/Watch funktionieren
- [ ] Wallet: User NFTs laden
- [ ] Collections: Collection View

### 10.3 API Tests
```bash
# Test Detail API (neue URL)
curl http://localhost:3000/api/marketplace/nft/0x.../123

# Test Stats API
curl http://localhost:3000/api/nft/stats?contractAddress=0x...&tokenId=123
```

### 10.4 Database Consistency
- [ ] Verify: Alle Collections haben `contractAddress` (keine `nftAddress` mehr)
- [ ] Verify: Alle Indexes auf `contractAddress`
- [ ] Verify: Keine duplicates

---

## Phase 11: Cleanup & Documentation

### 11.1 Code Cleanup
- [ ] Remove: Alle `item.nftAddress || item.contractAddress` Fallbacks
- [ ] Remove: Legacy compatibility code
- [ ] Remove: Debug `console.log` mit `nftAddress`

### 11.2 Documentation
- [ ] Update: README.md (API examples)
- [ ] Update: API.md (alle Endpoints)
- [ ] Update: ARCHITECTURE.md (field naming)
- [ ] Update: `.github/copilot-instructions.md`

### 11.3 Git
```bash
git add .
git commit -m "refactor: rename nftAddress to contractAddress everywhere

BREAKING CHANGE: All API routes, types, and database fields now use 'contractAddress' instead of 'nftAddress' for consistency with utility marketplace branding.

- Renamed all TypeScript interfaces
- Updated all API route parameters
- Renamed dynamic route folders
- Updated all hooks and contexts
- Updated all components
- Cleaned up legacy compatibility code
"
```

---

## 🔍 Search Patterns (für neuen Chat)

### Find all nftAddress occurrences:
```bash
# VS Code Search (Regex)
nftAddress[:\s\?\(\)]

# Or grep
grep -r "nftAddress" src/ --include="*.ts" --include="*.tsx"
```

### Critical Files (Start Here):
1. `src/types/core/core-nft.ts` - Base interface
2. `src/hooks/marketplace/useNFTDetail.ts` - Most used hook
3. `src/app/api/marketplace/nft/[nftAddress]/[tokenId]/route.ts` - Main API
4. `src/utils/api/nft-aggregation.ts` - Key helper
5. `src/contexts/NFTContext.tsx` - State management

---

## ⚠️ Breaking Changes Checklist

### API URLs (Breaking)
- ❌ `/api/marketplace/nft/[nftAddress]/[tokenId]`
- ✅ `/api/marketplace/nft/[contractAddress]/[tokenId]`

### Query Params (Breaking)
- ❌ `?nftAddress=0x...`
- ✅ `?contractAddress=0x...`

### Type Interfaces (Breaking)
- ❌ `interface NFTData { nftAddress: string }`
- ✅ `interface NFTData { contractAddress: string }`

### Component Props (Breaking)
- ❌ `<NFTCard nftAddress="0x..." />`
- ✅ `<NFTCard contractAddress="0x..." />`

---

## 📝 Migration Notes

### Already Completed (Previous Sessions):
- ✅ Database fields: `nftAddress` → `contractAddress` (4 collections)
- ✅ Database queries: All API routes use `contractAddress`
- ✅ Collection rename: `user_favorites` → `user_likes`

### Still TODO:
- ⏳ Variable/Parameter names: `nftAddress` → `contractAddress`
- ⏳ API route paths: Folder names with `[nftAddress]`
- ⏳ Frontend components: Props/State
- ⏳ Type definitions: All interfaces

---

## 🎯 Success Criteria

### Complete When:
1. ✅ `grep -r "nftAddress" src/` returns ZERO results (except comments)
2. ✅ `npm run build` succeeds without errors
3. ✅ All API endpoints respond correctly
4. ✅ Frontend loads and displays NFTs
5. ✅ Stats update correctly (like/rate/watch)
6. ✅ No TypeScript errors
7. ✅ No console errors in browser

---

## 💡 Recommendations

### Approach:
1. **Start Fresh Chat** (better token efficiency)
2. **Work Phase by Phase** (don't jump around)
3. **Test After Each Phase** (catch issues early)
4. **Use multi_replace_string_in_file** (bulk changes)
5. **Commit After Each Phase** (rollback safety)

### Tools:
- VS Code Search/Replace (Regex mode)
- TypeScript Language Server (error detection)
- `npm run build` (validation)
- Git (version control)

### Estimated Time:
- Phase 1-2: 30 min (Types & Utils)
- Phase 3-4: 45 min (Contexts & Hooks)
- Phase 5-6: 30 min (APIs & Services)
- Phase 7-8: 45 min (Scripts & Components)
- Phase 9-10: 30 min (Pages & Testing)
- Phase 11: 15 min (Cleanup)
- **Total**: ~3 hours (in 2-3 sessions)

---

## 🚀 Next Steps

1. **Copy this file** to new chat
2. **Start with Phase 1** (Types)
3. **Use search pattern**: `grep -r "nftAddress" src/types/`
4. **Make changes systematically**
5. **Test with `npm run build`**
6. **Move to Phase 2**

Good luck! 🎉

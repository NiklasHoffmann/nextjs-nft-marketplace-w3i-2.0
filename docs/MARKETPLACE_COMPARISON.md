# Marketplace V1 vs V2 - Performance Vergleich

## Übersicht

Beide Versionen sind parallel verfügbar für Performance-Tests und Vergleiche.

## V1 - TheGraph Backend

**Route:** `/marketplace`

**Technologie:**
- Data Source: TheGraph GraphQL API
- Hook: `useActiveItems` (in `nft-hooks-optimized.ts`)
- Components: `ActiveItemsList`, `CollectionsTable`

**Charakteristiken:**
- ✅ Vollständig dezentralisiert (Blockchain → TheGraph → App)
- ✅ Real-time Blockchain-Daten
- ❌ Langsame Ladezeiten (3-5 Sekunden)
- ❌ Client-side Filtering/Sorting (alle Daten müssen geladen werden)
- ❌ Keine Pagination auf API-Level
- ❌ Höherer Netzwerk-Traffic

**Performance Metrics:**
```
Initial Load:    3-5 seconds
Full Data Load:  ~60 items in one request
Response Size:   Large GraphQL response
Filtering:       Client-side (instant after load)
Sorting:         Client-side (instant after load)
```

---

## V2 - MongoDB Backend

**Route:** `/marketplace-v2`

**Technologie:**
- Data Source: MongoDB (synced von Blockchain)
- Hook: `useMarketplaceV2` (in `hooks/marketplace/useMarketplaceV2.ts`)
- Components: `ActiveItemsListV2`, `CollectionsTableV2`

**Charakteristiken:**
- ✅ Ultra-schnelle Ladezeiten (65ms)
- ✅ Server-side Filtering/Sorting
- ✅ Echte Pagination (20 items/page)
- ✅ Niedriger Netzwerk-Traffic
- ✅ Enriched Data (Insights, Stats eingebaut)
- ⚠️ Requires MongoDB Sync (via `sync-marketplace-data.js`)

**Performance Metrics:**
```
Initial Load:      65-100ms
Per Page Load:     20 items in ~65ms
Response Size:     Small JSON (only needed items)
Filtering:         Server-side (fast, only matches returned)
Sorting:           Server-side (MongoDB indexes)
Total Items:       60 (loaded on-demand)
```

---

## Feature Comparison

| Feature | V1 (TheGraph) | V2 (MongoDB) |
|---------|---------------|--------------|
| Load Time | 3-5s | 65ms |
| Pagination | None (all at once) | 20 items/page |
| Filtering | Client-side | Server-side |
| Sorting | Client-side | Server-side |
| Search | Client-side | Server-side (text index) |
| Price Range | Client-side | Server-side |
| Network Traffic | High | Low |
| Initial Bundle | All 60 items | First 20 items |
| Data Freshness | Real-time | Synced (configurable) |
| Enriched Data | No | Yes (insights, stats) |

---

## Performance Testing

### Test 1: Initial Page Load
```bash
V1: /marketplace
- Open DevTools Network Tab
- Hard Refresh (Ctrl+Shift+R)
- Measure time until first NFT renders

V2: /marketplace-v2
- Open DevTools Network Tab
- Hard Refresh (Ctrl+Shift+R)
- Measure time until first NFT renders
```

**Expected Results:**
- V1: 3-5 seconds
- V2: <100ms

### Test 2: Filtering Performance
```bash
Both versions:
1. Select a category filter
2. Measure time until filtered results appear

V1: Instant (already loaded, filter on client)
V2: ~65ms (new API call, filtered on server)
```

### Test 3: Pagination/Scrolling
```bash
V1: Scroll to bottom → all items already loaded
V2: Scroll to bottom → "Load More" → 65ms for next 20 items
```

### Test 4: Network Traffic
```bash
DevTools → Network Tab → Check transferred size

V1: Large GraphQL response (~500KB+ for 60 items)
V2: Small JSON responses (~50KB per 20 items page)
```

---

## Database Details (V2)

**MongoDB Collection:** `marketplace_items`
**Document Count:** 60 active listings

**Key Improvements:**
1. ✅ Price stored as Number (not String) - correct sorting
2. ✅ Secondary sort by listingId - stable pagination
3. ✅ Top-level listingId field - faster queries
4. ✅ Enriched with insights, stats, metadata

**Sync Process:**
```bash
# Manual sync (for testing)
node scripts/sync-marketplace-data.js

# Automatic sync (TODO: cron job or webhook)
```

---

## Migration Path

### Keep Both (Current)
- Parallel for performance comparison
- V1 for real-time blockchain accuracy
- V2 for fast UX

### Migrate to V2 (Future)
1. Run `sync-marketplace-data.js` on schedule
2. Update all routes to use V2
3. Archive V1 components to `/legacy` folder
4. Update documentation

---

## TODO for V2

- [ ] Implement automatic MongoDB sync (cron job)
- [ ] Add cache headers to API routes
- [ ] Add MongoDB indexes for common queries
- [ ] Implement optimistic updates on purchase
- [ ] Add real-time sync via webhooks
- [ ] Performance monitoring/analytics

---

## Empfehlung

**Für Development/Testing:** Beide Versionen behalten
**Für Production:** V2 verwenden (nach ausreichendem Testing)

**Warum V2?**
- 60x schnellere Ladezeiten
- Bessere User Experience
- Skalierbarkeit
- Niedrigere Netzwerk-Kosten

**Wann V1?**
- Wenn absolute Real-time Accuracy benötigt wird
- Für Blockchain-Verifizierung
- Als Fallback wenn MongoDB down ist

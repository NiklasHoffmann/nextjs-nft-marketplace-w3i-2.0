# Marketplace V2 - Quick Start Guide

## 🎯 Was wurde gebaut?

Eine komplett neue MongoDB-basierte Marketplace-Architektur mit:
- **Server-side Datenverarbeitung**: Alle Queries laufen in MongoDB, nicht im Client
- **Hintergrund-Synchronisation**: 4 Services halten Daten aktuell (The Graph, IPFS, Stats, Insights)
- **Instant Search**: Full-text Search über Name, Beschreibung, Tags
- **Optimierte Performance**: Ziel <200ms Initial Load (vs. 3-5s aktuell)

## 📦 Installierte Komponenten

### API Routes
```
/api/marketplace/items          - NFT Search & Filter
/api/marketplace/collections    - Collection Aggregation
/api/marketplace/sync           - Service Control
```

### Client Components
```
src/hooks/marketplace/useMarketplaceV2.ts  - React Hooks
src/app/marketplace-v2/page.tsx            - UI Page
```

### Background Services
```
src/services/nft-sync/graph-subscription.ts  - Real-time GraphQL Subscription
src/services/nft-sync/metadata-sync.ts       - IPFS Metadata (30s interval)
src/services/nft-sync/stats-sync.ts          - Social Stats (5min interval)
src/services/nft-sync/insights-sync.ts       - Curated Insights (30min interval)
```

## 🚀 Start-Anleitung

### 1. Environment Variables überprüfen
```bash
# In .env oder .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nft-marketplace?retryWrites=true&w=majority
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```

### 3. Sync Services starten
Öffne im Browser oder mit cURL:
```bash
# Status prüfen
curl http://localhost:3000/api/marketplace/sync

# Alle Services starten
curl -X POST http://localhost:3000/api/marketplace/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

**Erwartete Response:**
```json
{
  "success": true,
  "message": "All sync services started successfully",
  "services": {
    "graph-subscription": "starting",
    "metadata-sync": "starting",
    "stats-sync": "starting",
    "insights-sync": "starting"
  }
}
```

### 4. Daten-Population überwachen
Nach dem Start der Services beginnt die Synchronisation:

**Phase 1 (0-30s):** GraphQL Subscription lädt aktuelle Marketplace-Items
```bash
# Anzahl Items in MongoDB prüfen
curl http://localhost:3000/api/marketplace/items?limit=1
# → Schau auf pagination.total
```

**Phase 2 (30s-5min):** Metadata-Sync lädt IPFS-Daten
```bash
# Items mit Metadata zählen
curl "http://localhost:3000/api/marketplace/items?limit=100" | jq '[.data.items[] | select(.metadata != null)] | length'
```

**Phase 3 (5min+):** Stats & Insights werden hinzugefügt

### 5. Marketplace V2 öffnen
```
http://localhost:3000/marketplace-v2
```

## 🧪 Test-Szenarien

### Szenario 1: Suche testen
```bash
# Suche nach "Ape" in Name/Beschreibung
curl "http://localhost:3000/api/marketplace/items?search=Ape&limit=10"
```

### Szenario 2: Preis-Filter
```bash
# NFTs zwischen 0.01 und 1 ETH
curl "http://localhost:3000/api/marketplace/items?minPrice=0.01&maxPrice=1&limit=10"
```

### Szenario 3: Collection-Aggregation
```bash
# Top 5 Collections nach Floor Price
curl "http://localhost:3000/api/marketplace/collections?sortBy=floorPrice&sortOrder=asc&limit=5"
```

### Szenario 4: Pagination
```bash
# Seite 2, 20 Items pro Seite
curl "http://localhost:3000/api/marketplace/items?page=2&limit=20"
```

## 📊 Performance-Validierung

### Erwartete Metriken
| Metrik | V1 (Aktuell) | V2 (Ziel) | Messung |
|--------|--------------|-----------|---------|
| Initial Load | 3-5s | <200ms | Lighthouse |
| Search Query | N/A | <50ms | API Response Time |
| Filter Change | 500ms+ | <100ms | API Response Time |
| Items Angezeigt | 1000 | 20-50 | Pagination |

### Performance messen
```bash
# API Response Time messen
time curl -s "http://localhost:3000/api/marketplace/items?limit=20" > /dev/null

# Lighthouse Audit
npx lighthouse http://localhost:3000/marketplace-v2 --only-categories=performance
```

## 🔍 Troubleshooting

### Problem: "MongoDB connection failed"
**Lösung:**
1. Überprüfe `MONGODB_URI` in `.env`
2. Teste Verbindung direkt:
   ```bash
   node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e))"
   ```
3. Stelle sicher, dass Atlas IP-Whitelist konfiguriert ist (0.0.0.0/0 für Dev)

### Problem: "No items in marketplace"
**Lösung:**
1. Überprüfe Sync Service Status:
   ```bash
   curl http://localhost:3000/api/marketplace/sync
   ```
2. Starte Services manuell neu:
   ```bash
   curl -X POST http://localhost:3000/api/marketplace/sync -H "Content-Type: application/json" -d '{"action": "restart"}'
   ```
3. Prüfe ob The Graph Subgraph aktiv ist:
   ```bash
   # In src/constants/subgraph.queries.ts überprüfen
   # SUBGRAPH_URL sollte valide sein
   ```

### Problem: "Images not loading"
**Lösung:**
1. Metadata-Sync läuft erst nach 30s
2. Warte bis Metadata synchronisiert ist
3. Fallback: Prüfe `/api/nft/image/[hash]` Route

### Problem: "Search returns no results"
**Lösung:**
1. MongoDB Text Index prüfen:
   ```javascript
   // In MongoDB Atlas Console
   db.enriched_nfts.getIndexes()
   // → Sollte "metadata_text_index" zeigen
   ```
2. Index neu erstellen via API:
   ```bash
   # Rufe einmal auf, Indexes werden initialisiert
   curl http://localhost:3000/api/marketplace/items
   ```

## 📈 Nächste Schritte

### Sofort
- [ ] Services starten und 5-10min laufen lassen
- [ ] UI öffnen und Suche/Filter testen
- [ ] Response Times messen

### Kurzfristig
- [ ] Performance-Benchmarks durchführen
- [ ] Edge Cases testen (leere Suche, extreme Preise, etc.)
- [ ] UI-Feedback sammeln

### Migration (wenn V2 validiert)
- [ ] `/marketplace` Route auf V2 umstellen
- [ ] V1 Code deprecaten
- [ ] Dokumentation aktualisieren

## 💡 Tipps

### Development
- **Hot Reload**: Änderungen an API Routes erfordern keinen Service-Restart
- **Logging**: Services loggen in Console, nutze `console.log` für Debugging
- **MongoDB Atlas**: Nutze "Collections" Tab für direkte Datenbank-Inspektion

### Production Readiness
Noch NICHT production-ready, folgendes fehlt noch:
- [ ] Error Monitoring (Sentry/LogRocket)
- [ ] Rate Limiting auf API Routes
- [ ] Service Health Checks
- [ ] Graceful Shutdown für Background Services
- [ ] Caching Layer (Redis)
- [ ] API Authentication

## 📚 Weitere Dokumentation

- **Architektur**: `docs/MARKETPLACE_V2_README.md`
- **API Referenz**: `docs/API.md`
- **Deployment**: `docs/DEVELOPMENT.md`

---

**Fragen oder Probleme?** Öffne die Browser Console (F12) für detaillierte Logs.

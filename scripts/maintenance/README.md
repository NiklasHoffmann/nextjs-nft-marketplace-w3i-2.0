# Maintenance Scripts

## Cleanup Duplicate Interactions

**Script**: `cleanup-duplicate-interactions.ts`

### Problem
Durch Race Conditions oder Bugs können manchmal Duplikate in den User-Interaction-Collections entstehen:
- `user_favorites` - Mehrere Like-Einträge für gleiche Wallet + NFT
- `user_watchlist` - Mehrere Watchlist-Einträge für gleiche Wallet + NFT
- `user_ratings` - Mehrere Ratings für gleiche Wallet + NFT

Dies führt zu falschen Stats (favoriteCount, watchlistCount, averageRating).

### Lösung
Das Script:
1. ✅ Findet alle Duplikate (gleiche `wallet` + `contractAddress` + `tokenId`)
2. ✅ Behält nur den **neuesten** Eintrag (nach `createdAt` oder `_id`)
3. ✅ Löscht alle älteren Einträge
4. ✅ Recalculiert die Stats für betroffene NFTs

### Usage

#### Dry Run (Preview, keine Änderungen)
```bash
npm run cleanup:duplicates
```

**ODER direkt mit npx:**
```bash
npx tsx scripts/maintenance/cleanup-duplicate-interactions.ts
```

**Output Beispiel:**
```
🔍 Analyzing user_favorites...

📋 Duplicate Group in user_favorites:
   Wallet: 0x1234...
   NFT: 0xabc.../1
   Total entries: 3
   ✅ KEEP: 507f1f77bcf86cd799439011 (2025-11-11T10:30:00.000Z)
   ❌ DELETE: 507f1f77bcf86cd799439012 (2025-11-11T10:25:00.000Z)
   ❌ DELETE: 507f1f77bcf86cd799439013 (2025-11-11T10:20:00.000Z)
   🔍 DRY RUN: Would delete 2 duplicate(s)

📊 Recalculating stats for 1 affected NFTs...
   📝 0xabc.../1:
      Favorites: 1, Watchlist: 2, Ratings: 3 (avg: 4.50)

📊 Summary
Total duplicates found: 2
Affected NFTs: 1

💡 Run with --execute flag to actually delete duplicates
```

#### Execute (Tatsächlich löschen)

⚠️ **Wichtig:** Das npm-Script `npm run cleanup:duplicates -- --execute` funktioniert in PowerShell nicht immer korrekt.

**Empfohlene Methode:**
```bash
npx tsx scripts/maintenance/cleanup-duplicate-interactions.ts --execute
```

**Alternative (falls npm script funktioniert):**
```bash
npm run cleanup:duplicates -- --execute
```

**Output Beispiel:**
```
🚨 EXECUTE MODE - Duplicates WILL be deleted!

...

   🗑️  Deleted 2 duplicate(s)

✅ Stats recalculated for 1 NFTs

📊 Summary
Total duplicates removed: 2
Affected NFTs: 1

✅ Cleanup completed successfully!
```

### Safety Features

1. **Dry Run by Default**: Ohne `--execute` werden keine Änderungen gemacht
2. **Latest Entry Preserved**: Behält immer den neuesten Eintrag (nach Timestamp)
3. **Stats Recalculation**: Aktualisiert automatisch die `nft_stats` Collection
4. **Detailed Logging**: Zeigt genau was gelöscht wird/würde

### Wann ausführen?

- **Nach Race Condition Bugs**: Wenn Stats plötzlich falsch sind
- **Regelmäßige Wartung**: Z.B. monatlich als Sicherheitsmaßnahme
- **Nach DB-Migration**: Wenn alte Daten Duplikate enthalten

### Technische Details

**Erkennung von Duplikaten:**
```typescript
// MongoDB Aggregation Pipeline
{
  $group: {
    _id: {
      wallet: '$wallet',
      contractAddress: '$contractAddress',
      tokenId: '$tokenId'
    },
    count: { $sum: 1 }
  }
},
{
  $match: {
    count: { $gt: 1 }  // Nur Gruppen mit mehr als 1 Eintrag
  }
}
```

**Sortierung (neuester zuerst):**
```typescript
docs.sort((a, b) => {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a._id.getTimestamp().getTime();
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b._id.getTimestamp().getTime();
  return dateB - dateA;  // DESC
});
```

**Stats Recalculation:**
```typescript
// Zählt echte Einträge nach Cleanup
const favoriteCount = await favoritesCollection.countDocuments({
  contractAddress,
  tokenId
});

// Berechnet echten Durchschnitt
const averageRating = ratingCount > 0
  ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
  : 0;
```

### Environment Variables

Das Script nutzt die gleichen ENV-Variablen wie die App:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/Ideationmarket_v2?retryWrites=true&w=majority
```

**Wichtig:**
- Das Script lädt automatisch `.env.local` via `dotenv`
- **Datenbank**: `Ideationmarket_v2` (hardcoded im Script)
- **Collections**: `user_favorites`, `user_watchlist`, `user_ratings`, `nft_stats`

**Verbindungstest:**
```bash
npx tsx scripts/maintenance/cleanup-duplicate-interactions.ts
```
Wenn "✅ Connected to MongoDB" erscheint, ist die Verbindung OK.

### Dependencies

- `mongodb` - Bereits in `package.json`
- `tsx` - Zum Ausführen von TypeScript (benötigt für npm script)
- `dotenv` - Zum Laden der ENV-Variablen aus `.env.local`

Falls `tsx` oder `dotenv` fehlt:
```bash
npm install -D tsx dotenv
```

### Wann sind die Änderungen sichtbar?

**SOFORT!** ✅

Nach dem Cleanup sind die korrigierten Stats **sofort auf dem Marketplace sichtbar**:

1. **Stats werden direkt in DB aktualisiert** (`nft_stats` Collection)
2. **Kein Cache-Problem**: Das Script aktualisiert die echten DB-Werte
3. **Nächster API-Call holt korrekte Daten**: `/api/nft/stats` liest aus `nft_stats`
4. **UI updated automatisch**: DetailHeader, Cards, etc. zeigen neue Counts

**Wenn Stats nicht sofort erscheinen:**
- Browser-Cache leeren (Ctrl+F5)
- Seite neu laden
- Im Zweifel: DevTools → Network → "Disable cache" aktivieren

**Technischer Hintergrund:**
```typescript
// Script schreibt direkt in nft_stats:
await statsCollection.updateOne(
    { contractAddress, tokenId },
    { $set: { favoriteCount, watchlistCount, ... } }
);

// API liest dann diese Werte:
const stats = await statsCollection.findOne({ contractAddress, tokenId });
// → Keine Verzögerung, keine Cache-Probleme
```

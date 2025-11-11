# DEBUG: NFT Stats nicht funktionierend

## Problem
Watchlist, Favorites, Rating und Views funktionieren nicht im DetailHeader

## Zu prüfende Komponenten

### 1. DetailHeader Component
- Pfad: `src/app/nft/[nftAddress]/[tokenId]/components/DetailHeader.tsx`
- Verwendet: `useNFTUserStats` Hook

### 2. NFTStatsContext
- Pfad: `src/contexts/NFTStatsContext.tsx`
- Methoden: `toggleFavorite`, `toggleWatchlist`, `setUserRating`, `incrementViews`

### 3. API Routes
- `/api/user/interactions` (GET/POST)
- `/api/nft/stats` (GET/POST)

## Debug-Schritte

### Schritt 1: Browser Console prüfen
Öffne DevTools (F12) und schaue nach:
- [ ] Werden API-Calls gemacht? (Network Tab)
- [ ] Gibt es Fehler in der Console?
- [ ] Werden die Hook-Funktionen aufgerufen?

### Schritt 2: API-Responses prüfen
Öffne Network Tab und prüfe:
```
POST /api/user/interactions
GET /api/user/interactions?userId=...&contractAddress=...&tokenId=...
POST /api/nft/stats
GET /api/nft/stats?contractAddress=...&tokenId=...
```

Erwartete Response für POST /api/user/interactions:
```json
{
  "success": true,
  "data": {
    "modified": 1
  }
}
```

### Schritt 3: MongoDB Verbindung prüfen
```bash
# Check .env.local für MONGODB_URI
# Sollte vorhanden sein und gültig
```

### Schritt 4: Wallet-Verbindung prüfen
- [ ] Ist das Wallet verbunden?
- [ ] Wird userAddress korrekt übergeben?

### Schritt 5: Context Provider prüfen
In `src/app/layout.tsx` sollte sein:
```tsx
<NFTStatsProvider>
  {children}
</NFTStatsProvider>
```

## Häufige Fehlerquellen

1. **MongoDB nicht verbunden**
   - Check MONGODB_URI in .env.local
   - Prüfe ob MongoDB Atlas erreichbar ist

2. **Wallet nicht verbunden**
   - User muss Wallet verbinden um Favorites/Watchlist/Rating zu nutzen
   - Views sollten auch ohne Wallet funktionieren

3. **API-Rate-Limiting**
   - Zu viele Requests in kurzer Zeit
   - Check Network Tab für 429 Errors

4. **CORS Issues**
   - Sollte nicht auftreten da same-origin
   - Aber prüfe Network Tab

5. **Context nicht verfügbar**
   - NFTStatsProvider fehlt in Layout
   - useNFTUserStats wird außerhalb Provider aufgerufen

## Test-Scenario

1. Öffne eine NFT Detail-Seite: http://localhost:3000/nft/0x41655ae49482de69eec8f6875c34a8ada01965e2/273

2. Verbinde Wallet (oben rechts)

3. Klicke auf Favorite (Herz-Icon)
   - Erwartung: Icon wird rot, Counter +1
   - Network: POST /api/user/interactions mit isFavorite: true
   - Network: POST /api/nft/stats mit favoriteCount +1

4. Klicke auf Watchlist (Lesezeichen-Icon)
   - Erwartung: Icon wird blau, Counter +1
   - Network: POST /api/user/interactions mit isWatchlisted: true
   - Network: POST /api/nft/stats mit watchlistCount +1

5. Klicke auf Rating (Stern-Icon), wähle 5 Sterne
   - Erwartung: Icon wird gelb, Rating wird gespeichert
   - Network: POST /api/user/interactions mit rating: 5
   - Network: POST /api/nft/stats mit averageRating Update

## Debugging Code

Füge in DetailHeader.tsx ein (temporär):
```tsx
useEffect(() => {
  console.log('DetailHeader Stats:', {
    stats,
    userInteractions,
    userAddress,
    isConnected
  });
}, [stats, userInteractions, userAddress, isConnected]);
```

Füge in NFTStatsContext.tsx in toggleFavorite ein:
```tsx
console.log('toggleFavorite called:', { nftAddress, tokenId, userAddress });
```

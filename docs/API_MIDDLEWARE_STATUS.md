# API Routes - Middleware Status
**Updated:** December 18, 2025

## ✅ Vollständig Migriert (apiHandler + Auth)

### Admin Routes (withAdmin)
- ✅ `POST /api/nft/admin/insights` - apiHandler + withAdmin
- ✅ `PUT /api/nft/admin/insights` - apiHandler + withAdmin  
- ✅ `DELETE /api/nft/admin/insights` - apiHandler + withAdmin
- ✅ `POST /api/nft/admin/insights/collections` - apiHandler + withAdmin
- ✅ `PUT /api/nft/admin/insights/collections` - apiHandler + withAdmin
- ✅ `DELETE /api/nft/admin/insights/collections` - apiHandler + withAdmin

### User Routes (withAuth)
- ✅ `GET /api/user/interactions` - apiHandler + withAuth
- ✅ `POST /api/user/interactions` - apiHandler + withAuth
- ✅ `PUT /api/user/interactions` - apiHandler + withAuth  
- ✅ `GET /api/user/nfts` - apiHandler + withAuth
- ✅ `GET /api/cart` - apiHandler + withAuth
- ✅ `POST /api/cart` - apiHandler + withAuth
- ✅ `DELETE /api/cart` - apiHandler + withAuth

### Public Routes (apiHandler only)
- ✅ `GET /api/marketplace/items` - apiHandler
- ✅ `GET /api/marketplace/collections` - apiHandler
- ✅ `GET /api/marketplace/whitelist` - apiHandler
- ✅ `POST /api/marketplace/whitelist-check` - apiHandler
- ✅ `GET /api/marketplace/facets` - apiHandler
- ✅ `GET /api/nft/insights` - apiHandler
- ✅ `GET /api/wallet/nfts` - apiHandler

**Total: 20 Endpoints migriert**

## ⚠️ Teilweise Migriert (Legacy Pattern)

### Auth Routes (funktioniert, alt pattern)
- ⚠️ `GET /api/auth/challenge` - Legacy (funktioniert)
- ⚠️ `POST /api/auth/verify` - Legacy (funktioniert)
- ⚠️ `GET /api/auth/session` - Legacy (funktioniert)
- ⚠️ `POST /api/auth/logout` - Legacy (funktioniert)

**Note:** Auth-Routen sind special-purpose, müssen NICHT migriert werden

### NFT Routes (brauchen apiHandler)
- ⚠️ `GET /api/nft/detail` - Legacy try-catch
- ⚠️ `GET /api/nft/metadata` - Legacy try-catch
- ⚠️ `GET /api/nft/metadata/cached` - Legacy try-catch
- ⚠️ `POST /api/nft/metadata/cached` - Legacy try-catch
- ⚠️ `GET /api/nft/stats` - Legacy try-catch
- ⚠️ `POST /api/nft/stats` - Legacy try-catch
- ⚠️ `POST /api/nft/stats/update` - Legacy try-catch
- ⚠️ `GET /api/nft/insights/collections` - Legacy try-catch

### Dynamic Routes
- ⚠️ `GET /api/nft/image/[hash]` - Legacy try-catch
- ⚠️ `DELETE /api/nft/image/[hash]` - Legacy try-catch
- ⚠️ `GET /api/marketplace/nft/[contractAddress]/[tokenId]` - Legacy
- ⚠️ `GET /api/marketplace/listing/[contractAddress]/[tokenId]` - Legacy

### Sync Routes (brauchen Auth)
- ⚠️ `POST /api/user/nfts/sync` - Legacy (sollte withAuth haben)
- ⚠️ `GET /api/marketplace/sync` - Legacy (sollte withAdmin haben)
- ⚠️ `POST /api/marketplace/sync` - Legacy (sollte withAdmin haben)

### Other
- ⚠️ `GET /api/collections` - Legacy try-catch
- ⚠️ `GET /api/game/scores` - Legacy (falls vorhanden)
- ⚠️ `POST /api/game/scores` - Legacy (falls vorhanden)

## 📊 Statistik

### Migration Progress
- **Vollständig migriert**: 20 endpoints (57%)
- **Funktioniert (Auth)**: 4 endpoints (11%)  
- **Braucht Migration**: 11+ endpoints (32%)

### Auth Coverage
- **Admin (withAdmin)**: 6 endpoints ✅
- **User (withAuth)**: 7 endpoints ✅
- **Public**: 7 endpoints ✅
- **Sync ohne Auth**: 3 endpoints ⚠️

## 🎯 Nächste Schritte

### Priorität 1 (Sicherheit)
```bash
# Sync-Routes brauchen Auth
- POST /api/user/nfts/sync → withAuth hinzufügen
- GET /api/marketplace/sync → withAdmin hinzufügen  
- POST /api/marketplace/sync → withAdmin hinzufügen
```

### Priorität 2 (High Traffic)
```bash
# Häufig genutzte Routes
- GET /api/nft/detail → apiHandler
- GET /api/nft/metadata → apiHandler
- GET /api/collections → apiHandler
```

### Priorität 3 (Konsistenz)
```bash
# Restliche Routes
- NFT Stats Routes → apiHandler + optional withAuth
- NFT Image Routes → apiHandler
- Cached Routes → apiHandler
```

## ✅ Konsistenz-Check

**Alle migrierten Routes haben:**
- ✅ `apiHandler` wrapper (automatic error handling)
- ✅ Proper auth middleware (withAuth/withAdmin wo nötig)
- ✅ Keine manuellen try-catch blocks
- ✅ Consistent response format
- ✅ TypeScript types

**Noch zu tun:**
- ⚠️ Sync-Routes Auth hinzufügen (Sicherheitslücke!)
- ⚠️ Legacy try-catch in NFT routes entfernen
- ⚠️ Dynamic routes migrieren

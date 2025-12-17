# Subgraph Migration Checklist

## Was muss bei Subgraph + Marketplace Update beachtet werden?

### 1. **network.mapping.json aktualisieren**
📍 **File:** `src/constants/network.mapping.json`

```json
{
    "31337": { "NftMarketplace": ["0x...NEW_LOCAL_ADDRESS"] },
    "11155111": { "NftMarketplace": ["0x...NEW_SEPOLIA_ADDRESS"] }
}
```

**Wichtig:**
- Array-Format beibehalten (unterstützt mehrere Adressen)
- ChainId korrekt (31337 = local, 11155111 = Sepolia)

---

### 2. **Subgraph Queries prüfen** 
📍 **File:** `src/constants/subgraph.queries.ts`

**Aktuelle Felder:**
```graphql
items {
    listingId          # BigInt - Listing ID
    nftAddress         # Bytes - Contract Address
    tokenId            # BigInt - Token ID
    isListed           # Boolean - Listing Status
    price              # BigInt - Price in Wei
    seller             # Bytes - Seller Address
    buyer              # Bytes - Buyer Address (null if unsold)
    desiredNftAddress  # Bytes - Trade target (0x0 if none)
    desiredTokenId     # BigInt - Trade target token
}
```

**Zu prüfen wenn sich Schema ändert:**
- [ ] Feldnamen geändert? (z.B. `nftAddress` → `collection`)
- [ ] Neue Felder hinzugefügt? (z.B. `timestamp`, `currency`)
- [ ] Felder entfernt? (z.B. `desiredNftAddress` bei reinem Sale)
- [ ] Datentypen geändert? (z.B. `String` statt `BigInt`)

**Betroffene Queries:**
- `ITEMS_UPDATED_SUBSCRIPTION` - Real-time updates
- `GET_ACTIVE_ITEMS` - Marketplace listings
- `GET_NFT_BY_ADDRESS_AND_TOKENID` - Single NFT lookup
- `GET_INACTIVE_ITEMS` - Sold items
- `GET_NFTS_BY_COLLECTION` - Collection view

---

### 3. **GraphQL Subscription Service**
📍 **Files:** 
- `src/services/nft-sync/graph-subscription.ts`
- `src/services/nft-sync/index.ts`

**Änderungen wenn Subscription-Daten sich ändern:**

```typescript
// Beispiel: Wenn neue Felder kommen
interface GraphQLItem {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    // NEU: timestamp?, currency?, etc.
}
```

**Zu prüfen:**
- [ ] `handleSubscriptionData()` Funktion anpassen
- [ ] MongoDB Schema Update (`EnrichedNFTDocument`)
- [ ] Mapping-Logik für neue/geänderte Felder

---

### 4. **MongoDB Collections**
📍 **Collections die Graph-Daten verwenden:**

**marketplace_items:**
```typescript
{
    listingId: string,
    nftAddress: string,
    tokenId: string,
    price: string,
    seller: string,
    buyer: string | null,
    isListed: boolean,
    desiredNftAddress?: string,
    desiredTokenId?: string,
    // Metadata wird separat geladen
}
```

**Änderungen bei Schema-Update:**
- [ ] Migration-Script schreiben (`scripts/migrate-marketplace-schema.js`)
- [ ] Neue Felder hinzufügen mit Defaults
- [ ] Alte Felder umbenennen/transformieren
- [ ] Indexes aktualisieren

---

### 5. **API Routes die Graph verwenden**
📍 **File:** `src/app/api/marketplace/listing/[contractAddress]/[tokenId]/route.ts`

**Verwendet:** `GET_ACTIVE_ITEMS`

**Bei Schema-Änderung anpassen:**
```typescript
// Beispiel: Wenn Feldnamen ändern
const listing = items.find(item => 
    item.nftAddress === contractAddress && // oder item.collection?
    item.tokenId === tokenId
);
```

---

### 6. **TypeScript Types aktualisieren**
📍 **Files die Marketplace-Typen verwenden:**

**Suchen nach:**
- `listingId`
- `nftAddress`
- `tokenId`
- `isListed`
- `desiredNftAddress`

**Betroffene Files (aus grep):**
- `src/app/sell/**/*.tsx` - Listing Forms
- `src/hooks/marketplace/**/*.ts` - Admin Hooks
- `src/services/nft-sync/**/*.ts` - Sync Services
- `src/utils/performance/cache.ts` - Cache Keys

**Beispiel Type-Update:**
```typescript
// Alt
interface MarketplaceItem {
    nftAddress: string;
    tokenId: string;
}

// Neu (falls Schema ändert)
interface MarketplaceItem {
    collection: string;  // statt nftAddress
    tokenId: string;
    listingType: 'sale' | 'trade';  // NEU
}
```

---

### 7. **Environment Variables**
📍 **File:** `.env.local`

```bash
# Graph URLs
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../nft-marketplace/v2.0.0
NEXT_PUBLIC_SUBGRAPH_WS_URL=wss://api.studio.thegraph.com/query/.../nft-marketplace/v2.0.0

# Marketplace Contract
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x6B6825FbDA1dF2C890086E6E1F31f5D573788224
```

**Zu aktualisieren:**
- [ ] Subgraph URL mit neuer Version
- [ ] WebSocket URL
- [ ] Marketplace Contract Address (wenn deployed)

---

### 8. **Testing Checklist**

**Nach Migration testen:**

1. **Subgraph Verbindung:**
   - [ ] GraphQL Query in Playground testen
   - [ ] Subscription funktioniert (WebSocket)
   - [ ] Polling-Fallback funktioniert

2. **Marketplace Sync:**
   - [ ] Server startet ohne Fehler
   - [ ] NFT Sync läuft (MongoDB marketplace_items)
   - [ ] Neue Listings erscheinen automatisch
   - [ ] Sold items werden aktualisiert

3. **UI Funktionen:**
   - [ ] `/marketplace` zeigt Listings
   - [ ] `/sell` Listing erstellen funktioniert
   - [ ] `/admin/marketplace` Admin-Funktionen
   - [ ] NFT Detail Pages

4. **API Routes:**
   - [ ] `/api/marketplace/listing/[contract]/[tokenId]` funktioniert
   - [ ] `/api/marketplace/whitelist-check` funktioniert

---

### 9. **Migrations-Scripts erstellen**

**Wenn Daten migriert werden müssen:**

```javascript
// scripts/migrate-subgraph-schema.js
const { MongoClient } = require('mongodb');

async function migrate() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('nft_marketplace');
    const collection = db.collection('marketplace_items');

    // Beispiel: nftAddress → collection umbenennen
    await collection.updateMany(
        {},
        { $rename: { 'nftAddress': 'collection' } }
    );

    // Beispiel: Neue Felder mit Defaults
    await collection.updateMany(
        { listingType: { $exists: false } },
        { $set: { listingType: 'sale' } }
    );

    await client.close();
}

migrate();
```

---

### 10. **Breaking Changes dokumentieren**

**Erstelle CHANGELOG Eintrag:**

```markdown
## Subgraph v2.0.0 Migration

### Breaking Changes
- Field `nftAddress` renamed to `collection`
- Added required field `listingType`
- Removed `desiredNftAddress` (now separate trade collection)

### Migration Steps
1. Update network.mapping.json
2. Run migration: `npm run migrate:subgraph`
3. Restart sync service
4. Verify marketplace data
```

---

## Quick Migration Workflow

```bash
# 1. Stop Server
npm run stop  # oder Ctrl+C

# 2. Update Contracts
# - Deploy new marketplace contract
# - Update network.mapping.json mit neuer Adresse

# 3. Update Subgraph
# - Deploy neue Subgraph Version
# - Update .env.local mit neuer Subgraph URL

# 4. Code Updates
# - Update src/constants/subgraph.queries.ts
# - Update TypeScript Types
# - Update GraphQL Subscription Handler

# 5. Database Migration
npm run migrate:subgraph  # falls Schema ändert

# 6. Test
npm run dev
# - Check console für Sync-Logs
# - Test /marketplace
# - Test /sell listing

# 7. Verify Data
# - MongoDB marketplace_items collection checken
# - Graph Playground queries testen
```

---

## Rollback Plan

**Falls Migration fehlschlägt:**

1. **Code Rollback:**
   ```bash
   git revert HEAD
   ```

2. **Database Rollback:**
   - MongoDB Backup einspielen
   - Oder alte Felder wiederherstellen

3. **Contract Rollback:**
   - network.mapping.json auf alte Adresse
   - .env.local auf alte Subgraph URL

4. **Restart:**
   ```bash
   npm run dev
   ```

---

## Hilfreiche Commands

```bash
# MongoDB Backup
mongodump --uri="mongodb://..." --out=./backup

# MongoDB Restore
mongorestore --uri="mongodb://..." ./backup

# Subgraph Logs
# Check The Graph Studio Dashboard

# Test Queries
# Verwende GraphQL Playground: https://api.studio.thegraph.com/...
```

---

## Kontaktpunkte für Schema-Änderungen

### Files die SICHER angepasst werden müssen:

1. ✅ **src/constants/subgraph.queries.ts** - GraphQL Queries
2. ✅ **src/constants/network.mapping.json** - Contract Adressen
3. ✅ **src/services/nft-sync/graph-subscription.ts** - Subscription Handler
4. ✅ **.env.local** - Environment Variables
5. ✅ **MongoDB marketplace_items** - Collection Schema

### Files die MÖGLICHERWEISE angepasst werden müssen:

- `src/types/marketplace/*.ts` - TypeScript Interfaces
- `src/app/api/marketplace/**/*.ts` - API Routes
- `src/hooks/marketplace/**/*.ts` - React Hooks
- `src/app/sell/**/*.tsx` - Listing Forms
- `src/utils/performance/cache.ts` - Cache Keys

---

## Support

Bei Problemen:
1. Check Server Console Logs
2. Check MongoDB Collections
3. Check The Graph Subgraph Status
4. Check Network in Browser DevTools

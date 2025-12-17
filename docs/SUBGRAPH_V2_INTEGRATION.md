# Subgraph v2 Integration (Ideation Market)

## ✅ Was wurde implementiert

Die neue Subgraph-Version läuft **parallel** zur alten Version. Du kannst zwischen beiden wechseln oder beide gleichzeitig nutzen.

### Neue Files:
- ✅ `src/constants/subgraph.queries.v2.ts` - Neue GraphQL Queries
- ✅ `src/types/marketplace/listing-v2.ts` - TypeScript Types & Helper Functions
- ✅ `src/services/nft-sync/graph-subscription-v2.ts` - v2 Sync Service
- ✅ `.env.local` - Environment Variables aktualisiert
- ✅ `src/services/nft-sync/index.ts` - Parallel Sync Support

### Neue MongoDB Collection:
- `marketplace_items_v2` - Speichert Listings im neuen Format

---

## 🚀 Setup & Usage

### 1. Environment Variables (`.env.local`)

```bash
# Subgraph Version Control
NEXT_PUBLIC_SUBGRAPH_VERSION=v1   # v1 oder v2

# v1 Subgraph (Legacy)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/46078/nft-marketplace/v0.1.2

# v2 Subgraph (Ideation Market)
NEXT_PUBLIC_SUBGRAPH_V2_URL=https://api.studio.thegraph.com/query/46078/ideation-market/version/latest
NEXT_PUBLIC_SUBGRAPH_V2_DEPLOY_KEY=11585e35f5b3f29c372e173002aca887
```

### 2. Modi

#### Modus 1: Nur v1 (Standard)
```bash
NEXT_PUBLIC_SUBGRAPH_VERSION=v1
# v2 URL weglassen oder leer lassen
```

#### Modus 2: Nur v2
```bash
NEXT_PUBLIC_SUBGRAPH_VERSION=v2
NEXT_PUBLIC_SUBGRAPH_V2_URL=https://api.studio.thegraph.com/query/46078/ideation-market/version/latest
```

#### Modus 3: Beide parallel (für Migration)
```bash
NEXT_PUBLIC_SUBGRAPH_VERSION=v1  # Haupt-Version
# Beide URLs angeben:
NEXT_PUBLIC_SUBGRAPH_URL=https://...nft-marketplace...
NEXT_PUBLIC_SUBGRAPH_V2_URL=https://...ideation-market...
```

### 3. Server starten

```bash
npm run dev
```

**Console Output:**
```
🚀 Starting NFT Sync Service...
📡 Using Subgraph v1 (legacy)
🆕 Subgraph v2 sync initialized
🔄 Running both v1 and v2 sync in parallel
✅ v2: Synced 61 listings at 2025-12-17T...
```

---

## 📊 Neue Schema-Struktur

### Listing Entity (v2)

```typescript
interface ListingV2 {
    id: string;                      // "11155111-1"
    chainId: number;                 // 11155111
    listingId: string;               // "1"
    tokenAddress: string;            // Contract (statt nftAddress)
    tokenId: string;                 // Token ID
    tokenStandard: TokenStandard;    // ERC721 | ERC1155
    priceTotal: string;              // Gesamtpreis in Wei
    unitPrice?: string;              // Preis pro Unit (1155)
    remainingQuantity?: string;      // Verbleibende Menge (1155)
    listingType: ListingType;        // PURE_ETH | SWAP_AND_ETH | PURE_SWAP
    seller: string;                  // Verkäufer
    status: ListingStatus;           // LISTED | PARTIALLY_FILLED | SOLD_OUT | CANCELED
    active: boolean;                 // true wenn aktiv
    buyerWhitelistEnabled: boolean;
    partialBuyEnabled: boolean;
    feeRate: string;                 // Fee (denominator 100_000)
    createdAt: string;               // Timestamp
    
    // Swap fields
    desiredTokenAddress?: string;
    desiredTokenId?: string;
    desiredErc1155Quantity?: string;
}
```

### Mapping v1 ↔ v2

```typescript
// v1 → v2 Mapping
nftAddress     → tokenAddress
isListed       → active (status === 'LISTED')
price          → priceTotal
buyer          → (status === 'SOLD_OUT')
desiredNftAddress → desiredTokenAddress

// Neue Felder in v2
tokenStandard  → ERC721 | ERC1155
listingType    → PURE_ETH | SWAP_AND_ETH | PURE_SWAP
status         → LISTED | PARTIALLY_FILLED | SOLD_OUT | CANCELED
feeRate        → Fee Rate (z.B. 1000 = 1%)
```

---

## 🔧 Code Examples

### Query Active Listings (v2)

```typescript
import { GET_ACTIVE_LISTINGS } from '@/constants/subgraph.queries.v2';
import { ListingV2 } from '@/types/marketplace/listing-v2';

const { data } = await client.query({
    query: GET_ACTIVE_LISTINGS,
    variables: { first: 20, skip: 0 }
});

const listings: ListingV2[] = data.listings;
```

### Helper Functions

```typescript
import { 
    convertListingV2ToV1, 
    formatListingIdV2,
    isSwapListing,
    acceptsETH 
} from '@/types/marketplace/listing-v2';

// Convert to v1 format (für Backward Compatibility)
const v1Listing = convertListingV2ToV1(listing);

// Format Listing ID
const id = formatListingIdV2('123'); // "11155111-123"

// Check listing type
if (isSwapListing(listing)) {
    console.log('This is a trade listing');
}

if (acceptsETH(listing)) {
    console.log('This listing accepts ETH');
}
```

### MongoDB Queries

```typescript
// Get v2 listings from MongoDB
const db = await getDatabase();
const collection = db.collection('marketplace_items_v2');

const listings = await collection.find({ 
    active: true,
    tokenAddress: '0x...'
}).toArray();
```

---

## 🔄 Migration Workflow

### Phase 1: Parallel Betrieb (Jetzt)
```bash
# .env.local
NEXT_PUBLIC_SUBGRAPH_VERSION=v1
NEXT_PUBLIC_SUBGRAPH_URL=...v1...
NEXT_PUBLIC_SUBGRAPH_V2_URL=...v2...
```

**Result:** Beide Subgraphs laufen parallel, v1 ist primary

### Phase 2: Testing v2
```bash
# .env.local
NEXT_PUBLIC_SUBGRAPH_VERSION=v2
```

**Result:** Nur v2 läuft, testen der neuen Integration

### Phase 3: v2 Production
```bash
# .env.local
NEXT_PUBLIC_SUBGRAPH_VERSION=v2
# v1 URL entfernen
```

**Result:** Vollständig auf v2 migriert

---

## 📋 Testing Checklist

### Subgraph v2 testen:

1. **Server starten:**
   ```bash
   npm run dev
   ```

2. **Console Logs checken:**
   ```
   ✅ v2: Synced 61 listings at...
   📝 v2: Upserted 61, Modified 0
   ```

3. **MongoDB checken:**
   ```bash
   # MongoDB Compass oder mongosh
   use Ideationmarket_v2
   db.marketplace_items_v2.find({ active: true }).count()
   ```

4. **GraphQL Playground:**
   ```
   https://api.studio.thegraph.com/query/46078/ideation-market/version/latest
   ```
   
   Test Query:
   ```graphql
   query {
     listings(first: 5, where: { active: true }) {
       id
       listingId
       tokenAddress
       tokenId
       priceTotal
       seller
       status
     }
   }
   ```

5. **API Routes (später):**
   - [ ] Create API route using v2 queries
   - [ ] Test with Postman/Thunder Client

---

## 🚨 Wichtige Unterschiede v1 vs v2

| Feature | v1 | v2 |
|---------|----|----|
| **Entity Name** | `items` | `listings` |
| **Contract Field** | `nftAddress` | `tokenAddress` |
| **Status** | `isListed` (boolean) | `status` (enum) + `active` |
| **Token Standard** | ❌ | ✅ ERC721/ERC1155 |
| **Listing Type** | ❌ | ✅ PURE_ETH/SWAP/HYBRID |
| **Partial Fills** | ❌ | ✅ remainingQuantity |
| **Fee Rate** | ❌ | ✅ feeRate |
| **Buyer Whitelist** | ❌ | ✅ Separate entity |
| **MongoDB Collection** | `marketplace_items` | `marketplace_items_v2` |

---

## 🛠 Nächste Schritte

### 1. API Routes für v2 erstellen

```typescript
// src/app/api/marketplace/v2/listings/route.ts
import { GET_ACTIVE_LISTINGS } from '@/constants/subgraph.queries.v2';

export async function GET(request: Request) {
    // Fetch from v2 subgraph or MongoDB
    const db = await getDatabase();
    const listings = await db.collection('marketplace_items_v2')
        .find({ active: true })
        .toArray();
    
    return Response.json(listings);
}
```

### 2. Frontend Context für v2

```typescript
// src/contexts/marketplace/MarketplaceCacheContextV2.tsx
// Similar to v1 but uses v2 schema
```

### 3. UI Components anpassen

```typescript
// Conditional rendering basierend auf NEXT_PUBLIC_SUBGRAPH_VERSION
const version = process.env.NEXT_PUBLIC_SUBGRAPH_VERSION || 'v1';

if (version === 'v2') {
    // Use v2 types and queries
} else {
    // Use v1 (legacy)
}
```

---

## 📞 Support & Debugging

### Console Logs

**v2 Sync erfolgreich:**
```
✅ v2: Synced 61 listings at 2025-12-17T10:30:00.000Z
📝 v2: Upserted 61, Modified 0
```

**v2 Sync Fehler:**
```
❌ v2: Polling error: [Error details]
❌ v2: MongoDB sync error: [Error details]
```

### MongoDB Queries für Debugging

```javascript
// Alle v2 Listings
db.marketplace_items_v2.find({}).pretty()

// Nur aktive Listings
db.marketplace_items_v2.find({ active: true }).pretty()

// Nach Seller
db.marketplace_items_v2.find({ seller: '0x...' }).pretty()

// Nach Status
db.marketplace_items_v2.find({ status: 'LISTED' }).pretty()
```

### GraphQL Playground Queries

```graphql
# Alle aktiven Listings
query {
  listings(first: 10, where: { active: true }) {
    id listingId tokenAddress tokenId priceTotal seller
  }
}

# Specific NFT
query {
  listings(where: { 
    tokenAddress: "0x...", 
    tokenId: "1", 
    active: true 
  }) {
    listingId priceTotal seller
  }
}

# By Seller
query {
  listings(where: { seller: "0x..." }) {
    listingId tokenAddress tokenId status active
  }
}
```

---

## ✅ Done!

Das war's! Du kannst jetzt:
- ✅ v1 und v2 parallel laufen lassen
- ✅ Zwischen v1 und v2 wechseln via `.env.local`
- ✅ v2 Daten in `marketplace_items_v2` abrufen
- ✅ Stufenweise auf v2 migrieren

**Next Steps:**
1. Server starten: `npm run dev`
2. Console Logs checken (beide Syncs sollten laufen)
3. MongoDB `marketplace_items_v2` checken
4. GraphQL Playground testen
5. Später: API Routes + Frontend für v2 erstellen

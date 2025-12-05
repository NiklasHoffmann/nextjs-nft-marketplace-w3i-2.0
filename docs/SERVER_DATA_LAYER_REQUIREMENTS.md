# Server-Side Data Layer Requirements

## Übersicht
Implementierung eines Server-Side Data Layers für optimale NFT-Datenverarbeitung, Suche und Collection-Management.

## Ziele
1. **Zentrale Datenhaltung** - Server hält alle NFT-Daten im Memory (The Graph + Metadata + Stats)
2. **Real-Time Updates** - GraphQL Subscription lauscht auf Blockchain-Events
3. **Server-seitige Filterung** - Client erhält nur benötigte Daten
4. **Volltext-Suche** - Suche über alle Felder (Name, Description, Attributes, etc.)
5. **Collection-Management** - Automatisches Grouping und Aggregation

---

## Datenfelder pro NFT

### The Graph (Blockchain/Marketplace Data)
```typescript
{
  listingId: string;
  nftAddress: string;
  tokenId: string;
  isListed: boolean;
  price: string;
  seller: string;
  buyer?: string | null;
  desiredNftAddress?: string;
  desiredTokenId?: string;
}
```

### NFT Metadata (IPFS/tokenURI)
```typescript
{
  name?: string;
  description?: string;
  image?: string; // IPFS hash
  attributes?: Array<{
    trait_type?: string;
    value?: any;
  }>;
  animationUrl?: string;
  externalUrl?: string;
}
```

### Contract Data (ERC721/ERC721Enumerable)
```typescript
{
  owner: string; // aktueller Besitzer
  tokenURI: string;
  contractName?: string;
  contractSymbol?: string;
  totalSupply?: number; // wenn Enumerable
}
```

### Social Stats (eigene API)
```typescript
{
  likeCount?: number;
  watchlistCount?: number;
  viewCount?: number;
  shareCount?: number;
  commentCount?: number;
  averageRating?: number;
  ratingCount?: number;
}
```

### Insights (eigene API)
```typescript
{
  customTitle?: string;
  category?: string;
  tags?: string[];
  cardDescription?: string[];
  rarity?: string;
  projectDescriptions?: object;
  functionalitiesDescriptions?: object;
  projectWebsite?: string;
  projectTwitter?: string;
  projectDiscord?: string;
}
```

---

## Collection-Aggregation

### Collection-Daten (aus gelisteten Items)
```typescript
interface CollectionData {
  // Identifikation
  contractAddress: string;
  symbol: string;
  name: string;
  
  // Statistiken
  totalSupply: number; // Gesamt-NFTs in Collection (aus Contract)
  totalListedNFTs: number; // Aktuell gelistet auf Marketplace
  
  // Finanz-Daten (nur von gelisteten Items)
  totalValue: string; // Gesamt-Wert gelisteter Items in ETH
  floorPrice: string | null; // Niedrigster Preis
  averagePrice: string | null; // Durchschnittspreis
  
  // Visual
  imageUrl: string | null; // Haupt-Collection-Image
  previewImages: string[]; // Preview-Bilder (max 4)
  
  // Social
  totalLikes: number;
  totalWatchlist: number;
  
  // Items
  listedItems: NFTItem[]; // Alle gelisteten NFTs dieser Collection
}
```

### MUSS-Features für Collections
✅ **Collections aus gelisteten Items bilden**
   - Grouping nach `nftAddress`
   - Aggregation von Stats (Floor Price, Total Listed, etc.)
   - Visual Previews (erste 4 NFT-Images)

### OPTIONAL-Features für Collections  
⚪ **Nicht-gelistete Items nachladen**
   - Via ERC721Enumerable `tokenByIndex()`
   - Zeige "X von Y NFTs gelistet"
   - Ermöglicht vollständige Collection-Ansicht

---

## Such- und Filter-Anforderungen

### Server-seitige Filterung (GraphQL-Felder)
Schnelle Filterung direkt auf The Graph:
- `nftAddress` (Bytes)
- `tokenId` (BigInt)
- `price` (BigInt) - Range-Filter
- `seller` (Bytes)
- `isListed` (Boolean)
- `desiredNftAddress` (Bytes)

### Client-seitige Suche (Metadata-Felder)
Volltext-Suche mit Auto-Load aller Items:
- `name` (NFT Name)
- `description` (NFT Description)
- `attributes[].value` (Traits/Properties)
- `category` (aus Insights)
- `tags` (aus Insights)
- `customTitle` (aus Insights)

### Hybrid-Ansatz
```typescript
// Beispiel: Suche nach "Laser Eyes" UND Preis < 1 ETH
{
  // Server-Filter (GraphQL)
  graphqlFilter: {
    price_lt: "1000000000000000000", // 1 ETH in Wei
    isListed: true
  },
  
  // Client-Filter (nach vollständigem Load)
  metadataSearch: {
    searchTerm: "Laser Eyes",
    searchFields: ["name", "description", "attributes"]
  }
}
```

---

## Real-Time Update-Strategie

### GraphQL Subscription (The Graph)
```typescript
subscription ItemsUpdated {
  items(
    first: 1000,
    where: { isListed: true },
    orderBy: listingId,
    orderDirection: desc
  ) {
    listingId
    nftAddress
    tokenId
    isListed
    price
    seller
    buyer
    desiredNftAddress
    desiredTokenId
  }
}
```

**Server-Verhalten:**
1. Subscription läuft permanent auf Server
2. Bei Event → Update im Memory-Cache
3. WebSocket/SSE benachrichtigt alle Clients
4. Clients fetchen nur geänderte Items (über IDs)

### WebSocket Events
```typescript
// Server → Client
{
  type: "ITEM_LISTED" | "ITEM_SOLD" | "ITEM_UNLISTED" | "PRICE_CHANGED",
  nftAddress: string,
  tokenId: string,
  data: Partial<NFTItem>
}

// Client → Server (optional)
{
  type: "SUBSCRIBE_COLLECTION",
  nftAddress: string // Benachrichtigungen nur für diese Collection
}
```

---

## API Endpoints

### GET /api/marketplace/items
Haupt-Endpoint für NFT-Suche und -Filterung

**Query Parameters:**
```typescript
{
  // Pagination
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  
  // GraphQL-Filter (server-side)
  nftAddress?: string;
  minPrice?: string; // in Wei
  maxPrice?: string;
  seller?: string;
  isListed?: boolean;
  
  // Metadata-Suche (server-side, aber langsamer)
  search?: string; // Volltext-Suche über Name, Description, Attributes
  category?: string;
  rarity?: string;
  tags?: string[]; // Comma-separated
  
  // Sortierung
  sortBy?: "price" | "listingId" | "name" | "rarity" | "likes";
  sortOrder?: "asc" | "desc";
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    items: EnrichedNFTItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
    filters: {
      appliedFilters: object;
      availableCategories: string[];
      availableRarities: string[];
      priceRange: { min: string; max: string };
    };
  };
  timestamp: number;
  cached: boolean;
}
```

### GET /api/marketplace/collections
Collection-Übersicht und -Statistiken

**Query Parameters:**
```typescript
{
  // Pagination
  page?: number;
  limit?: number;
  
  // Filter
  minFloorPrice?: string;
  maxFloorPrice?: string;
  minListedCount?: number;
  
  // Sortierung
  sortBy?: "floorPrice" | "totalListed" | "totalValue" | "name";
  sortOrder?: "asc" | "desc";
  
  // Optionen
  includeUnlisted?: boolean; // Nicht-gelistete Items nachladen
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    collections: CollectionData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalCollections: number;
      totalListedNFTs: number;
      totalValue: string; // in ETH
    };
  };
}
```

### GET /api/marketplace/collections/:address
Detaillierte Collection-Ansicht

**Query Parameters:**
```typescript
{
  includeUnlisted?: boolean; // Nicht-gelistete Items via Contract laden
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    collection: CollectionData;
    items: {
      listed: EnrichedNFTItem[];
      unlisted?: EnrichedNFTItem[]; // Falls includeUnlisted=true
    };
    stats: {
      totalSupply: number;
      listedCount: number;
      unlistedCount?: number;
      ownerCount: number;
      floorPrice: string;
      averagePrice: string;
    };
  };
}
```

### WebSocket: /api/marketplace/ws
Real-Time Updates via WebSocket

**Client → Server Messages:**
```typescript
// Subscribe to updates
{ type: "subscribe", filter: { nftAddress?: string } }

// Unsubscribe
{ type: "unsubscribe" }

// Ping
{ type: "ping" }
```

**Server → Client Messages:**
```typescript
// Item update
{
  type: "item_update",
  action: "listed" | "sold" | "unlisted" | "price_changed",
  data: EnrichedNFTItem
}

// Collection update
{
  type: "collection_update",
  nftAddress: string,
  stats: Partial<CollectionData>
}

// Pong
{ type: "pong", timestamp: number }
```

---

## Server-Side Caching-Strategie

### Memory Cache (In-Memory auf Server)
```typescript
interface ServerCache {
  // NFT-Daten (Key: `${nftAddress}-${tokenId}`)
  nfts: Map<string, {
    data: EnrichedNFTItem;
    lastUpdated: number;
    sources: DataSource[]; // welche Daten verfügbar sind
  }>;
  
  // Collection-Daten (Key: nftAddress)
  collections: Map<string, {
    data: CollectionData;
    lastUpdated: number;
  }>;
  
  // Index für schnelle Suche
  searchIndex: {
    byName: Map<string, string[]>; // Lowercase name → [keys]
    byCategory: Map<string, string[]>;
    byRarity: Map<string, string[]>;
    byTags: Map<string, string[]>;
  };
}
```

### Cache-Invalidierung
- **The Graph Updates**: Subscription → sofortiges Update
- **Metadata**: Lazy Refresh (wenn > 12h alt)
- **Stats**: Refresh bei User-Interaktion (Like, View, etc.)
- **Insights**: Refresh bei Admin-Edit

### Background Tasks
```typescript
// Alle 5 Minuten: Metadata für neue Items laden
setInterval(async () => {
  const newItems = cache.nfts.filter(item => !item.sources.includes('metadata'));
  await loadMetadataForItems(newItems);
}, 5 * 60 * 1000);

// Alle 30 Minuten: Stats refresh für aktive Items
setInterval(async () => {
  const activeItems = cache.nfts.filter(item => item.data.viewCount > 10);
  await refreshStatsForItems(activeItems);
}, 30 * 60 * 1000);
```

---

## Performance-Ziele

### Initiale Ladezeit
- **Ziel**: < 500ms für erste 20 Items
- **Aktuell**: ~3-5s (1000 Items + Metadata)
- **Verbesserung**: ~85-90% schneller

### Such-Performance
- **Volltext-Suche**: < 100ms (über alle ~1000 Items)
- **GraphQL-Filter**: < 50ms
- **Collection-Aggregation**: < 200ms

### Real-Time Updates
- **Event → Client**: < 2s Latenz
- **WebSocket Overhead**: < 10KB/min bei normaler Aktivität

### Memory-Verbrauch
- **Ziel**: < 500MB für ~1000 NFTs mit Metadata
- **Cache-Size**: Auto-Cleanup bei > 2000 Items (FIFO)

---

## Implementierungs-Phasen

### Phase 1: Server Cache & API
- [ ] In-Memory Cache-Struktur
- [ ] GET /api/marketplace/items Endpoint
- [ ] GraphQL Subscription Integration
- [ ] Metadata Loading Background Task

### Phase 2: Collection Management
- [ ] Collection-Aggregation Logik
- [ ] GET /api/marketplace/collections Endpoint
- [ ] GET /api/marketplace/collections/:address Endpoint
- [ ] Optional: ERC721Enumerable Integration für unlisted Items

### Phase 3: Real-Time Updates
- [ ] WebSocket Server Setup
- [ ] Event Broadcasting
- [ ] Client-Side WebSocket Integration
- [ ] Optimistic Updates

### Phase 4: Search & Indexing
- [ ] Full-Text Search Index
- [ ] Advanced Filter Logic
- [ ] Search Performance Optimization

### Phase 5: Client Migration
- [ ] useActiveItems Hook auf fetch umbauen
- [ ] useAllCollections Hook auf fetch umbauen
- [ ] ActiveItemsList Integration
- [ ] Backwards Compatibility sicherstellen

### Phase 6: Testing & Optimization
- [ ] Load Testing (1000+ NFTs)
- [ ] WebSocket Stress Testing
- [ ] Memory Profiling
- [ ] Lighthouse Performance Tests

---

## Offene Fragen

1. **Nicht-gelistete Items nachladen:**
   - Wann triggern? (User-Aktion, automatisch beim Collection-View?)
   - Performance-Impact bei großen Collections (10k+ Items)?
   - Caching-Strategie für unlisted Items?

2. **Search Index:**
   - Vollständiger In-Memory Index oder Elasticsearch/Algolia?
   - Fuzzy-Search gewünscht?
   - Multi-Language Support?

3. **WebSocket Alternativen:**
   - Server-Sent Events (SSE) statt WebSocket?
   - Polling-Fallback für alte Browser?

4. **Deployment:**
   - Vercel Edge Functions möglich für Cache?
   - Oder dedizierter Node.js Server nötig?
   - Redis für Shared Cache in Multi-Instance Setup?

---

## Nächste Schritte

1. **Feedback zu Requirements einholen**
2. **Entscheidung: WebSocket vs SSE**
3. **Entscheidung: Unlisted Items Feature Scope**
4. **Phase 1 starten: Server Cache implementieren**

# NFT Detail API Migration

## Problem
Aktuell bezieht die NFT-Detail-Seite Daten aus verschiedenen Quellen:
- `fetch NFTMetadata` → `/api/nft/metadata` → Blockchain
- `fetchNFTInsights` → `/api/nft/insights` → MongoDB
- `fetchNFTStats` → `/api/nft/stats` → MongoDB  
- Marketplace-Daten → TheGraph (via `useActiveItems`)

**Fehlende Daten:**
- `contract.owner` - Aktueller NFT-Besitzer
- `contract.approved` - Welche Adresse ist approved
- `contract.ownerBalance` - Wie viele NFTs der Owner besitzt
- `marketplace.isValid` - Ist das Listing noch gültig?
- `marketplace.invalidReasons` - Warum ist es invalid?

## Lösung
Neuer zentraler Endpunkt mit **allen** Daten aus MongoDB:

### Endpoint
```
GET /api/marketplace/nft/[nftAddress]/[tokenId]
```

### Response
```json
{
  "success": true,
  "data": {
    "nftAddress": "0x...",
    "tokenId": "359",
    "metadata": { ... },
    "contract": {
      "contractName": "People of History - Bolivar",
      "contractSymbol": "PoHB",
      "totalSupply": 36,
      "tokenURI": "ipfs://...",
      "owner": "0xf034e8ad...",
      "ownerBalance": 28,
      "approved": "0x6B6825Fb..."
    },
    "marketplace": {
      "isListed": true,
      "isValid": false,                    // ⚠️ NEU!
      "invalidReasons": ["owner_mismatch", "no_approval"],  // ⚠️ NEU!
      "invalidatedAt": "2025-11-14T...",  // ⚠️ NEU!
      "price": "6000000000000000",
      "seller": "0x...",
      ...
    },
    "stats": { ... },
    "insights": { ... }
  }
}
```

## Nächste Schritte

### 1. UI-Komponenten updaten
**Overview Tab** - Warning anzeigen wenn invalid:
```tsx
{nft.marketplace.isValid === false && (
  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
    <h3>⚠️ Listing not tradeable</h3>
    <ul>
      {nft.marketplace.invalidReasons.includes('owner_mismatch') && (
        <li>NFT was transferred to a new owner</li>
      )}
      {nft.marketplace.invalidReasons.includes('no_approval') && (
        <li>No marketplace approval - cannot be sold</li>
      )}
    </ul>
  </div>
)}
```

**Technical Tab** - Contract-Daten anzeigen:
```tsx
<div className="space-y-4">
  <InfoRow label="Owner" value={nft.contract.owner} />
  <InfoRow label="Owner Balance" value={`${nft.contract.ownerBalance} NFTs`} />
  <InfoRow label="Approved Address" value={nft.contract.approved} />
  <InfoRow label="Token URI" value={nft.contract.tokenURI} />
  <InfoRow label="Total Supply" value={nft.contract.totalSupply} />
</div>
```

### 2. Hook erstellen
```typescript
// src/hooks/marketplace/useNFTDetail.ts
export function useNFTDetail(nftAddress: string, tokenId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketplace/nft/${nftAddress}/${tokenId}`)
      .then(res => res.json())
      .then(data => setData(data.data));
  }, [nftAddress, tokenId]);

  return { data, loading };
}
```

### 3. Liste filtern
Im API-Endpoint `/api/marketplace/items` standardmäßig invalide ausblenden:
```typescript
const query = {
  'marketplace.isListed': true,
  'marketplace.isValid': { $ne: false }  // Exclude invalid listings
};
```

Optional per Query-Parameter einblenden:
```
/api/marketplace/items?includeInvalid=true
```

## Files geändert
- ✅ `src/app/api/marketplace/nft/[nftAddress]/[tokenId]/route.ts` (NEU)
- ⏳ `src/components/nft/detail/overview/NFTOverview.tsx` (TODO)
- ⏳ `src/components/nft/detail/technical/TechnicalTab.tsx` (TODO)
- ⏳ `src/hooks/marketplace/useNFTDetail.ts` (TODO - NEU)
- ⏳ `src/app/api/marketplace/items/route.ts` (TODO - Filter hinzufügen)

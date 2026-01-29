# 👛 /wallet - Wallet Dashboard Route

View and manage your NFT collection.

## 🎯 Purpose

User wallet dashboard displaying owned NFTs with management capabilities.

## 🗂️ Structure

```
wallet/
├── README.md           # This file
├── page.tsx            # Main wallet page
├── layout.tsx          # Wallet layout
└── components/         # Route-specific components
```

## 🚀 Features

- **NFT Collection**: Display all NFTs owned by connected wallet
- **Listing Status**: Show which NFTs are listed on marketplace
- **Quick Actions**: List, delist, transfer NFTs
- **Stats**: Total value, floor price, collection insights
- **Filtering**: Filter by listed/unlisted, collection
- **Search**: Search by name, token ID

## 🔗 Data Source

### WalletNFTsContext (Hybrid Approach)
```typescript
import { useWalletNFTs } from '@/contexts/wallet-nfts/WalletNFTsContext';

const { nfts, loading, error, refresh } = useWalletNFTs(address);
```

### Data Flow
1. **DB-first**: Load from nft_metadata collection (~50ms)
2. **Background sync**: Discover new NFTs from Alchemy
3. **Enrichment**: Add insights, stats, marketplace data
4. **Ownership tracking**: Update transfer history

### Performance
- ✅ **Instant load**: ~50ms from MongoDB
- ✅ **Background discovery**: Alchemy discovery-only API
- ✅ **Smart caching**: 5-minute cache, stale-while-revalidate
- ✅ **Ownership history**: Full transfer tracking

## 📊 Available Data

### NFT Object Structure
```typescript
interface WalletNFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  
  // Listing data
  isListed: boolean;
  listingId?: string;
  listingPrice?: string;
  seller?: string;
  
  // Metadata
  contractName?: string;
  contractSymbol?: string;
  hasMarketplaceData: boolean;
  hasInsightsData: boolean;
  
  // Ownership
  currentOwner: string;
  ownedSince?: Date;
  previousOwners?: string[];
}
```

## 🎨 Component Usage

### NFT Grid
```typescript
import { NFTGrid } from '@/components/nft/NFTGrid';

<NFTGrid
  nfts={nfts}
  showListingStatus
  onNFTClick={handleNFTClick}
/>
```

### Quick Actions
```typescript
import { NFTActions } from '@/components/nft/NFTActions';

<NFTActions
  nft={nft}
  onList={() => router.push('/sell')}
  onTransfer={handleTransfer}
/>
```

## 📝 Common Use Cases

### Check Ownership
```typescript
const { nfts } = useWalletNFTs(address);
const ownsNFT = nfts.some(nft => 
  nft.contractAddress === contractAddress &&
  nft.tokenId === tokenId
);
```

### List NFT for Sale
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push(`/sell?nft=${contractAddress}-${tokenId}`);
```

### Filter Listed NFTs
```typescript
const listedNFTs = nfts.filter(nft => nft.isListed);
const unlistedNFTs = nfts.filter(nft => !nft.isListed);
```

### Refresh Wallet
```typescript
const { refresh } = useWalletNFTs(address);
await refresh(); // Force re-sync from blockchain
```

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
MONGODB_URI=mongodb://...
```

### Cache Settings
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_WHILE_REVALIDATE = true;
```

## 🐛 Troubleshooting

### "No NFTs found"
→ Check wallet connection
→ Verify wallet has NFTs on Alchemy dashboard
→ Try manual refresh

### Missing metadata
→ NFT may not have tokenURI set
→ Check IPFS gateway availability
→ Verify contract implements ERC721Metadata

### Stale listing status
→ Run marketplace sync: `POST /api/marketplace/sync`
→ Clear cache and refresh

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-20

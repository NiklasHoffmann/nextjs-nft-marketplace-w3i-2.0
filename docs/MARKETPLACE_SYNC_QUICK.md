# Marketplace Data Sync - Quick Reference

Quick guide for understanding how the marketplace gets populated with NFT data.

## 🎯 What Does It Do?

Fetches NFT marketplace data from multiple sources and stores it in MongoDB as complete, enriched documents ready for display.

## 📊 Data Sources (4 Sources)

```
1. TheGraph      → Marketplace events (listings, sales, cancellations)
2. Blockchain    → Contract data (owner, approval, tokenURI)
3. IPFS          → Metadata (name, image, description, attributes)
4. MongoDB       → Insights (curated info, categories, project details)
```

## 🔄 Sync Flow (30 seconds interval)

```
TheGraph         Blockchain        IPFS            MongoDB
   ↓                ↓                ↓                ↓
Listings      → Contract Data → Metadata    → Insights
   ↓                ↓                ↓                ↓
   └────────────────┴────────────────┴────────────────┘
                         ↓
              Complete NFT Document
                         ↓
           marketplace_items collection
```

## 📦 What Gets Stored?

### For Each NFT:
```javascript
{
  // Who & What
  nftAddress: "0x123...",
  tokenId: "42",
  
  // Marketplace (TheGraph)
  marketplace: {
    price: 1000000000000000,    // Number in Wei
    seller: "0xabc...",
    isListed: true,
    listingId: "1"
  },
  
  // Metadata (IPFS)
  metadata: {
    name: "Cool NFT #42",
    image: "ipfs://Qm.../image.png",
    description: "...",
    attributes: [...]
  },
  
  // Contract (Blockchain)
  contract: {
    owner: "0xdef...",
    contractName: "CoolNFTs",
    approvedAddress: "0xMarketplace..."
  },
  
  // Insights (MongoDB admin_nft_insights)
  insights: {
    category: "Art",
    rarity: "Rare",
    customTitle: "Featured Art Piece",
    cardDescriptions: ["..."]
  }
}
```

## 🚀 How to Run

### Automatic (Production)
```bash
# Runs automatically on server boot
# Updates every 30 seconds
# No action needed! ✅
```

### Manual (Development)
```bash
# One-time sync
node scripts/sync-marketplace-data.js

# Check results
node scripts/dev/check-data-structure.js
```

## 📈 Current Status

```
✅ Active: Syncing 61 NFTs
✅ Network: Ethereum Sepolia
✅ Update Frequency: 30 seconds
✅ Auto-start: Enabled
```

## 🔍 Verification Commands

```bash
# Check marketplace data
node scripts/dev/check-data-structure.js

# Verify price sorting
node scripts/dev/test-sort.js

# Check NFT stats
node scripts/dev/check-nft-stats.js
```

## ⚙️ Configuration

### Required in `.env.local`:
```bash
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../marketplace-subgraph/...
MONGODB_URI=mongodb+srv://...
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## 🎨 Key Features

### Smart Updates
```
New NFT     → Full fetch (all 4 sources)
Existing    → Only update marketplace + contract data
             → Preserve metadata + insights (faster!)
```

### Insights Hierarchy
```
1. NFT-specific     (nftAddress + tokenId)
2. Collection-level (nftAddress + tokenId="")
3. Default empty    (if nothing found)
```

### Price Format
```
✅ CORRECT: marketplace.price: 1000000000000000  (number)
❌ WRONG:   marketplace.price: "1000000000000000" (string)

Why? Numbers sort correctly: 1T < 2T < 10T
     Strings sort wrong:     "10T" < "1T" < "2T"
```

## 🐛 Common Issues

### IPFS Slow?
- Normal! Gateways can be slow (5-10s)
- Script continues, will retry next sync
- Existing metadata is preserved

### RPC Rate Limit?
- Check Alchemy dashboard
- Free tier: 300 req/sec (enough!)
- Consider upgrading if needed

### MongoDB Connection Error?
- Check MONGODB_URI
- Verify IP whitelist in MongoDB Atlas
- Test: `mongosh "mongodb+srv://..."`

## 📚 Full Documentation

See **[MARKETPLACE_SYNC.md](./MARKETPLACE_SYNC.md)** for complete details.

## 💡 Quick Tips

1. **Prices are numbers** - Enables correct sorting
2. **Smart updates** - Preserves expensive IPFS fetches
3. **Insights hierarchy** - NFT-specific > Collection > Default
4. **Auto-sync** - No manual intervention needed
5. **Logs everything** - Check console for issues

## 🎯 Result

Complete NFT marketplace database with:
- ✅ Accurate marketplace data (prices, listings)
- ✅ Rich metadata (names, images, attributes)
- ✅ Contract information (owner, approval)
- ✅ Curated insights (categories, descriptions)
- ✅ Ready for display in UI

**Status**: 🟢 Production Ready - 61 NFTs synchronized

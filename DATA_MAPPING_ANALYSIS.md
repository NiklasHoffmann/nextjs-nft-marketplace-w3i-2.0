# NFT Detail Page - Data Mapping Analysis

## API Response Structure (`/api/marketplace/nft/[contractAddress]/[tokenId]`)

### ✅ Returned by API
```typescript
{
  success: true,
  data: {
    contractAddress: string,
    tokenId: string,
    listingId: string,
    price: string,
    seller: string,
    isListed: boolean,

    metadata: {
      name: string,
      description: string | null,
      image: string | null,
      animationUrl: string | null,
      externalUrl: string | null,
      attributes: Array<{trait_type: string, value: any}>
    },

    contract: {
      contractName: string | null,      // ✅ Mapped from nft_metadata.contract.name
      contractSymbol: string | null,    // ✅ Mapped from nft_metadata.contract.symbol
      totalSupply: number | null,       // ✅ Mapped from nft_metadata.contract.totalSupply
      tokenURI: string | null,          // ✅ Mapped from nft_metadata.contract.tokenURI
      contractType: string,             // ✅ Mapped from nft_metadata.contract.contractType
      owner: string | null,             // ✅ Mapped from nft_metadata.contract.owner
      ownerBalance: number | null,      // ✅ Mapped from nft_metadata.contract.ownerBalance
      approved: string | null,          // ✅ Mapped from nft_metadata.contract.approved
      approvedAddress: string | null    // ✅ Backward compatibility
    },

    marketplace: {
      isListed: boolean,
      price: string,
      seller: string,
      listingId: string,
      listedAt: Date
    },

    insights: {
      customTitle: string | null,
      category: string | null,
      tags: string[],
      rarity: string | null,
      cardDescriptions: string[],
      projectDescriptions: {
        titleDescriptionPairs: Array<{
          id: string,
          title: string,
          descriptions: string[]
        }>
      } | null,
      functionalitiesDescriptions: {
        titleDescriptionPairs: Array<{
          id: string,
          title: string,
          descriptions: string[]
        }>
      } | null,
      projectWebsite: string | null,
      projectTwitter: string | null,
      projectDiscord: string | null,
      partnerships: string[]
    } | null,

    dataQuality: {
      hasMetadata: boolean,
      hasInsights: boolean,
      metadataSource: string
    }
  }
}
```

---

## Component Data Usage

### 1. **NFTDetailHeader**
**Data Used:**
- `metadata.name` → name
- `contract.contractName` → collection
- `contract.contractSymbol` → contractSymbol
- `contractAddress` → contractAddress
- `tokenId` → tokenId

**From NFTStatsContext:**
- `isFavorited` → favorite button state

---

### 2. **CategoryPills**
**Data Used:**
- `insights.category` → category pills
- `insights.tags` → tag pills
- `metadata.externalUrl` → external link
- `insights.projectWebsite` → website link
- `insights.projectTwitter` → twitter link
- `insights.projectDiscord` → discord link

---

### 3. **NFTMediaSection**
**Data Used:**
- `metadata.image` → main image
- `metadata.animationUrl` → animation/video
- `metadata.name` → alt text

---

### 4. **NFTPriceCard**
**Data Used:**
- `marketplace.price` → price display
- `marketplace.isListed` → listing status
- `marketplace.seller` → seller address
- `marketplace.listingId` → for buy/cancel actions
- `contract.owner` → current owner
- `marketplace.desiredContractAddress` → swap target (⚠️ **NOT IN API**)
- `marketplace.desiredTokenId` → swap target (⚠️ **NOT IN API**)

---

### 5. **OverviewTab**
**Data Used:**
- `metadata.description` → description
- `contract.contractName` → collection name
- `contract.contractSymbol` → symbol
- `contract.totalSupply` → collection size
- `metadata.attributes` → properties
- `insights.rarity` → rarity display
- `insights.customTitle` → custom name override
- `marketplace.isValid` → validation warning (⚠️ **NOT IN API**)
- `marketplace.invalidReasons` → validation details (⚠️ **NOT IN API**)

---

### 6. **TechnicalTab**
**Data Used:**
- `contractAddress` → contract address
- `tokenId` → token ID
- `contract.contractName` → collection name
- `contract.contractSymbol` → symbol
- `contract.totalSupply` → total supply
- `contract.tokenURI` → token URI
- `contract.owner` → current owner
- `contract.ownerBalance` → owner balance
- `contract.approved` → approval status
- `metadata.attributes` → all attributes

---

### 7. **ProjektTab**
**Data Used:**
- `insights.projectDescriptions.titleDescriptionPairs` → project info sections
- `insights.projectWebsite` → website link
- `insights.projectTwitter` → twitter link
- `insights.projectDiscord` → discord link
- `insights.partnerships` → partnership info

**Fallback:**
- Uses `collectionInsights` if no NFT-specific insights available

---

### 8. **FunctionalitiesTab**
**Data Used:**
- `insights.functionalitiesDescriptions.titleDescriptionPairs` → functionality sections

**Fallback:**
- Uses `collectionInsights` if no NFT-specific insights available

---

### 9. **PersonalTab**
**Data Used from NFTStatsContext:**
- `userInteractions.personalNotes` → personal notes
- `userInteractions.userRating` → user rating
- `userInteractions.isWatchlisted` → watchlist status
- `userInteractions.isFavorited` → favorite status
- `stats.viewCount` → view count
- `stats.likeCount` → like count

---

## ⚠️ Missing Data in API Response

### Critical Missing Fields:
1. **Swap Target Info** (PriceCard needs this):
   - `marketplace.desiredContractAddress` ❌
   - `marketplace.desiredTokenId` ❌

2. **Validation Info** (OverviewTab needs this):
   - `marketplace.isValid` ❌
   - `marketplace.invalidReasons` ❌
   - `marketplace.invalidatedAt` ❌

### Why These Are Missing:
- API only does `$lookup` on `nft_metadata` and `admin_nft_insights`
- Validation fields exist in `marketplace_items` but are not projected in `$addFields`
- Swap target fields (`desiredContractAddress`, `desiredTokenId`) exist in `marketplace_items` but not projected

---

## 🔧 Required API Fixes

### Add to `$addFields` stage in `/api/marketplace/nft/[contractAddress]/[tokenId]/route.ts`:

```typescript
marketplace: {
  listingId: '$listingId',
  price: '$price',
  seller: '$seller',
  isListed: '$isListed',
  listedAt: '$listedAt',
  // ✅ Add these missing fields:
  desiredContractAddress: '$desiredContractAddress',
  desiredTokenId: '$desiredTokenId',
  isValid: '$isValid',
  invalidReasons: '$invalidReasons',
  invalidatedAt: '$invalidatedAt'
}
```

### Add to API response format (lines 161-168):

```typescript
marketplace: {
  isListed: nft.isListed,
  price: nft.price,
  seller: nft.seller,
  listingId: nft.listingId,
  listedAt: nft.listedAt,
  // ✅ Add these:
  desiredContractAddress: nft.desiredContractAddress || null,
  desiredTokenId: nft.desiredTokenId || null,
  isValid: nft.isValid ?? true,
  invalidReasons: nft.invalidReasons || null,
  invalidatedAt: nft.invalidatedAt || null
}
```

---

## ✅ Data Flow Summary

1. **MongoDB** → `marketplace_items` collection has all data
2. **API aggregation** → Joins `nft_metadata` + `admin_nft_insights`
3. **API response** → Transforms to clean structure
4. **useNFTDetail hook** → Fetches and caches data
5. **NFTDetailPage** → Extracts data from `nftData`
6. **Components** → Receive props with specific data slices

### Current Issues:
- ✅ Contract data works (after migration)
- ✅ Insights data works
- ❌ Swap target data missing
- ❌ Validation data missing

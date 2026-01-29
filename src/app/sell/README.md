# 📦 /sell - NFT Listing Route

List your NFTs for sale on the marketplace with support for single and batch listings.

## 🎯 Purpose

Complete NFT listing flow with:
- Single NFT listing
- Batch listing (multiple NFTs)
- Whitelist verification
- Automatic approval handling
- Transaction preview
- Progress tracking

## 🗂️ Structure

```
sell/
├── README.md                    # This file
├── ARCHITECTURE.md              # Detailed architecture docs
├── page.tsx                     # Route entry point
├── layout.tsx                   # Layout with ListingFlowContext
├── error.tsx                    # Error boundary
│
├── components/                  # 20 UI components
│   ├── SellPage.tsx             # Main page component
│   ├── common/                  # Shared components (EmptyState, SellHeader, FlowSidebar)
│   ├── forms/                   # Form components (UnifiedListingForm, BatchListingForm)
│   ├── listing/                 # Listing components (ApprovalDialog, WhitelistWarning)
│   ├── nft-selection/           # NFT selection (NFTUserSelector, BatchNFTSelector)
│   └── preview/                 # Transaction preview components
│
├── contexts/                    # State management
│   └── ListingFlowContext.tsx   # Global flow state (form data, progress)
│
├── lib/                         # Business logic
│   └── listing-service.ts       # Listing transaction orchestration
│
├── types/                       # TypeScript definitions
│   └── index.ts                 # 157 lines of types (ListingStep, ProgressStep, etc.)
│
├── utils/                       # Utilities
│   ├── nft-adapter.ts           # Type conversions (WalletNFT → AggregatedNFT)
│   ├── nft-filter.ts            # NFT filtering logic
│   └── nft-sorter.ts            # NFT sorting logic
│
└── [sub-routes]/
    ├── check-listing/           # Transaction preview page
    ├── listing/                 # Transaction execution page
    └── success/                 # Success confirmation page
```

## 🚀 Features

### Single Listing
- Select one NFT from your wallet
- Configure price (ETH/USDC)
- Add description and duration
- Automatic whitelist check
- One-click approval (if needed)
- Real-time transaction tracking

### Batch Listing
- Select multiple NFTs (grid view)
- Fixed or variable pricing
- Bulk whitelist verification
- Batch approval handling
- Progress overlay with status updates

### Smart Flow
- **Step 1**: NFT selection
- **Step 2**: Whitelist verification (automatic)
- **Step 3**: Approval check (automatic)
- **Step 4**: Price & details configuration
- **Step 5**: Transaction preview
- **Step 6**: Blockchain execution
- **Step 7**: Success confirmation

## 🔗 Integration Points

### Global Hooks (from @/hooks/marketplace)
```typescript
import { useMarketplaceData } from '@/hooks/marketplace';

const { useCollectionWhitelist } = useMarketplaceData();
const { isWhitelisted, loading } = useCollectionWhitelist(contractAddress);
```

### Contexts
```typescript
import { useListingFlow } from '../contexts/ListingFlowContext';

const { formData, setFormData, resetFlow } = useListingFlow();
```

### Services
```typescript
import { ListingService } from '../lib/listing-service';

const service = new ListingService(
  marketplaceAddress,
  createListing,
  ensureApproval,
  checkWhitelist,
  notifications
);
```

## 📊 State Management

### ListingFlowContext
- **Form Data**: Selected NFTs, price, currency, mode
- **Progress Data**: Current step, status, transaction hash
- **Session Persistence**: Auto-saves to SessionStorage
- **Actions**: setFormData, updateProgress, resetFlow

### Flow Steps
```typescript
type ListingStep = 
  | 'select'      // NFT selection
  | 'whitelist'   // Whitelist verification
  | 'approval'    // Approval check
  | 'form'        // Price & details
  | 'preview'     // Transaction preview
  | 'listing'     // Blockchain execution
  | 'success';    // Confirmation
```

## 🎨 Component Guidelines

### Barrel Exports
All components exported through [index.ts](components/index.ts):
```typescript
import { NFTUserSelector, UnifiedListingForm } from '../components';
```

### Styling
- Tailwind CSS utility classes
- Consistent spacing (space-y-6, gap-4)
- Rounded corners (rounded-xl)
- Subtle shadows (shadow-sm)

## 🧪 Testing

```bash
# Run component tests
npm test -- --testPathPattern=sell

# Type check
npm run type-check

# Lint
npm run lint
```

## 📝 Common Use Cases

### Check if NFT is Listed
```typescript
const nft = await fetchNFT(contractAddress, tokenId);
if (nft.listed) {
  console.log('Already listed with price:', nft.listing?.price);
}
```

### List Single NFT
```typescript
const service = new ListingService(...);
await service.listNFTForSale({
  nftAddress: '0x...',
  tokenId: '123',
  price: '0.1',
  currency: 'ETH'
});
```

### Batch Listing
```typescript
await service.listMultipleNFTs([
  { nftAddress: '0x...', tokenId: '1', price: '0.1' },
  { nftAddress: '0x...', tokenId: '2', price: '0.2' }
]);
```

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
```

### Contracts
- **MarketplaceFacet**: Listing creation/management
- **WhitelistFacet**: Collection verification
- **ERC721**: NFT ownership & approval

## 📚 Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture
- [/docs/architecture/features.md](../../../docs/architecture/features.md) - Feature overview
- [/docs/api/routes.md](../../../docs/api/routes.md) - API routes

## 🐛 Troubleshooting

### "Collection not whitelisted"
→ Collection must be approved by admin first

### "NFT approval required"
→ Click "Approve NFT" button in the flow

### "Transaction failed"
→ Check wallet balance (gas fees)
→ Verify NFT ownership
→ Check marketplace contract status

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-12-20

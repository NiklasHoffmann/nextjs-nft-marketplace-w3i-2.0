# Custom React Hooks

Centralized repository of reusable React hooks for the NFT Marketplace application.

## 📁 Structure

```
hooks/
├── marketplace/       # Marketplace smart contract operations
├── multisig/         # MultiSig wallet & governance
├── nfts/             # NFT data, insights, filters
├── wallet/           # User wallet NFTs
├── user/             # User interactions (likes, watchlist, ratings)
├── ui/               # Reusable UI patterns
├── admin/            # Admin-only functionality
├── index.ts          # Central barrel exports
└── README.md         # This file
```

## 🚀 Quick Start

All hooks can be imported from the central barrel export:

```typescript
import {
  useMarketplaceListing,
  useMultisigWallet,
  useNFTInsights,
  useWalletNFTsV2,
  useUserInteractions,
  useModal,
  useAdminStatus,
} from "@/hooks";
```

---

## 📦 Hook Categories

### 1. Marketplace Hooks (`marketplace/`)

Smart contract operations for the Ideation Market Diamond.

#### **Data Reading**

```typescript
import { useMarketplaceData } from "@/hooks";

const { useListingById, useListingsByNFT, useMarketplaceInfo } =
  useMarketplaceData(marketplaceAddress);

// Get single listing
const { data: listing } = useListingById("123");

// Get all listings for an NFT
const { data: listings } = useListingsByNFT(tokenAddress, tokenId);

// Get marketplace metadata
const { data: info } = useMarketplaceInfo();
// Returns: { innovationFee, nextListingId, owner, whitelistedCollections }
```

#### **Listing Management**

```typescript
import { useMarketplaceListing } from "@/hooks";

const {
  createListing,
  updateListing,
  cancelListing,
  isLoading,
  submittedHash,
} = useMarketplaceListing(marketplaceAddress);

// Create new listing
await createListing({
  tokenAddress: "0x...",
  tokenId: "1",
  price: "0.1", // in ETH
  buyerWhitelistEnabled: false,
});
```

#### **Purchase Operations**

```typescript
import { useMarketplacePurchase } from "@/hooks";

const { purchaseListing, isLoading, isConfirming } =
  useMarketplacePurchase(marketplaceAddress);

await purchaseListing({
  listingId: "123",
  expectedPrice: "0.1",
  onProgress: (step, txHash) => {
    console.log(`Step: ${step}, TX: ${txHash}`);
  },
});
```

#### **Admin Functions**

```typescript
import { useMarketplaceAdmin } from "@/hooks";

const { setInnovationFee, addWhitelistedCollection, cleanListing } =
  useMarketplaceAdmin(marketplaceAddress);

// Owner-only: Set marketplace fee
await setInnovationFee(2500); // 2.5% (per 100000)

// Owner-only: Whitelist collection
await addWhitelistedCollection("0x...");
```

#### **User Operations**

```typescript
import { useMarketplaceUser } from "@/hooks";

const { proceeds, withdrawProceeds, isLoading } =
  useMarketplaceUser(marketplaceAddress);

console.log("Available proceeds:", proceeds); // bigint

await withdrawProceeds();
```

---

### 2. MultiSig Hooks (`multisig/`)

MultiSig wallet governance and transaction management.

#### **Core Wallet Operations**

```typescript
import { useMultisigWallet } from "@/hooks";

const {
  owners,
  isOwner,
  ownerCount,
  requiredConfirmations,
  submitTransaction,
  confirmTransaction,
  executeTransaction,
} = useMultisigWallet();

// Submit proposal
await submitTransaction({
  targetContract: "0x...",
  functionName: "setInnovationFee",
  args: [250],
});
```

#### **Proposal Management**

```typescript
import { useMultisigProposals } from "@/hooks";

const { proposals, createProposal, confirmProposal, executeProposal, stats } =
  useMultisigProposals(marketplaceAddress);

// Create proposal
await createProposal({
  type: "SET_FEE",
  targetContract: marketplaceAddress,
  functionName: "setInnovationFee",
  functionArgs: [250],
  description: "Set fee to 2.5%",
});
```

#### **Transaction Monitoring**

```typescript
import { useMultisigPendingTransactions } from "@/hooks";

const { transactions, refetch } =
  useMultisigPendingTransactions(diamondAddress);

// Filter pending
const pending = transactions.filter((tx) => tx.status === "PENDING");
```

---

### 3. NFT Hooks (`nfts/`)

NFT data fetching, insights, and utilities (NOT marketplace contract).

#### **Admin Insights**

```typescript
import { useAdminNFTInsights, useAdminCollectionInsights } from "@/hooks";

// NFT insights management
const { createInsight, updateInsight, deleteInsight } = useAdminNFTInsights();

await createInsight({
  contractAddress: "0x...",
  tokenId: "1",
  significance: "HIGH",
  verificationStatus: "VERIFIED",
});

// Collection insights
const { createCollectionInsight, updateCollectionInsight } =
  useAdminCollectionInsights();
```

#### **NFT Approval**

```typescript
import { useNFTApproval } from "@/hooks";

const approval = useNFTApproval({
  nftContractAddress: "0x...",
  tokenId: "123",
  marketplaceAddress: "0x...",
  enabled: true,
});

// Check status
if (!approval.isFullyApproved) {
  // Approve all NFTs from collection (recommended)
  await approval.approveAll();

  // Or approve single NFT
  await approval.approveSingle();

  // Or smart approval (only if needed)
  const success = await approval.ensureApproval(true); // preferAll
}

// Status checks
console.log("Fully approved:", approval.isFullyApproved);
console.log("Single approved:", approval.isSingleApproved);
console.log("All approved:", approval.isApprovedForAll);
console.log("Loading:", approval.isLoading);
```

#### **NFT User Actions**

```typescript
import { useNFTUserActions } from "@/hooks";

const {
  like,
  unlike,
  addToWatchlist,
  removeFromWatchlist,
  submitRating,
  isLiked,
  isWatchlisted,
  userRating,
} = useNFTUserActions(contractAddress, tokenId);

// User interactions
await like();
await addToWatchlist();
await submitRating(5);

console.log("Liked:", isLiked);
console.log("Watchlisted:", isWatchlisted);
```

#### **Price Data**

```typescript
import { useNFTPriceData } from "@/hooks";

const { priceETH, priceUSD, isLoading } = useNFTPriceData(priceWei);

console.log(`${priceETH} ETH = $${priceUSD}`);
```

#### **Filtering**

```typescript
import { useNFTFilters } from "@/hooks";

const { filtered, filteredCount } = useNFTFilters(nfts, {
  search: "dragon",
  minPrice: "0.1",
  maxPrice: "10",
  collections: ["0x..."],
  listingStatus: "LISTED",
});
```

---

### 4. Wallet Hooks (`wallet/`)

User wallet NFT management with DB-first architecture.

```typescript
import { useWalletNFTsV2 } from "@/hooks";

const { nfts, isLoading, error, refetch, summary } = useWalletNFTsV2({
  walletAddress: "0x...",
  chainId: 11155111,
  enableAutoRefresh: true,
});

// Instant load from DB (~50ms)
console.log("NFTs:", nfts);
console.log("Total:", summary.total);
console.log("Listed:", summary.listedCount);
```

---

### 5. User Interaction Hooks (`user/`)

User-specific interactions and preferences.

```typescript
import { useUserInteractions } from "@/hooks";

const {
  recordView,
  recordLike,
  recordUnlike,
  recordWatchlist,
  getUserInteraction,
  isLoading,
} = useUserInteractions({ enableOptimisticUpdates: true });

// Track view
await recordView(contractAddress, tokenId);

// Check if user liked
const interaction = await getUserInteraction(contractAddress, tokenId);
console.log("User liked:", interaction?.liked);
```

---

### 6. UI Utility Hooks (`ui/`)

Reusable UI patterns and utilities.

#### **Modal Management**

```typescript
import { useModal } from '@/hooks';

const { isOpen, open, close, toggle } = useModal(false);

<button onClick={open}>Open Modal</button>
<Modal isOpen={isOpen} onClose={close}>
  <h2>Modal Content</h2>
</Modal>
```

#### **Form Validation**

```typescript
import { useForm } from '@/hooks';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  price: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid price')
});

const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit
} = useForm({
  initialValues: { name: '', price: '' },
  validationSchema: schema,
  onSubmit: async (values) => {
    await api.submit(values);
  }
});

<input
  name="name"
  value={values.name}
  onChange={handleChange}
  onBlur={handleBlur}
/>
{touched.name && errors.name && <span>{errors.name}</span>}
```

#### **Card Tilt Effect**

```typescript
import { useCardTilt } from '@/hooks';

const { ref, style } = useCardTilt({
  maxTilt: 15,
  perspective: 1000,
  scale: 1.05
});

<div ref={ref} style={style}>
  Hover me for 3D effect
</div>
```

#### **Horizontal Scroll**

```typescript
import { useHorizontalScroll } from '@/hooks';

const scrollRef = useHorizontalScroll();

<div ref={scrollRef} className="overflow-x-auto">
  {/* Mouse wheel scrolls horizontally */}
</div>
```

---

### 7. Admin Hooks (`admin/`)

Admin-only functionality.

#### **Admin Status Check**

```typescript
import { useAdminStatus } from "@/hooks";

const { isAdmin, adminAddress, isLoading } = useAdminStatus();

if (isAdmin) {
  // Show admin UI
}
```

#### **Admin Mode Detection**

```typescript
import { useAdminMode } from "@/hooks";

const { isOwner, isMultisigOwner, requiresMultisig } =
  useAdminMode(diamondAddress);

if (isOwner) {
  console.log("Direct owner");
} else if (isMultisigOwner) {
  console.log("MultiSig owner - requires confirmations");
}
```

---

## 🎯 Best Practices

### 1. **Import from Barrel**

```typescript
// ✅ Good - Central import
import { useMarketplaceListing, useModal } from "@/hooks";

// ❌ Bad - Direct path
import { useMarketplaceListing } from "@/hooks/marketplace/useMarketplaceListing";
```

### 2. **Error Handling**

```typescript
const { createListing, error } = useMarketplaceListing(address);

try {
  await createListing(params);
} catch (err) {
  console.error('Transaction failed:', err);
}

// Hook provides error state
if (error) {
  return <ErrorMessage>{error}</ErrorMessage>;
}
```

### 3. **Loading States**

```typescript
const { nfts, isLoading, isConfirming } = useWalletNFTsV2(params);

if (isLoading) return <Spinner />;
if (isConfirming) return <ConfirmingTransaction />;

return <NFTGrid nfts={nfts} />;
```

### 4. **Conditional Execution**

```typescript
// Wait for data before calling hook
const marketplaceAddress = useMarketplaceAddress();

const { createListing } = useMarketplaceListing(
  marketplaceAddress || "0x0", // Fallback
);

// Only execute when ready
if (marketplaceAddress) {
  await createListing(params);
}
```

---

## 🏗️ Architecture Patterns

### Hook Composition

```typescript
// Combine multiple hooks for complex features
function useNFTCard(contractAddress: string, tokenId: string) {
  const { like, isLiked } = useNFTUserActions(contractAddress, tokenId);
  const { priceETH } = useNFTPriceData(priceWei);
  const { isAdmin } = useAdminStatus();

  return {
    like,
    isLiked,
    priceETH,
    isAdmin,
    canEdit: isAdmin,
  };
}
```

### Optimistic Updates

```typescript
const { like } = useNFTUserActions(address, tokenId);

// Optimistic UI update
setIsLiked(true);

try {
  await like();
} catch {
  setIsLiked(false); // Rollback on error
}
```

---

## 📚 Related Documentation

- **[Config Documentation](../config/README.md)** - ABIs, Networks, Subgraph Queries
- **[Contexts Documentation](../contexts/README.md)** - Global state management
- **[API Documentation](../app/api/README.md)** - Backend API routes
- **[Components Documentation](../components/README.md)** - UI components

---

## ✅ Migration Complete

All hooks are now professionally organized with:

- ✅ Barrel exports for clean imports
- ✅ Logical grouping by domain
- ✅ Comprehensive documentation
- ✅ Type-safe TypeScript
- ✅ Zero tech debt

**Import everything from `@/hooks` - one source of truth! 🚀**

```typescript
import { useModal } from '@/hooks/useModal';

function MyComponent() {
  const { isOpen, open, close, toggle } = useModal();

  return (
    <>
      <button onClick={open}>Open Modal</button>
      <Modal isOpen={isOpen} onClose={close}>
        Content
      </Modal>
    </>
  );
}
```

### **Admin Status Hook** (`useAdminStatus.ts`)

```typescript
import { useAdminStatus } from '@/hooks/useAdminStatus';

function AdminPanel() {
  const {
    isAdmin,        // Is current user admin?
    isLoading,      // Loading state
    checkAdminStatus // Manual recheck
  } = useAdminStatus();

  if (!isAdmin) return <AccessDenied />;
  return <AdminInterface />;
}
```

### **Card Tilt Hook** (`useCardTilt.ts`)

```typescript
import { useCardTilt } from '@/hooks/useCardTilt';

function NFTCard() {
  const { ref, style } = useCardTilt<HTMLDivElement>();

  return <div ref={ref} style={style}>Card Content</div>;
}
```

### **Horizontal Scroll Hook** (`useHorizontalScroll.ts`)

```typescript
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

function Gallery() {
  const scrollRef = useHorizontalScroll<HTMLDivElement>();

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      {items.map(item => <Item key={item.id} />)}
    </div>
  );
}
```

## Hook Categories

### **NFT Hooks** (`nfts/`)

- `useNFTMetadata.ts` - Fetch NFT metadata
- `useNFTOwnership.ts` - Check NFT ownership
- `useNFTValidation.ts` - Validate NFT addresses/IDs

### **Marketplace Hooks** (`marketplace/`)

- `useMarketplaceEvents.ts` - Listen to marketplace events
- `useListingStatus.ts` - Check listing status
- `useCollectionWhitelist.ts` - Whitelist validation

### **Wallet Hooks** (`wallet/`)

- `useWalletConnection.ts` - Wallet connection state
- `useBalance.ts` - Wallet balance
- `useNFTApproval.ts` - NFT approval status

### **User Hooks** (`user/`)

- `useUserInteractions.ts` - User favorites, ratings, watchlist

## Best Practices

### ✅ DO:

```typescript
// Encapsulate complex logic
function useComplexLogic() {
  const [state, setState] = useState();

  useEffect(() => {
    // Complex side effects
  }, [dependencies]);

  return { state, actions };
}

// Provide loading/error states
return { data, loading, error };

// Use TypeScript generics
function useData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  // ...
}
```

### ❌ DON'T:

```typescript
// Don't put hooks in conditions
if (condition) {
  const data = useHook(); // ❌
}

// Don't create too many hooks
// Bundle related logic together

// Don't forget cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // ✅
}, []);
```

## Naming Conventions

- **use** prefix (React convention)
- Descriptive names: `useNFTMetadata` not `useData`
- Return objects with clear names: `{ nft, loading, error }`

## Related Documentation

- **Form Validation**: See `useForm.ts` implementation
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)

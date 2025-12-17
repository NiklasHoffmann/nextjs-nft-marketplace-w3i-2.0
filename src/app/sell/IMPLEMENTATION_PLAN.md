# /sell Route - Contract Integration Plan

## 🎯 Ziel
Implementierung der kompletten Smart Contract Integration für NFT Listings (Verkauf, Tausch, Hybrid).

## 📋 Benötigte Contract-Funktionen

### 1. **Marketplace Contract** (bereits vorhanden)
- ✅ `createListing()` - NFT listen (Verkauf oder Tausch)
- ✅ `updateListing()` - Listing-Details ändern
- ✅ `cancelListing()` - Listing abbrechen
- ✅ `isCollectionWhitelisted()` - Prüfen ob Collection erlaubt ist

### 2. **ERC721 Contract** (noch benötigt)
- ❌ `approve()` - Marketplace für einzelnen NFT freigeben
- ❌ `setApprovalForAll()` - Marketplace für alle NFTs freigeben
- ❌ `isApprovedForAll()` - Approval-Status prüfen
- ❌ `getApproved()` - Approval für einzelnen NFT prüfen

### 3. **Network Config**
- ✅ Marketplace Address aus `network.mapping.json`
- ❌ Chain-spezifische Settings (Gas, Confirmations)

## 🔧 Zu implementierende Features

### Phase 1: NFT Approval System ⭐ KRITISCH
**Warum?** Bevor ein NFT gelistet werden kann, muss der Marketplace-Contract das Recht haben, den NFT zu transferieren.

#### Neue Dateien:
```
src/app/sell/
├── hooks/
│   ├── useNFTApproval.ts        # NEW - Approval Management
│   └── useCollectionWhitelist.ts # NEW - Whitelist Check
├── lib/
│   └── approval-service.ts       # NEW - Approval Logic
└── constants/
    └── erc721.abi.json          # NEW - ERC721 Standard ABI
```

#### Funktionen:
```typescript
// useNFTApproval.ts
interface UseNFTApprovalReturn {
  // Status
  isApproved: boolean;
  isApprovedForAll: boolean;
  isLoading: boolean;
  
  // Actions
  approveSingle: (tokenId: string) => Promise<void>;
  approveAll: () => Promise<void>;
  checkApproval: () => Promise<void>;
}
```

### Phase 2: Listing Service Implementation
**Was:** Echte Contract Calls statt Console.logs

#### Zu implementieren in `listing-service.ts`:

```typescript
1. listNFTForSale(data: TransactionData)
   ├── Check Collection Whitelist ✅/❌
   ├── Check NFT Approval ❌
   ├── Approve if needed ❌
   ├── Call createListing() ✅
   └── Wait for confirmation ✅

2. createTradeOffer(data: TransactionData)
   ├── Check Collection Whitelist
   ├── Check NFT Approval
   ├── Approve if needed
   ├── Call createListing() mit desiredToken
   └── Wait for confirmation

3. createHybridOffer(data: TransactionData)
   ├── Check Collection Whitelist
   ├── Check NFT Approval
   ├── Approve if needed
   ├── Call createListing() mit Price + desiredToken
   └── Wait for confirmation

4. createBatchListings(data: BatchTransactionData)
   ├── Check all Collections Whitelisted
   ├── Check approveAll
   ├── Loop through NFTs
   │   └── Call createListing() for each
   └── Return success/failure for each
```

### Phase 3: UI Enhancements
**Was:** User Feedback & Error Handling

#### Neue Komponenten:
```
components/
├── ApprovalDialog.tsx           # NEW - Approval UI
├── TransactionStatus.tsx        # NEW - TX Status
├── WhitelistWarning.tsx         # NEW - Not whitelisted warning
└── GasFeeEstimate.tsx          # NEW - Gas estimation
```

## 📊 Workflow-Diagram

```
User selects NFT
    ↓
Check Collection Whitelist
    ↓ NO
    └─→ Show Warning: "Collection not whitelisted"
    ↓ YES
Check Approval Status
    ↓ NOT APPROVED
    ├─→ Show Approval Dialog
    │   ├─ Option 1: Approve Single NFT
    │   └─ Option 2: Approve All (recommended for batch)
    ↓
User fills form
    ↓
Preview Transaction
    ↓
User confirms
    ↓
Execute Approval (if needed)
    ├─→ Wait for confirmation
    ↓
Execute Listing
    ├─→ Wait for confirmation
    ↓
Success! Update UI
```

## 🔍 Collection Whitelist System

### Benötigt?
**JA!** Aus Sicherheitsgründen erlaubt der Marketplace nur geprüfte Collections.

### Implementation:
```typescript
// useCollectionWhitelist.ts
export function useCollectionWhitelist(marketplaceAddress: string) {
  const checkWhitelist = async (contractAddress: string): Promise<boolean> => {
    // Read from contract: isCollectionWhitelisted(address)
    return result;
  };
  
  const getWhitelistedCollections = async (): Promise<string[]> => {
    // Read from contract: getWhitelistedCollections()
    return collections;
  };
}
```

### UI Integration:
```tsx
// In SellPage.tsx
const { isWhitelisted, loading } = useCollectionWhitelist(nft.contractAddress);

if (!isWhitelisted) {
  return <WhitelistWarning 
    message="Diese Collection ist nicht für Listings freigegeben" 
  />;
}
```

## 📝 Detaillierte Implementierungs-Steps

### Step 1: ERC721 ABI erstellen ✅
```bash
src/constants/erc721.abi.json
```
Standard ERC721 Interface mit approve, setApprovalForAll, etc.

### Step 2: Approval Hook erstellen
```typescript
// src/app/sell/hooks/useNFTApproval.ts
import { useReadContract, useWriteContract } from 'wagmi';
import erc721Abi from '@/constants/erc721.abi.json';

export function useNFTApproval(
  nftContractAddress: string,
  tokenId: string,
  marketplaceAddress: string
) {
  // Check approval for specific token
  const { data: approvedAddress } = useReadContract({
    address: nftContractAddress,
    abi: erc721Abi,
    functionName: 'getApproved',
    args: [BigInt(tokenId)]
  });

  // Check approval for all
  const { data: isApprovedForAll } = useReadContract({
    address: nftContractAddress,
    abi: erc721Abi,
    functionName: 'isApprovedForAll',
    args: [userAddress, marketplaceAddress]
  });

  const { writeContract } = useWriteContract();

  const approveSingle = async () => {
    await writeContract({
      address: nftContractAddress,
      abi: erc721Abi,
      functionName: 'approve',
      args: [marketplaceAddress, BigInt(tokenId)]
    });
  };

  const approveAll = async () => {
    await writeContract({
      address: nftContractAddress,
      abi: erc721Abi,
      functionName: 'setApprovalForAll',
      args: [marketplaceAddress, true]
    });
  };

  return {
    isApproved: approvedAddress === marketplaceAddress,
    isApprovedForAll: isApprovedForAll as boolean,
    approveSingle,
    approveAll
  };
}
```

### Step 3: Listing Service erweitern
```typescript
// src/app/sell/lib/listing-service.ts
import { useMarketplaceListing } from '@/hooks/marketplace';
import { useNFTApproval } from '../hooks/useNFTApproval';

export async function listNFTForSale(data: TransactionData): Promise<void> {
  // 1. Check approval
  const approval = useNFTApproval(
    data.selectedNFT.contractAddress,
    data.selectedNFT.tokenId,
    marketplaceAddress
  );

  if (!approval.isApproved && !approval.isApprovedForAll) {
    // 2. Request approval first
    await approval.approveSingle();
    // Wait for confirmation...
  }

  // 3. Create listing
  const listing = useMarketplaceListing(marketplaceAddress);
  await listing.createListing({
    tokenAddress: data.selectedNFT.contractAddress,
    tokenId: data.selectedNFT.tokenId,
    price: data.price,
    buyerWhitelistEnabled: false,
    allowedBuyers: []
  });
}
```

### Step 4: UI Components
```typescript
// ApprovalDialog.tsx
interface ApprovalDialogProps {
  nft: AggregatedNFT;
  onApprove: () => void;
  onCancel: () => void;
}

// TransactionStatus.tsx
type TxStatus = 'idle' | 'approving' | 'listing' | 'success' | 'error';

// WhitelistWarning.tsx
- Show when collection not whitelisted
- Link to admin for adding collection
```

## 🎯 Dependencies

### Wagmi Hooks (bereits verfügbar):
- ✅ `useReadContract` - Contract lesen
- ✅ `useWriteContract` - Contract schreiben
- ✅ `useWaitForTransactionReceipt` - TX Confirmation warten

### Marketplace Hooks (bereits verfügbar):
- ✅ `useMarketplaceListing` - Listing Functions
- ✅ `useMarketplaceData` - Read Functions

### Neue Dependencies (zu erstellen):
- ❌ `useNFTApproval` - Approval Management
- ❌ `useCollectionWhitelist` - Whitelist Check
- ❌ ERC721 ABI JSON

## 🔐 Security Checks

### Pre-Listing Validations:
1. ✅ Collection is whitelisted
2. ✅ User owns the NFT
3. ✅ NFT is not already listed
4. ✅ Price is valid (> 0)
5. ✅ Marketplace is approved
6. ✅ Target NFT exists (für Trades)

## 📦 Transaction Flow

### Single Sale Listing:
```
1. Validate Form Data
2. Check Collection Whitelist
   └─ Show warning if not whitelisted
3. Check Approval Status
4. If not approved:
   ├─ Show Approval Dialog
   ├─ Execute approve() or setApprovalForAll()
   └─ Wait for confirmation
5. Show Transaction Preview
6. User confirms
7. Execute createListing()
   ├─ Parameters:
   │  ├─ tokenAddress
   │  ├─ tokenId
   │  ├─ price (ETH)
   │  ├─ desiredTokenAddress = 0x0000...
   │  ├─ desiredTokenId = 0
   │  └─ buyerWhitelist = []
   └─ Wait for confirmation
8. Update UI:
   ├─ Show success message
   ├─ Remove from "unlisted" filter
   └─ Refresh NFT data
```

### Trade Offer:
```
Same as Sale, but:
- desiredTokenAddress = target NFT contract
- desiredTokenId = target NFT ID
- price = 0 (optional: hybrid with price)
```

### Batch Listing:
```
1. Check approveAll (recommended)
2. Loop through selected NFTs:
   ├─ Validate each
   ├─ Create listing
   └─ Track success/failure
3. Show summary:
   ├─ X successful
   ├─ Y failed (with reasons)
```

## 🛠 Implementation Priority

### Phase 1: Core Functionality (MUST HAVE)
1. ✅ ERC721 ABI erstellen
2. ✅ useNFTApproval Hook
3. ✅ Approval in listing-service integrieren
4. ✅ Single Sale Listing funktional

### Phase 2: Extended Features (SHOULD HAVE)
5. ✅ Collection Whitelist Check
6. ✅ Trade Listings
7. ✅ Hybrid Listings
8. ✅ Transaction Status UI

### Phase 3: Nice to Have (COULD HAVE)
9. ⭕ Batch Listings
10. ⭕ Gas Estimation
11. ⭕ Transaction History
12. ⭕ Error Recovery

## 🧪 Testing Checklist

### Contract Interactions:
- [ ] Approval for single NFT works
- [ ] ApproveAll works
- [ ] Sale listing creates successfully
- [ ] Trade listing creates successfully
- [ ] Hybrid listing creates successfully
- [ ] Error handling works
- [ ] Transaction confirmations tracked

### UI/UX:
- [ ] Approval dialog shows when needed
- [ ] Transaction status updates in real-time
- [ ] Success/Error messages clear
- [ ] Loading states everywhere
- [ ] Collection whitelist warning works

## 📈 Success Metrics

### Technical:
- ✅ 0 TypeScript errors
- ✅ All contracts called correctly
- ✅ Transactions confirmed
- ✅ Error handling complete

### User Experience:
- ✅ Clear step-by-step process
- ✅ Real-time feedback
- ✅ Error recovery options
- ✅ Gas fee transparency

## 🎉 Final Deliverables

1. **Code Files:**
   - `erc721.abi.json`
   - `useNFTApproval.ts`
   - `useCollectionWhitelist.ts`
   - `approval-service.ts`
   - Updated `listing-service.ts`
   - `ApprovalDialog.tsx`
   - `TransactionStatus.tsx`
   - `WhitelistWarning.tsx`

2. **Documentation:**
   - Contract integration guide
   - User flow documentation
   - Error handling guide

3. **Tests:**
   - Unit tests for hooks
   - Integration tests for service
   - E2E tests for complete flow

---

**Geschätzter Aufwand:** 4-6 Stunden
**Priorität:** HIGH (Feature kann ohne dies nicht genutzt werden)
**Dependencies:** Wagmi v2, Viem, Marketplace Contract deployed

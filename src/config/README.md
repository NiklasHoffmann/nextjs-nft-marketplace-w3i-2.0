# Configuration Files

Centralized configuration for the NFT Marketplace application.

## Structure

```
config/
├── abis/                  # Smart contract ABIs (TypeScript format)
│   ├── index.ts           # Barrel exports for all ABIs
│   ├── marketplace.ts     # Ideation Market Diamond ABI
│   ├── multisig-wallet.ts # MultiSig Wallet ABI
│   └── diamond.ts         # Diamond Ownership ABI
├── subgraph/              # GraphQL queries for TheGraph
│   ├── index.ts           # Barrel exports for queries
│   └── queries.ts         # Ideation Market subgraph queries
├── networks.ts            # Network configuration and contract addresses
├── admin.ts               # Admin addresses and configuration
├── apolloClient.ts        # Apollo Client setup for GraphQL
├── app.config.ts          # Application-wide configuration
├── wagmi.ts               # Wagmi configuration for Web3
└── index.ts               # Central barrel exports
```

## ABIs

All ABIs are exported as TypeScript constants with `as const` assertion for type safety.

### Usage Example
```typescript
import { MARKETPLACE_ABI } from '@/config/abis/marketplace';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { DIAMOND_ABI } from '@/config/abis/diamond';

const contract = getContract({
  address: marketplaceAddress,
  abi: MARKETPLACE_ABI,
  client: publicClient,
});
```

## Networks

Network configuration provides contract addresses for different blockchain networks.

### Usage Example
```typescript
import { NETWORK_CONFIG, getMarketplaceAddress, isSupportedChain } from '@/config/networks';

// Get marketplace address for current chain
const address = getMarketplaceAddress(chainId);

// Check if chain is supported
if (isSupportedChain(chainId)) {
  // ...
}

// Direct access
const sepoliaContracts = NETWORK_CONFIG['11155111'];
```

### Supported Networks
- **31337**: Hardhat Local Network
- **11155111**: Sepolia Testnet

## Subgraph Queries

GraphQL queries for fetching data from TheGraph protocol.

### Usage Example
```typescript
import {
  GET_ACTIVE_LISTINGS,
  GET_LISTINGS_BY_COLLECTION,
  GET_LISTINGS_BY_NFT,
  GET_LISTING_BY_ID,
  GET_WHITELISTED_BUYERS,
  GET_LISTINGS_BY_SELLER,
  LISTINGS_UPDATED_SUBSCRIPTION,
  GET_LISTINGS_BY_STATUS,
  GET_LISTINGS_BY_TYPE,
  
  // Types
  TokenStandard,
  ListingType,
  ListingStatus
} from '@/config/subgraph';
```

## Migration from `constants/`

All configuration files were migrated from `src/constants/` to `src/config/` for better organization:

### Changes
1. **marketplace.abi.json** → **config/abis/marketplace.ts**
   - Converted from JSON to TypeScript
   - Export name: `MARKETPLACE_ABI`
   - 17 import locations updated

2. **network.mapping.json** → **config/networks.ts**
   - Converted from JSON to TypeScript
   - Export name: `NETWORK_CONFIG`
   - Added helper functions: `getMarketplaceAddress()`, `isSupportedChain()`
   - 4 import locations updated

3. **subgraph.queries.ts** → **config/subgraph/queries.ts**
   - Moved to dedicated subgraph folder
   - No changes to exports
   - 2 import locations updated

4. **subgraph.queries.v2.ts** → **config/subgraph/queries.ts**
   - Moved to dedicated subgraph folder
   - Renamed to `queries.ts` (v2 is now the standard)
   - Added barrel export via `index.ts`
   - 1 import location updated

### Benefits
- ✅ **Type Safety**: ABIs use TypeScript `as const` for full type inference
- ✅ **Consistency**: All config in one place (`config/`)
- ✅ **Organization**: Logical grouping (abis/, subgraph/)
- ✅ **Helper Functions**: Utility functions for common operations
- ✅ **Maintainability**: Easier to find and update configuration
- ✅ **IntelliSense**: Better autocomplete and type checking

### Migration Complete ✅
All files migrated successfully:
- ✅ `src/constants/` folder deleted
- ✅ All imports updated to `@/config/`
- ✅ Barrel exports added for cleaner imports
- ✅ TypeScript type safety enforced

**Note:** Archive scripts in `scripts/archive/` still reference old paths but are not actively used.

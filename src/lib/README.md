# lib/ - Core Infrastructure

Zentrale API-Infrastruktur, Middleware, Database-Verbindungen und System-Utilities.

## Folder Structure

```
lib/
├── api/              # API infrastructure (handlers, errors, responses)
│   ├── handler.ts    # apiHandler() wrapper
│   ├── errors.ts     # Custom error classes
│   ├── responses.ts  # Response helpers
│   ├── helpers.ts    # Request utilities
│   └── index.ts      # Barrel exports
├── middleware/       # Auth, validation, rate limiting
│   ├── auth.ts       # Authentication middleware
│   ├── validation.ts # Zod schema validation
│   ├── rateLimit.ts  # Rate limiting
│   └── index.ts      # Barrel exports ✨
├── db/               # Database utilities
│   ├── nft-metadata.ts # NFT metadata collection helpers
│   └── index.ts      # Barrel exports ✨
├── blockchain/       # Direct blockchain interactions
│   ├── wallet-nfts.ts # Blockchain-based NFT discovery
│   └── index.ts      # Barrel exports ✨
├── cache.ts          # Cache management utilities
├── utils.ts          # General utilities (cn, etc.)
├── mongodb.ts        # MongoDB connection singleton
├── globals.ts        # Global polyfills (BigInt serialization)
├── init-services.ts  # Service initialization
├── dev-services-auto-start.ts # Dev-only auto-start
├── index.ts          # Central barrel export ✨
└── README.md         # This file
```

## Quick Reference

### **Centralized Import** (Recommended)
```typescript
// Import everything from @/lib
import { 
  apiHandler, 
  withAuth, 
  withAdmin,
  BadRequestError,
  getNFTMetadataCollection,
  getWalletNFTsFromBlockchain,
  cn
} from '@/lib';
```

### **API Infrastructure** (`api/`)
```typescript
import { apiHandler, withAuth, withAdmin } from '@/lib';
import { BadRequestError, NotFoundError } from '@/lib';

// Standard API Route
export const GET = apiHandler(async (request) => {
  return { data: { message: 'Hello' } };
});

// Protected Route (User Auth)
export const POST = apiHandler(async (request) => {
  await withAuth(request);
  const userAddress = request.userAddress; // auto-injected
  return { data: { user: userAddress } };
});

// Admin-Only Route
export const DELETE = apiHandler(async (request) => {
  await withAdmin(request);
  return { data: { message: 'Deleted' } };
});
```

**Key Features:**
- ✅ Auto error handling & formatting
- ✅ Request/response logging
- ✅ CORS headers
- ✅ Type-safe responses
- ✅ Standardized error classes

**Exported Functions:**
- `apiHandler()` - Wraps route handlers
- `apiSuccess()` - Success response helper
- `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, etc.

### **Middleware** (`middleware/`)
```typescript
import { withAuth, withAdmin, withValidation, rateLimit } from '@/lib';
import { z } from 'zod';

// Authentication Middleware
await withAuth(request);           // Requires a signed user- or admin-session cookie
await withAdmin(request);          // Requires a signed admin-session cookie
await withOptionalAuth(request);   // Optional user wallet

// Validation Middleware
const schema = z.object({ name: z.string() });
await withValidation(request, schema);

// Rate Limiting
await rateLimit(request, { max: 10, window: 60 }); // 10 req/min
```

**Authentication Flow:**
1. Verify session cookie (`user-session` or `admin-session`, HMAC-signed)
2. Take the wallet address from the verified token — never from a request header
3. Check admin status (if needed)
4. Inject `request.userAddress` & `request.isAdmin`

See [docs/architecture/ROLES_AND_PERMISSIONS.md](../../docs/architecture/ROLES_AND_PERMISSIONS.md) for the full permission matrix.

**Exported Functions:**
- `withAuth()` - Require authentication
- `withAdmin()` - Require admin role
- `withOptionalAuth()` - Optional authentication
- `withValidation()` - Zod schema validation
- `rateLimit()` - Rate limiting

### **Database** (`db/`, `mongodb.ts`)
```typescript
import { getDb, getNFTMetadataCollection, upsertNFTMetadata } from '@/lib';

// Get MongoDB connection
const db = await getDb();
const collection = db.collection('nft_metadata');

// Typed collection access
const nftCollection = await getNFTMetadataCollection();
const nft = await nftCollection.findOne({ 
  nftAddress: '0x...', 
  tokenId: '1' 
});

// Helper functions
await upsertNFTMetadata('0x...', '1', {
  name: 'Cool NFT',
  image: 'ipfs://...',
  metadata: { /* ... */ }
});
```

**Features:**
- ✅ Connection pooling (singleton pattern)
- ✅ Auto-reconnect
- ✅ TypeScript support
- ✅ Typed collection helpers

**Exported Functions:**
- `getDb()` - Get database instance
- `getCollection()` - Get generic collection
- `getNFTMetadataCollection()` - Typed nft_metadata access
- `upsertNFTMetadata()` - Insert/update NFT metadata
- `findNFTMetadata()` - Query NFT metadata

### **Blockchain** (`blockchain/`)
```typescript
import { getWalletNFTsFromBlockchain, discoverNFTsViaTransferEvents } from '@/lib';

// Direct blockchain NFT discovery
const nfts = await getWalletNFTsFromBlockchain(
  '0x...', // wallet address
  ['0x...', '0x...'] // contract addresses
);

// Event-based discovery
const discovered = await discoverNFTsViaTransferEvents(
  '0x...', // wallet
  11155111 // chainId
);
```

**Features:**
- ✅ Direct blockchain queries (no API limits)
- ✅ ERC-721 enumeration support
- ✅ Transfer event scanning
- ✅ Parallel contract processing

**Exported Functions:**
- `getWalletNFTsFromBlockchain()` - Get owned NFTs from blockchain
- `discoverNFTsViaTransferEvents()` - Discover via Transfer events
- `getOwnedTokenIds()` - Get token IDs for owner
- `batchGetNFTMetadata()` - Batch metadata fetching

### **Caching** (`cache.ts`)
```typescript
import { getCachedStats, setCachedStats, invalidateStatsCache } from '@/lib';

// Get cached data
const stats = getCachedStats<StatsType>('0x...', '1');

// Set cache
setCachedStats('0x...', '1', statsData);

// Invalidate
invalidateStatsCache('0x...', '1');
```

**Features:**
- ✅ In-memory caching
- ✅ TTL support (configurable per cache type)
- ✅ Automatic invalidation
- ✅ Cache statistics

**Cache Types:**
- Stats cache (5s TTL)
- Collections cache (60s TTL)

### **General Utilities** (`utils.ts`)
```typescript
import { cn } from '@/lib';

// Merge Tailwind classes
const className = cn(
  'base-class',
  condition && 'conditional-class',
  'override-class'
);
```

## Architecture

### API Request Flow
```
Request
  ↓
apiHandler (error handling, logging, CORS)
  ↓
Middleware (auth, validation, rate limit)
  ↓
Route Handler
  ↓
Response (auto-formatted, CORS headers)
```

### Error Handling
All errors thrown in `apiHandler` are automatically caught and formatted:
```typescript
throw new BadRequestError('Invalid input');
throw new UnauthorizedError('Not authenticated');
throw new NotFoundError('Resource not found');
// → Automatic JSON response with proper status code
```

### Import Patterns

**✅ RECOMMENDED:**
```typescript
// Centralized import from @/lib
import { apiHandler, withAuth, getNFTMetadataCollection } from '@/lib';
```

**✅ ALSO VALID:**
```typescript
// Direct subfolder imports
import { apiHandler } from '@/lib/api';
import { withAuth } from '@/lib/middleware';
```

**❌ AVOID:**
```typescript
// Don't import directly from files (bypasses barrel exports)
import { apiHandler } from '@/lib/api/handler';
import { withAuth } from '@/lib/middleware/auth';
```

## Best Practices

### ✅ DO:
- Use centralized `@/lib` imports
- Use `apiHandler` for all API routes
- Use typed error classes (`BadRequestError`, etc.)
- Validate request data with `withValidation`
- Use authentication middleware consistently
- Cache expensive operations
- Use helper functions from `db/` for database access

### ❌ DON'T:
- Bypass `apiHandler` for API routes
- Throw generic `Error` objects in API routes
- Directly access MongoDB without connection pooling
- Skip validation on user input
- Forget to add authentication to protected routes
- Cache indefinitely without TTL

## Related Documentation

- **API Routes**: [/docs/api/routes.md](/docs/api/routes.md)
- **Authentication**: [/docs/api/authentication.md](/docs/api/authentication.md)
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)


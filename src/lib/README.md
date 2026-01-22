# lib/ - Core Infrastructure

Zentrale API-Infrastruktur, Middleware, Database-Verbindungen und System-Utilities.

## Quick Reference

### **API Infrastructure** (`api/`)
```typescript
import { apiHandler, withAuth, withAdmin } from '@/lib/api';
import { BadRequestError, NotFoundError } from '@/lib/api';

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

**Wichtige Dateien:**
- `api/handler.ts` - `apiHandler()` wrapper (auto error handling, logging, CORS)
- `api/errors.ts` - Custom error classes (BadRequestError, UnauthorizedError, etc.)
- `api/responses.ts` - Response helpers (`createSuccessResponse<T>()`)
- `api/helpers.ts` - Request utilities (parseJsonBody, getQueryParam, pagination)

### **Middleware** (`middleware/`)
```typescript
import { withAuth, withAdmin, withValidation } from '@/lib/middleware/auth';
import { z } from 'zod';

// Authentication Middleware
await withAuth(request);           // Requires user wallet
await withAdmin(request);          // Requires admin wallet
await withOptionalAuth(request);   // Optional user wallet

// Validation Middleware
const schema = z.object({ name: z.string() });
await withValidation(request, schema);
```

**Dateien:**
- `middleware/auth.ts` - Auth middleware (signature verification, session management)
- `middleware/validation.ts` - Zod schema validation
- `middleware/rateLimit.ts` - Rate limiting (in-memory, sliding window)

### **Database** (`db/`, `mongodb.ts`)
```typescript
import { getDb } from '@/lib/mongodb';

const db = await getDb();
const collection = db.collection('nft_metadata');
const docs = await collection.find({}).toArray();
```

**Features:**
- Connection pooling (singleton pattern)
- Auto-reconnect
- Error handling
- TypeScript support

### **Caching** (`cache.ts`)
```typescript
import { cache } from '@/lib/cache';

// Set/Get
cache.set('key', value, 60); // TTL: 60s
const value = cache.get('key');

// Stats
cache.stats();
cache.clear();
```

**Features:**
- In-memory LRU cache
- TTL support
- Size limits
- Performance monitoring

### **Blockchain** (`blockchain/`)
- `alchemy.ts` - Alchemy SDK client
- `viem.ts` - Viem client configuration
- Contract utilities

## Architecture

### API Request Flow
```
Request
  ↓
apiHandler (error handling, logging)
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

## Related Documentation

- **API Routes**: [/docs/api/routes.md](/docs/api/routes.md)
- **Authentication**: [/docs/api/authentication.md](/docs/api/authentication.md)
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)

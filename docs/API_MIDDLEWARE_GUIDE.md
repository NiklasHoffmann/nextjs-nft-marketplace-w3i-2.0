# API Middleware Guide

This guide explains how to use the standardized API middleware in `/src/lib/api/`.

## 📦 Available Utilities

### Response Helpers (`/src/lib/api/responses.ts`)

Standardized response functions for consistent API responses:

```typescript
import { apiSuccess, apiBadRequest, apiUnauthorized, apiInternalError } from '@/lib/api';

// Success response (200)
return apiSuccess({ message: 'User created' });
return apiSuccess(userData, 201); // Custom status code

// Error responses
return apiBadRequest('Invalid input'); // 400
return apiUnauthorized('Not authenticated'); // 401
return apiForbidden('Admin only'); // 403
return apiNotFound('Resource not found'); // 404
return apiInternalError('Database error'); // 500
```

**Response Format:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Error Classes (`/src/lib/api/errors.ts`)

Typed error classes for better error handling:

```typescript
import { BadRequestError, UnauthorizedError, NotFoundError } from '@/lib/api';

// Throw typed errors
throw new BadRequestError('Invalid address format');
throw new UnauthorizedError('Login required');
throw new NotFoundError('NFT not found');

// Catch and handle
try {
  // ... your code
} catch (error) {
  if (error instanceof BadRequestError) {
    return apiBadRequest(error.message);
  }
  return apiInternalError('Unexpected error');
}
```

**Available Error Classes:**
- `BadRequestError` (400) - Invalid input
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ValidationError` (422) - Validation failed
- `RateLimitError` (429) - Too many requests
- `InternalError` (500) - Server error

### Rate Limiting (`/src/lib/api/middleware/rateLimit.ts`)

In-memory rate limiting with configurable limits:

```typescript
import { rateLimit, RATE_LIMIT_CONFIG } from '@/lib/api';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT); // 120 req/min
  
  // Your route logic...
}

export async function POST(request: NextRequest) {
  // Stricter limit for write operations
  await rateLimit(request, RATE_LIMIT_CONFIG.STANDARD); // 60 req/min
  
  // Your route logic...
}
```

**Available Configs:**
- `LENIENT`: 120 requests/minute (read-only operations)
- `STANDARD`: 60 requests/minute (default)
- `STRICT`: 10 requests/minute (admin/write operations)
- `VERY_STRICT`: 5 requests/minute (expensive operations)

**Custom Config:**
```typescript
await rateLimit(request, {
  maxRequests: 30,
  windowSeconds: 60
});
```

### Authentication (`/src/lib/api/middleware/auth.ts`)

Admin authentication for protected routes:

```typescript
import { requireAdmin, checkAdmin, getWalletAddress } from '@/lib/api';

// Require admin (throws UnauthorizedError if not admin)
export async function POST(request: NextRequest) {
  await requireAdmin(request); // Throws if not admin
  
  // Your admin logic...
}

// Check admin (returns boolean)
export async function GET(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  
  if (isAdmin) {
    // Show admin data
  } else {
    // Show public data
  }
}

// Get wallet address
const walletAddress = await getWalletAddress(request);
```

**Wallet Address Sources** (checked in order):
1. `Authorization: Bearer <address>` header
2. `x-wallet-address` header
3. `walletAddress` query parameter
4. `walletAddress` in request body

### Validation (`/src/lib/api/middleware/validation.ts`)

Type-safe validation helpers:

```typescript
import {
  getQueryParam,
  parseJsonBody,
  isValidAddress,
  isValidTokenId,
  validateObject,
  BadRequestError
} from '@/lib/api';

export async function GET(request: NextRequest) {
  // Get query parameters (throws if required and missing)
  const address = getQueryParam(request, 'contractAddress', true);
  const tokenId = getQueryParam(request, 'tokenId', true);
  const page = getQueryParam(request, 'page', false); // Optional
  
  // Validate formats
  if (!isValidAddress(address)) {
    throw new BadRequestError('Invalid address format');
  }
  if (!isValidTokenId(tokenId)) {
    throw new BadRequestError('Invalid token ID');
  }
  
  // Your logic...
}

export async function POST(request: NextRequest) {
  // Parse and validate JSON body
  const body = await parseJsonBody<{ name: string; price: number }>(request);
  
  // Validate against schema
  const validatedData = validateObject(body, {
    name: { required: true, type: 'string' },
    price: { required: true, type: 'number' }
  });
  
  // Your logic...
}
```

**Available Validators:**
- `isValidAddress(address)` - Ethereum address
- `isValidTokenId(tokenId)` - NFT token ID
- `isValidNumber(value)` - Valid number
- `isValidEmail(email)` - Valid email
- `isValidUrl(url)` - Valid URL

## 🎯 Complete Example

Here's a complete example of a well-structured API route:

```typescript
// src/app/api/nft/stats/route.ts
import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
  rateLimit,
  RATE_LIMIT_CONFIG,
  getQueryParam,
  parseJsonBody,
  isValidAddress,
  isValidTokenId,
  BadRequestError,
  InternalError
} from '@/lib/api';

// GET /api/nft/stats
export async function GET(request: NextRequest) {
  try {
    // 1. Apply rate limiting
    await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

    // 2. Extract and validate parameters
    const contractAddress = getQueryParam(request, 'contractAddress', true);
    const tokenId = getQueryParam(request, 'tokenId', true);

    if (!isValidAddress(contractAddress)) {
      throw new BadRequestError('Invalid contract address format');
    }
    if (!isValidTokenId(tokenId)) {
      throw new BadRequestError('Invalid token ID format');
    }

    // 3. Your business logic
    const collection = await getCollection('nft_stats');
    const stats = await collection.findOne({
      contractAddress: contractAddress.toLowerCase(),
      tokenId
    });

    // 4. Return success response
    return apiSuccess(stats);

  } catch (error) {
    console.error('Error fetching NFT stats:', error);

    // 5. Handle typed errors
    if (error instanceof BadRequestError) {
      return apiBadRequest(error.message);
    }

    return apiInternalError('Failed to fetch NFT stats');
  }
}

// POST /api/nft/stats (Admin only)
export async function POST(request: NextRequest) {
  try {
    // 1. Require admin authentication
    await requireAdmin(request);

    // 2. Apply strict rate limiting for write operations
    await rateLimit(request, RATE_LIMIT_CONFIG.STRICT);

    // 3. Parse and validate request body
    const body = await parseJsonBody<{
      contractAddress: string;
      tokenId: string;
      field: string;
      increment: boolean;
    }>(request);

    if (!isValidAddress(body.contractAddress)) {
      throw new BadRequestError('Invalid contract address');
    }

    // 4. Your business logic
    const collection = await getCollection('nft_stats');
    const result = await collection.updateOne(
      { contractAddress: body.contractAddress.toLowerCase(), tokenId: body.tokenId },
      { $inc: { [body.field]: body.increment ? 1 : -1 } }
    );

    // 5. Return success response
    return apiSuccess({ updated: result.modifiedCount });

  } catch (error) {
    console.error('Error updating NFT stats:', error);

    if (error instanceof BadRequestError) {
      return apiBadRequest(error.message);
    }
    if (error instanceof UnauthorizedError) {
      return apiUnauthorized(error.message);
    }

    return apiInternalError('Failed to update NFT stats');
  }
}
```

## 📝 Migration Checklist

When updating an existing route to use the new middleware:

- [ ] Replace `NextResponse` import with API helpers
- [ ] Add rate limiting call at the beginning of each handler
- [ ] Replace manual parameter extraction with `getQueryParam()` or `parseJsonBody()`
- [ ] Add validation using type guards (`isValidAddress`, etc.)
- [ ] Replace `NextResponse.json()` with `apiSuccess()` or `apiError()` helpers
- [ ] Add typed error handling in catch blocks
- [ ] For admin routes: Add `requireAdmin()` check
- [ ] Test the route to ensure it works correctly

## 🚀 Benefits

- **Consistency**: All API routes follow the same pattern
- **Type Safety**: Typed errors and responses
- **Security**: Built-in rate limiting and admin authentication
- **Validation**: Centralized input validation
- **Maintainability**: Easy to update and extend
- **Developer Experience**: Clear error messages and autocomplete

## 📚 Related Files

- `/src/lib/api/responses.ts` - Response helpers
- `/src/lib/api/errors.ts` - Error classes
- `/src/lib/api/middleware/auth.ts` - Authentication
- `/src/lib/api/middleware/validation.ts` - Validation
- `/src/lib/api/middleware/rateLimit.ts` - Rate limiting
- `/src/lib/api/index.ts` - Central exports

## 🔧 Environment Variables

```env
# Admin wallet addresses (comma-separated)
NEXT_PUBLIC_ADMIN_ADDRESSES=0x123...,0x456...
```

---

**Last Updated:** Phase 6 - API Routes Cleanup (October 2025)

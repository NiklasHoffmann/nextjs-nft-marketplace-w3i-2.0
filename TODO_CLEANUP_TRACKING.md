# TODO/FIXME/HACK Cleanup Tracking
**Date:** December 18, 2025  
**Total Found:** 100+ instances

## 📋 Categorized TODOs

### 1. Admin Authentication (8 instances) - HIGH PRIORITY

#### Files:
- `src/app/api/nft/admin/insights/route.ts` (Line 42, 96, 170)
- `src/app/api/nft/admin/insights/collections/route.ts` (Line 40, 99)
- `src/app/admin/components/AdminNFTInsightsManager.tsx` (Line 281)

#### Current State:
```typescript
// TODO: Add admin authentication check here
// TODO: Replace with actual admin address
createdBy: '0x0000000000000000000000000000000000000000'
```

#### Action Plan:
1. Create middleware: `src/lib/middleware/auth.ts`
2. Implement `withAdmin` middleware
3. Apply to all admin routes
4. Replace all `0x000...` addresses with actual admin wallet

**Status:** ⏳ Pending (Phase 5 - Error Handling)

---

### 2. Contract Call Implementations (5 instances) - HIGH PRIORITY

#### Files:
- `src/components/nft/modals/BuyNowModal.tsx` (Line 66)
- `src/components/nft/modals/CancelListingModal.tsx` (Line 27)
- `src/components/nft/modals/UpdateListingModal.tsx` (Line 42)
- `src/app/cart/CartPage.tsx` (Line 102)
- `src/app/sell/SellTradePage.tsx` (Line 89)

#### Current State:
```typescript
// TODO: Implement actual contract call
// TODO: Implement transaction handling with ListingService
// TODO: Implement batch purchase contract call
```

#### Action Plan:
1. Create `src/services/blockchain/TransactionService.ts`
2. Implement buy/cancel/update functions
3. Replace all TODOs with actual implementation
4. Add error handling and user feedback

**Status:** ⏳ Pending (Phase 9 - Services Layer)

---

### 3. Collection Statistics (3 instances) - MEDIUM PRIORITY

#### Files:
- `scripts/sync-collections.ts` (Lines 200, 201, 206)

#### Current State:
```typescript
soldCount: 0, // TODO: Track from marketplace events
totalVolume: '0' // TODO: Calculate from sales history
uniqueOwners: 0 // TODO: Calculate unique owners
```

#### Action Plan:
1. Create MongoDB aggregation for sales tracking
2. Implement owner counting logic
3. Add historical data tracking
4. Update sync script

**Status:** ⏳ Pending (Low priority - can be addressed later)

---

### 4. Error Logging Setup (2 instances) - MEDIUM PRIORITY

#### Files:
- `src/components/layout/ClientLayout.tsx` (Lines 22, 62)

#### Current State:
```typescript
// TODO: hier an Sentry/Log-Backend senden
// TODO: Sentry.captureException(error)
```

#### Action Plan:
1. Setup Sentry account
2. Install @sentry/nextjs
3. Configure Sentry in `next.config.ts`
4. Replace all TODOs with actual Sentry calls
5. Add custom error boundaries

**Status:** ⏳ Pending (Phase 5 - Error Handling)

---

### 5. Debug Code & Comments (15+ instances) - LOW PRIORITY

#### Files:
- Multiple files with debug logs, panels, comments
- `src/components/ui/AdminDebugPanel.tsx` (entire file)
- Various debug logging throughout

#### Current State:
```typescript
devLog.debug('marketplace-items', `⏸️ Stats refresh...`);
// Debug log for totalSupply
// Debug: Log incoming data structure
```

#### Action Plan:
1. Remove all `console.log` calls
2. Replace with proper logger (pino)
3. Keep AdminDebugPanel but only in dev mode
4. Clean up excessive debug comments

**Status:** ⏳ Pending (Phase 5 - Logging)

---

### 6. View Tracking Disabled (1 instance) - LOW PRIORITY

#### File:
- `src/app/nft/[contractAddress]/[tokenId]/page.tsx` (Line 160)

#### Current State:
```typescript
// TODO: Re-enable with proper debouncing after stats sync is fixed
```

#### Context:
- View tracking was disabled due to stats sync issues
- Need to implement proper debouncing
- Fix stats sync race conditions first

#### Action Plan:
1. Fix stats sync service (already done?)
2. Implement debounced view tracking
3. Add deduplication logic
4. Re-enable feature

**Status:** ⏳ Pending (Phase 6 - Context Optimization)

---

## 🎯 Resolution Strategy

### Immediate Actions (This Week)
1. ✅ Document all TODOs (this file)
2. ⏳ Create admin authentication middleware
3. ⏳ Setup Sentry for error tracking
4. ⏳ Remove debug logs in production builds

### Short Term (Next 2 Weeks)
5. ⏳ Implement contract call services
6. ⏳ Fix stats sync and re-enable view tracking
7. ⏳ Replace structured logging

### Long Term (Next Month)
8. ⏳ Implement collection statistics
9. ⏳ Add comprehensive test coverage
10. ⏳ Remove or productionize debug features

---

## 📊 Progress Tracking

### By Category
- **Admin Auth:** 0/8 resolved (0%)
- **Contract Calls:** 0/5 resolved (0%)
- **Statistics:** 0/3 resolved (0%)
- **Error Logging:** 0/2 resolved (0%)
- **Debug Code:** 0/15 resolved (0%)
- **View Tracking:** 0/1 resolved (0%)

### Overall
**Total:** 0/34+ resolved (0%)

---

## 🚀 Implementation Plan

### Phase 1: Authentication & Security
```typescript
// Create: src/lib/middleware/auth.ts
export const withAuth = async (req: Request) => {
  // Verify JWT/session
};

export const withAdmin = async (req: Request) => {
  await withAuth(req);
  // Check admin role
};

// Apply to routes:
export const POST = apiHandler(
  async (req) => { /* ... */ },
  { middleware: [withAdmin] }
);
```

### Phase 2: Transaction Services
```typescript
// Create: src/services/blockchain/TransactionService.ts
export class TransactionService {
  async buyNFT(contractAddress: string, tokenId: string, price: string) {
    // Implement with wagmi/viem
  }
  
  async cancelListing(listingId: string) {
    // Implement
  }
  
  async updateListing(listingId: string, newPrice: string) {
    // Implement
  }
}
```

### Phase 3: Error Tracking
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// Update: src/components/layout/ClientLayout.tsx
import * as Sentry from '@sentry/nextjs';

const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  Sentry.captureException(error, {
    contexts: { react: { componentStack: errorInfo.componentStack } }
  });
};
```

### Phase 4: Logging System
```typescript
// Create: src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Usage:
logger.info({ contractAddress, tokenId }, 'Fetching NFT metadata');
logger.error({ error }, 'Failed to fetch metadata');
```

---

## ✅ Cleanup Checklist

- [ ] Remove all `console.log` calls
- [ ] Remove all `console.debug` calls
- [ ] Implement admin middleware
- [ ] Replace all admin address placeholders
- [ ] Implement transaction services
- [ ] Setup Sentry
- [ ] Replace debug logs with proper logging
- [ ] Implement collection statistics
- [ ] Fix and re-enable view tracking
- [ ] Add tests for all new implementations

---

**Last Updated:** December 18, 2025  
**Next Review:** After Phase 5 completion

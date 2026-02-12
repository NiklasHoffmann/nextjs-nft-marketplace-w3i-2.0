# Utils - Utility Functions

Reusable helper functions organized by domain for common operations throughout the application.

## 📋 Table of Contents

- [Directory Structure](#directory-structure)
- [Quick Reference](#quick-reference)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Migration Notes](#migration-notes)

---

## Directory Structure

```
utils/
├── api/                    # API layer utilities
│   ├── index.ts
│   ├── nft.ts             # NFT key generation, data freshness
│   └── nft-aggregation.ts # Aggregation & deduplication
├── core/                   # Fundamental utilities
│   ├── index.ts
│   ├── bigint.ts          # BigInt serialization & parsing
│   ├── dev-log.ts         # Development logging
│   └── media.ts           # Image/video URL handling & IPFS
├── features/              # Feature-specific utilities
│   ├── index.ts
│   └── admin-access.ts    # Admin access control
├── formatters/            # Display formatting
│   ├── index.ts
│   ├── general.ts         # Currency, numbers, dates
│   └── nft.ts             # NFT-specific formatting
├── marketplace/           # Marketplace utilities
│   ├── index.ts
│   └── nft-converters.ts  # NFT data transformations
├── performance/           # Performance monitoring
│   ├── index.ts
│   ├── cache.ts           # Cache invalidation
│   └── monitoring.ts      # Performance metrics
├── validation/            # Input validation
│   ├── index.ts
│   └── general.ts         # Address, tokenId, price validation
├── index.ts              # Barrel export
└── README.md             # This file
```

---

## Quick Reference

### Core Utilities

#### Development Logging (`core/dev-log.ts`)

```typescript
import { devLog } from "@/utils";

// Only logs in development mode
devLog.info("User action", { userId: "123" });
devLog.warn("Performance issue detected");
devLog.error("Critical error"); // Always logged
devLog.debug("Detailed debug info");

// Visual scanning with ASCII markers
devLog.success("Operation completed");
devLog.fail("Operation failed");
devLog.event("Event triggered");
devLog.cache("Cache updated");
devLog.api("API call");
```

#### BigInt Handling (`core/bigint.ts`)

```typescript
import { safeStringify, parseBigIntFields } from "@/utils";

// Serialize BigInt values
const data = { price: 1000000000000000000n }; // 1 ETH in Wei
const json = safeStringify(data);
// → '{"price":"1000000000000000000"}'

// Parse BigInt fields
const parsed = parseBigIntFields(data, ["price"]);
```

#### Media Utilities (`core/media.ts`)

```typescript
import {
  isVideo,
  isImage,
  convertIpfsToHttp,
  optimizeImageUrl,
  generateBlurDataUrl,
} from "@/utils";

// Check media types
isVideo("video.mp4"); // true
isImage("image.jpg"); // true

// IPFS conversion
convertIpfsToHttp("ipfs://QmHash...");
// → 'https://ipfs.io/ipfs/QmHash...'

// Image optimization
optimizeImageUrl("https://example.com/image.jpg", { width: 400 });
// → Cloudflare-optimized URL

// Generate blur placeholder
generateBlurDataUrl("https://example.com/image.jpg");
```

### Formatters

#### General Formatting (`formatters/general.ts`)

```typescript
import {
  formatPrice,
  formatNumber,
  formatDate,
  formatTimeAgo,
  formatPercentage,
  truncateAddress,
} from "@/utils";

// Currency formatting
formatPrice("1.5", "ETH"); // "1.5 ETH"
formatPrice("1.5"); // "1.5"

// Number formatting
formatNumber(1234567); // "1,234,567"
formatNumber(0.00123, 6); // "0.001230"

// Date formatting
formatDate(new Date()); // "Jan 23, 2026"
formatTimeAgo(Date.now() - 3600000); // "1 hour ago"

// Percentage
formatPercentage(0.1234); // "12.34%"
formatPercentage(0.1234, 1); // "12.3%"

// Address truncation
truncateAddress("0x1234...abcd", 6, 4); // "0x1234...abcd"
```

#### NFT Formatting (`formatters/nft.ts`)

```typescript
import { formatNFTDisplayName, formatContractName } from "@/utils";

// NFT display name
formatNFTDisplayName("Ape #123", "123", "Ape");
// → "Ape #123"

formatNFTDisplayName(null, "456", "NFT");
// → "NFT #456"

// Contract name formatting
formatContractName("0x...", "My Contract");
// → "My Contract (0x...)"
```

### Validation

#### Input Validation (`validation/general.ts`)

```typescript
import {
  isValidAddress,
  isValidTokenId,
  isValidPrice,
  isValidUrl,
  sanitizeInput,
} from "@/utils";

// Address validation
isValidAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
// → true

// Token ID validation
isValidTokenId("123"); // true
isValidTokenId("-1"); // false

// Price validation
isValidPrice("1.5"); // true
isValidPrice("-0.5"); // false

// URL validation
isValidUrl("https://example.com"); // true
isValidUrl("not-a-url"); // false

// Input sanitization
sanitizeInput('<script>alert("xss")</script>');
// → 'alert("xss")'
```

### API Utilities

#### NFT Utilities (`api/nft.ts`)

```typescript
import { createNFTKey, isDataFresh } from "@/utils";

// Generate unique NFT key
const key = createNFTKey("0x123...", "42");
// → "0x123...-42"

// Check data freshness
const isFresh = isDataFresh(lastFetchTimestamp, 5 * 60 * 1000); // 5 minutes
// → true/false
```

#### NFT Aggregation (`api/nft-aggregation.ts`)

```typescript
import { aggregateNFTsByCollection, deduplicateNFTs } from "@/utils";

// Aggregate by collection
const collections = aggregateNFTsByCollection(nfts);
// → Map<string, NFT[]>

// Remove duplicates
const unique = deduplicateNFTs(nfts);
```

### Performance

#### Performance Monitoring (`performance/monitoring.ts`)

```typescript
import {
  performanceMonitor,
  measureAsync,
  measureSync,
  getMemoryUsage,
  logPerformanceSummary,
} from "@/utils";

// Monitor async operations
const result = await measureAsync("fetchNFTs", async () => {
  return await fetchNFTs();
});

// Monitor sync operations
const value = measureSync("calculation", () => {
  return complexCalculation();
});

// Get memory usage
const memory = getMemoryUsage();
// → { heapUsed: 50.5, heapTotal: 100.2, ... }

// Log summary
logPerformanceSummary();
```

#### Cache Management (`performance/cache.ts`)

```typescript
import { createCacheInvalidationManager } from "@/utils";
import { devLog } from "@/utils";

const cacheManager = createCacheInvalidationManager({
  onInvalidate: (keys) => {
    devLog.info("Invalidating:", keys);
  },
});

// Invalidate cache
cacheManager.invalidate(["nft-123", "collection-xyz"]);

// Clear all
cacheManager.clearAll();
```

### Marketplace

#### NFT Converters (`marketplace/nft-converters.ts`)

```typescript
import { convertToEnrichedNFT, convertToMarketplaceItem } from "@/utils";

// Convert raw NFT to enriched NFT
const enriched = convertToEnrichedNFT(rawNFT, insights);

// Convert to marketplace item
const item = convertToMarketplaceItem(nft, listing);
```

### Features

#### Admin Access (`features/admin-access.ts`)

```typescript
import { hasAdminAccess, isAdminReadOnlyMode } from "@/utils";

// Check admin access
if (hasAdminAccess("0x123...")) {
  // User is admin
}

// Check read-only mode
if (isAdminReadOnlyMode()) {
  // Admin features disabled
}
```

---

## Usage Patterns

### Import from Barrel Export

```typescript
// ✅ Recommended: Use barrel export
import { formatPrice, isValidAddress, devLog } from "@/utils";

// ✅ Also valid: Direct import
import { formatPrice } from "@/utils/formatters/general";
```

### Backwards Compatibility

Legacy `@/utils/devLog` still works, but prefer the barrel export:

```typescript
import { devLog } from "@/utils";
```

### Combine Multiple Utilities

```typescript
import { formatPrice, isValidAddress, devLog, measureAsync } from "@/utils";

async function processNFT(address: string) {
  if (!isValidAddress(address)) {
    devLog.error("Invalid address:", address);
    return null;
  }

  return measureAsync("processNFT", async () => {
    const data = await fetchData(address);
    const price = formatPrice(data.price, "ETH");
    return { ...data, formattedPrice: price };
  });
}
```

---

## Best Practices

### ✅ DO

#### Write Pure Functions

```typescript
// ✅ No side effects, predictable output
function formatPrice(amount: string, currency: string = "ETH"): string {
  return `${amount} ${currency}`;
}
```

#### Use Type-Safe Inputs

```typescript
// ✅ Strong typing
function isValidTokenId(tokenId: string): boolean {
  return /^\d+$/.test(tokenId) && BigInt(tokenId) >= 0;
}
```

#### Handle Edge Cases

```typescript
// ✅ Null-safe, boundary checks
function truncate(text: string | null | undefined, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  if (length <= 3) return "...";
  return text.slice(0, length - 3) + "...";
}
```

#### Keep Functions Small

```typescript
// ✅ Single responsibility
function isVideo(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}
```

### ❌ DON'T

#### Don't Mutate Inputs

```typescript
// ❌ Mutates original array
function bad(arr: number[]): number[] {
  arr.sort();
  return arr;
}

// ✅ Creates new array
function good(arr: number[]): number[] {
  return [...arr].sort();
}
```

#### Don't Use `any`

```typescript
// ❌ Loses type safety
function bad(input: any): any {
  return input.toString();
}

// ✅ Specific types
function good(input: string | number | bigint): string {
  return input.toString();
}
```

#### Don't Add Side Effects

```typescript
// ❌ Unexpected side effect
function bad(data: Data): string {
  logToAnalytics(data); // Side effect!
  return data.toString();
}

// ✅ Pure function
function good(data: Data): string {
  return data.toString();
}
```

---

## Migration Notes

### Recent Changes

#### January 2026

- **Removed `utils/blockchain/`** → Moved to `@/services/blockchain`
  - Deprecated duplicate of `services/blockchain/contract-calls.ts`
  - All blockchain utilities consolidated in services layer

- **Moved `devLog.ts`** → `core/dev-log.ts`
  - Now exported from `@/utils/core`
  - Backwards compatible: `@/utils/devLog` still works via barrel export
  - Update imports to `@/utils` for clarity

### Import Path Updates

```typescript
// OLD (deprecated, removed)
import { executeContractCallWithFallback } from "@/utils/blockchain";

// NEW
import { executeContractCallWithFallback } from "@/services/blockchain";

// Preferred
import { devLog } from "@/utils";
```

---

## Testing Utilities

### Pure Function Testing

```typescript
import { truncateAddress, formatPrice } from "@/utils";

describe("truncateAddress", () => {
  it("should truncate long addresses", () => {
    expect(truncateAddress("0x1234567890abcdef", 6, 4)).toBe("0x1234...cdef");
  });

  it("should handle short addresses", () => {
    expect(truncateAddress("0x123", 6, 4)).toBe("0x123");
  });
});

describe("formatPrice", () => {
  it("should format with currency", () => {
    expect(formatPrice("1.5", "ETH")).toBe("1.5 ETH");
  });

  it("should handle missing currency", () => {
    expect(formatPrice("1.5")).toBe("1.5");
  });
});
```

### Performance Monitoring Tests

```typescript
import { measureSync, performanceMonitor } from "@/utils";

describe("Performance Monitoring", () => {
  it("should measure execution time", () => {
    const result = measureSync("test", () => {
      return 42;
    });
    expect(result).toBe(42);
  });

  it("should track metrics", () => {
    performanceMonitor.startMetric("test-metric");
    // ... operation ...
    performanceMonitor.endMetric("test-metric");

    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
  });
});
```

---

## Related Documentation

- **Services Layer**: [../services/README.md](../services/README.md)
- **Types System**: [../types/README.md](../types/README.md)
- **Architecture**: [../../docs/architecture/utilities.md](../../docs/architecture/utilities.md)
- **Development Setup**: [../../docs/development/setup.md](../../docs/development/setup.md)

---

## Support

For issues or questions:

1. Check [Architecture Documentation](../../docs/architecture/)
2. Review [Development Setup](../../docs/development/setup.md)
3. Examine existing utility implementations for patterns

# utils/ - Utility Functions

Reusable helper functions for common operations.

## Quick Reference

### **NFT Helpers** (`nft-helpers.ts`)
```typescript
import {
  truncateAddress,
  formatNFTDisplayName,
  isValidNFTAddress,
  isValidTokenId,
  getMediaType,
  convertIpfsUrl
} from '@/utils/nft-helpers';

// Address formatting
truncateAddress('0x1234...abcd', 6, 4);
// → "0x1234...abcd"

// NFT naming
formatNFTDisplayName('Ape #123', '123', 'NFT');
// → "Ape #123"

// Validation
isValidNFTAddress('0x...');  // true/false
isValidTokenId('123');       // true/false

// Media detection
getMediaType(imageUrl, animationUrl, videoUrl);
// → { type: 'image' | 'video' | 'audio' | 'unknown', url: string }

// IPFS conversion
convertIpfsUrl('ipfs://QmHash...');
// → "https://ipfs.io/ipfs/QmHash..."
```

### **Formatters** (`formatters.ts`)
```typescript
import {
  formatPrice,
  formatNumber,
  formatDate,
  formatTimeAgo
} from '@/utils/formatters';

// Price formatting
formatPrice('1.5', 'ETH');
// → "1.5 ETH"

// Number formatting
formatNumber(1234567);
// → "1,234,567"

// Date formatting
formatDate(new Date());
// → "Jan 19, 2026"

// Relative time
formatTimeAgo(timestamp);
// → "2 hours ago"
```

### **Validation** (`validation.ts`)
```typescript
import {
  validateAddress,
  validateTokenId,
  validatePrice,
  validateUrl
} from '@/utils/validation';

// Address validation
const result = validateAddress('0x...');
if (!result.valid) {
  console.error(result.error);
}

// Price validation
const priceValid = validatePrice('1.5');
```

### **String Utilities** (`string-utils.ts`)
```typescript
import {
  capitalize,
  slugify,
  truncate
} from '@/utils/string-utils';

capitalize('hello world');  // "Hello world"
slugify('Hello World!');    // "hello-world"
truncate('Long text...', 50);  // "Long text..."
```

### **Array Utilities** (`array-utils.ts`)
```typescript
import {
  unique,
  groupBy,
  chunk
} from '@/utils/array-utils';

// Remove duplicates
unique([1, 2, 2, 3]);  // [1, 2, 3]

// Group by property
groupBy(items, 'category');
// → { art: [...], gaming: [...] }

// Split into chunks
chunk([1, 2, 3, 4], 2);
// → [[1, 2], [3, 4]]
```

### **Error Handling** (`errors.ts`)
```typescript
import { 
  handleError,
  isNetworkError,
  getUserFriendlyError
} from '@/utils/errors';

try {
  await operation();
} catch (error) {
  const message = getUserFriendlyError(error);
  console.error(message);
}
```

## Utility Organization

```
utils/
├── nft-helpers.ts          # NFT-specific utilities
├── formatters.ts           # Formatting functions
├── validation.ts           # Input validation
├── string-utils.ts         # String operations
├── array-utils.ts          # Array operations
├── errors.ts               # Error handling
├── date-utils.ts           # Date/time utilities
└── devLog.ts              # Development logging
```

## Best Practices

### ✅ DO:
```typescript
// Pure functions - no side effects
function formatPrice(amount: string): string {
  return `${amount} ETH`;
}

// Type-safe inputs and outputs
function isValid(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
}

// Handle edge cases
function truncate(text: string | null, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
```

### ❌ DON'T:
```typescript
// Don't mutate inputs
function bad(arr: number[]) {
  arr.sort();  // ❌ Mutates original
  return arr;
}

function good(arr: number[]) {
  return [...arr].sort();  // ✅ Creates copy
}

// Don't use any
function bad(input: any) { }  // ❌

function good(input: string | number) { }  // ✅
```

## Testing Utilities

```typescript
// Most utility functions are pure - easy to test
import { truncateAddress } from '@/utils/nft-helpers';

test('truncateAddress', () => {
  expect(truncateAddress('0x1234567890', 4, 4))
    .toBe('0x12...7890');
});
```

## Related Documentation

- **NFT Helpers**: See [/docs/architecture/utilities.md](/docs/architecture/utilities.md)
- **Architecture**: [/docs/architecture/overview.md](/docs/architecture/overview.md)

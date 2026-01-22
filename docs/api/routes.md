# 🚀 API Reference

## Overview

All API routes are located in `/src/app/api/` and follow Next.js App Router conventions.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

---

## NFT Stats API

### GET `/api/nft/stats`

Fetch statistics for a specific NFT.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contractAddress` | string | Yes | NFT contract address |
| `tokenId` | string | Yes | Token ID |

#### Response

```typescript
{
  success: boolean;
  data: {
    contractAddress: string;
    tokenId: string;
    viewCount: number;
    favoriteCount: number;
    averageRating: number;
    ratingCount: number;
    watchlistCount: number;
    lastViewed?: string;
  };
}
```

#### Example

```typescript
const response = await fetch(
  '/api/nft/stats?contractAddress=0x41655ae49482de69eec8f6875c34a8ada01965e2&tokenId=652'
);
const { success, data } = await response.json();
console.log(data.favoriteCount); // 42
```

#### Caching

- **TTL**: 5 seconds
- **Cache Key**: `{contractAddress}-{tokenId}`
- **Max Entries**: 1000
- **Performance**: ~99.5% faster on cache hit (2000ms → 10ms)

---

### POST `/api/nft/stats`

Record a view for an NFT.

#### Request Body

```typescript
{
  contractAddress: string;  // Required
  tokenId: string;          // Required
  userId?: string;          // Optional - wallet address
}
```

#### Response

```typescript
{
  success: boolean;
  data: {
    message: string;
  };
}
```

#### Example

```typescript
await fetch('/api/nft/stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractAddress: '0x41655ae49482de69eec8f6875c34a8ada01965e2',
    tokenId: '652',
    userId: '0xf034e8ad11F249c8081d9da94852bE1734bc11a4'
  })
});
```

#### Side Effects

- Increments `viewCount` in stats collection
- Inserts view record with timestamp
- **Invalidates stats cache** for this NFT

---

## User Interactions API

### GET `/api/user/interactions`

Fetch user's interactions with a specific NFT.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's wallet address |
| `contractAddress` | string | Yes | NFT contract address |
| `tokenId` | string | Yes | Token ID |

#### Response

```typescript
{
  success: boolean;
  data: {
    // Favorites
    isFavorite: boolean;
    favoriteAddedAt?: string;
    
    // Ratings
    rating?: number;           // 1-5
    ratedAt?: string;
    
    // Watchlist
    isWatchlisted: boolean;
    watchlistAddedAt?: string;
    
    // Personal Notes (private)
    personalNotes?: string;
    strategy?: string;
    investmentGoal?: string;
    riskLevel?: string;
    
    // Metadata
    userId: string;
    contractAddress: string;
    tokenId: string;
    lastUpdated: string;
  };
}
```

#### Example

```typescript
const response = await fetch(
  '/api/user/interactions?' + new URLSearchParams({
    userId: '0xf034e8ad11F249c8081d9da94852bE1734bc11a4',
    contractAddress: '0x41655ae49482de69eec8f6875c34a8ada01965e2',
    tokenId: '652'
  })
);
const { data } = await response.json();
console.log(data.isFavorite); // true
console.log(data.rating); // 4
```

#### Caching

- **TTL**: 10 seconds
- **Cache Key**: `{userId}-{contractAddress}-{tokenId}`
- **Max Entries**: 500

---

### POST `/api/user/interactions`

Update user's interactions with an NFT.

#### Request Body

```typescript
{
  userId: string;              // Required - wallet address
  contractAddress: string;     // Required
  tokenId: string;             // Required
  
  // Actions (all optional, send only what you want to update)
  isFavorite?: boolean;
  rating?: number;             // 1-5, or 0 to remove
  isWatchlisted?: boolean;
  
  // Personal notes (optional, private to user)
  personalNotes?: string;
  strategy?: string;
  investmentGoal?: string;
  riskLevel?: string;
}
```

#### Response

```typescript
{
  success: boolean;
  data: UserInteractionData;   // Full updated interaction data
  message: string;
  results: {
    favorites?: { acknowledged: boolean };
    ratings?: { acknowledged: boolean };
    watchlist?: { acknowledged: boolean };
    personalNotes?: { acknowledged: boolean };
  };
}
```

#### Example: Like NFT

```typescript
await fetch('/api/user/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '0xf034e8ad11F249c8081d9da94852bE1734bc11a4',
    contractAddress: '0x41655ae49482de69eec8f6875c34a8ada01965e2',
    tokenId: '652',
    isFavorite: true
  })
});
```

#### Example: Set Rating

```typescript
await fetch('/api/user/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '0xf034e8ad11F249c8081d9da94852bE1734bc11a4',
    contractAddress: '0x41655ae49482de69eec8f6875c34a8ada01965e2',
    tokenId: '652',
    rating: 5
  })
});
```

#### Example: Update Multiple

```typescript
await fetch('/api/user/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '0xf034e8ad11F249c8081d9da94852bE1734bc11a4',
    contractAddress: '0x41655ae49482de69eec8f6875c34a8ada01965e2',
    tokenId: '652',
    isFavorite: true,
    isWatchlisted: true,
    rating: 4,
    personalNotes: 'Great project!'
  })
});
```

#### Side Effects

- Updates relevant MongoDB collections:
  - `user_favorites`
  - `user_ratings`
  - `user_watchlist`
  - `user_personal_notes`
- Updates denormalized stats in `nft_stats`:
  - `favoriteCount`
  - `averageRating` & `ratingCount`
  - `watchlistCount`
- **Invalidates ALL caches** for this NFT:
  - Stats cache (affects all users)
  - Interactions cache (user-specific)
- Dispatches `nft-stats-updated` event

#### Important Notes

- All operations are **atomic** (single transaction)
- Denormalized stats ensure **fast reads**
- Cache invalidation ensures **immediate UI updates**

---

### PUT `/api/user/interactions`

Alias for POST (for convenience).

---

## Admin APIs

### POST `/api/admin/fix-stats`

Recalculate NFT statistics from raw data.

⚠️ **Admin only** - Requires authentication

#### Request Body

```typescript
{
  contractAddress: string;  // Required
  tokenId: string;          // Required
}
```

#### Response

```typescript
{
  success: boolean;
  data: {
    contractAddress: string;
    tokenId: string;
    oldStats: NFTStats;
    newStats: NFTStats;
    changes: string[];
  };
}
```

#### What It Does

1. Counts raw favorites from `user_favorites`
2. Counts raw watchlist entries from `user_watchlist`
3. Recalculates average rating from `user_ratings`
4. Updates `nft_stats` collection
5. Invalidates stats cache

#### Use Cases

- Fix data inconsistencies
- Manual correction after migration
- Debugging stat issues

---

## Session API

### GET `/api/auth/session`

Get current user session (if using NextAuth or similar).

#### Response

```typescript
{
  user?: {
    address: string;
    // ... other user data
  };
  expires?: string;
}
```

---

## Error Responses

All API routes follow a consistent error format:

```typescript
{
  success: false;
  error: string;  // Human-readable error message
}
```

### Common HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting

### Current Limits

- **Stats API**: No limit (cached)
- **Interactions API**: 100 requests/minute per user
- **Admin APIs**: 10 requests/minute

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

---

## Caching Strategy

### Cache Headers

API routes return appropriate cache headers:

```
Cache-Control: public, s-maxage=5, stale-while-revalidate=10
```

### Invalidation

Caches are automatically invalidated when:
- User performs an action (like, rate, watchlist)
- Admin fixes stats
- View is recorded

### Monitoring

Get cache statistics (development only):

```typescript
import { getCacheStats } from '@/lib/cache';

const stats = getCacheStats();
console.log(stats);
// {
//   stats: { size: 234, maxSize: 1000, ... },
//   interactions: { size: 89, maxSize: 500, ... }
// }
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const response = await fetch('/api/nft/stats?...');
  if (!response.ok) throw new Error('API error');
  const data = await response.json();
} catch (error) {
  console.error('Failed to fetch stats:', error);
  // Show user-friendly error
}
```

### 2. Use TypeScript Types

```typescript
import type { NFTStats, UserInteractionData } from '@/types';

const stats: NFTStats = await fetchStats();
```

### 3. Validate Input

```typescript
import { isValidNFTAddress, isValidNFTTokenId } from '@/utils/nft-helpers';

if (!isValidNFTAddress(contractAddress)) {
  throw new Error('Invalid contract address');
}
```

### 4. Optimize Requests

```typescript
// ✅ Good: Fetch once, cache locally
const stats = await fetchStats(contract, tokenId);

// ❌ Bad: Fetch repeatedly
setInterval(() => fetchStats(...), 1000);
```

### 5. Use Event System

```typescript
// Listen for real-time updates instead of polling
window.addEventListener('nft-stats-updated', (event) => {
  if (event.detail.contractAddress === myContract) {
    updateUI(event.detail.stats);
  }
});
```

---

## Integration Examples

### React Component

```typescript
import { useEffect, useState } from 'react';
import type { NFTStats } from '@/types';

function NFTStatsDisplay({ contract, tokenId }: Props) {
  const [stats, setStats] = useState<NFTStats | null>(null);
  
  useEffect(() => {
    fetch(`/api/nft/stats?contractAddress=${contract}&tokenId=${tokenId}`)
      .then(res => res.json())
      .then(({ data }) => setStats(data));
      
    // Listen for updates
    const handler = (e: CustomEvent) => {
      if (e.detail.contractAddress === contract && e.detail.tokenId === tokenId) {
        setStats(prev => ({ ...prev, ...e.detail.stats }));
      }
    };
    
    window.addEventListener('nft-stats-updated', handler);
    return () => window.removeEventListener('nft-stats-updated', handler);
  }, [contract, tokenId]);
  
  return <div>{stats?.favoriteCount} likes</div>;
}
```

### Using Context

```typescript
import { useNFTStatsContext } from '@/contexts/NFTStatsContext';

function LikeButton({ contract, tokenId }: Props) {
  const { favorites, toggleFavorite } = useNFTStatsContext();
  
  const nftKey = `${contract}-${tokenId}`;
  const isLiked = favorites.has(nftKey);
  
  return (
    <button onClick={() => toggleFavorite(contract, tokenId)}>
      {isLiked ? '❤️ Liked' : '🤍 Like'}
    </button>
  );
}
```

---

**Last Updated**: 2025-10-15

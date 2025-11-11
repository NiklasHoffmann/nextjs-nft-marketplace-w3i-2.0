# 🏗️ System Architecture

## Overview

NFT Marketplace 2.0 is a modern, full-stack application built with Next.js 15 App Router, featuring a clean separation of concerns and modular architecture.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript 5.4.5** - Type safety
- **Tailwind CSS** - Styling
- **React 18** - UI library

### Web3
- **Wagmi 2.x** - React hooks for Ethereum
- **Viem 2.x** - TypeScript Ethereum interface
- **RainbowKit 2.x** - Wallet connection UI

### Data Layer
- **Apollo Client 3.x** - GraphQL client
- **TanStack Query 5.x** - Data fetching & caching
- **MongoDB 6.x** - Database for stats & user data

### State Management
- **React Context** - Global state (Currency, NFT, Stats)
- **Custom Hooks** - Encapsulated logic
- **Apollo Cache** - GraphQL data caching
- **In-Memory Cache** - API response caching

## Architecture Patterns

### 1. Context-Based State Management

#### NFTContext
**Location**: `/src/contexts/NFTContext.tsx`

Manages NFT collection data from The Graph Protocol.

```typescript
interface NFTContextType {
  nfts: NFT[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}
```

**Features**:
- GraphQL subscription for real-time updates
- Apollo cache persistence
- Automatic refetch on connection
- Error boundary integration

#### NFTStatsContext
**Location**: `/src/contexts/NFTStatsContext.tsx`

Manages user interactions (favorites, watchlist, ratings) and NFT statistics.

```typescript
interface NFTStatsContextType {
  // User Interactions
  favorites: Set<string>;
  watchlist: Set<string>;
  ratings: Map<string, number>;
  
  // Actions
  toggleFavorite: (contractAddress: string, tokenId: string) => Promise<void>;
  toggleWatchlist: (contractAddress: string, tokenId: string) => Promise<void>;
  setRating: (contractAddress: string, tokenId: string, rating: number) => Promise<void>;
  
  // Stats
  getStats: (contractAddress: string, tokenId: string) => NFTStats;
}
```

**Key Features**:
- **Type-Safe Events**: Custom `NFTStatsUpdateEvent` for cross-component updates
- **Optimistic Updates**: Immediate UI feedback
- **API Integration**: Syncs with MongoDB backend
- **Cache Invalidation**: Smart cache management via `invalidateAllCachesForNFT()`
- **Session Persistence**: Logged-in users get persistent data

**Event System**:
```typescript
// Dispatch stats update
dispatchNFTStatsUpdate({
  contractAddress: '0x...',
  tokenId: '123',
  stats: { favoriteCount: 42, ... },
  source: 'toggleFavorite'
});

// Listen for updates
window.addEventListener('nft-stats-updated', (event) => {
  console.log('Stats updated:', event.detail);
});
```

#### CurrencyContext
**Location**: `/src/contexts/CurrencyContext.tsx`

Manages multi-currency support and exchange rates.

```typescript
interface CurrencyContextType {
  currentCurrency: Currency;
  exchangeRates: Record<string, number>;
  setCurrentCurrency: (currency: Currency) => void;
  convertPrice: (ethPrice: bigint, toCurrency: string) => number;
}
```

**Features**:
- Real-time exchange rates from CoinGecko
- Local storage persistence
- Automatic rate refresh (5 minutes)

### 2. Custom Hooks Pattern

#### useImageCache
**Location**: `/src/hooks/nfts/04-ui-useImageCache.tsx`

Optimizes NFT image loading with caching and lazy loading.

```typescript
const { 
  imageSrc,      // Optimized image URL
  isLoading,     // Loading state
  hasError       // Error state
} = useImageCache(originalUrl, nftId);
```

**Features**:
- IPFS gateway fallbacks
- Browser cache integration
- Lazy loading support
- Error handling with retries

### 3. API Route Architecture

#### Stats API - `/api/nft/stats`
**GET** - Fetch NFT statistics
**POST** - Record NFT view

**Caching Strategy**:
- In-memory cache (5 second TTL)
- 99.5% faster on cache hits (2000ms → 10ms)
- Auto-cleanup (max 1000 entries)

```typescript
// Shared cache module
import { getCachedStats, setCachedStats, invalidateStatsCache } from '@/lib/cache';

// GET handler
const cached = getCachedStats<NFTStats>(contractAddress, tokenId);
if (cached) return NextResponse.json({ success: true, data: cached });

// Fetch from DB...
setCachedStats(contractAddress, tokenId, stats);
```

#### User Interactions API - `/api/user/interactions`
**GET** - Fetch user's interactions with NFT
**POST** - Update interactions (favorite, watchlist, rating, notes)

**Features**:
- Batch updates (single DB transaction)
- Cache invalidation for both stats AND interactions
- Denormalized stats for performance

```typescript
// Critical: Invalidate ALL related caches
invalidateAllCachesForNFT(contractAddress, tokenId, userId);
```

#### Admin API - `/api/admin/fix-stats`
**POST** - Recalculate NFT stats from raw data

**Use Case**: Fix data inconsistencies, manual stat corrections

### 4. Shared Cache Architecture

**Location**: `/src/lib/cache.ts`

Centralized cache management for API routes.

```typescript
// Stats cache (5s TTL, max 1000 entries)
getCachedStats<T>(contractAddress, tokenId): T | null
setCachedStats<T>(contractAddress, tokenId, stats: T): void
invalidateStatsCache(contractAddress, tokenId): void

// Interactions cache (10s TTL, max 500 entries)
getCachedInteractions<T>(userId, contractAddress, tokenId): T | null
setCachedInteractions<T>(userId, contractAddress, tokenId, data: T): void
invalidateInteractionsCache(userId, contractAddress, tokenId): void

// Batch invalidation (critical for consistency)
invalidateAllCachesForNFT(contractAddress, tokenId, userId?): void

// Monitoring
getCacheStats(): { stats: {...}, interactions: {...} }
clearAllCaches(): void
```

**Why Shared Cache?**
- ✅ Atomic cache invalidation across routes
- ✅ No stale data issues
- ✅ Single source of truth
- ✅ Easy monitoring and debugging

### 5. Type System

**Location**: `/src/types/`

Centralized TypeScript types for consistency.

#### Core NFT Types (`types/nft.ts`)
```typescript
interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name?: string;
  description?: string;
  image?: string;
  // ... 30+ properties
}
```

#### Event Types (`types/events.ts`)
```typescript
interface NFTStatsUpdateDetail {
  contractAddress: string;
  tokenId: string;
  stats: Partial<NFTStats>;
  source: 'toggleFavorite' | 'toggleWatchlist' | 'setRating' | 'api';
}

// Type-safe event dispatch
export function dispatchNFTStatsUpdate(detail: NFTStatsUpdateDetail): void;

// Window event map augmentation for IntelliSense
declare global {
  interface WindowEventMap {
    'nft-stats-updated': NFTStatsUpdateEvent;
  }
}
```

### 6. Component Architecture

#### Modular Component Structure

**Example**: NFT Detail Page

```
/app/nft/[nftAddress]/[tokenId]/
├── page.tsx                    # Route handler (250 lines, down from 930)
└── components/
    ├── 01-core-DetailHeader.tsx          # Title, actions, navigation
    ├── 02-core-MediaSection.tsx          # Image/video display
    ├── 03-core-NFTPriceCard.tsx          # Price, buy button
    ├── 04-navigation-CategoryPills.tsx    # Tags, categories
    ├── 05-navigation-TabNavigation.tsx    # Tab switcher
    ├── 06-content-InfoTabs.tsx           # Tab content container
    ├── tabs/
    │   ├── 01-ProjektTab.tsx
    │   ├── 03-FunctionalitiesTab.tsx
    │   └── 08-TokenomicsTab.tsx
    ├── 08-features-SwapTargetInfo.tsx
    ├── 09-utils-LoadingSpinner.tsx
    └── 10-utils-ErrorDisplay.tsx
```

**Benefits**:
- Single Responsibility Principle
- Easy testing
- Reusable components
- Clear data flow

#### Component Patterns

**1. Performance Optimization**
```typescript
// Memoized expensive computations
const mediaType = useMemo(() => 
  getMediaType(nft?.image, nft?.animation_url, nft?.video_url),
  [nft?.image, nft?.animation_url, nft?.video_url]
);

// Memoized callbacks
const handleTabChange = useCallback((tab: string) => {
  setActiveTab(tab);
}, []);

// Memoized components
const NFTCard = React.memo(({ nft }: Props) => { ... });
```

**2. Error Handling**
```typescript
// Component-level error boundaries
<ErrorBoundary fallback={<ErrorDisplay />}>
  <NFTDetailContent />
</ErrorBoundary>

// Conditional rendering with loading states
{loading ? <LoadingSpinner /> : <Content />}
{error ? <ErrorDisplay error={error} /> : null}
```

**3. Data Validation**
```typescript
// Utility validators
if (!isValidNFTAddress(contractAddress)) {
  return <ErrorDisplay message="Invalid NFT address" />;
}

if (!isValidNFTTokenId(tokenId)) {
  return <ErrorDisplay message="Invalid token ID" />;
}
```

## Data Flow

### 1. NFT Data Fetching

```
User visits page
    ↓
Next.js SSR/SSG
    ↓
Apollo Client → The Graph Subgraph
    ↓
NFTContext provides data
    ↓
Components consume via useNFTContext()
    ↓
Real-time updates via GraphQL subscription
```

### 2. User Interactions Flow

```
User clicks "Like" button
    ↓
NFTStatsContext.toggleFavorite()
    ↓
Optimistic update (immediate UI feedback)
    ↓
POST /api/user/interactions
    ↓
MongoDB: Update favorites + denormalized stats
    ↓
invalidateAllCachesForNFT() ← Critical!
    ↓
Dispatch 'nft-stats-updated' event
    ↓
All components listening re-render with fresh data
    ↓
Next GET /api/nft/stats → Cache miss → Fresh data
```

### 3. Cache Invalidation Flow

```
User action (like/watchlist/rating)
    ↓
POST /api/user/interactions
    ↓
DB updates complete
    ↓
invalidateAllCachesForNFT(contractAddress, tokenId, userId)
    ├─ invalidateStatsCache(contractAddress, tokenId)
    └─ invalidateInteractionsCache(userId, contractAddress, tokenId)
    ↓
Next request: Cache miss → Fresh DB query
```

## Performance Optimizations

### 1. API Caching
- **Stats**: 5s TTL, 99.5% faster cache hits
- **Interactions**: 10s TTL, user-specific
- **Auto-cleanup**: Max entries to prevent memory leaks

### 2. Client-Side
- **Apollo Cache**: Persisted to IndexedDB
- **Image Cache**: Browser cache + lazy loading
- **React Optimization**: useCallback, useMemo, React.memo

### 3. Database
- **Denormalized Stats**: Avoid expensive aggregations
- **Indexes**: On contractAddress + tokenId
- **Batch Operations**: Single transaction for multiple updates

## Error Handling

### 1. API Routes
```typescript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { success: false, error: 'Descriptive message' },
    { status: 500 }
  );
}
```

### 2. React Components
```typescript
<ErrorBoundary 
  fallback={<ErrorDisplay />}
  onError={(error) => console.error(error)}
>
  <Component />
</ErrorBoundary>
```

### 3. GraphQL
```typescript
const { data, loading, error } = useQuery(QUERY);

if (error) return <ErrorDisplay error={error} />;
```

## Security

### 1. Admin Routes
- Authentication check before sensitive operations
- API key validation
- Rate limiting

### 2. User Data
- Address validation
- Input sanitization
- CORS configuration

### 3. Smart Contracts
- Read-only operations via Viem
- No private key handling
- Public RPC endpoints

## Testing Strategy

### 1. Unit Tests
- Utility functions
- Custom hooks
- Type validators

### 2. Integration Tests
- API routes
- Context providers
- Cache invalidation

### 3. E2E Tests
- User flows (like, watchlist, rating)
- NFT detail page
- Wallet connection

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] API rate limits set
- [ ] Error tracking enabled
- [ ] Cache monitoring active
- [ ] Build optimization verified

---

**Last Updated**: 2025-10-15

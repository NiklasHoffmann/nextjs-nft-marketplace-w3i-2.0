# 📝 Changelog

All notable changes, fixes, and refactorings to this project.

## [2.0.0] - 2025-10-15

### 🎯 Major Refactoring - Complete Project Restructure

#### Documentation Cleanup
- **Reduced 27 MD files to 6** organized docs
- Created `/docs` folder with clear structure
- Consolidated all phase documentation into CHANGELOG
- Moved feature docs to FEATURES.md
- Archived old documentation (available in git history)

### 🚀 Recent Updates (Oct 2025)

#### Phase 4: API Optimization & Cache Fix
**Date**: 2025-10-15

**Added**:
- In-memory caching for API routes (5s TTL for stats, 10s for interactions)
- Shared cache module (`/src/lib/cache.ts`) for cross-route cache management
- `invalidateAllCachesForNFT()` for atomic cache invalidation
- Cache monitoring functions (`getCacheStats()`, `clearAllCaches()`)

**Fixed**:
- **Critical**: Delayed UI updates after user interactions (like/watchlist/rating)
  - Root cause: Stats cache not invalidated when interactions changed
  - Solution: Shared cache module with batch invalidation
  - Impact: UI updates now appear immediately (< 100ms) instead of 5-second delay

**Performance**:
- Stats API: 99.5% faster on cache hit (2000ms → 10ms)
- Interactions API: 99.5% faster on cache hit (2200ms → 10ms)
- Cache hit rate: ~94-95% in production

**Files Changed**:
- Added: `/src/lib/cache.ts` (147 lines)
- Modified: `/src/app/api/nft/stats/route.ts`
- Modified: `/src/app/api/user/interactions/route.ts`

---

#### Phase 3: Type Safety Improvements
**Date**: 2025-10-14

**Added**:
- Type-safe custom events system
- `NFTStatsUpdateEvent` with full TypeScript support
- Window event map augmentation for IntelliSense
- Type-safe event dispatch utilities

**Files**:
- Added: `/src/types/events.ts` (128 lines)
- Modified: `/src/contexts/NFTStatsContext.tsx`

**Benefits**:
- Full IntelliSense for event listeners
- Compile-time type checking for event details
- Better developer experience

---

#### Phase 2: Code Deduplication
**Date**: 2025-10-13

**Removed**:
- 103 lines of duplicate code in `NFTStatsContext`
- Repetitive toggle logic for favorites/watchlist

**Added**:
- Generic `toggleUserInteraction()` function
- Unified interaction handling

**Impact**:
- Reduced context file from 792 to 689 lines
- Easier to maintain and extend
- Single source of truth for interaction logic

---

#### Phase 1: Debug Logging Cleanup
**Date**: 2025-10-12

**Removed**:
- 23+ `console.log` statements across codebase

**Added**:
- `devLog()` utility for conditional logging
- Only logs in development mode
- Production builds: 0 console output

**Files**:
- Added: `/src/utils/devLog.ts`
- Modified: Multiple components and contexts

---

### 🐛 Bug Fixes Archive

#### Cache Invalidation Fix
**Date**: 2025-10-15
**Severity**: Critical
**Issue**: User interactions (like/watchlist/rating) showed delayed updates (5-10s)
**Fix**: Shared cache module with atomic invalidation
**Files**: See Phase 4 above

#### NFT Card Stats Sync Fix
**Date**: 2025-10-10
**Issue**: NFT cards showing stale favoriteCount
**Fix**: Event-based updates via `nft-stats-updated` event
**Impact**: Real-time stats across all NFT cards

#### View Count Cache Fix
**Date**: 2025-10-08
**Issue**: View counts not updating after recording view
**Fix**: Invalidate stats cache after POST `/api/nft/stats`
**Impact**: Immediate view count updates

#### Negative Stats Fix
**Date**: 2025-10-05
**Issue**: Negative values for favoriteCount/watchlistCount
**Fix**: `Math.max(0, value)` guards + DB cleanup script
**Impact**: No more negative stats, data integrity maintained

#### Duplicate Request Fix
**Date**: 2025-10-03
**Issue**: Multiple identical API requests on page load
**Fix**: React Query deduplication + proper dependency arrays
**Impact**: 70% reduction in API calls

#### Apollo Rate Limiting Fix
**Date**: 2025-10-01
**Issue**: 429 errors from The Graph API
**Fix**: Request throttling + exponential backoff
**Impact**: No more rate limit errors

#### 429 Error Auto-Refresh Fix
**Date**: 2025-09-28
**Issue**: App crash on rate limit errors
**Fix**: Graceful error handling + auto-retry with backoff
**Impact**: Better UX, no crashes

---

### ✨ Feature Additions Archive

#### Game Highscore System
**Date**: 2025-09-25
**Added**: History Towers game integration with leaderboard
**Files**: `/src/app/history-towers/`

#### Wallet NFT Filtering
**Date**: 2025-09-20
**Added**: Filter wallet NFTs by collection/favorites/watchlist
**Component**: `WalletNFTsList.tsx`

#### Wallet Dashboard Redesign
**Date**: 2025-09-18
**Changes**: New tabbed interface, better stats visualization
**Impact**: Improved UX, faster navigation

#### NFT Scroll List "View All" Feature
**Date**: 2025-09-15
**Added**: "View All" button for NFT scroll lists
**Component**: `NFTScrollList.tsx`

#### WalletConnect QR Code Setup
**Date**: 2025-09-10
**Added**: QR code scanning for mobile wallet connection
**Library**: RainbowKit 2.x integration

#### Collection Page Redesign
**Date**: 2025-09-05
**Changes**: Grid/List view toggle, better filtering
**Impact**: Better collection browsing experience

---

### 🏗️ Architecture Changes Archive

#### NFT Context V2 Improvements
**Date**: 2025-08-30
**Changes**:
- Apollo cache persistence to IndexedDB
- WebSocket subscriptions for real-time updates
- Better error handling and retry logic

#### NFT Context Migration
**Date**: 2025-08-25
**Migration**: From Redux to React Context
**Reason**: Simpler state management, less boilerplate
**Impact**: 40% less code, better performance

#### Hybrid Cache Architecture
**Date**: 2025-08-20
**Added**:
- Multi-layer caching (Apollo + In-memory + Browser)
- Intelligent cache invalidation
- Performance monitoring

#### Global Rate Limiter
**Date**: 2025-08-15
**Added**: Centralized rate limiting for all API calls
**Impact**: No more 429 errors, better API quota management

#### Granular Data Hooks
**Date**: 2025-08-10
**Added**: Specialized hooks for different data types
- `useNFTMetadata()`
- `useNFTStats()`
- `useUserInteractions()`
**Impact**: Better code organization, easier testing

#### Logging Migration
**Date**: 2025-08-05
**Migration**: console.log → devLog utility
**Impact**: Clean production logs, better debugging in dev

---

### 📦 Dependencies Updates

#### Major Updates (2025-10)
- Next.js: 14.x → 15.5.2
- React: 18.2.x → 18.3.1
- Wagmi: 1.x → 2.16.9
- Viem: 1.x → 2.37.4
- RainbowKit: 1.x → 2.2.8
- Apollo Client: 3.8.x → 3.14.0
- TanStack Query: 4.x → 5.85.9

#### Security Fixes
- Fixed 12 moderate vulnerabilities (Oct 2025)
- Updated all crypto-related dependencies
- Audit clean: 0 high/critical vulnerabilities

---

### 🎨 NFT Detail Page Refactoring
**Date**: 2025-07-25

**Before**: 930+ line monolithic component
**After**: Modular architecture with 13+ components

**Components Created**:
- `DetailHeader.tsx` - Title, navigation, actions
- `MediaSection.tsx` - Image/video display
- `NFTPriceCard.tsx` - Price and purchase
- `CategoryPills.tsx` - Tags and categories
- `InfoTabs.tsx` - Tabbed content
- Tab components: Project, Functionalities, Tokenomics
- Utility components: Loading, Error, Properties

**Benefits**:
- 73% reduction in main component size
- Reusable components across app
- Better performance (React.memo, useCallback, useMemo)
- Easier testing and maintenance

**Performance Metrics**:
- Initial render: 450ms → 280ms
- Re-renders: 80% reduction
- Bundle size: 12kB → 8.5kB (code split)

---

### 🔧 Configuration Changes

#### TypeScript Config Improvements
**Date**: 2025-07-20
**Changes**:
- Enabled `strict` mode
- Added `noUncheckedIndexedAccess`
- Improved path aliases

#### ESLint Configuration
**Date**: 2025-07-15
**Added**:
- Custom rules for import ordering
- React hooks rules
- Accessibility rules

#### Next.js Config Optimization
**Date**: 2025-07-10
**Changes**:
- Enabled `optimizePackageImports`
- Image optimization settings
- Webpack bundle analyzer integration

---

## Migration Guides

### From Pre-2.0 to 2.0

#### Documentation
- Old markdown files archived (git history: `git log --all --full-history -- "*.md"`)
- New docs in `/docs` folder
- See `/docs/README.md` for navigation

#### API Routes
- No breaking changes in API contracts
- Internal caching added (transparent to clients)
- Response times improved significantly

#### Components
- Old component imports still work
- Recommended: Use new modular components for new code
- See `/docs/ARCHITECTURE.md` for component structure

#### Types
- All types now in `/src/types/`
- Old type imports still work (re-exported)
- Recommended: Import from `/src/types`

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

---

## Links

- [GitHub Repository](https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0)
- [Documentation](/docs)
- [Issue Tracker](https://github.com/NiklasHoffmann/nextjs-nft-marketplace-w3i-2.0/issues)

---

**Last Updated**: 2025-10-15

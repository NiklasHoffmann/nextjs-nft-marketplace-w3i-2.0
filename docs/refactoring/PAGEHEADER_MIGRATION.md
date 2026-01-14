# PageHeader Migration Plan

## Executive Summary
Refactoring all page headers to use the new unified `PageHeader` component for better maintainability, consistency, and code quality.

## Current State Analysis

### Files to Migrate
1. ✅ **WalletHeader** (`src/app/wallet/components/WalletHeader.tsx`) - 92 lines
2. ✅ **CollectionPageClient** (inline header in `src/app/nft/components/CollectionPageClient.tsx`) - ~80 lines
3. ✅ **NFTDetailHeader** (`src/app/nft/[contractAddress]/[tokenId]/components/DetailHeader.tsx`) - 289 lines
4. ⚠️ **SellHeader** (`src/app/sell/components/common/SellHeader.tsx`) - 160 lines (complex with progress tracking)

### Code Duplication Metrics
- **Total Lines**: ~621 lines across 4 headers
- **Duplicate Markup**: ~60% (back button, separator, icon badge, title section)
- **Unique Logic**: ~40% (stats, interactions, progress tracking)
- **Expected Reduction**: ~200-250 lines removed

### Common Patterns Identified
```
Pattern                    | Frequency | Lines | Duplication
---------------------------|-----------|-------|------------
Back Button                | 4/4       | ~8    | 100%
Separator (vertical line)  | 4/4       | ~2    | 100%
Icon Badge (gradient)      | 4/4       | ~6    | 100%
Title Section              | 4/4       | ~8    | 100%
Copyable Address           | 2/4       | ~15   | 50%
Fixed Positioning          | 4/4       | ~3    | 100%
Sidebar Offset (md:left-16)| 1/4       | ~1    | 25%
```

## Migration Strategy

### Phase 1: Setup ✅ COMPLETE
- [x] Create `PageHeader` component with full TypeScript types
- [x] Create barrel export (`index.ts`)
- [x] Write comprehensive documentation
- [x] Add usage examples

### Phase 2: Simple Migrations (Low Risk)
**Priority Order**: Simplest → Most Complex

#### 2.1 Wallet Page (RECOMMENDED FIRST)
**Complexity**: ⭐ Low
**Risk**: 🟢 Low
**Impact**: High visibility page

**Current**: `WalletHeader.tsx` (92 lines)
```tsx
// 40+ lines of JSX markup
<div className="fixed top-[66px]...">
  <Link href="/marketplace">...</Link>
  <div className="w-px h-8 bg-gray-200" />
  <div className="w-9 h-9 rounded-full bg-gradient...">
    <svg>...</svg>
  </div>
  <div>
    <h1>My Wallet</h1>
    <p>{address}</p>
    <button onClick={copy}>Copy</button>
  </div>
  <WalletStats {...stats} />
</div>
```

**After**: 10 lines
```tsx
<PageHeader
  backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
  icon={{
    type: "svg",
    svgContent: <svg className="w-5 h-5 text-white">...</svg>,
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600"
  }}
  title="My Wallet"
  subtitle={{ address, displayFormat: "short" }}
  rightContent={<WalletStats {...stats} />}
/>
```

**Testing**:
- [ ] Visual check: Icon, title, address display
- [ ] Copy button functionality
- [ ] Back navigation works
- [ ] Stats cards render correctly
- [ ] Responsive layout (mobile/desktop)

---

#### 2.2 Collection Page
**Complexity**: ⭐ Low
**Risk**: 🟢 Low
**Impact**: Medium visibility

**Current**: Inline header in `CollectionPageClient.tsx` (~80 lines)

**After**: 15 lines
```tsx
<PageHeader
  backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
  icon={{
    type: "svg",
    svgContent: <svg className="w-5 h-5 text-white">...</svg>
  }}
  title={collectionMetadata?.contractName || 'NFT Collection'}
  subtitle={{ address: contractAddress, displayFormat: "short" }}
  rightContent={
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard label="Supply" value={collectionStats?.totalSupply} />
      {/* ... more stats */}
    </div>
  }
  hasSidebar={true}
/>
```

**Testing**:
- [ ] Sidebar offset works (md:left-16)
- [ ] Collection name displays
- [ ] Contract address copyable
- [ ] Stats grid responsive

---

#### 2.3 NFT Detail Page
**Complexity**: ⭐⭐ Medium
**Risk**: 🟡 Medium
**Impact**: High visibility, complex interactions

**Current**: `DetailHeader.tsx` (289 lines with interactive cards)

**Challenge**: Interactive stat cards (likes, watchlist, rating) require click handlers
**Solution**: Keep cards in separate component, pass as `rightContent`

**After**: 20 lines
```tsx
<PageHeader
  backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
  icon={{
    type: "text-badge",
    text: contractSymbol || '?'
  }}
  title={formatNFTDisplayName(name, tokenId)}
  subtitle={formatCollectionDisplayName(...)}
  rightContent={<NFTInteractionCards {...interactionProps} />}
/>
```

**New file**: `NFTInteractionCards.tsx` (extract interactive cards)
```tsx
export function NFTInteractionCards({
  stats,
  userInteractions,
  onToggleLike,
  onToggleWatchlist,
  onRate,
  onShare
}) {
  return (
    <div className="hidden lg:grid grid-cols-5 gap-3 items-stretch" 
         style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
      {/* Views, Likes, Watchlist, Rating, Share cards */}
    </div>
  );
}
```

**Benefits**:
- Separates layout (PageHeader) from behavior (interaction cards)
- Cards remain testable in isolation
- Easier to add new interactions

**Testing**:
- [ ] Text badge shows contract symbol
- [ ] All 5 interaction cards render
- [ ] Like/watchlist/rating actions work
- [ ] Share button triggers correctly
- [ ] Wallet gating works

---

### Phase 3: Complex Migration (Higher Risk)

#### 3.1 Sell Page
**Complexity**: ⭐⭐⭐ High
**Risk**: 🟠 Medium-High
**Impact**: Critical flow (listing creation)

**Current**: `SellHeader.tsx` (160 lines) with progress tracking

**Challenge**: Complex state (whitelist, approval, signing, pending)
**Solution**: Create specialized `SellPageHeader` wrapper

**Option A**: Extend PageHeader
```tsx
export function SellPageHeader({
  // PageHeader props
  ...pageHeaderProps,
  // Sell-specific props
  showProgress,
  stepStates,
  listingType,
  setListingType,
  showToggle,
  sellStats
}) {
  return (
    <>
      <PageHeader {...pageHeaderProps} />
      {showProgress && (
        <div className="px-8 py-2 bg-gray-50 border-b">
          <SellProgressSteps steps={stepStates} />
        </div>
      )}
    </>
  );
}
```

**Option B**: Keep as-is (if too complex)
- Justify: Unique enough to warrant separate component
- Refactor later after pattern stabilizes

**Recommendation**: Start with Option A, fallback to B if issues arise

---

## Implementation Checklist

### Pre-Migration
- [x] Create PageHeader component
- [x] Write comprehensive types
- [x] Document usage patterns
- [x] Create migration plan
- [ ] Get team approval
- [ ] Set up feature branch

### Migration Steps (Per Component)
1. [ ] Create backup branch
2. [ ] Replace header markup with PageHeader
3. [ ] Extract stats/actions to rightContent
4. [ ] Update imports
5. [ ] Run type checks (`npm run type-check`)
6. [ ] Test locally (visual + functional)
7. [ ] Create PR with screenshots
8. [ ] Code review
9. [ ] Merge to main

### Post-Migration
- [ ] Delete old header components (WalletHeader.tsx, etc.)
- [ ] Update component index exports
- [ ] Update documentation
- [ ] Monitor for regressions
- [ ] Collect team feedback

---

## Rollback Plan

### If Issues Arise
1. **Revert**: Git revert merge commit
2. **Hotfix**: Fix specific issue in PageHeader
3. **Partial Rollback**: Keep PageHeader, revert specific page

### Known Risks
| Risk | Mitigation |
|------|------------|
| Type errors | Comprehensive TypeScript types already defined |
| Visual regressions | Side-by-side screenshots before/after |
| Broken interactions | Extract to separate components first |
| Performance issues | Simple functional components (no re-render issues) |

---

## Success Metrics

### Code Quality
- **Lines of Code**: Reduce by ~200-250 lines (40% reduction)
- **Duplication**: Eliminate 100% of header markup duplication
- **Type Safety**: 100% type coverage with strict mode
- **Test Coverage**: Maintain or increase coverage

### Maintainability
- **Consistency**: All headers use same component
- **Onboarding**: New devs understand pattern in 5 minutes
- **Changes**: Header updates apply globally (1 file vs 4 files)

### Performance
- **Bundle Size**: Minimal impact (shared code = smaller bundle)
- **Render Performance**: No degradation (pure functional components)

---

## Timeline Estimate

```
Week 1:
├── Day 1-2: Wallet Page migration + testing
├── Day 3: Collection Page migration + testing
└── Day 4-5: NFT Detail Page migration + testing

Week 2:
├── Day 1-3: Sell Page migration (complex) + testing
├── Day 4: Code review + fixes
└── Day 5: Deployment + monitoring
```

**Total Effort**: ~2 weeks (1 developer)

---

## Next Steps

1. **Review this plan** with team
2. **Approve migration strategy**
3. **Start with Wallet Page** (lowest risk, highest learning)
4. **Iterate based on feedback**
5. **Complete remaining pages**

---

## Questions for Discussion

1. Should we keep SellHeader separate due to complexity?
2. Do we want dark mode support from the start?
3. Should PageHeader be moved to design system package?
4. Any additional pages that need headers?

---

## Conclusion

This migration will:
- ✅ Reduce code duplication by 40%
- ✅ Improve maintainability and consistency
- ✅ Make future changes easier (single source of truth)
- ✅ Follow senior-level best practices
- ✅ Maintain backward compatibility during transition

**Recommendation**: Proceed with Phase 2.1 (Wallet Page) as proof of concept.

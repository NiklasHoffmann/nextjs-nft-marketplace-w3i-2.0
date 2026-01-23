# Route-Specific Components Architecture Analysis

## Current Situation

### Routes with Local Components (7/8 routes)

| Route | Component Count | Structure | Reusability |
|-------|----------------|-----------|-------------|
| `/sell` | 19 | Well-organized subdirectories (common/, nft-selection/, forms/, preview/, listing/) | ⚠️ Mixed (some could be global) |
| `/admin` | 12 | Sections + forms organization | ⚠️ Some components are admin-specific only |
| `/history-towers` | 8 | Game-specific components | ✅ Game-specific (correct placement) |
| `/marketplace` | 7 | Components for marketplace views | ⚠️ Some could be shared |
| `/wallet` | 5 | Dashboard components | ⚠️ StatCard could be global |
| `/cart` | 1 | CartHeader only | ⚠️ Could move to global |
| `/nft` | 1 | CollectionPageClient | ⚠️ Could be in route-specific nested folder |
| `/api` | 0 | No components (correct) | N/A |

### Problem Patterns Identified

#### 1. **Inconsistent Component Placement**
```
✅ Good Example:
/sell/
  ├── components/         # Complex route with many components
  │   ├── common/        # Shared within route
  │   ├── nft-selection/
  │   ├── forms/
  │   └── preview/
  └── page.tsx

⚠️ Questionable Example:
/cart/
  ├── components/        # Only 1 component
  │   └── CartHeader.tsx  # Could be in global src/components/cart/
  ├── CartPage.tsx
  └── page.tsx
```

#### 2. **Duplicate UI Patterns Across Routes**
- **StatCard** (`/wallet/components/StatCard.tsx`) - Uses BaseCard internally, could be global
- **EmptyState patterns** - Multiple routes implement similar empty states
- **List components** - Similar patterns in marketplace, wallet, admin

#### 3. **Unclear Reusability Boundaries**
Some route components import heavily from global components, suggesting they're composition-heavy rather than truly route-specific.

---

## Senior Developer Decision Framework

### When to Keep Components Route-Local (`app/[route]/components/`)

✅ **Keep Local When:**

1. **High Route Coupling** - Component deeply tied to route's business logic
   ```tsx
   // ✅ Good: Tightly coupled to sell flow state
   app/sell/components/UnifiedListingForm.tsx
   - Uses ListingFlowContext (route-specific context)
   - Only used in sell route
   - Complex multi-step form logic
   ```

2. **Complex Feature Modules** - Route represents a distinct feature with 5+ components
   ```tsx
   // ✅ Good: Game is a complete feature module
   app/history-towers/components/
   - GamePageLayout.tsx
   - HistoryJumperV2.tsx
   - LeaderboardModal.tsx
   - HighscoreTable.tsx
   // These components only make sense within the game context
   ```

3. **Nested Route Specificity** - Component only used in nested routes
   ```tsx
   // ✅ Good: Only used in NFT detail pages
   app/nft/[contractAddress]/[tokenId]/components/
   - NFTInsightsPanel.tsx
   - NFTPriceCard.tsx
   - CategoryPills.tsx
   ```

4. **Contains Route-Specific State/Context** - Relies on route-level data providers
   ```tsx
   // ✅ Good: Uses admin-specific contexts and auth
   app/admin/components/AdminNFTInsightsManager.tsx
   - Requires AdminAuthGuard
   - Uses admin-specific API endpoints
   - Complex admin-only workflows
   ```

### When to Move to Global Components (`src/components/`)

⚠️ **Move to Global When:**

1. **Used in 2+ Routes** - Component is or could be reused
   ```tsx
   // ⚠️ Move: Used in wallet, marketplace, admin
   StatCard.tsx → src/components/ui/StatCard.tsx
   - Generic stat display
   - No route-specific logic
   - Reusable across dashboards
   ```

2. **Pure Presentational** - No route-specific business logic
   ```tsx
   // ⚠️ Move: Pure UI component
   app/cart/components/CartHeader.tsx → src/components/cart/CartHeader.tsx
   - Only displays title and count
   - Could be used in cart modal, mini-cart, etc.
   ```

3. **Extends Global Components Minimally** - Thin wrapper around base components
   ```tsx
   // ⚠️ Move: Just adds styling to BaseCard
   app/marketplace/components/CollectionCard.tsx → src/components/marketplace/CollectionCard.tsx
   ```

4. **Could Be Useful Elsewhere** - Solves common problem
   ```tsx
   // ⚠️ Move: Generic list with filters
   NFTFilteredList.tsx → src/components/shared/NFTFilteredList.tsx
   ```

---

## Recommended Architecture

### Three-Tier Component Organization

```
src/
├── components/                    # GLOBAL: Reusable across entire app
│   ├── core/                     # Base components (BaseCard, BaseModal)
│   ├── ui/                       # Generic UI (Button, Loading, StatCard)
│   ├── shared/                   # Domain-agnostic shared (NFTGallery)
│   ├── nft/                      # NFT domain components (NFTCard)
│   ├── marketplace/              # Marketplace domain components
│   ├── cart/                     # Cart domain components
│   ├── wallet/                   # Wallet domain components
│   └── admin/                    # Admin UI components (cross-route)
│
└── app/
    ├── [route]/
    │   ├── components/           # ROUTE-SPECIFIC: Only used in this route
    │   │   ├── [feature]/        # Organized by feature/section
    │   │   └── index.ts          # Barrel export
    │   ├── [nested-route]/
    │   │   └── components/       # NESTED-ROUTE: Only for nested route
    │   └── page.tsx
```

### Migration Strategy by Route

#### `/sell` - Keep Local (✅ Good Structure)
**Reason:** Complex feature module with 19 components, uses route-specific context
```
sell/
├── components/
│   ├── common/          # SellHeader, FlowSidebar (route navigation)
│   ├── nft-selection/   # NFT selection step
│   ├── forms/           # UnifiedListingForm (uses ListingFlowContext)
│   ├── preview/         # Preview step
│   └── listing/         # Final listing step
├── contexts/            # ListingFlowContext
└── hooks/               # Route-specific hooks
```
**Action:** ✅ No changes needed - exemplary structure

#### `/admin` - Partial Move Recommended
**Split Strategy:**
```tsx
// Keep Local (admin workflow components):
app/admin/components/
├── sections/                    # Admin-specific sections
│   ├── NFTSelector.tsx         # Admin insight management
│   ├── BasicInfoManager.tsx
│   ├── TagsManager.tsx
│   └── PartnershipManager.tsx
└── AdminNFTInsightsManager.tsx  # Main admin workflow

// Move to Global (reusable admin UI):
src/components/admin/
├── AdminModeIndicator.tsx      # Already global ✅
├── MigrationBanner.tsx         # Already global ✅
├── ProposalCard.tsx            # Multisig - reusable
└── CreateProposalModal.tsx     # Multisig - reusable
```

#### `/marketplace` - Move to Global
**Reason:** All 7 components are presentational and could be reused
```tsx
// Current:
app/marketplace/components/
├── ListedNFTsList.tsx          # Generic NFT list
├── CollectionsList.tsx         # Generic collections list
└── [5 more presentational]

// Recommended:
src/components/marketplace/
├── MarketplaceNFTsList.tsx     # Renamed for clarity
├── CollectionsList.tsx
└── [others]
```

#### `/wallet` - Move to Global
**Reason:** Dashboard components useful in other dashboards (admin, profile)
```tsx
// Current:
app/wallet/components/
├── WalletDashboard.tsx
├── WalletHeader.tsx
├── WalletStats.tsx
├── WalletNFTsList.tsx
└── StatCard.tsx

// Recommended:
src/components/wallet/
├── WalletDashboard.tsx
├── WalletHeader.tsx
├── WalletStats.tsx
└── WalletNFTsList.tsx

src/components/ui/
└── StatCard.tsx               # Reusable stat display
```

#### `/cart` - Move to Global
**Reason:** Only 1 component, better in global cart namespace
```tsx
// Current:
app/cart/components/
└── CartHeader.tsx

// Recommended:
src/components/cart/
├── CartHeader.tsx
├── CartItem.tsx              # Could add more cart components here
└── CartSummary.tsx           # Future additions
```

#### `/nft` - Keep Nested Structure (✅ Good)
**Reason:** Component is nested-route-specific
```
nft/
├── components/
│   └── CollectionPageClient.tsx  # Used by /nft/[contractAddress]/page.tsx
└── [contractAddress]/
    ├── page.tsx                  # Uses CollectionPageClient
    └── [tokenId]/
        └── components/            # NFT detail page components ✅
            ├── NFTInsightsPanel.tsx
            ├── NFTPriceCard.tsx
            └── CategoryPills.tsx
```
**Action:** ✅ Structure is correct - components are where they're used

#### `/history-towers` - Keep Local (✅ Perfect)
**Reason:** Game-specific components that only make sense within game context
```
history-towers/
└── components/                   # ✅ All game-specific
    ├── GamePageLayout.tsx
    ├── HistoryJumperV2.tsx
    ├── LeaderboardModal.tsx
    ├── HighscoreTable.tsx
    └── MarketplaceDropdown.tsx
```
**Action:** ✅ No changes - isolated feature module

---

## Migration Priority

### Phase 1: Low-Hanging Fruit (Quick Wins)
1. **Move `/cart/components/` to `src/components/cart/`** - Only 1 component
2. **Move `StatCard` to `src/components/ui/`** - Clearly reusable
3. **Create `src/components/marketplace/`** - Move 7 components

### Phase 2: Complex Reorganization
4. **Split `/admin/components/`** - Keep workflow, move UI
5. **Move `/wallet/components/`** to global - Dashboard components
6. **Audit imports** - Update all import paths

### Phase 3: Optimization
7. **Create barrel exports** - Add index.ts for new namespaces
8. **Document patterns** - Update component READMEs
9. **Refactor duplicates** - Consolidate similar patterns

---

## Senior-Level Best Practices

### 1. **Colocation vs Reusability Trade-off**

**Colocation Benefits (Route-Local):**
- ✅ Easier to understand feature scope
- ✅ Faster to iterate on feature
- ✅ Clearer coupling to route logic
- ✅ Can delete entire feature folder easily

**Reusability Benefits (Global):**
- ✅ DRY principle - no duplication
- ✅ Consistent UI across routes
- ✅ Easier to maintain shared patterns
- ✅ Better for design system coherence

**Golden Rule:** Start local, refactor to global when reuse is **proven**, not predicted.

### 2. **Import Distance Rule**

Components should be as close to their usage as possible:
```tsx
// ❌ Bad: Unnecessarily global
src/components/sell/OnlyUsedInSellRoute.tsx
app/sell/page.tsx                            // Long import path

// ✅ Good: Colocated
app/sell/components/OnlyUsedInSellRoute.tsx
app/sell/page.tsx                            // Short relative import
```

### 3. **Namespace by Domain, Not Route**

When moving to global, organize by **domain/feature**, not by route:
```
✅ Good (Domain-based):
src/components/
├── marketplace/     # All marketplace-related
│   ├── ListingCard.tsx
│   ├── CollectionCard.tsx
│   └── MarketplaceFilters.tsx
└── wallet/          # All wallet-related
    ├── WalletHeader.tsx
    └── WalletStats.tsx

❌ Bad (Route-based):
src/components/
├── pages/           # Don't mirror route structure
│   ├── marketplace/
│   └── wallet/
```

### 4. **Feature Modules for Complex Routes**

Routes with 10+ components should be treated as **feature modules**:
```
sell/                          # Feature module
├── components/               # Internal components
│   ├── common/
│   ├── nft-selection/
│   └── forms/
├── contexts/                 # Feature state
├── hooks/                    # Feature hooks
├── lib/                      # Feature utilities
└── types/                    # Feature types

// This is essentially a mini-app within the app
```

### 5. **Clear Naming Conventions**

When moving components, rename for clarity:
```tsx
// Route-local (specific context clear from path):
app/wallet/components/Header.tsx

// Global (needs context in name):
src/components/wallet/WalletHeader.tsx  // Not just "Header"
```

---

## Testing Strategy

### Before Migration
```bash
# 1. Find all imports of components to be moved
rg "from ['\"].*app/cart/components" src/

# 2. Check for dynamic imports
rg "import\(" src/ | rg "app/.*components"

# 3. Verify no circular dependencies
# Use dependency-cruiser or madge
```

### After Migration
```bash
# 1. TypeScript compilation
npm run type-check

# 2. Build verification
npm run build

# 3. Import path validation
rg "from ['\"].*app/cart/components" src/  # Should be empty

# 4. Component accessibility
# Ensure all moved components are exported via barrel files
```

---

## Proposed Action Plan

### Immediate Actions (This Session)

1. **Create Analysis Document** ✅ (This file)
2. **Get User Approval** on strategy
3. **Implement Phase 1** (if approved):
   - Move `/cart/components/` → `src/components/cart/`
   - Move `StatCard` → `src/components/ui/`
   - Update all imports
   - Test build

### Follow-up Actions (Next Sessions)

4. **Phase 2:** Complex reorganizations (`/admin`, `/wallet`)
5. **Phase 3:** Documentation updates
6. **Phase 4:** Refactor duplicates and patterns

---

## Decision Matrix

| Component | Current Location | Recommended | Reason | Priority |
|-----------|-----------------|-------------|---------|----------|
| CartHeader | `app/cart/components/` | `src/components/cart/` | Reusable, pure UI | HIGH |
| StatCard | `app/wallet/components/` | `src/components/ui/` | Generic stat display | HIGH |
| ListedNFTsList | `app/marketplace/components/` | `src/components/marketplace/` | Domain component, reusable | MEDIUM |
| CollectionsList | `app/marketplace/components/` | `src/components/marketplace/` | Domain component, reusable | MEDIUM |
| WalletDashboard | `app/wallet/components/` | `src/components/wallet/` | Dashboard component, reusable | MEDIUM |
| WalletHeader | `app/wallet/components/` | `src/components/wallet/` | Domain header, reusable | MEDIUM |
| WalletStats | `app/wallet/components/` | `src/components/wallet/` | Dashboard component | MEDIUM |
| WalletNFTsList | `app/wallet/components/` | `src/components/wallet/` | Wallet-specific list | MEDIUM |
| CollectionPageClient | `app/nft/components/` | KEEP | Nested route specific | LOW |
| NFTInsightsPanel | `app/nft/[...]/components/` | KEEP | Detail page specific | LOW |
| Admin sections | `app/admin/components/sections/` | KEEP | Admin workflow specific | LOW |
| Sell components | `app/sell/components/` | KEEP | Feature module | LOW |
| Game components | `app/history-towers/components/` | KEEP | Game-specific feature | LOW |

---

## Summary

**Current State:**
- 53 route-local components across 7 routes
- Mixed patterns: some routes organized well, others not
- Unclear boundaries between route-specific and reusable

**Recommended State:**
- Keep 3 routes local: `/sell` (19), `/history-towers` (8), `/admin` (subset)
- Move 4 routes to global: `/cart` (1), `/wallet` (5), `/marketplace` (7), admin UI (subset)
- Total: ~25 components stay local, ~20 move to global

**Key Principle:**
> "Components should live at the intersection of **how often they're used** and **how coupled they are to route logic**. When in doubt, favor colocation until reuse is proven."

**Next Step:**
Get user approval and proceed with Phase 1 migration (cart, StatCard, marketplace).

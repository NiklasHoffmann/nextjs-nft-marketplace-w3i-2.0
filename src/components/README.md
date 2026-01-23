# Components - React Component Library

Reusable, production-ready React components (46 components) organized by domain and complexity level. Following atomic design principles with enterprise patterns.

## 📋 Table of Contents
- [Directory Structure](#directory-structure)
- [Quick Reference](#quick-reference)
- [Component Categories](#component-categories)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)

---

## Directory Structure

```
components/
├── admin/                    # Admin-specific components (4 files)
│   ├── README.md            # 📖 Detailed admin components docs
│   ├── AdminModeIndicator.tsx
│   ├── MigrationBanner.tsx
│   └── multisig/            # Multi-signature wallet UI
│       ├── CreateProposalModal.tsx
│       ├── MultiSigTransactionCard.tsx
│       ├── ProposalCard.tsx
│       └── TransactionBuilder.tsx
├── auth/                    # Authentication & authorization (2 files)
│   ├── AdminAuthGuard.tsx   # Route protection with session
│   └── AdminGuard.tsx       # Component-level access control
├── core/                    # Base components - atomic design (5 files)
│   ├── README.md            # 📖 Detailed core components docs
│   ├── Card/BaseCard.tsx    # Flexible card container
│   ├── Empty/EmptyState.tsx # Empty state placeholder
│   ├── Form/FormField.tsx   # Form input with validation
│   ├── Loading/LoadingState.tsx # Loading indicators
│   └── Modal/BaseModal.tsx  # Modal dialog base
├── icons/                   # SVG icon components
│   └── index.tsx
├── layout/                  # Layout & navigation (8 files)
│   ├── AdminNavbar.tsx
│   ├── ClientLayout.tsx
│   ├── ErrorBoundary.tsx
│   ├── Navbar.tsx
│   ├── Web3ConnectButton.tsx
│   ├── Web3Provider.tsx
│   └── PageHeader/PageHeader.tsx
├── nft/                     # NFT-specific components (11 files)
│   ├── README.md            # 📖 Detailed NFT components docs
│   ├── archive/             # Deprecated files (reference only)
│   ├── modals/              # Buy, Sell, Cancel modals
│   ├── NFTCard/             # Modular card components
│   ├── NFTCard.tsx
│   ├── LazyNFTCard.tsx
│   └── OptimizedNFTImage.tsx
├── shared/                  # Complex shared components (3 files)
│   ├── NFTFilterBar.tsx
│   ├── NFTFilterSidebar.tsx
│   └── NFTGallery.tsx
└── ui/                      # UI primitives (11 files)
    ├── Button.tsx
    ├── Loading.tsx
    ├── ErrorDisplay.tsx
    └── ...more
```

### 📚 Detailed Documentation

For comprehensive documentation on specific component categories, see:

- **[Core Components](core/README.md)** - BaseCard, BaseModal, LoadingState, EmptyState, FormField
  - Composition patterns, slot system, accessibility features
  - Props interfaces, usage examples, testing patterns
  
- **[NFT Components](nft/README.md)** - NFTCard, LazyNFTCard, OptimizedNFTImage, Modals
  - NFT card architecture with 3D tilt effects
  - Performance optimization with lazy loading
  - Image handling with IPFS support
  
- **[Admin Components](admin/README.md)** - Admin UI, Multisig operations, Access control
  - Multi-signature wallet interface
  - Proposal management workflow
  - Authentication and authorization patterns

---

## Quick Reference

### Core Components (Base Layer)

#### BaseCard - Flexible Card Container
```typescript
import { BaseCard } from '@/components';

// Basic card
<BaseCard>
  <h3>Card Title</h3>
  <p>Content goes here</p>
</BaseCard>

// With gradient border
<BaseCard border="gradient" size="lg" hover>
  <h2>Premium Content</h2>
</BaseCard>

// All options
<BaseCard 
  size="md"              // xs | sm | md | lg | xl
  border="gradient"      // none | default | gradient
  padding="p-6"
  hover={true}
  loading={false}
  onClick={() => {}}
  className="custom-class"
/>
```

#### BaseModal - Dialog Component
```typescript
import { BaseModal } from '@/components';

<BaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirmation"
  size="lg"
  footer={
    <div className="flex gap-2">
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </div>
  }
>
  <p>Modal content here</p>
</BaseModal>
```

#### LoadingState - Loading Indicators
```typescript
import { LoadingState } from '@/components';

// Centered (full container)
<LoadingState 
  size="lg" 
  variant="centered" 
  message="Loading NFTs..."
  color="blue"
/>

// Inline (within content)
<LoadingState variant="inline" size="sm" />
```

#### EmptyState - Empty Placeholder
```typescript
import { EmptyState } from '@/components';

<EmptyState
  icon={<SearchIcon />}
  title="No NFTs found"
  message="Try adjusting your filters"
  action={<button onClick={handleReset}>Reset</button>}
/>
```

#### FormField - Validated Input
```typescript
import { FormField } from '@/components';

<FormField
  label="Price"
  name="price"
  type="number"
  value={formData.price}
  onChange={handleChange}
  error={errors.price}
  helperText="Enter price in ETH"
  placeholder="0.00"
  required
/>
```

### NFT Components

#### NFTCard - Main NFT Display
```typescript
import { NFTCard } from '@/components';

<NFTCard
  nft={nftData}
  onBuy={handleBuy}
  onUpdateListing={handleUpdate}
  onCancelListing={handleCancel}
  showActions={true}
  isOwner={isUserOwner}
/>
```

#### LazyNFTCard - Performance Optimized
```typescript
import { LazyNFTCard } from '@/components';

// Loads when visible (Intersection Observer)
<LazyNFTCard
  nft={nftData}
  threshold={0.1}      // Load at 10% visibility
  rootMargin="50px"    // Preload 50px before
/>
```

#### NFT Modals
```typescript
import { 
  BuyNowModal, 
  UpdateListingModal, 
  CancelListingModal 
} from '@/components/nft/modals';

<BuyNowModal
  isOpen={isOpen}
  onClose={handleClose}
  nft={selectedNFT}
  onSuccess={handleSuccess}
/>
```

### Shared Components

#### NFTGallery - Grid Display
```typescript
import { NFTGallery } from '@/components/shared';

<NFTGallery
  title="Featured NFTs"
  subtitle="Discover unique digital assets"
  nfts={nftList}
  loading={isLoading}
  error={error}
  columns={4}
  showFilters={true}
  onFilterChange={handleFilter}
/>
```

#### NFTFilterBar & Sidebar
```typescript
import { NFTFilterBar, NFTFilterSidebar } from '@/components/shared';

// Horizontal bar
<NFTFilterBar
  filters={filters}
  onFiltersChange={handleChange}
  collections={collections}
  showPriceRange
  showSortOptions
/>

// Vertical sidebar
<NFTFilterSidebar
  isOpen={isSidebarOpen}
  onClose={handleClose}
  filters={filters}
  onFiltersChange={handleChange}
/>
```

### UI Components

#### Button
```typescript
import { Button } from '@/components/ui';

<Button
  variant="primary"      // primary | secondary | outline | ghost
  size="md"             // sm | md | lg
  loading={isLoading}
  disabled={isDisabled}
  onClick={handleClick}
  icon={<Icon />}
  fullWidth={false}
>
  Click Me
</Button>
```

#### CurrencySelector
```typescript
import { CurrencySelector } from '@/components/ui';

<CurrencySelector
  value={selectedCurrency}
  onChange={handleCurrencyChange}
  currencies={['ETH', 'USD', 'EUR']}
  showFlags={true}
/>
```

### Layout Components

#### Web3Provider
```typescript
import { Web3Provider } from '@/components/layout';

// Wrap app (in app/layout.tsx)
<Web3Provider>
  <YourApp />
</Web3Provider>
```

#### Navbar
```typescript
import { Navbar } from '@/components/layout';

<Navbar
  showSearch={true}
  showCart={true}
  user={currentUser}
  onSearch={handleSearch}
/>
```

### Auth Components

#### AdminAuthGuard - Route Protection
```typescript
import { AdminAuthGuard } from '@/components/auth';

// Protect entire page
export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
```

#### AdminGuard - Conditional Render
```typescript
import { AdminGuard } from '@/components/auth';

// Show only to admins
<AdminGuard fallback={<AccessDenied />}>
  <AdminPanel />
</AdminGuard>
```

---

## Component Categories

### Core Components (Atomic Design)
**Purpose**: Fundamental, reusable building blocks  
**Location**: `components/core/`

- No business logic
- Highly configurable via props
- Minimal dependencies
- Used across entire app

**Examples**: BaseCard, BaseModal, LoadingState, FormField, EmptyState

### UI Components (Atoms)
**Purpose**: Small, single-purpose UI elements  
**Location**: `components/ui/`

- Single responsibility
- Composable
- Consistent styling
- Minimal state

**Examples**: Button, Loading, ErrorDisplay, CurrencySelector, AddToCartButton

### Shared Components (Molecules)
**Purpose**: Complex, domain-agnostic components  
**Location**: `components/shared/`

- Composition of core/ui components
- Reusable across pages
- Internal state management
- Well-defined interfaces

**Examples**: NFTGallery, NFTFilterBar, NFTFilterSidebar

### NFT Components (Organisms)
**Purpose**: NFT-specific, business logic components  
**Location**: `components/nft/`

- NFT marketplace domain
- Blockchain integration
- User interactions (buy, sell, list)
- Performance optimized (lazy loading)

**Examples**: NFTCard, LazyNFTCard, BuyNowModal, UpdateListingModal

### Layout Components
**Purpose**: Page structure and navigation  
**Location**: `components/layout/`

- Application structure
- Navigation patterns
- Provider wrappers
- Global state

**Examples**: Navbar, ClientLayout, Web3Provider, ErrorBoundary

### Auth Components
**Purpose**: Authentication and authorization  
**Location**: `components/auth/`

- Access control
- Route protection
- Permission checking
- Wallet integration

**Examples**: AdminAuthGuard (route-level), AdminGuard (component-level)

### Admin Components
**Purpose**: Admin-only features  
**Location**: `components/admin/`

- Admin functionality
- System management
- Multisig operations
- Advanced features

**Examples**: AdminModeIndicator, MigrationBanner, Multisig components

---

## Usage Patterns

### Import from Barrel Exports

```typescript
// ✅ Recommended
import { NFTCard, NFTGallery, BaseCard } from '@/components';

// ✅ Also valid
import { NFTCard } from '@/components/nft/NFTCard';
import { BaseCard } from '@/components/core/Card/BaseCard';
```

### Composition Over Configuration

```typescript
// ✅ Good - Flexible
<BaseCard>
  <header><h2>Title</h2></header>
  <div>{content}</div>
  <footer>Footer</footer>
</BaseCard>

// ❌ Avoid - Too many props
<BaseCard title="Title" content={content} footer="Footer" />
```

### Loading States Pattern

```typescript
function MyComponent() {
  const { data, loading, error } = useFetchData();

  if (loading) return <LoadingState message="Loading..." />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data?.length) return <EmptyState title="No data" />;

  return <DataDisplay data={data} />;
}
```

### Modal Pattern

```typescript
function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmation"
      >
        <p>Content</p>
      </BaseModal>
    </>
  );
}
```

### Lazy Loading for Performance

```typescript
// For large lists (100+ items)
<div className="grid grid-cols-4 gap-4">
  {nfts.map(nft => (
    <LazyNFTCard
      key={nft.id}
      nft={nft}
      threshold={0.1}
      rootMargin="100px"
    />
  ))}
</div>
```

---

## Best Practices

### ✅ DO

#### Use TypeScript Interfaces
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  ...rest 
}: ButtonProps) {
  // Implementation
}
```

#### Handle All States
```typescript
if (loading) return <LoadingState />;
if (error) return <ErrorDisplay error={error} />;
if (!data) return <EmptyState />;
return <Content data={data} />;
```

#### Use Tailwind CSS
```typescript
// ✅ Consistent
<div className="flex items-center gap-2 p-4 rounded-lg bg-white shadow-md">
  {content}
</div>

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

#### Memoize Expensive Operations
```typescript
const sortedNFTs = useMemo(() => {
  return [...nfts].sort((a, b) => a.price - b.price);
}, [nfts]);
```

#### Use React.memo for Pure Components
```typescript
export const NFTCard = memo(function NFTCard({ nft }) {
  return <BaseCard>...</BaseCard>;
});
```

### ❌ DON'T

#### Don't Use Any
```typescript
// ❌ Bad
function BadComponent(props: any) { }

// ✅ Good
interface Props { data: string; }
function GoodComponent({ data }: Props) { }
```

#### Don't Mutate Props
```typescript
// ❌ Bad
function BadComponent({ items }: { items: Item[] }) {
  items.sort(); // Mutates!
}

// ✅ Good
const sortedItems = [...items].sort();
```

#### Don't Forget Keys
```typescript
// ❌ Bad
{items.map((item, i) => <div key={i}>{item}</div>)}

// ✅ Good
{items.map(item => <div key={item.id}>{item}</div>)}
```

---

## Styling Guidelines

### Tailwind Conventions
```typescript
// Spacing
p-4 m-2 gap-4

// Colors
bg-white text-gray-900
bg-gray-800 text-white

// Responsive
sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4

// States
hover:bg-gray-50 focus:ring-2 focus:ring-blue-500
```

### Component Sizing
```typescript
const sizeClasses = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
  xl: 'text-xl px-8 py-4'
};
```

---

## Performance Tips

### Code Splitting
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingState />}>
  <HeavyComponent />
</Suspense>
```

### Image Optimization
```typescript
import { OptimizedNFTImage } from '@/components/nft';

<OptimizedNFTImage
  src={nft.image}
  alt={nft.name}
  width={400}
  height={400}
  blur={true}
/>
```

---

## Migration Notes

### Recent Changes (January 2026)

**Archived Deprecated Files**:
- `nft/NFTCard.old.tsx` → `nft/archive/` (reference only)
- `nft/NFTCard.backup.tsx` → `nft/archive/` (reference only)

**Deprecated Exports**:
```typescript
// OLD (ui/index.ts - deprecated)
import { Card, CardHeader } from '@/components/ui';

// NEW (use BaseCard)
import { BaseCard } from '@/components';
```

---

## Related Documentation

### Component Documentation
- **[Core Components](core/README.md)** - Base components (BaseCard, BaseModal, LoadingState, etc.)
- **[NFT Components](nft/README.md)** - NFT marketplace UI (NFTCard, LazyNFTCard, Modals)
- **[Admin Components](admin/README.md)** - Admin & multisig components

### Project Documentation
- [Services Layer](../services/README.md) - Backend services and blockchain integration
- [Types System](../types/README.md) - TypeScript type definitions
- [Utilities](../utils/README.md) - Helper functions and utilities
- [Architecture](../../docs/architecture/features.md) - System architecture overview
- [Types System](../types/README.md)
- [Utilities](../utils/README.md)
- [Architecture](../../docs/architecture/features.md)

---

## Component Checklist

When creating components:

- [ ] Choose correct directory (core/, ui/, nft/, etc.)
- [ ] Define TypeScript props interface
- [ ] Handle loading/error/empty states
- [ ] Add to index.ts barrel export
- [ ] Use PascalCase naming
- [ ] Follow Tailwind conventions
- [ ] Optimize with memo/useMemo
- [ ] Add accessibility (aria-labels)
- [ ] Test mobile viewport
- [ ] Write tests for critical logic

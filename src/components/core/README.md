# Core Components - Base Building Blocks

Fundamental, reusable UI components following atomic design principles. These are the foundation of the entire component library - highly configurable, framework-agnostic, and used across all pages.

## 📋 Table of Contents
- [Overview](#overview)
- [Components](#components)
  - [BaseCard](#basecard---flexible-card-container)
  - [BaseModal](#basemodal---dialog-system)
  - [LoadingState](#loadingstate---loading-indicators)
  - [EmptyState](#emptystate---empty-placeholders)
  - [FormField](#formfield---validated-inputs)
- [Design Principles](#design-principles)
- [Composition Patterns](#composition-patterns)
- [Best Practices](#best-practices)

---

## Overview

**Location**: `components/core/`  
**Purpose**: Foundation components with zero business logic  
**Philosophy**: Composition over configuration

### Core Components
- **BaseCard** - Flexible card container with slots (5 variants, 8+ slot types)
- **BaseModal** - Accessible dialog system with keyboard navigation
- **LoadingState** - Unified loading indicators (centered/inline variants)
- **EmptyState** - Empty state placeholders with CTAs
- **FormField** - Form inputs with validation and error handling

### Key Characteristics
✅ **Zero Business Logic** - Pure UI, no API calls or state management  
✅ **Highly Configurable** - Props-driven with sensible defaults  
✅ **Composition-Ready** - Slot-based architecture for flexibility  
✅ **Fully Typed** - Comprehensive TypeScript interfaces  
✅ **Accessible** - ARIA labels, keyboard navigation, focus management

---

## Components

### BaseCard - Flexible Card Container

**File**: `core/Card/BaseCard.tsx` (383 lines)  
**Purpose**: Unified card component eliminating duplication across NFTCard, CollectionCard, StatCard

#### Props Interface

```typescript
interface BaseCardProps {
  // Size & Style
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;

  // Slot System (flexible content)
  image?: ReactNode;          // Top image/media
  badge?: ReactNode;          // Top-right badge overlay
  header?: ReactNode;         // Title section
  content?: ReactNode;        // Main content
  footer?: ReactNode;         // Bottom section
  overlay?: ReactNode;        // Full overlay (e.g., "SOLD")
  actions?: ReactNode;        // Action buttons (bottom)

  // Advanced
  customBorder?: string;      // Custom border class
  customBackground?: string;  // Custom background
  customPadding?: string;     // Override padding
}
```

#### Size Variants

```typescript
// Small - Compact list items
<BaseCard size="sm">
  <div className="p-2">Compact content</div>
</BaseCard>

// Medium (default) - Standard cards
<BaseCard size="md">
  <div className="p-4">Standard card</div>
</BaseCard>

// Large - Feature cards
<BaseCard size="lg">
  <div className="p-6">Feature content</div>
</BaseCard>

// Extra Large - Hero sections
<BaseCard size="xl">
  <div className="p-8">Hero content</div>
</BaseCard>
```

#### Usage Examples

**Basic Card**
```typescript
<BaseCard>
  <h3 className="text-lg font-bold">Simple Card</h3>
  <p className="text-gray-600">Basic content</p>
</BaseCard>
```

**NFT Card with Slots**
```typescript
<BaseCard
  size="md"
  hoverable
  onClick={() => router.push(`/nft/${address}/${tokenId}`)}
  image={
    <OptimizedNFTImage 
      src={nft.image} 
      alt={nft.name}
      className="w-full h-64 object-cover"
    />
  }
  badge={
    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
      New
    </span>
  }
  header={
    <div className="flex justify-between items-start">
      <h3 className="font-bold text-lg">{nft.name}</h3>
      <span className="text-sm text-gray-500">#{nft.tokenId}</span>
    </div>
  }
  content={
    <p className="text-gray-600 text-sm line-clamp-2">
      {nft.description}
    </p>
  }
  footer={
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">Price</span>
      <span className="font-bold">{nft.price} ETH</span>
    </div>
  }
/>
```

**Loading Skeleton**
```typescript
<BaseCard loading size="md">
  {/* Shows animated skeleton */}
</BaseCard>
```

**Custom Styling**
```typescript
<BaseCard
  customBorder="border-2 border-gradient-to-r from-purple-500 to-pink-500"
  customBackground="bg-gradient-to-br from-blue-50 to-indigo-50"
  customPadding="p-8"
>
  <div>Premium styled card</div>
</BaseCard>
```

**Overlay Pattern**
```typescript
<BaseCard
  image={<img src={nft.image} />}
  overlay={
    nft.isSold ? (
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
        <span className="text-white text-2xl font-bold">SOLD</span>
      </div>
    ) : null
  }
>
  <div>{nft.name}</div>
</BaseCard>
```

#### Composition Pattern

```typescript
// Instead of many props, compose with children
function NFTCard({ nft }: { nft: NFT }) {
  return (
    <BaseCard hoverable onClick={() => viewNFT(nft.id)}>
      <NFTCardImage nft={nft} />
      <NFTCardHeader nft={nft} />
      <NFTCardContent nft={nft} />
      <NFTCardFooter nft={nft} />
    </BaseCard>
  );
}
```

---

### BaseModal - Dialog System

**File**: `core/Modal/BaseModal.tsx` (178 lines)  
**Purpose**: Accessible modal wrapper with animations and keyboard navigation

#### Props Interface

```typescript
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disableBackdropClick?: boolean;
  showCloseButton?: boolean;
}
```

#### Usage Examples

**Basic Modal**
```typescript
const [isOpen, setIsOpen] = useState(false);

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
>
  <p>Are you sure you want to proceed?</p>
</BaseModal>
```

**Modal with Footer Actions**
```typescript
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Delete NFT Listing"
  size="md"
  footer={
    <div className="flex gap-3 justify-end">
      <button 
        onClick={handleClose}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button 
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Delete
      </button>
    </div>
  }
>
  <p>This action cannot be undone.</p>
</BaseModal>
```

**Large Modal with Complex Content**
```typescript
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="NFT Details"
  size="xl"
  disableBackdropClick={true}
>
  <div className="space-y-4">
    <img src={nft.image} className="w-full rounded-lg" />
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold">Owner</h4>
        <p>{nft.owner}</p>
      </div>
      <div>
        <h4 className="font-semibold">Price</h4>
        <p>{nft.price} ETH</p>
      </div>
    </div>
  </div>
</BaseModal>
```

#### Accessibility Features

- ✅ **Keyboard Navigation**: ESC to close, Tab trap
- ✅ **Focus Management**: Auto-focus on open, restore on close
- ✅ **ARIA Labels**: `role="dialog"`, `aria-modal="true"`
- ✅ **Screen Reader Support**: Proper heading hierarchy

---

### LoadingState - Loading Indicators

**File**: `core/Loading/LoadingState.tsx`  
**Purpose**: Unified loading indicators with size and variant options

#### Props Interface

```typescript
interface LoadingStateProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'centered' | 'inline';
  message?: string;
  color?: string;
  className?: string;
}
```

#### Usage Examples

**Centered Loading (Full Container)**
```typescript
// Takes full parent height, centers content
function PageContent() {
  if (loading) {
    return <LoadingState 
      size="lg" 
      variant="centered" 
      message="Loading NFTs..." 
    />;
  }
  return <Content data={data} />;
}
```

**Inline Loading (Within Content)**
```typescript
// Fits inline with content flow
<div className="flex items-center gap-2">
  <span>Processing</span>
  <LoadingState variant="inline" size="sm" />
</div>
```

**Size Variants**
```typescript
<LoadingState size="xs" />   // 16px spinner
<LoadingState size="sm" />   // 24px spinner
<LoadingState size="md" />   // 32px spinner (default)
<LoadingState size="lg" />   // 48px spinner
<LoadingState size="xl" />   // 64px spinner
```

**Custom Color**
```typescript
<LoadingState 
  size="md" 
  color="text-purple-600"
  message="Loading your collection..."
/>
```

---

### EmptyState - Empty Placeholders

**File**: `core/Empty/EmptyState.tsx`  
**Purpose**: Consistent empty state displays with optional CTAs

#### Props Interface

```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}
```

#### Usage Examples

**Basic Empty State**
```typescript
<EmptyState
  title="No NFTs found"
  message="Try adjusting your filters or check back later"
/>
```

**With Icon**
```typescript
<EmptyState
  icon={
    <svg className="w-16 h-16 text-gray-400">
      {/* Search icon SVG */}
    </svg>
  }
  title="No results found"
  message="We couldn't find any NFTs matching your search"
/>
```

**With Action Button**
```typescript
<EmptyState
  title="Your cart is empty"
  message="Start adding NFTs to your cart to purchase"
  action={
    <button 
      onClick={() => router.push('/explore')}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Explore NFTs
    </button>
  }
/>
```

**Error State Pattern**
```typescript
<EmptyState
  icon={<ErrorIcon className="w-16 h-16 text-red-500" />}
  title="Failed to load NFTs"
  message={error.message}
  action={
    <button onClick={handleRetry}>
      Try Again
    </button>
  }
/>
```

---

### FormField - Validated Inputs

**File**: `core/Form/FormField.tsx`  
**Purpose**: Form inputs with built-in validation, error handling, and accessibility

#### Props Interface

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number; // For textarea
}
```

#### Usage Examples

**Basic Input**
```typescript
<FormField
  label="NFT Name"
  name="name"
  type="text"
  value={formData.name}
  onChange={handleChange}
  placeholder="Enter NFT name"
  required
/>
```

**Number Input with Validation**
```typescript
<FormField
  label="Price"
  name="price"
  type="number"
  value={formData.price}
  onChange={handleChange}
  error={errors.price}
  helperText="Enter price in ETH (min: 0.001)"
  placeholder="0.00"
  required
/>
```

**Textarea**
```typescript
<FormField
  label="Description"
  name="description"
  type="textarea"
  value={formData.description}
  onChange={handleChange}
  placeholder="Describe your NFT..."
  rows={4}
/>
```

**Disabled State**
```typescript
<FormField
  label="Token ID"
  name="tokenId"
  type="text"
  value={nft.tokenId}
  onChange={() => {}}
  disabled={true}
  helperText="Token ID cannot be changed"
/>
```

**Error State**
```typescript
<FormField
  label="Wallet Address"
  name="address"
  type="text"
  value={formData.address}
  onChange={handleChange}
  error={!isValidAddress(formData.address) ? 'Invalid Ethereum address' : undefined}
  required
/>
```

#### Form Pattern with useForm Hook

```typescript
import { useForm } from '@/hooks';

function MyForm() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', price: '' },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.price || parseFloat(values.price) <= 0) {
        errors.price = 'Price must be greater than 0';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await createListing(values);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Name"
        name="name"
        value={values.name}
        onChange={handleChange}
        error={errors.name}
        required
      />
      <FormField
        label="Price"
        name="price"
        type="number"
        value={values.price}
        onChange={handleChange}
        error={errors.price}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Design Principles

### 1. Composition Over Configuration

**❌ Bad - Too many props**
```typescript
<Card
  title="Title"
  subtitle="Subtitle"
  image={imageUrl}
  badge="New"
  footer="Footer text"
  showActions={true}
  actionButtons={[...]}
/>
```

**✅ Good - Flexible composition**
```typescript
<BaseCard>
  <CardImage src={imageUrl} />
  <CardHeader>
    <h3>Title</h3>
    <span className="badge">New</span>
  </CardHeader>
  <CardContent>Subtitle</CardContent>
  <CardFooter>Footer text</CardFooter>
</BaseCard>
```

### 2. Single Responsibility

Each component does ONE thing well:
- **BaseCard** - Container with styling
- **BaseModal** - Dialog management
- **LoadingState** - Loading indicators
- **EmptyState** - Empty placeholders
- **FormField** - Input with validation

### 3. Zero Business Logic

Core components never:
- ❌ Make API calls
- ❌ Manage global state
- ❌ Contain business rules
- ❌ Know about NFTs/marketplace

They only:
- ✅ Render UI
- ✅ Handle local UI state
- ✅ Accept props
- ✅ Emit events

### 4. Accessibility First

All components include:
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ Semantic HTML

---

## Composition Patterns

### Slot Pattern (BaseCard)

```typescript
// Define clear slots for content
<BaseCard
  image={<Slot1 />}
  header={<Slot2 />}
  content={<Slot3 />}
  footer={<Slot4 />}
/>
```

### Wrapper Pattern (BaseModal)

```typescript
// Wrap content with behavior
<BaseModal isOpen={isOpen} onClose={close}>
  <YourContent />
</BaseModal>
```

### State Pattern (LoadingState/EmptyState)

```typescript
// Conditional rendering based on state
if (loading) return <LoadingState />;
if (error) return <ErrorDisplay error={error} />;
if (!data?.length) return <EmptyState title="No data" />;
return <Content data={data} />;
```

---

## Best Practices

### ✅ DO

**Use Memoization for Expensive Content**
```typescript
const cardContent = useMemo(() => (
  <ExpensiveComponent data={data} />
), [data]);

<BaseCard content={cardContent} />
```

**Compose Small, Focused Components**
```typescript
function NFTCard({ nft }: { nft: NFT }) {
  return (
    <BaseCard>
      <NFTImage nft={nft} />
      <NFTHeader nft={nft} />
      <NFTPrice nft={nft} />
    </BaseCard>
  );
}
```

**Handle All States**
```typescript
function DataView() {
  const { data, loading, error } = useData();

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Error" message={error.message} />;
  if (!data) return <EmptyState title="No data" />;

  return <Content data={data} />;
}
```

### ❌ DON'T

**Don't Add Business Logic**
```typescript
// ❌ Bad
function BaseCard({ nft }: { nft: NFT }) {
  const price = await fetchPrice(nft.id); // NO!
  return <div>{price}</div>;
}

// ✅ Good
function NFTCard({ nft }: { nft: NFT }) {
  return (
    <BaseCard>
      <PriceDisplay price={nft.price} />
    </BaseCard>
  );
}
```

**Don't Overload Props**
```typescript
// ❌ Bad - 20+ props
<BaseCard 
  prop1={...} prop2={...} prop3={...} prop4={...}
  prop5={...} prop6={...} prop7={...} prop8={...}
/>

// ✅ Good - Composition
<BaseCard>
  <CustomContent {...allYourProps} />
</BaseCard>
```

---

## Performance Tips

### Memoization

```typescript
// Memoize expensive components
const MemoizedCard = memo(BaseCard);

// Memoize callbacks
const handleClick = useCallback(() => {
  navigate(`/nft/${id}`);
}, [id, navigate]);
```

### Lazy Loading

```typescript
// Lazy load heavy content
const HeavyContent = lazy(() => import('./HeavyContent'));

<BaseCard>
  <Suspense fallback={<LoadingState />}>
    <HeavyContent />
  </Suspense>
</BaseCard>
```

---

## Testing Examples

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseCard } from './BaseCard';

describe('BaseCard', () => {
  it('renders children', () => {
    render(<BaseCard>Test content</BaseCard>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<BaseCard onClick={handleClick}>Click me</BaseCard>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading skeleton', () => {
    render(<BaseCard loading>Content</BaseCard>);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
```

---

## Related Documentation

- [Main Components README](../README.md)
- [NFT Components](../nft/README.md)
- [Admin Components](../admin/README.md)
- [Architecture](../../../docs/architecture/features.md)

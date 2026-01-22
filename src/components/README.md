# components/ - React Component Library

Reusable UI components organized by domain and complexity level.

## Quick Reference

### **Core Components** (`core/`)

#### BaseCard
```typescript
import { BaseCard } from '@/components/core/Card/BaseCard';

<BaseCard 
  size="md"           // xs | sm | md | lg | xl
  border="default"    // none | default | gradient
  padding="p-6"
  hover={true}
  loading={false}
  onClick={() => {}}
>
  <h3>Title</h3>
  <p>Content</p>
</BaseCard>
```

#### BaseModal
```typescript
import { BaseModal } from '@/components/core/Modal/BaseModal';

<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="lg"
  disableBackdropClick={false}
>
  <p>Modal content</p>
</BaseModal>
```

#### LoadingState
```typescript
import { LoadingState } from '@/components/core/Loading/LoadingState';

<LoadingState 
  size="lg"              // xs | sm | md | lg | xl
  variant="centered"     // centered | inline
  message="Loading..."
  color="blue"
/>
```

#### EmptyState
```typescript
import { EmptyState } from '@/components/core/Empty/EmptyState';

<EmptyState
  icon={<Icon />}
  title="No items found"
  message="Try adjusting your filters"
  action={<button>Reload</button>}
/>
```

#### FormField
```typescript
import { FormField } from '@/components/core/Form/FormField';

<FormField
  label="Name"
  name="name"
  type="text"
  value={value}
  onChange={handleChange}
  error={errors.name}
  required
/>
```

### **NFT Components** (`nft/`)
- `NFTCard.tsx` - NFT display card
- `NFTGallery.tsx` - Grid gallery
- `LazyNFTCard.tsx` - Lazy-loaded card
- `modals/` - BuyNowModal, CancelListingModal, UpdateListingModal

### **Layout Components** (`layout/`)
- `PageHeader.tsx` - Page header with breadcrumbs
- `Navbar.tsx` - Navigation bar
- `Footer.tsx` - Footer
- `Web3Provider.tsx` - Web3 context provider

### **Auth Components** (`auth/`)
- `AdminAuthGuard.tsx` - Protect admin routes
- `AdminGuard.tsx` - Admin access control
- `Web3ConnectButton.tsx` - Wallet connection

## Component Organization

```
components/
├── core/              # Reusable core components (BaseCard, BaseModal, etc.)
├── nft/              # NFT-specific components
├── layout/           # Layout & navigation
├── auth/             # Authentication components
├── ui/               # Generic UI elements
├── shared/           # Shared utilities
└── icons/            # Icon components
```

## Design Patterns

### **Composition over Props Drilling**
```typescript
// ✅ Good - Composition
<BaseCard>
  <CardHeader title="NFT" />
  <CardContent>{children}</CardContent>
</BaseCard>

// ❌ Avoid - Too many props
<Card title="NFT" content={...} footer={...} />
```

### **Loading States**
```typescript
// Always provide loading state
if (loading) return <LoadingState />;
if (error) return <EmptyState title="Error" />;
return <Content data={data} />;
```

### **Consistent Styling**
- Use Tailwind CSS classes
- Follow existing patterns (borders, shadows, spacing)
- Mobile-first responsive design

## Related Documentation

- **Architecture**: [/docs/architecture/features.md](/docs/architecture/features.md)
- **Utilities**: [/docs/architecture/utilities.md](/docs/architecture/utilities.md)

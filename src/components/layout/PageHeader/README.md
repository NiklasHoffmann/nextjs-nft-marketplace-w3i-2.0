# PageHeader Component

## Overview
Unified, reusable header component for all pages with a consistent compact design.

## Design Principles
- **Single Responsibility**: Each subcomponent handles one specific task
- **Composition**: Complex UI built from simple, composable parts
- **Type Safety**: Comprehensive TypeScript types for all props
- **Flexibility**: Supports multiple icon types and content layouts
- **Consistency**: Enforces design system across all pages

## Architecture

### Component Hierarchy
```
PageHeader
├── BackButton (navigation)
├── Separator (visual divider)
├── IconBadge (flexible icon display)
├── TitleSection (title + optional copyable address)
└── rightContent (slot for stats/actions)
```

### Key Features
1. **Fixed Positioning**: Consistently placed at `top-[66px]`
2. **Sidebar Support**: Optional left offset for pages with sidebar
3. **Icon Flexibility**: 4 types (svg, text-badge, gradient-badge, custom)
4. **Copyable Addresses**: Built-in support for wallet/contract addresses
5. **Responsive**: Adapts to different screen sizes

## Usage Examples

### 1. Wallet Page
```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { WalletStats } from './WalletStats';

<PageHeader
  backLink={{ 
    href: "/marketplace", 
    label: "Back to Marketplace" 
  }}
  icon={{
    type: "svg",
    svgContent: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600"
  }}
  title="My Wallet"
  subtitle={{ 
    address: "0x1234567890abcdef...", 
    displayFormat: "short" 
  }}
  rightContent={
    <WalletStats
      listedCount={5}
      unlistedCount={12}
      totalListedValue={2.5}
    />
  }
/>
```

### 2. Collection Page
```tsx
<PageHeader
  backLink={{ 
    href: "/marketplace", 
    label: "Back to Marketplace" 
  }}
  icon={{
    type: "svg",
    svgContent: <CollectionIcon />,
    gradientFrom: "from-blue-500",
    gradientTo: "to-purple-500"
  }}
  title="Bored Ape Yacht Club"
  subtitle={{ 
    address: contractAddress, 
    displayFormat: "short" 
  }}
  rightContent={<CollectionStats {...stats} />}
  hasSidebar={true}
/>
```

### 3. NFT Detail Page
```tsx
<PageHeader
  backLink={{ 
    href: "/marketplace", 
    label: "Back to Marketplace" 
  }}
  icon={{
    type: "text-badge",
    text: "BAYC" // contractSymbol
  }}
  title="Ape #1234"
  subtitle="Bored Ape Yacht Club"
  rightContent={
    <div className="grid grid-cols-5 gap-3">
      <StatCard label="Views" value={1234} />
      <StatCard label="Likes" value={56} />
      {/* ... more cards */}
    </div>
  }
/>
```

### 4. Sell Page (with custom icon)
```tsx
<PageHeader
  backLink={{ 
    href: "/wallet", 
    label: "Back to Wallet" 
  }}
  icon={{
    type: "custom",
    customContent: (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <span className="text-xl">🏷️</span>
      </div>
    )
  }}
  title="Sell & Trade NFTs"
  subtitle="Select NFTs to list on the marketplace"
  rightContent={<SellStats {...stats} />}
/>
```

## Props API

### PageHeaderProps
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `backLink` | `BackLink` | ✅ | Navigation configuration |
| `icon` | `IconConfig` | ✅ | Icon/badge configuration |
| `title` | `string` | ✅ | Main page title |
| `subtitle` | `string \| CopyableAddress` | ❌ | Secondary text or address |
| `rightContent` | `ReactNode` | ❌ | Stats cards or actions |
| `hasSidebar` | `boolean` | ❌ | Enable left sidebar offset |
| `className` | `string` | ❌ | Additional CSS classes |

### BackLink
```typescript
{
  href: string;        // Link destination
  label: string;       // Button text
}
```

### IconConfig
```typescript
{
  type: 'svg' | 'text-badge' | 'gradient-badge' | 'custom';
  svgContent?: ReactNode;      // For 'svg' type
  text?: string;               // For 'text-badge' type
  gradientFrom?: string;       // Tailwind class (e.g., "from-blue-500")
  gradientTo?: string;         // Tailwind class (e.g., "to-purple-500")
  customContent?: ReactNode;   // For 'custom' type
}
```

### CopyableAddress
```typescript
{
  address: string;                        // Full address
  displayFormat?: 'full' | 'short';      // short = 0x123...789
}
```

## Migration Guide

### Before (WalletHeader.tsx)
```tsx
<div className="fixed top-[66px] left-0 right-0 z-10 bg-white border-b">
  <div className="px-8 py-2.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/marketplace">
          <svg>...</svg>
          <span>Back to Marketplace</span>
        </Link>
        <div className="w-px h-8 bg-gray-200" />
        <div className="w-9 h-9 rounded-full bg-gradient...">
          <svg>...</svg>
        </div>
        <div>
          <h1>{title}</h1>
          <p>{address}</p>
          <button onClick={copy}>Copy</button>
        </div>
      </div>
      <div>
        <WalletStats {...stats} />
      </div>
    </div>
  </div>
</div>
```

### After (using PageHeader)
```tsx
<PageHeader
  backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
  icon={{ type: "svg", svgContent: <WalletIcon />, gradientFrom: "from-green-500", gradientTo: "to-emerald-600" }}
  title="My Wallet"
  subtitle={{ address, displayFormat: "short" }}
  rightContent={<WalletStats {...stats} />}
/>
```

**Benefits:**
- 50+ lines reduced to 7 lines
- No duplicate markup
- Type-safe configuration
- Automatic copy functionality
- Consistent styling

## Testing Checklist

### Visual Tests
- [ ] Back button navigates correctly
- [ ] Icon displays properly for all 4 types
- [ ] Title truncates with ellipsis on overflow
- [ ] Address copy button works
- [ ] Separator shows between elements
- [ ] Right content aligns properly
- [ ] Sidebar offset applies on md+ screens

### Responsive Tests
- [ ] Mobile: All elements visible, proper wrapping
- [ ] Tablet: Sidebar offset applies correctly
- [ ] Desktop: Stats cards display in grid

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces elements correctly
- [ ] Copy button has aria-label
- [ ] Links have proper title attributes

## Performance Considerations
- Subcomponents are pure functions (no unnecessary re-renders)
- Icon badge uses CSS classes (no inline styles)
- Copy handler is not recreated on every render
- Memoization not needed due to simple structure

## Future Enhancements
1. **Mobile menu**: Collapsible stats on small screens
2. **Breadcrumbs**: Support for multi-level navigation
3. **Actions dropdown**: Common actions (refresh, settings)
4. **Theme support**: Dark mode variants
5. **Animation**: Smooth transitions on mount/unmount

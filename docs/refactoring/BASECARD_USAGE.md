# BaseCard Component Usage Guide

## Overview

BaseCard is a unified card component that eliminates duplication across NFTCard, CollectionCard, StatCard, and other card variants. It provides consistent styling, flexible slots, and powerful customization options.

## Basic Usage

```tsx
import { BaseCard, CardBadge, CardHeader, CardStat } from '@/components/core/Card';

// Simple card with image and content
<BaseCard
  size="md"
  hoverable
  onClick={() => router.push('/details')}
  image={<img src={imageUrl} alt="NFT" className="w-full h-full object-cover" />}
  content={<p>Card content here</p>}
/>
```

## Props Reference

### Core Props
- `size`: 'sm' | 'md' | 'lg' | 'xl' - Card dimensions (default: 'md')
- `hoverable`: boolean - Enable hover effects (scale, shadow)
- `onClick`: () => void - Click handler (makes card clickable)
- `loading`: boolean - Show skeleton state
- `className`: string - Additional CSS classes

### Slot System
- `image`: ReactNode - Top image/media area
- `badge`: ReactNode - Badge overlay (top-right)
- `header`: ReactNode - Header content
- `content`: ReactNode - Main content area
- `footer`: ReactNode - Footer content
- `overlay`: ReactNode - Full card overlay

### Styling Props
- `border`: boolean | 'default' | 'thick' | 'colored' - Border style
- `shadow`: boolean | 'sm' | 'md' | 'lg' | 'xl' - Shadow intensity
- `background`: 'white' | 'gray' | 'gradient' - Background color
- `rounded`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' - Border radius
- `padding`: string - Custom padding (overrides size default)

### Advanced Props
- `noTransition`: boolean - Disable animations
- `group`: boolean - Enable group hover effects (default: true)

## Examples

### NFT Card (Before: 841 lines)

**After (with BaseCard):**
```tsx
import { BaseCard, CardBadge, CardHeader } from '@/components/core/Card';

<BaseCard
  size="md"
  hoverable
  onClick={() => router.push(`/nft/${address}/${tokenId}`)}
  loading={isLoading}
  image={
    <OptimizedNFTImage
      src={nft.metadata?.image}
      alt={nft.metadata?.name}
      className="w-full h-full object-cover"
    />
  }
  badge={
    nft.listing?.price ? (
      <CardBadge variant={nft.listing.isSwap ? 'swap' : 'sale'}>
        {nft.listing.isSwap ? 'Swap' : 'Sale'}
      </CardBadge>
    ) : null
  }
  header={
    <CardHeader
      title={nft.insights?.customTitle || nft.metadata?.name || `#${nft.tokenId}`}
      subtitle={nft.contract?.symbol}
    />
  }
  content={
    <div className="space-y-2">
      {nft.listing?.price && (
        <CardStat
          label="Price"
          value={`${formatEther(nft.listing.price)} ETH`}
          variant="highlight"
        />
      )}
      <CardStat label="Token ID" value={nft.tokenId} />
    </div>
  }
  footer={
    <button className="w-full btn-primary">
      {nft.listing?.price ? 'Buy Now' : 'View Details'}
    </button>
  }
/>
```

### Collection Card (Before: 4 separate components)

**After (unified):**
```tsx
<BaseCard
  size="lg"
  hoverable
  onClick={() => router.push(`/collection/${address}`)}
  image={
    <div className="grid grid-cols-2 gap-1 h-full">
      {previewImages.map((img, i) => (
        <img key={i} src={img} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  }
  header={
    <CardHeader
      title={collection.contractName || 'Unnamed Collection'}
      subtitle={collection.contractSymbol}
    />
  }
  content={
    <div className="space-y-2">
      <CardStat label="Items" value={collection.itemCount} />
      <CardStat label="Floor" value={`${collection.floorPrice} ETH`} variant="highlight" />
      <CardStat label="Volume" value={`${collection.totalValue} ETH`} />
    </div>
  }
/>
```

### Stat Card (Before: 56 lines)

**After:**
```tsx
<BaseCard
  size="sm"
  border="default"
  shadow="sm"
  padding="p-3"
  hoverable
  header={
    <div className="flex items-center gap-2">
      <div className="bg-green-100 rounded-lg p-1.5">
        <ChartIcon className="w-5 h-5 text-green-600" />
      </div>
      <span className="text-xs font-medium text-gray-600">Total Sales</span>
    </div>
  }
  content={
    <>
      <p className="text-xl font-bold text-green-600">{totalSales}</p>
      <p className="text-xs text-gray-500">{formattedValue} ETH</p>
    </>
  }
/>
```

### Price Card with Modal Integration

```tsx
<BaseCard
  size="md"
  border="thick"
  shadow="lg"
  content={
    <div className="space-y-4">
      <CardStat
        label="Current Price"
        value={`${formatEther(price)} ETH`}
        variant="highlight"
      />
      <CardStat label="USD Value" value={convertedPrice} />
      <CardStat 
        label="Status" 
        value={status}
        icon={<StatusIcon />}
      />
    </div>
  }
  footer={
    <div className="flex gap-2">
      {isOwner ? (
        <>
          <button onClick={() => setShowUpdateModal(true)} className="btn-secondary flex-1">
            Update
          </button>
          <button onClick={() => setShowCancelModal(true)} className="btn-danger flex-1">
            Cancel
          </button>
        </>
      ) : (
        <button onClick={() => setShowBuyModal(true)} className="btn-primary w-full">
          Buy Now
        </button>
      )}
    </div>
  }
/>
```

### Loading State

```tsx
// Automatically shows skeleton
<BaseCard
  size="md"
  loading={true}
/>

// Custom loading overlay
<BaseCard
  size="md"
  overlay={
    isProcessing && (
      <div className="flex items-center justify-center bg-white/90">
        <Spinner />
      </div>
    )
  }
/>
```

## Sub-Components

### CardBadge

Pre-styled badges for card overlays:

```tsx
<CardBadge variant="sale">For Sale</CardBadge>
<CardBadge variant="swap">Swap</CardBadge>
<CardBadge variant="sold">Sold</CardBadge>
<CardBadge variant="new">New</CardBadge>
<CardBadge variant="featured">Featured</CardBadge>
```

### CardHeader

Standard header with title and subtitle:

```tsx
<CardHeader
  title="Cool NFT #1234"
  subtitle="COOLNFT"
  icon={<CollectionIcon />}
/>
```

### CardStat

Stat rows with label and value:

```tsx
<CardStat label="Price" value="1.5 ETH" variant="highlight" />
<CardStat label="Owner" value="0x123...456" icon={<UserIcon />} />
```

## Migration Strategy

1. **Keep existing cards working** - BaseCard supports gradual migration
2. **Start with simple cards** - StatCard, loading skeletons
3. **Move to complex cards** - NFTCard, CollectionCard
4. **Remove old components** - After migration is complete

## Size Configuration

| Size | Width | Image Height | Padding | Use Case |
|------|-------|--------------|---------|----------|
| sm   | 256px | 192px       | 12px    | Stat cards, small previews |
| md   | 320px | 256px       | 16px    | Standard NFT cards |
| lg   | 384px | 320px       | 20px    | Collection cards, featured items |
| xl   | 448px | 384px       | 24px    | Hero cards, detail views |

## Performance Notes

- **Memoized** - All sub-components use `memo()` for optimal performance
- **Transform-GPU** - Hardware-accelerated animations
- **Lazy Loading** - Combine with lazy image loading for best results
- **Skeleton States** - Built-in loading skeletons avoid layout shift

## Accessibility

- **Keyboard Navigation** - Cards with `onClick` support Enter/Space keys
- **ARIA Roles** - Clickable cards have `role="button"`
- **Tab Index** - Proper keyboard focus management
- **Semantic HTML** - Uses appropriate elements for screen readers

## Estimated Impact

- **NFTCard**: 841 → ~150 lines (83% reduction)
- **CollectionCard**: 150 → ~80 lines (47% reduction)
- **StatCard**: 56 → ~30 lines (46% reduction)
- **Total**: ~1000 lines eliminated across card components

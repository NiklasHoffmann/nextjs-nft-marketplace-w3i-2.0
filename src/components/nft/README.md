# NFT Components - Marketplace UI

Production-ready NFT display components optimized for performance, user experience, and marketplace interactions. Handles NFT cards, modals, image optimization, and lazy loading.

## 📋 Table of Contents
- [Overview](#overview)
- [Components](#components)
  - [NFTCard](#nftcard---main-nft-display)
  - [LazyNFTCard](#lazynftcard---performance-optimized)
  - [OptimizedNFTImage](#optimizednftimage---image-handling)
  - [NFT Modals](#nft-modals)
- [Architecture](#architecture)
- [Performance Patterns](#performance-patterns)
- [Best Practices](#best-practices)

---

## Overview

**Location**: `components/nft/`  
**Purpose**: NFT-specific UI components with marketplace integration  
**Components**: 11 files + 3 modals + 4 NFTCard sub-components

### Component List
- **NFTCard.tsx** (365 lines) - Main NFT card with 3D tilt effect
- **LazyNFTCard.tsx** - Intersection Observer wrapper for lazy loading
- **OptimizedNFTImage.tsx** - Image optimization with blur placeholders
- **ImagePreloader.tsx** - Preload critical images
- **NFTCardExplanation.tsx** - Educational tooltips
- **NFTCard/** - Modular sub-components
  - NFTCardHeader.tsx
  - NFTCardImage.tsx
  - NFTCardPrice.tsx
  - NFTCardFooter.tsx
- **modals/** - User interaction modals
  - BuyNowModal.tsx
  - UpdateListingModal.tsx
  - CancelListingModal.tsx

### Key Features
✅ **3D Tilt Effect** - Mouse + touch support with hardware acceleration  
✅ **Lazy Loading** - Intersection Observer for performance (100+ cards)  
✅ **Image Optimization** - Blur placeholders, IPFS conversion, CDN integration  
✅ **Rarity System** - Dynamic backgrounds based on NFT rarity  
✅ **Social Stats** - Likes, watchlist, views integration  
✅ **Price Display** - ETH/USD conversion with CurrencyContext

---

## Components

### NFTCard - Main NFT Display

**File**: `nft/NFTCard.tsx` (365 lines)  
**Refactored**: December 2025 (-400 LOC from original)  
**Uses**: BaseCard, useCardTilt hook, modular sub-components

#### Props Interface

```typescript
interface NFTCardProps {
  /** Complete NFT data from AggregatedNFT system */
  nft: AggregatedNFT;
  
  /** Display options */
  showStats?: boolean;         // Show likes, views, watchlist
  className?: string;
  priority?: boolean;          // Load image immediately (above fold)
  enableInsights?: boolean;    // Show insights/categories
}
```

#### Features

1. **3D Tilt Effect** - Hardware-accelerated CSS transforms
2. **Blurred Background** - Sharp foreground + blurred background
3. **Rarity Backgrounds** - Common (blue) → Legendary (purple gradient)
4. **Social Stats** - Likes, watchlist, views with real-time updates
5. **Category Tags** - Genre, theme, rarity insights
6. **Price Display** - ETH + USD with currency toggle
7. **Modular Structure** - 4 sub-components for maintainability

#### Usage Examples

**Basic NFT Card**
```typescript
import { NFTCard } from '@/components/nft';

<NFTCard nft={nftData} />
```

**With All Features**
```typescript
<NFTCard
  nft={nftData}
  showStats={true}
  enableInsights={true}
  priority={isAboveFold}
  className="custom-class"
/>
```

**In Grid Layout**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {nfts.map(nft => (
    <NFTCard key={nft.id} nft={nft} />
  ))}
</div>
```

#### Sub-Components Architecture

**NFTCardHeader** - Title, token ID, collection badge
```typescript
<NFTCardHeader nft={nft} />
// Renders: Name, #tokenId, collection info
```

**NFTCardImage** - Optimized image with blur placeholder
```typescript
<NFTCardImage 
  nft={nft} 
  priority={priority}
/>
// Handles: IPFS URLs, blur placeholders, fallbacks
```

**NFTCardPrice** - Price display with currency conversion
```typescript
<NFTCardPrice nft={nft} />
// Shows: ETH price + USD equivalent
```

**NFTCardFooter** - Social stats, action buttons
```typescript
<NFTCardFooter 
  nft={nft} 
  showStats={showStats}
/>
// Displays: Likes, views, watchlist, CTA buttons
```

#### Rarity System

```typescript
// Automatic background colors based on rarity
const rarityBackgrounds = {
  Common: 'bg-gradient-to-br from-blue-50 to-blue-100',
  Uncommon: 'bg-gradient-to-br from-green-50 to-green-100',
  Rare: 'bg-gradient-to-br from-purple-50 to-purple-100',
  Epic: 'bg-gradient-to-br from-orange-50 to-orange-100',
  Legendary: 'bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100'
};
```

#### 3D Tilt Effect

```typescript
// Powered by useCardTilt hook
const { tiltRef, tiltStyle } = useCardTilt({
  maxTilt: 15,           // Max rotation degrees
  scale: 1.05,           // Hover scale
  speed: 400,            // Animation speed (ms)
  glare: true,           // Enable glare effect
  maxGlare: 0.5          // Glare opacity
});

<div ref={tiltRef} style={tiltStyle}>
  {/* Card content */}
</div>
```

---

### LazyNFTCard - Performance Optimized

**File**: `nft/LazyNFTCard.tsx`  
**Purpose**: Lazy load NFT cards using Intersection Observer

#### Props Interface

```typescript
interface LazyNFTCardProps {
  nft: AggregatedNFT;
  threshold?: number;      // Visibility threshold (0-1)
  rootMargin?: string;     // Load before visible (e.g., "100px")
  showStats?: boolean;
  enableInsights?: boolean;
}
```

#### Usage Examples

**Basic Lazy Loading**
```typescript
import { LazyNFTCard } from '@/components/nft';

// Loads when 10% visible
<LazyNFTCard 
  nft={nft} 
  threshold={0.1}
/>
```

**Preload Before Visible**
```typescript
// Start loading 200px before entering viewport
<LazyNFTCard
  nft={nft}
  threshold={0}
  rootMargin="200px"
/>
```

**Large Grid Pattern**
```typescript
// For lists with 100+ items
<div className="grid grid-cols-4 gap-6">
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

#### Performance Benefits

- ✅ **Reduced Initial Load** - Only render visible cards
- ✅ **Lower Memory Usage** - Fewer DOM nodes
- ✅ **Faster Scrolling** - Progressive rendering
- ✅ **Better UX** - Smooth loading experience

**Benchmarks** (1000 NFTs):
- Without lazy loading: ~8s initial render, 2GB memory
- With lazy loading: ~1s initial render, 500MB memory

---

### OptimizedNFTImage - Image Handling

**File**: `nft/OptimizedNFTImage.tsx`  
**Purpose**: Optimized image component with IPFS support and blur placeholders

#### Props Interface

```typescript
interface OptimizedNFTImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;      // Load immediately (above fold)
  width?: number;
  height?: number;
  blur?: boolean;          // Show blur placeholder
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}
```

#### Features

1. **IPFS URL Conversion** - Automatic gateway routing
2. **Blur Placeholders** - Low-quality image previews
3. **Fallback Handling** - Default image on error
4. **Priority Loading** - For above-the-fold images
5. **Lazy Loading** - For below-the-fold images
6. **CDN Integration** - Cloudflare image optimization

#### Usage Examples

**Basic Image**
```typescript
<OptimizedNFTImage
  src={nft.image}
  alt={nft.name}
  className="w-full h-64 object-cover rounded-lg"
/>
```

**Priority Image (Above Fold)**
```typescript
<OptimizedNFTImage
  src={nft.image}
  alt={nft.name}
  priority={true}      // Load immediately
  width={400}
  height={400}
/>
```

**With Blur Placeholder**
```typescript
<OptimizedNFTImage
  src={nft.image}
  alt={nft.name}
  blur={true}
  className="rounded-lg"
/>
```

**IPFS URL Handling**
```typescript
// Automatically converts IPFS URLs
<OptimizedNFTImage
  src="ipfs://QmHash123..."
  alt="IPFS NFT"
/>
// Renders: https://ipfs.io/ipfs/QmHash123...
```

---

### NFT Modals

#### BuyNowModal

**File**: `nft/modals/BuyNowModal.tsx`  
**Purpose**: Purchase NFT with price display and wallet integration

```typescript
import { BuyNowModal } from '@/components/nft/modals';

<BuyNowModal
  isOpen={isOpen}
  onClose={handleClose}
  nft={selectedNFT}
  onSuccess={(txHash) => {
    console.log('Purchase successful:', txHash);
    router.push(`/my-nfts`);
  }}
/>
```

**Features**:
- Price breakdown (NFT + platform fee + gas estimate)
- Wallet balance check
- Transaction progress (signing → confirming → complete)
- Error handling with retry
- Success/failure callbacks

#### UpdateListingModal

**File**: `nft/modals/UpdateListingModal.tsx`  
**Purpose**: Update NFT listing price

```typescript
import { UpdateListingModal } from '@/components/nft/modals';

<UpdateListingModal
  isOpen={isOpen}
  onClose={handleClose}
  listing={currentListing}
  onSuccess={(newPrice) => {
    console.log('Listing updated to:', newPrice);
    refreshListings();
  }}
/>
```

**Features**:
- Current vs. new price comparison
- USD conversion preview
- Price validation (min: 0.001 ETH)
- Gas estimation
- Transaction tracking

#### CancelListingModal

**File**: `nft/modals/CancelListingModal.tsx`  
**Purpose**: Cancel active NFT listing

```typescript
import { CancelListingModal } from '@/components/nft/modals';

<CancelListingModal
  isOpen={isOpen}
  onClose={handleClose}
  listing={listing}
  onSuccess={() => {
    console.log('Listing cancelled');
    router.push('/my-nfts');
  }}
/>
```

**Features**:
- Confirmation step (prevent accidents)
- Gas estimation
- Transaction progress
- Post-cancel actions

---

## Architecture

### Component Hierarchy

```
NFTCard (Main)
├── BaseCard (from core/)
│   ├── NFTCardImage
│   │   └── OptimizedNFTImage
│   ├── NFTCardHeader
│   ├── NFTCardPrice
│   │   └── CurrencyContext
│   └── NFTCardFooter
│       └── Social Stats (NFTStatsContext)
└── useCardTilt (hook)

LazyNFTCard (Wrapper)
└── NFTCard + Intersection Observer

Modals
├── BuyNowModal
├── UpdateListingModal
└── CancelListingModal
    └── BaseModal (from core/)
```

### Data Flow

```
AggregatedNFT (MongoDB)
    ↓
NFTCard Component
    ↓
├── NFTStatsContext (likes, views)
├── CurrencyContext (ETH/USD)
├── WalletContext (ownership)
└── TransactionService (buy/sell)
```

### Context Integration

**NFTStatsContext** - User interactions
```typescript
const { stats, toggleLike, addToWatchlist } = useNFTUserStats(nft.id);
```

**CurrencyContext** - Price conversion
```typescript
const { selectedCurrency, convertPrice } = useCurrency();
const usdPrice = convertPrice(nft.price, 'ETH', 'USD');
```

---

## Performance Patterns

### 1. Lazy Loading Strategy

```typescript
// For grids with 20+ NFTs
<div className="grid grid-cols-4 gap-6">
  {nfts.map((nft, index) => {
    // First row: priority loading
    if (index < 4) {
      return <NFTCard key={nft.id} nft={nft} priority />;
    }
    // Rest: lazy loading
    return <LazyNFTCard key={nft.id} nft={nft} />;
  })}
</div>
```

### 2. Image Optimization

```typescript
// Preload critical images
import { ImagePreloader } from '@/components/nft';

<ImagePreloader
  images={featuredNFTs.map(nft => nft.image)}
  priority={true}
/>

// Then render cards
{featuredNFTs.map(nft => (
  <NFTCard key={nft.id} nft={nft} priority />
))}
```

### 3. Memoization

```typescript
// Memoize expensive NFT cards
const MemoizedNFTCard = memo(NFTCard, (prevProps, nextProps) => {
  return (
    prevProps.nft.id === nextProps.nft.id &&
    prevProps.nft.price === nextProps.nft.price &&
    prevProps.nft.status === nextProps.nft.status
  );
});
```

### 4. Virtual Scrolling (Large Lists)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function NFTList({ nfts }: { nfts: NFT[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: nfts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350, // Card height
    overscan: 5              // Render 5 extra items
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const nft = nfts[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <NFTCard nft={nft} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Best Practices

### ✅ DO

**Use LazyNFTCard for Large Lists**
```typescript
// For 100+ NFTs
{nfts.map(nft => (
  <LazyNFTCard key={nft.id} nft={nft} />
))}
```

**Prioritize Above-the-Fold Images**
```typescript
{nfts.map((nft, index) => (
  <NFTCard 
    key={nft.id} 
    nft={nft}
    priority={index < 4} // First row
  />
))}
```

**Handle Loading/Error States**
```typescript
function NFTGallery() {
  const { nfts, loading, error } = useNFTs();

  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay error={error} />;
  if (!nfts?.length) return <EmptyState title="No NFTs" />;

  return (
    <div className="grid grid-cols-4 gap-6">
      {nfts.map(nft => <NFTCard key={nft.id} nft={nft} />)}
    </div>
  );
}
```

**Memoize Callbacks**
```typescript
const handleBuy = useCallback(async (nft: NFT) => {
  await purchaseNFT(nft);
  refreshNFTs();
}, [refreshNFTs]);
```

### ❌ DON'T

**Don't Render All Cards Immediately**
```typescript
// ❌ Bad - Renders 1000 cards at once
{nfts.map(nft => <NFTCard key={nft.id} nft={nft} />)}

// ✅ Good - Lazy loads as needed
{nfts.map(nft => <LazyNFTCard key={nft.id} nft={nft} />)}
```

**Don't Skip Image Optimization**
```typescript
// ❌ Bad - Raw image URLs
<img src={nft.image} />

// ✅ Good - Optimized with fallbacks
<OptimizedNFTImage src={nft.image} alt={nft.name} blur />
```

**Don't Ignore IPFS URLs**
```typescript
// ❌ Bad - IPFS URLs won't load
<img src="ipfs://QmHash..." />

// ✅ Good - OptimizedNFTImage handles conversion
<OptimizedNFTImage src="ipfs://QmHash..." alt="NFT" />
```

---

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NFTCard } from './NFTCard';

describe('NFTCard', () => {
  const mockNFT = {
    id: '1',
    name: 'Test NFT',
    image: 'https://example.com/image.jpg',
    price: '1.5',
    tokenId: '123',
    contractAddress: '0x123...'
  };

  it('renders NFT information', () => {
    render(<NFTCard nft={mockNFT} />);
    
    expect(screen.getByText('Test NFT')).toBeInTheDocument();
    expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
  });

  it('navigates on click', () => {
    const mockRouter = { push: jest.fn() };
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter
    }));

    render(<NFTCard nft={mockNFT} />);
    fireEvent.click(screen.getByRole('article'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/nft/${mockNFT.contractAddress}/${mockNFT.tokenId}`
    );
  });

  it('shows loading skeleton', () => {
    render(<NFTCard nft={{ ...mockNFT, image: null }} />);
    expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();
  });
});
```

---

## Related Documentation

- [Core Components](../core/README.md)
- [Admin Components](../admin/README.md)
- [Main Components README](../README.md)
- [Architecture](../../../docs/architecture/features.md)

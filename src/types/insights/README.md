# Insights Types

TypeScript definitions for NFT insights, analytics, and admin-managed metadata.

## Overview

The insights system provides rich metadata and analytics for NFTs beyond their on-chain data. Insights are managed by admins and displayed publicly.

## Files Overview

### `insights-main.ts`
Core insight data structures and admin management types.

**Key Types:**
```typescript
NFTInsight           // Main insight document
InsightCategory      // Categorization
InsightTag           // Tagging system
InsightMetadata      // Additional metadata
```

**Structure:**
```typescript
interface NFTInsight {
  contractAddress: string;
  tokenId: string;
  
  // Categorization
  category: 'art' | 'collectible' | 'gaming' | 'utility' | 'other';
  tags: string[];
  
  // Visibility
  featured: boolean;
  hidden: boolean;
  
  // Content
  title?: string;
  description?: string;
  externalUrl?: string;
  
  // Admin data
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### `insights-public.ts`
Public-facing insight views and display types.

**Key Types:**
```typescript
PublicInsight       // Sanitized public view
InsightSummary      // Short summary for cards
InsightDetail       // Full detail page view
```

**Public View:**
```typescript
interface PublicInsight {
  // Only includes public-safe data
  category: string;
  tags: string[];
  featured: boolean;
  description?: string;
  // Admin fields excluded
}
```

---

## Data Flow

```
Admin creates/updates insight
         ↓
Stored in MongoDB (nft_insights)
         ↓
Enriched into NFT data
         ↓
Public view (sanitized)
         ↓
Displayed in UI
```

## Usage Examples

### Creating an Insight
```typescript
import type { NFTInsight } from '@/types';

const insight: NFTInsight = {
  contractAddress: '0x...',
  tokenId: '123',
  category: 'art',
  tags: ['digital', 'abstract', 'generative'],
  featured: true,
  description: 'A stunning piece of generative art',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Public Display
```typescript
import type { PublicInsight } from '@/types';

function InsightCard({ insight }: { insight: PublicInsight }) {
  return (
    <div>
      <span>{insight.category}</span>
      {insight.featured && <Badge>Featured</Badge>}
      <p>{insight.description}</p>
    </div>
  );
}
```

### Filtering by Category
```typescript
const artNFTs = nfts.filter(nft => 
  nft.insights?.category === 'art'
);
```

---

## Categories

Predefined categories for NFT classification:

- **art** - Digital art, paintings, photography
- **collectible** - Trading cards, memorabilia
- **gaming** - In-game items, characters, assets
- **utility** - Access tokens, memberships, tickets
- **other** - Miscellaneous or uncategorized

---

## Tagging System

**Best Practices:**
- Use lowercase tags
- Keep tags concise (1-2 words)
- Use consistent vocabulary
- Common tags: `rare`, `animated`, `3d`, `pixel-art`, `profile-pic`

**Examples:**
```typescript
tags: ['rare', 'animated', 'holographic']
tags: ['pixel-art', 'retro', '8bit']
tags: ['generative', 'algorithmic', 'unique']
```

---

## Featured NFTs

**Criteria for featuring:**
1. High-quality artwork or utility
2. Active community engagement
3. Verified authentic creator
4. Interesting backstory or use case

**Display Priority:**
- Featured NFTs appear first in listings
- Highlighted in discovery sections
- May be shown on homepage

---

## Privacy & Security

**Admin-Only Fields:**
- `createdBy` - Admin user who created insight
- `updatedAt` - Last modification timestamp
- Internal notes (not in type system)

**Public Fields:**
- All categorization data
- Descriptions and URLs
- Feature status (if not hidden)

**Hidden Insights:**
- Not shown in public views
- Still accessible via direct API calls
- Used for moderation or preparation

---

## MongoDB Schema

**Collection:** `nft_insights`

**Indexes:**
```typescript
{
  contractAddress: 1,
  tokenId: 1
} // Unique compound index

{
  category: 1,
  featured: -1
} // Filtering index

{
  tags: 1
} // Tag search index
```

---

## API Integration

**Endpoints:**
```typescript
GET    /api/admin/insights          // List all insights (admin)
POST   /api/admin/insights          // Create insight (admin)
PUT    /api/admin/insights/:id      // Update insight (admin)
DELETE /api/admin/insights/:id      // Delete insight (admin)

GET    /api/insights/public/:id     // Get public insight
GET    /api/insights/featured        // List featured NFTs
```

---

## Best Practices

1. **Always Sanitize** - Use `PublicInsight` for public display
2. **Validate Category** - Use predefined categories only
3. **Tag Management** - Implement tag suggestions/autocomplete
4. **Feature Sparingly** - Keep featured NFTs exclusive (< 10%)
5. **Update Regularly** - Keep insights current and relevant

---

See [main README](../README.md) for more type documentation.

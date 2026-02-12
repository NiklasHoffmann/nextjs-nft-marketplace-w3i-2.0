# app/api/ - API Routes

Next.js API routes using standardized patterns with apiHandler, middleware, and validation.

## Quick Reference

### Standard Route Pattern

```typescript
import { apiHandler } from "@/lib/api";
import { z } from "zod";

// GET - Public endpoint
export const GET = apiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const data = await fetchData(id);
  return { data };
});

// POST - Protected endpoint
export const POST = apiHandler(
  async (request) => {
    const userAddress = request.userAddress; // auto-injected

    const body = await request.json();
    const result = await processData(body, userAddress);
    return { data: result };
  },
  { auth: true },
);

// DELETE - Admin only
export const DELETE = apiHandler(
  async (request) => {
    await deleteResource();
    return { data: { message: "Deleted" } };
  },
  { admin: true },
);
```

### With Validation

```typescript
import { withValidation } from "@/lib/middleware/validation";

const schema = z.object({
  name: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d+)?$/),
});

export const POST = apiHandler(async (request) => {
  await withValidation(request, schema);
  const body = await request.json();

  // body is now validated
  return { data: body };
});
```

| Endpoint             | Methods        | Purpose                                            | Auth Required |
| -------------------- | -------------- | -------------------------------------------------- | ------------- |
| `/user/interactions` | GET, POST, PUT | Combined user data (favorites, ratings, watchlist) | ✅ Wallet     |

---

## 📊 Data Flow

```mermaid
flowchart TD
    A[Admin] -->|Creates| B[/api/nft/admin/insights]
    B --> C[(admin_nft_insights)]

    D[Public Users] -->|Reads| E[/api/nft/insights]
    E --> C

    F[Authenticated User] -->|Interacts| G[/api/user/interactions]
    G --> H[(user_favorites)]
    G --> I[(user_ratings)]
    G --> J[(user_watchlist)]

    K[App] -->|Fetches| L[/api/nft/metadata]
    K -->|Tracks| M[/api/nft/stats]
    K -->|Blockchain| N[/api/nft/tokenURI]
```

---

## 🔧 Integration Examples

### Frontend Hook Usage:

```typescript
// NFT Detail Page
useNFTPageData() → /api/nft/admin/insights + /api/user/interactions + /api/nft/stats

// NFT Metadata
useNFT() → /api/nft/metadata

// Admin Panel
useNFTInsights() → /api/nft/admin/insights (CUD) + /api/nft/insights (Read)
```

### API Call Examples:

```javascript
// Get NFT insights (public)
GET /api/nft/insights?contractAddress=0x123&tokenId=456

// Create NFT insights (admin)
POST /api/nft/admin/insights
{ contractAddress, tokenId, title, description, ... }

// Get user interactions
GET /api/user/interactions?userId=0xabc&contractAddress=0x123&tokenId=456

// Update user interactions (batch)
POST /api/user/interactions
{ userId, contractAddress, tokenId, isFavorite: true, rating: 5, isWatchlisted: true }
```

---

## 🏗️ Architecture Benefits

### ✅ Before vs After:

| Aspect           | Old Structure                        | New Structure                     |
| ---------------- | ------------------------------------ | --------------------------------- |
| **Organization** | Functional (`/admin/`, `/insights/`) | Thematic (`/nft/`, `/user/`)      |
| **Navigation**   | Scattered across domains             | Grouped by feature domain         |
| **Scalability**  | Hard to extend                       | Easy to add new NFT/User features |
| **Developer UX** | Confusing paths                      | Intuitive, predictable paths      |

### 🎯 Key Improvements:

- **Single Domain Focus**: All NFT operations under `/nft/`
- **Logical Hierarchy**: Admin → Public → Data Services
- **Combined APIs**: User interactions consolidated from 3 → 1 endpoint
- **RESTful Design**: Consistent patterns across all routes
- **Future-Proof**: Easy to extend with new features

---

## 📂 File Locations

```
src/app/api/
├── nft/
│   ├── admin/insights/route.ts           # Admin NFT insights
│   ├── admin/insights/collections/route.ts # Admin collection insights
│   ├── insights/route.ts                 # Public NFT insights
│   ├── insights/collections/route.ts     # Public collection insights
│   ├── metadata/route.ts                 # NFT metadata
│   ├── stats/route.ts                    # NFT statistics
│   └── tokenURI/route.ts                 # Blockchain access
└── user/
    └── interactions/route.ts             # User interactions
```

---

## 🔄 Migration Status

| Component     | Status      | Notes                                      |
| ------------- | ----------- | ------------------------------------------ |
| API Routes    | ✅ Complete | All moved to new structure                 |
| Hooks         | ✅ Complete | All updated to new endpoints               |
| Components    | ✅ Complete | NFT detail page & admin panel updated      |
| Documentation | ✅ Complete | Full API reference updated                 |
| Old Routes    | ✅ Removed  | `/admin/`, `/insights/`, `/stats/` deleted |

---

_Last Updated: September 13, 2025_  
_Structure: Thematic API Organization v2.0_

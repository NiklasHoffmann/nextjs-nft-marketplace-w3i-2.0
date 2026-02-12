# App Directory Documentation

Next.js 15 App Router implementation with TypeScript, featuring a hybrid NFT marketplace with MongoDB backend and blockchain integration.

## 📁 Directory Structure

```
app/
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout (Web3Provider, ClientLayout)
├── page.tsx                    # Home page (Marketplace + History Towers Game)
│
├── admin/                      # Admin panel (Protected routes)
│   ├── layout.tsx              # Admin layout with AdminAuthGuard
│   ├── page.tsx                # Admin dashboard
│   ├── components/             # Admin-specific components ⭐
│   │   ├── ui/                 # UI components (AdminModeIndicator, MigrationBanner)
│   │   ├── multisig/           # MultiSig components (ProposalCard, TransactionBuilder)
│   │   ├── forms/              # Form components (TitleDescriptionManager, etc.)
│   │   └── sections/           # Section components (NFTSelector, TagsManager, etc.)
│   ├── dashboard/              # Admin dashboard page
│   ├── insights/               # NFT insights management
│   ├── login/                  # Admin login page
│   ├── marketplace/            # Marketplace admin
│   ├── multisig/               # MultiSig proposals
│   ├── multisig-wallet/        # MultiSig wallet management
│   │   └── submit/             # Submit transaction page
│   └── settings/               # Admin settings
│
├── api/                        # API routes (REST endpoints)
│   ├── README.md               # API documentation
│   ├── admin/                  # Admin-protected endpoints
│   │   ├── dashboard/stats/    # Dashboard statistics
│   │   ├── multisig/proposals/ # MultiSig proposal management
│   │   ├── nfts/list/          # NFT list for admin
│   │   └── system/health/      # System health check
│   ├── auth/                   # Authentication endpoints
│   │   ├── challenge/          # Get auth challenge
│   │   ├── verify/             # Verify signature
│   │   ├── session/            # Check session
│   │   └── logout/             # Logout
│   ├── cart/                   # Shopping cart endpoints
│   ├── collections/            # Collections aggregation
│   ├── game/scores/            # History Towers game scores
│   ├── marketplace/            # Marketplace endpoints
│   │   ├── collections/        # Collections list
│   │   ├── items/              # Marketplace items
│   │   ├── nft/[...]/          # NFT detail
│   │   ├── listing/[...]/      # Listing detail
│   │   ├── sync/               # Sync marketplace data
│   │   ├── whitelist/          # Whitelist management
│   │   └── facets/             # Facet info (Diamond Proxy)
│   ├── nft/                    # NFT-specific endpoints
│   │   ├── admin/insights/     # Admin NFT insights (CRUD)
│   │   ├── detail/             # NFT detail data
│   │   ├── image/[hash]/       # IPFS image proxy with caching
│   │   ├── insights/           # Public NFT insights
│   │   ├── metadata/           # NFT metadata
│   │   ├── stats/              # NFT statistics
│   │   └── update-owner/       # Update NFT ownership
│   ├── user/                   # User-specific endpoints
│   │   ├── interactions/       # User interactions (views, likes, ratings)
│   │   └── nfts/               # User's NFTs with enrichment
│   └── wallet/nfts/            # Wallet NFTs (DB-first hybrid)
│
├── cart/                       # Shopping cart page
│   ├── page.tsx                # Cart page wrapper
│   └── CartPage.tsx            # Cart page implementation
│
├── history-towers/             # History Towers game (Feature module)
│   ├── README.md               # Game documentation
│   ├── ARCHITECTURE.md         # Game architecture
│   ├── page.tsx                # Game page
│   ├── components/             # Game-specific components (8 files)
│   ├── config/                 # Game configuration
│   ├── engine/                 # Physics and render engines
│   ├── hooks/                  # Game-specific hooks
│   ├── types/                  # Game-specific types
│   └── __tests__/              # Game tests
│
├── marketplace/                # Marketplace listing page
│   └── page.tsx                # Marketplace page (MongoDB-backed)
│
├── nft/                        # NFT pages
│   ├── components/             # Shared NFT components
│   │   └── CollectionPageClient.tsx
│   ├── [contractAddress]/      # Collection page
│   │   ├── page.tsx            # Collection page
│   │   └── [tokenId]/          # NFT detail page
│   │       ├── page.tsx        # NFT detail page
│   │       └── components/     # Detail page components (17 files)
│   │           ├── tabs/       # Tab components (8 tabs)
│   │           ├── CategoryPills.tsx
│   │           ├── MediaSection.tsx
│   │           ├── NFTPriceCard.tsx
│   │           └── ...
│
├── sell/                       # Sell/List NFTs (Feature module)
│   ├── README.md               # Sell flow documentation
│   ├── ARCHITECTURE.md         # Sell architecture
│   ├── layout.tsx              # Sell layout with FlowSidebar
│   ├── page.tsx                # Sell page wrapper
│   ├── components/             # Sell-specific components (20 files)
│   │   ├── SellPage.tsx        # Main sell page component
│   │   ├── common/             # Common components
│   │   ├── forms/              # Form components
│   │   ├── listing/            # Listing components
│   │   ├── nft-selection/      # NFT selection components
│   │   └── preview/            # Preview components
│   ├── contexts/               # Sell contexts (ListingFlowContext)
│   ├── lib/                    # Sell utilities (listing-service)
│   ├── types/                  # Sell types
│   ├── utils/                  # Sell utilities
│   ├── check-listing/          # Check listing status page
│   ├── listing/                # Listing step page
│   └── success/                # Success page
│
└── wallet/                     # Wallet page
    └── page.tsx                # Wallet dashboard page
```

## 🗂️ Route Types

### Public Routes

- `/` - Home (Marketplace + Game)
- `/marketplace` - NFT marketplace
- `/nft/[contractAddress]` - Collection page
- `/nft/[contractAddress]/[tokenId]` - NFT detail page
- `/history-towers` - History Towers game
- `/cart` - Shopping cart
- `/wallet` - User wallet (requires connection)

### Protected Routes (Wallet Connection Required)

- `/sell` - List NFTs for sale
- `/sell/listing` - Listing flow
- `/sell/check-listing` - Check listing status
- `/sell/success` - Success page

### Admin Routes (Admin Authentication Required)

- `/admin` - Admin dashboard
- `/admin/dashboard` - Admin dashboard
- `/admin/insights` - Manage NFT insights
- `/admin/marketplace` - Marketplace admin
- `/admin/multisig` - MultiSig proposals
- `/admin/multisig-wallet` - MultiSig wallet
- `/admin/login` - Admin login
- `/admin/settings` - Admin settings

## 🏗️ Architecture Patterns

### 1. Feature Modules

Routes with complex functionality are organized as **feature modules** with their own subdirectories:

```typescript
// Feature Module Structure
feature/
├── README.md              # Feature documentation
├── ARCHITECTURE.md        # Architecture details (optional)
├── page.tsx               # Main page
├── layout.tsx             # Feature layout (optional)
├── components/            # Feature-specific components
├── contexts/              # Feature-specific contexts
├── hooks/                 # Feature-specific hooks
├── lib/                   # Feature utilities
├── types/                 # Feature types
└── utils/                 # Feature utilities
```

**Examples:**

- `/sell` - 45 files (listing flow, forms, NFT selection)
- `/history-towers` - 25 files (game engine, physics, rendering)
- `/admin` - 32 files (insights, multisig, dashboard)

### 2. Component Colocation

Components are colocated with their routes when they are:

- Only used in that specific route
- Tightly coupled to route logic
- Part of a complex feature module

```typescript
// ✅ Colocated components (route-specific)
app/admin/components/       # Only used in /admin routes
app/sell/components/        # Only used in /sell routes
app/history-towers/components/ # Only used in game
app/nft/[...]/[...]/components/ # Only used in NFT detail pages

// ❌ NOT colocated (moved to global)
src/components/cart/        # Reusable across app
src/components/marketplace/ # Reusable across app
src/components/wallet/      # Reusable across app
```

### 3. API Routes

All API routes use standardized infrastructure:

```typescript
// Standard API Route Pattern
import { apiHandler } from "@/lib/api/handler";
import { withAuth, withAdmin } from "@/lib/middleware";
import { apiBadRequest, apiSuccess, apiNotFound } from "@/lib/api/responses";
import { z } from "zod";

// Schema validation
const RequestSchema = z.object({
  field: z.string(),
});

// Handler with middleware
export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    const body = await req.json();
    const data = RequestSchema.parse(body);

    // Business logic

    return apiSuccess(result);
  }),
);
```

**Middleware:**

- `withAuth()` - Requires valid session (wallet signature)
- `withAdmin()` - Requires admin session

**Response Helpers:**

- `apiSuccess(data, status?)` - Success response
- `apiBadRequest(message)` - 400 Bad Request
- `apiNotFound(message)` - 404 Not Found
- `apiUnauthorized(message)` - 401 Unauthorized
- `apiInternalError(message)` - 500 Internal Server Error

### 4. Layouts

Layouts define persistent UI across route segments:

```typescript
// Root Layout (app/layout.tsx)
- Web3Provider (Wagmi, RainbowKit)
- ClientLayout (Navbar, Footer, AdminGuard)

// Admin Layout (app/admin/layout.tsx)
- AdminAuthGuard (signature-based auth)

// Sell Layout (app/sell/layout.tsx)
- FlowSidebar (listing flow navigation)
```

### 5. Page Patterns

#### Simple Page (Wrapper)

```typescript
// ✅ Good: Wrapper page for SEO/routing
export default function WalletPage() {
    return <WalletDashboard />;
}
```

#### Complex Page (Direct Implementation)

```typescript
// ✅ Good: Direct implementation for route-specific logic
export default function AdminPage() {
    const { data } = useAdminData();

    return (
        <div>
            {/* Complex UI */}
        </div>
    );
}
```

#### Client Component Page

```typescript
// ✅ Good: Use "use client" when needed
"use client";

export default function InteractivePage() {
  const [state, setState] = useState();
  // Client-side logic
}
```

## 📝 File Naming Conventions

### Route Files

- `page.tsx` - Route page component
- `layout.tsx` - Route layout component
- `loading.tsx` - Loading UI (not used yet)
- `error.tsx` - Error UI (not used yet)
- `not-found.tsx` - 404 UI (not used yet)

### API Routes

- `route.ts` - API route handler

### Components

- `ComponentName.tsx` - PascalCase for components
- `index.ts` - Barrel export

### Utilities

- `utilityName.ts` - camelCase for utilities
- `serviceName.ts` - camelCase for services

### Types

- `typeName.types.ts` - Type definitions
- `index.ts` - Type exports

### Documentation

- `README.md` - Feature documentation
- `ARCHITECTURE.md` - Architecture details

## 🎨 Component Organization

### Route-Local Components (`app/[route]/components/`)

**When to keep components route-local:**

1. Component only used in this route tree
2. Tightly coupled to route logic/context
3. Part of a feature module
4. Complex workflows specific to route

**Examples:**

```typescript
// ✅ Route-local (correct)
app/admin/components/ui/AdminModeIndicator.tsx  # Admin-specific
app/sell/components/forms/UnifiedListingForm.tsx # Sell flow specific
app/history-towers/components/HistoryJumperV2.tsx # Game specific
```

### Global Components (`src/components/`)

**When to move components to global:**

1. Used in 2+ routes
2. Pure presentational (no route-specific logic)
3. Domain components (cart, marketplace, wallet)
4. Base components (BaseCard, BaseModal)

**Examples:**

```typescript
// ✅ Global (correct)
src/components/cart/CartHeader.tsx          # Used across cart contexts
src/components/marketplace/CollectionsList.tsx # Domain component
src/components/wallet/WalletDashboard.tsx    # Reusable dashboard
```

## 🔐 Authentication & Authorization

### Admin Authentication

```typescript
// Session-based authentication with wallet signature
// Session stored in HTTP-only cookies (24h expiry)

// Protected admin routes use AdminAuthGuard
<AdminAuthGuard>
    {/* Admin content */}
</AdminAuthGuard>

// API routes use withAdmin middleware
export const POST = apiHandler(withAdmin(async (req) => {
    // Admin-only logic
}));
```

### User Authentication

```typescript
// Wallet connection via Wagmi + RainbowKit
// No session required for read operations
// Wallet connection required for write operations
```

## 🗄️ Data Fetching Patterns

### Server Components (Default)

```typescript
// ✅ Good: Fetch data in server components
export default async function Page() {
    const data = await fetchData();

    return <div>{data}</div>;
}
```

### Client Components

```typescript
// ✅ Good: Use hooks for client-side data
"use client";

export default function Page() {
    const { data, isLoading } = useData();

    if (isLoading) return <LoadingState />;
    return <div>{data}</div>;
}
```

### Hybrid Components

```typescript
// ✅ Good: Server-fetch initial data, client-hydrate
export default function Page({ initialData }: Props) {
    const { data } = useData(initialData);

    return <ClientComponent data={data} />;
}
```

## 🎯 Performance Optimization

### Dynamic Rendering

```typescript
// Force dynamic rendering (disable static generation)
export const dynamic = "force-dynamic";
```

### Route Caching

```typescript
// Revalidate data every X seconds
export const revalidate = 60; // 60 seconds
```

### Component Lazy Loading

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingState />}>
    <HeavyComponent />
</Suspense>
```

## 📊 Route Statistics

| Route              | Files | Components | Has Layout | Has README | Complexity |
| ------------------ | ----- | ---------- | ---------- | ---------- | ---------- |
| `/admin`           | 32    | 12         | ✅         | ❌         | High       |
| `/sell`            | 45    | 19         | ✅         | ✅         | Very High  |
| `/history-towers`  | 25    | 8          | ❌         | ✅         | High       |
| `/nft/[...]/[...]` | 28    | 17         | ❌         | ✅         | High       |
| `/marketplace`     | 1     | 0          | ❌         | ❌         | Low        |
| `/wallet`          | 1     | 0          | ❌         | ❌         | Low        |
| `/cart`            | 2     | 0          | ❌         | ❌         | Low        |
| `/api`             | 40    | N/A        | ❌         | ✅         | Medium     |

**Total:** 174 files across 8 main routes

## 🧹 Code Quality

### Cleanup Actions Taken

- ✅ Removed deprecated route: `api/nft/admin/insights/route-old.ts` (see git history)
- ✅ Organized admin components: UI, MultiSig, Forms, Sections
- ✅ Moved reusable components to global: cart/, marketplace/, wallet/
- ✅ Standardized API routes with apiHandler pattern

### Best Practices

- ✅ **Consistent naming:** PascalCase for components, camelCase for utilities
- ✅ **Barrel exports:** index.ts files for clean imports
- ✅ **Type safety:** Zod schemas for API validation
- ✅ **Error handling:** Standardized API responses
- ✅ **Documentation:** README files for complex features
- ✅ **Component colocation:** Route-specific components in route folders
- ✅ **Feature modules:** Complex routes organized as modules

## 📚 Related Documentation

### Component Documentation

- [src/components/README.md](../../components/README.md) - Global components
- [src/components/core/README.md](../../components/core/README.md) - Base components
- [src/components/nft/README.md](../../components/nft/README.md) - NFT components
- [src/components/admin/README.md](../../components/admin/README.md) - Admin components

### Feature Documentation

- [app/sell/README.md](./sell/README.md) - Sell flow documentation
- [app/sell/ARCHITECTURE.md](./sell/ARCHITECTURE.md) - Sell architecture
- [app/history-towers/README.md](./history-towers/README.md) - Game documentation
- [app/history-towers/ARCHITECTURE.md](./history-towers/ARCHITECTURE.md) - Game architecture
- [app/api/README.md](./api/README.md) - API documentation

### Architecture Documentation

- [docs/architecture/overview.md](../../docs/architecture/overview.md) - System architecture
- [docs/architecture/route-components-analysis.md](../../docs/architecture/route-components-analysis.md) - Component placement
- [docs/architecture/components-placement-decision.md](../../docs/architecture/components-placement-decision.md) - Decision framework

### Project Documentation

- [docs/README.md](../../docs/README.md) - Project documentation hub
- [docs/api/README.md](../../docs/api/README.md) - API documentation
- [docs/database/README.md](../../docs/database/README.md) - Database documentation

## 🔄 Next Steps

### Potential Improvements

1. **Loading/Error States:** Add loading.tsx and error.tsx for routes
2. **Not Found Pages:** Add not-found.tsx for 404 handling
3. **Admin READMEs:** Create README files for admin subdirectories
4. **Route Groups:** Consider route groups for better organization
5. **Parallel Routes:** Use parallel routes for complex layouts
6. **Intercepting Routes:** Implement modals with intercepting routes

### Maintenance

- Keep components colocated with their routes
- Archive deprecated files in `archive/` folders
- Update documentation when adding new routes
- Follow established patterns for consistency
- Use feature modules for complex functionality

---

**Last Updated:** January 2026  
**Next.js Version:** 15.5.9  
**App Router:** Enabled  
**TypeScript:** Strict Mode

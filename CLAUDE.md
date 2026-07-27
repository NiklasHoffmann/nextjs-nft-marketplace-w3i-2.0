# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                    # Next.js dev server (Turbopack)
npm run build                  # Production build
npm start                      # Start production server

# Quality gates (run all three before considering work done — CI runs the same)
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test:coverage          # Vitest with coverage

# Tests
npm test                       # Vitest watch mode
npm run test:run               # Vitest single run
npx vitest run path/to/file.test.ts        # Single test file
npx vitest run -t "test name"              # Single test by name
npm run test:e2e               # Playwright e2e (tests/e2e/*.spec.ts)
npm run test:e2e:headed        # Playwright with browser visible

# Background worker (separate process from the web server — see Runtime roles below)
npm run worker:start
npm run sync:marketplace        # One-off TheGraph → MongoDB sync
npm run env:check               # Validate required env vars are set
npm run env:check:prod          # Same, against production requirements
```

Node >= 20.19.0 is required (`engines` in package.json; `.nvmrc` pins the dev version).

## Architecture

### Runtime roles: web vs. worker

This app runs as two separate processes sharing one codebase, controlled by `APP_RUNTIME_ROLE` (`web` | `worker` | `all`):

- `instrumentation.ts` (Next.js server startup hook) calls `initializeBackgroundServices()` from `src/lib/init-services.ts` unless `APP_RUNTIME_ROLE=web`.
- The **worker** process runs the NFT sync service, MongoDB index setup, marketplace/image cache prewarming, and image enrichment — see `scripts/production/background-worker.ts` and `npm run worker:start`.
- The **web** process (`APP_RUNTIME_ROLE=web`) skips all of that and only serves requests.
- When developing locally with `npm run dev`, background services start in the same process (`role=all` by default).

Do not assume every server-side module runs in every request — code under `src/services/nft-sync/` and `src/lib/init-services.ts` is worker-lifecycle code, not per-request code.

### Data architecture: three MongoDB collections, one source of truth

- **`nft_metadata`** — central source of truth for all NFT data: metadata (name/image/description/attributes), contract info, full ownership history, admin insights (category/rarity/tags). This is what makes wallet loading instant (~50ms) instead of hitting Alchemy (~5000ms).
- **`marketplace_items`** — listing data only (price, seller, buyer, status, listing type). References `nft_metadata` via `nftAddress` + `tokenId` ($lookup), never duplicates metadata.
- **`nft_stats`** — user interactions (views, likes, ratings, watchlist), denormalized for fast reads.

Sync strategy (see `src/services/nft-sync/`, `docs/database/README.md`): TheGraph polling (30s) is the fallback path; a WebSocket event listener (`src/services/marketplace/event-listener.ts`) gives <1s updates when available. Alchemy is used in **discovery-only** mode (`withMetadata=false`) — metadata for new NFTs comes from the blockchain/IPFS directly, not Alchemy, to keep API costs down (~90% reduction vs. full Alchemy metadata calls).

When adding a feature that reads NFT data, prefer reading from `nft_metadata` (via `src/lib/db/nft-metadata.ts`) over calling Alchemy or the chain directly.

### API layer: `apiHandler` + middleware, always

Every route in `src/app/api/**/route.ts` is wrapped in `apiHandler()` (`src/lib/api/handler.ts`). It handles error formatting, request logging, rate limiting, and optional CORS. Don't hand-roll try/catch + `NextResponse.json` in a route — throw a typed error instead:

```typescript
import { apiHandler, BadRequestError } from '@/lib';

export const POST = apiHandler(async (req) => {
  await withAuth(req);           // or: { auth: true } / { admin: true } in apiHandler options
  if (!valid) throw new BadRequestError('Invalid input');
  return apiSuccess({ ... });
});
```

- `withAuth` / `withAdmin` (`src/lib/middleware/auth.ts`) inject `request.userAddress` / admin status from the session cookie.
- `withValidation` (`src/lib/middleware/validation.ts`) validates request bodies with Zod schemas.
- Rate limiting is automatic and scales by route type (`admin` routes get `STRICT`, authed routes `STANDARD`, public `LENIENT` — see `RATE_LIMIT_CONFIG` in `src/lib/middleware/rateLimit.ts`).
- Prefer importing from the barrel `@/lib` over deep paths like `@/lib/api/handler` (see `src/lib/README.md`).

Admin routes (`/admin/*`, `/api/admin/*`, `/api/nft/admin/*`) are additionally gated at the edge by `middleware.ts`, which verifies the `admin-session` JWT cookie (HMAC-SHA256) before the request even reaches the route handler. Admin auth itself is signature-based: wallet signs a server-issued challenge (no gas), verified with `viem.verifyMessage()`, session stored as an httpOnly cookie for 24h (`src/lib/auth/`).

### Context layer: one domain = Context + Cache + Service (+ Events)

State for each data domain lives under `src/contexts/<domain>/` following a consistent split (see `src/contexts/README.md`):

- `wallet-nfts/` — `WalletNFTsContext` (DB-first load, Alchemy fallback, background sync), `WalletNFTsCache`, `WalletNFTsService`, `WalletNFTsEnricher`.
- `marketplace-items/` — `MarketplaceItemsContext`/`MarketplaceCacheContext`, cache, service, events.
- `collections/`, `nft-stats/`, `marketplace-events/`, `notifications/` follow the same shape.
- `CurrencyContext.tsx` and `CartContext.tsx` are flat (no sub-split needed).

Cross-cutting cache invalidation goes through `src/services/validation/data-invalidation.ts` (`invalidateAfterListing`, `invalidateAfterPurchase`, `invalidateAllCachesForNFT`, etc.) and a `nft-stats-updated` / invalidation event system — mutating one collection's data without invalidating the related caches is a common source of stale-UI bugs here, so always route mutations through the existing invalidation helpers rather than updating context state directly.

### Service layer (`src/services/`)

Stateless, framework-agnostic business logic — never hold React state here, never call these directly from a component without going through a hook:

- `blockchain/` — contract reads/writes; `TransactionService` centralizes purchase/list/cancel/update flows with progress callbacks.
- `cache/smart-cache.ts` — LRU caches with per-data-type TTLs (contract properties 24h, ownership 5min, metadata 12h, approvals 2min).
- `marketplace/` — WebSocket event listener → MongoDB sync → invalidation bridge.
- `nft-sync/` — the background sync orchestrator described above.
- `multisig/` — Safe/Diamond-standard multisig transaction building for admin governance.

### Import conventions (enforced by ESLint, not just style)

- **No relative imports.** `eslint.config.mjs` has `no-restricted-imports` forbidding `../` patterns — always import via the `@/` path alias, even for sibling files.
- **Never import from `**/archive/**` or `*.deprecated*`** — these exist for reference only and are excluded from the build; importing them is an ESLint error.

### Deployment / process model

- `nixpacks.toml` / `Dockerfile` build for Railway-style deployment; `APP_RUNTIME_ROLE` differentiates the web dyno from the worker dyno at runtime (same image, different start command — `npm start` vs `npm run worker:start`).
- Sentry is wired in `instrumentation.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`.

## Where to look for more detail

`docs/` is organized by topic and generally up to date — check it before re-deriving architecture from scratch:
- `docs/architecture/overview.md` — contexts, caching, data flow, component patterns.
- `docs/api/routes.md`, `docs/api/authentication.md` — full API surface and auth flow.
- `docs/database/README.md` and `docs/database/schemas/` — collection schemas.
- `docs/development/setup.md` — environment setup.
- Several subfolders (`src/lib/`, `src/contexts/`, `src/services/`) have their own `README.md` with quick-reference usage examples for that layer.

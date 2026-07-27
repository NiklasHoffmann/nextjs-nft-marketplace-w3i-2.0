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

Three collections (`nft_metadata`, `marketplace_items`, `nft_stats`) — full field breakdown and sync strategy in `docs/database/README.md`.

When adding a feature that reads NFT data, prefer reading from `nft_metadata` (via `src/lib/db/nft-metadata.ts`) over calling Alchemy or the chain directly — that's what makes wallet loading instant (~50ms) instead of hitting Alchemy (~5000ms).

### API layer: `apiHandler` + middleware, always

Every route in `src/app/api/**/route.ts` is wrapped in `apiHandler()` (`src/lib/api/handler.ts`), which handles error formatting, logging, rate limiting, and CORS. Don't hand-roll try/catch + `NextResponse.json` in a route — throw a typed error instead. Quick-reference examples and the full middleware list (`withAuth`, `withAdmin`, `withValidation`, `rateLimit`) are in `src/lib/README.md`; rate-limit tiers are in `docs/api/routes.md`; the admin signature/session flow is in `docs/api/authentication.md`.

Admin routes (`/admin/*`, `/api/admin/*`, `/api/nft/admin/*`) are additionally gated at the edge by `middleware.ts`, which verifies the `admin-session` JWT cookie before the request even reaches the route handler.

### Context layer: one domain = Context + Cache + Service (+ Events)

State for each data domain lives under `src/contexts/<domain>/` following a consistent Context + Cache + Service split — domain list and usage examples in `src/contexts/README.md`.

Cross-cutting cache invalidation goes through `src/services/validation/data-invalidation.ts` (`invalidateAfterListing`, `invalidateAfterPurchase`, `invalidateAllCachesForNFT`, etc.) and a `nft-stats-updated` / invalidation event system — mutating one collection's data without invalidating the related caches is a common source of stale-UI bugs here, so always route mutations through the existing invalidation helpers rather than updating context state directly.

### Service layer (`src/services/`)

Stateless, framework-agnostic business logic — never hold React state here, never call these directly from a component without going through a hook. Directory breakdown (`blockchain/`, `cache/`, `marketplace/`, `nft-sync/`, `multisig/`) is in `src/services/README.md`.

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

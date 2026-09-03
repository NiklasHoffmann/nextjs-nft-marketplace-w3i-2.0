- [x] Projekt wurde mit Next.js 15, TypeScript, Tailwind CSS und ESLint erstellt.
- [x] README.md ist aktuell und beschreibt das Projekt.
- [x] Projekt kann kompiliert und gestartet werden.
- [x] Dokumentation ist vollständig und aufgeräumt.
- [x] NFT Sync Service funktioniert (61 items in MongoDB).
- [x] WalletNFTsContext integriert (auto-loading, enrichment, caching).
- [x] CollectionsContext integriert (MongoDB aggregation, insights enrichment).
- [x] **Hybrid NFT Fetching optimiert (production-ready)**.
- [x] **Alchemy API optimiert (rate-limit friendly, nur Discovery)**.
- [x] **Admin Authentication System (signaturbasiert mit Session-Management)**.
- [x] **API Infrastructure Complete** - apiHandler, middleware, type-safe errors.
- [x] **Component Refactoring Complete** - BaseCard, BaseModal, LoadingState, useForm.
- [x] **Hook Architecture Optimized** - All route-specific hooks moved to global @/hooks/.
- [x] **useNFTApproval global** - Comprehensive approval management in @/hooks/nfts.

## Status
✅ **Production Ready** - Real-time sync via polling (30s interval)
✅ **Architecture Complete** - Hybrid metadata system, modular components
✅ **Security Complete** - Signature-based auth with session cookies
✅ **API Standardized** - 42+ handlers using apiHandler pattern

### Active Systems
- **TheGraph → MongoDB sync**: 61 NFT listings, auto-start on server boot
- **WalletNFTsContext**: DB-first loading (~56ms p50, measured)
- **CollectionsContext**: MongoDB aggregation (~104ms p50, measured)
- **Hybrid API**: Alchemy discovery + Blockchain metadata (rate limit friendly)
- **Admin Auth**: Wallet signature verification + 24h sessions
- **API Infrastructure**: Standardized error handling, middleware, validation
- **Component Library**: BaseCard, BaseModal, LoadingState, FormField, TransactionService

### Architecture Highlights
- **nft_metadata collection**: Central source of truth for ALL NFT data
- **marketplace_items**: ONLY listing data (price, seller, status)
- **nft_stats**: User interactions (views, likes, ratings, watchlist)
- **Smart sync**: Discovery-only from Alchemy (`withMetadata=false`)
- **Instant loading**: ~56ms p50 from DB vs ~497ms cold Alchemy discovery (`npm run bench:api`)
- **Ownership tracking**: Full history with transfer detection

## Context Architecture
- **MarketplaceCacheContext**: Listed marketplace items (MongoDB marketplace_items)
- **WalletNFTsContext**: User-owned NFTs (DB-first: nft_metadata → Alchemy fallback)
  - **Optimization**: DB-first load, background sync, smart filtering
  - **Performance**: ~56ms p50 vs ~497ms cold discovery (measured 2026-09-03)
  - **Alchemy**: Only discovery (withMetadata=false) - 90% rate limit savings
- **CollectionsContext**: Collections aggregation (MongoDB marketplace_items + insights)
- **NFTContext**: Metadata/insights caching, performance monitoring (kept for compatibility)

## Collections Schema
- **nft_metadata**: Central source of truth (metadata, contract, insights, ownership history)
- **marketplace_items**: Only listing data (references nft_metadata via nftAddress+tokenId)
- **nft_stats**: User interactions (views, likes, ratings, watchlist)

## Performance Optimizations
- ✅ **Parallel Execution**: Blockchain + Alchemy discovery run simultaneously
- ✅ **Smart Filtering**: Only fetch metadata for unknown NFTs
- ✅ **Alchemy Discovery Only**: withMetadata=false (rate limit friendly)
- ✅ **Blockchain Metadata**: Contract + IPFS for all metadata (free, no rate limit)
- ✅ **Concurrent Contracts**: Process 3 contracts at once
- ✅ **Modular Code**: Separated concerns, easier testing/debugging
- ✅ **Enhanced Logging**: Per-step timing, unknown NFT tracking
- ✅ **IPFS Optimization**: Better timeout handling, content validation
- ✅ **Empty Result Cache**: Skip enrichment for wallets without NFTs

## Development Guide
- All API routes use `apiHandler` for consistent error handling
- Use `withAuth` middleware for user authentication
- Use `withAdmin` middleware for admin-only endpoints
- Use Zod schemas for request validation
- Components use BaseCard, BaseModal, LoadingState for consistency
- Forms use `useForm` hook for validation and state management
- Transactions use `TransactionService` for blockchain interactions

## Hook Architecture
- **Global hooks** (@/hooks/): Used across multiple routes or services
  - @/hooks/marketplace - Marketplace contract operations
  - @/hooks/nfts - NFT approval, insights, user actions
  - @/hooks/wallet - Wallet NFT management
  - @/hooks/multisig - MultiSig operations
- **Route-specific hooks** (app/[route]/hooks/): Only used within single route
- **Rule**: If a hook is used in 2+ places → move to global
- **Migration history**:
  - useMarketplaceContracts, useMarketplaceFees → @/hooks/marketplace
  - useNFTApproval → @/hooks/nfts
  - useUserNFTs, useCollectionWhitelist → Removed (redundant wrappers)

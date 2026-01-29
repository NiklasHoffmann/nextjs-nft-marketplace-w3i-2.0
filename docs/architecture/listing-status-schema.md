/**
 * NFT Listing Status Schema
 * 
 * Definiert die konsistente Verwendung von Status-Werten im gesamten System.
 * 
 * PROBLEM: Alte Code-Stellen verwendeten 'active' | 'sold' | 'cancelled' (lowercase)
 * LÖSUNG: TheGraph v2 liefert 'LISTED' | 'SOLD_OUT' | 'CANCELED' (uppercase)
 * 
 * @see src/types/marketplace/listing-v2.ts
 */

// ============================================================================
// STANDARD STATUS VALUES (from TheGraph v2)
// ============================================================================

export type ListingStatus = 
    | 'LISTED'           // Active listing (can be bought)
    | 'PARTIALLY_FILLED' // ERC1155: Some quantity sold, some remaining
    | 'SOLD_OUT'         // Fully sold
    | 'CANCELED'         // Canceled by seller
    | 'INVALIDATED';     // Invalid (ownership changed, etc.)

// ============================================================================
// USAGE GUIDELINES
// ============================================================================

/**
 * 1. MongoDB Storage
 * - Field: `status` (string)
 * - Values: 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED'
 * - Synced from TheGraph automatically
 * 
 * Example:
 * ```typescript
 * await db.collection('marketplace_items').updateOne(
 *   { listingId: '123' },
 *   { $set: { status: 'LISTED' } }
 * );
 * ```
 */

/**
 * 2. API Queries
 * - Filter active listings: `isListed: true` (recommended)
 * - OR filter by status: `status: 'LISTED'`
 * - Sold listings: `status: 'SOLD_OUT'`
 * - Canceled: `status: 'CANCELED'`
 * 
 * Example:
 * ```typescript
 * const activeListings = await db.collection('marketplace_items').find({
 *   isListed: true  // Preferred method
 * }).toArray();
 * 
 * // OR
 * 
 * const activeListings = await db.collection('marketplace_items').find({
 *   status: 'LISTED'
 * }).toArray();
 * ```
 */

/**
 * 3. Frontend Display
 * - Use `isListed` boolean for simple checks
 * - Use `status` enum for detailed state (PARTIALLY_FILLED, etc.)
 * - Display badges based on status
 * 
 * Example:
 * ```tsx
 * {nft.listing?.isListed && (
 *   <span className="badge">
 *     {nft.listing.status === 'LISTED' && '🟢 Active'}
 *     {nft.listing.status === 'PARTIALLY_FILLED' && '🟡 Partially Sold'}
 *     {nft.listing.status === 'SOLD_OUT' && '✅ Sold'}
 *     {nft.listing.status === 'CANCELED' && '❌ Canceled'}
 *   </span>
 * )}
 * ```
 */

/**
 * 4. Testing/Preview
 * - Use 'LISTED' for preview NFTs
 * - NOT 'active' (legacy, deprecated)
 * 
 * Example:
 * ```typescript
 * const previewNFT = {
 *   ...nft,
 *   listing: {
 *     status: 'LISTED',  // ✅ Correct
 *     isListed: true
 *   }
 * };
 * ```
 */

// ============================================================================
// MIGRATION FROM LEGACY STATUS VALUES
// ============================================================================

/**
 * Legacy mapping (deprecated, for reference only):
 * 
 * OLD (lowercase)  →  NEW (uppercase)
 * ─────────────────────────────────────
 * 'active'         →  'LISTED'
 * 'sold'           →  'SOLD_OUT'
 * 'cancelled'      →  'CANCELED'
 * 
 * ⚠️ DO NOT USE LEGACY VALUES IN NEW CODE!
 */

// ============================================================================
// RELATED FIELDS
// ============================================================================

/**
 * isListed (boolean)
 * - Computed field: true if status === 'LISTED' || status === 'PARTIALLY_FILLED'
 * - Used for simple active/inactive checks
 * - Indexed in MongoDB for performance
 * 
 * active (boolean) - DEPRECATED
 * - Legacy field, use `isListed` instead
 * - May be removed in future versions
 */

// ============================================================================
// FILES TO UPDATE WHEN CHANGING STATUS SCHEMA
// ============================================================================

/**
 * Core Type Definitions:
 * - src/types/marketplace/listing-v2.ts (ListingStatus type)
 * - src/config/subgraph/queries.ts (GraphQL schema)
 * 
 * Sync Services:
 * - src/services/nft-sync/graph-subscription.ts (status mapping)
 * - src/services/marketplace/event-mongodb-sync.ts (event handlers)
 * 
 * API Routes:
 * - src/app/api/marketplace/items/route.ts (query filters)
 * - src/app/api/collections/route.ts (aggregations)
 * 
 * Frontend Components:
 * - src/app/nft/[contractAddress]/[tokenId]/components/NFTPriceCard.tsx (status display)
 * - src/app/nft/[contractAddress]/[tokenId]/components/tabs/OverviewTab.tsx (status badges)
 * - src/app/sell/*/page.tsx (preview NFTs)
 */

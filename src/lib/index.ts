/**
 * CENTRAL LIB EXPORTS
 * 
 * Main entry point for all library utilities.
 * Import from @/lib for convenience.
 * 
 * Structure:
 * • api/ - API infrastructure (handlers, errors, responses)
 * • middleware/ - Auth, validation, rate limiting
 * • db/ - Database utilities (typed collections)
 * • blockchain/ - Direct blockchain interactions
 * • cache.ts - Cache management utilities
 * • utils.ts - General utilities (cn, etc.)
 * • mongodb.ts - MongoDB connection singleton
 * • globals.ts - Global polyfills and configurations
 */

// === API INFRASTRUCTURE ===
export * from './api';

// === MIDDLEWARE ===
// Re-export middleware without RATE_LIMIT_CONFIG to avoid conflict with api/
export {
    // Auth middleware
    withAuth,
    withAdmin,
    withOptionalAuth,
    isAdmin,
    getAuthenticatedAddress,
    // Validation middleware
    withValidation,
    withQueryValidation,
    getValidatedData,
    getValidatedQuery,
    ethereumAddressSchema,
    tokenIdSchema,
    nftIdentifierSchema,
    paginationSchema,
    // Rate limiting (without RATE_LIMIT_CONFIG - use from api/)
    rateLimit,
    isRateLimited,
    getRemainingRequests,
    resetRateLimit,
} from './middleware';

// === DATABASE UTILITIES ===
export * from './db';

// === BLOCKCHAIN UTILITIES ===
export * from './blockchain';

// === CACHE UTILITIES ===
export {
    // Stats cache
    getStatsCacheKey,
    getCachedStats,
    setCachedStats,
    invalidateStatsCache,
    // Interactions cache
    getInteractionsCacheKey,
    getCachedInteractions,
    setCachedInteractions,
    invalidateInteractionsCache,
    // General cache utilities
    invalidateAllCachesForNFT,
    getCacheStats,
    clearAllCaches,
} from './cache';

// === GENERAL UTILITIES ===
export { cn } from './utils';

// === MONGODB CONNECTION ===
export { default as clientPromise } from './mongodb';
export {
    connectToDatabase,
    getDatabase,
    getCollection,
    getEnrichedNFTsCollection,
    getCollectionStatsCollection,
} from './mongodb';

// Note: globals.ts is imported in app root layout - no exports needed
// Note: init-services.ts & dev-services-auto-start.ts are entry points - no exports

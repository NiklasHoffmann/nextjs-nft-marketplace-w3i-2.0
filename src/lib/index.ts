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
export * from './middleware';

// === DATABASE UTILITIES ===
export * from './db';

// === BLOCKCHAIN UTILITIES ===
export * from './blockchain';

// === CACHE UTILITIES ===
export {
    getStatsCacheKey,
    getCachedStats,
    setCachedStats,
    invalidateStatsCache,
    clearStatsCache,
    getCollectionsCacheKey,
    getCachedCollections,
    setCachedCollections,
    invalidateCollectionsCache,
    clearAllCaches,
} from './cache';

// === GENERAL UTILITIES ===
export { cn } from './utils';

// === MONGODB CONNECTION ===
export {
    clientPromise,
    getCollection,
    getDb,
    getEnrichedNFTsCollection,
    getMarketplaceItemsCollection,
    getNFTStatsCollection,
} from './mongodb';

// Note: globals.ts is imported in app root layout - no exports needed
// Note: init-services.ts & dev-services-auto-start.ts are entry points - no exports

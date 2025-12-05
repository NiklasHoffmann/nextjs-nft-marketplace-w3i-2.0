// Main exports
export { MarketplaceItemsProvider, useMarketplaceItems } from './MarketplaceItemsContext';

// Services
export { MarketplaceItemsService } from './MarketplaceItemsService';
export { MarketplaceItemsCache } from './MarketplaceItemsCache';
export type { CacheEntry } from './MarketplaceItemsService';
export type { MarketplaceItemsCacheEntry, MarketplaceItemsCacheState } from './MarketplaceItemsCache';

// Events
export { emitStatsUpdate, onStatsUpdate, emitCacheInvalidation, onCacheInvalidation } from './MarketplaceItemsEvents';
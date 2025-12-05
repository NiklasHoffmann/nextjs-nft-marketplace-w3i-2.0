/**
 * NFT & COLLECTION HOOKS
 * 
 * NFT-bezogene Funktionalitäten (NICHT Marketplace Contract):
 * • Admin: NFT Insights, Collection Insights (Admin Panel)
 * • UI: User Actions, Price Data, Filters
 * • Collections: Collection Aggregation & Display Utils
 */

// === ADMIN HOOKS ===
export {
    useNFTInsights as useNFTInsightsLegacy,
    useCollectionInsights,
    useAdminNFTInsights,
    useAdminCollectionInsights
} from './useNFTInsights';

// === UI & USER ACTION HOOKS ===
export { useNFTUserActions } from './useNFTUserActions';

// === UTILITY HOOKS ===
export { useNFTPriceData } from './useNFTPriceData';
export { useNFTFilters } from './useNFTFilters';

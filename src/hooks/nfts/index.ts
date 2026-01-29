/**
 * NFT & COLLECTION HOOKS
 * 
 * NFT-bezogene Funktionalitäten (NICHT Marketplace Contract):
 * • Admin: NFT Insights, Collection Insights (Admin Panel)
 * • UI: User Actions, Price Data, Filters
 * • Collections: Collection Aggregation & Display Utils
 * • Approval: NFT approval management for marketplace operations
 */

// === NFT APPROVAL ===
export { useNFTApproval } from './useNFTApproval';
export type { UseNFTApprovalParams, UseNFTApprovalReturn } from './useNFTApproval';

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

// === DEPRECATED NFT HOOKS EXPORT ===
// ⚠️ ALL EXPORTS FROM THIS FILE ARE DEPRECATED
// Use useNFTContext() directly instead: import { useNFTContext } from '@/contexts/NFTContext';

// === CORE MARKETPLACE HOOKS ===
// Only the essential hooks that are still needed
export {
    useActiveItems,
    useNFTInteractionPreload,
    useNFTPerformance
} from './01-core-nft-hooks';

// === DEPRECATED CONTEXT HOOKS ===
// ⚠️ Use useNFTContext() directly instead of these legacy exports
export {
    /** @deprecated Use useNFTContext() directly */
    useNFTData as useNFT, // Legacy compatibility
    /** @deprecated Use useNFTContext() directly */
    useNFTDetailData as useNFTInsights, // Legacy compatibility - insights are in detail data
    /** @deprecated Use useNFTContext() directly */
    useNFTDetailData as useNFTStats, // Legacy compatibility - stats are in detail data
    /** @deprecated Use useNFTContext() directly */
    useNFTCardData,
    /** @deprecated Use useNFTContext() directly */
    useNFTDetailData,
    /** @deprecated Use useNFTContext() directly */
    useNFTData
} from '@/contexts/NFTContext';

// === LEGACY COMPATIBILITY ===
// For components that expect useNFTList functionality, use Context preloader instead
export { useNFTPreloader as useNFTList } from '@/contexts/NFTContext';

// === ADMIN HOOKS (Admin-only functionality) ===
// These hooks are for admin panel and require elevated permissions
export {
    useNFTInsights as useNFTInsightsLegacy,
    useCollectionInsights,
    useAdminNFTInsights,
    useAdminCollectionInsights
} from './02-admin-useNFTInsights';

// === UI & USER ACTION HOOKS ===
// Specialized hooks for UI state and user interactions
export { useNFTUserActions } from './03-ui-useNFTUserActions';

// === UTILITY HOOKS ===
// Performance and utility hooks
export { useNFTPriceData } from './05-utils-useNFTPriceData';
export { useNFTPrefetch } from './06-utils-useNFTPrefetch';
export { useNFTFilters } from './08-utils-useNFTFilters';
export { useWalletNFTs } from './09-wallet-useWalletNFTs';
/**
 * NFT & COLLECTION HOOKS
 * 
 * NFT-bezogene Funktionalitäten (NICHT Marketplace Contract):
 * • Core: activeItems, modernNFT, NFTContext 
 * • Admin: NFT Insights, Collection Insights (Admin Panel)
 * • UI: User Actions, Price Data, Filters
 * • Wallet: WalletNFTs, Collection Display
 * • Collections: Collection Aggregation & Display Utils
 */

// === CORE NFT HOOKS ===
export {
    useActiveItems,
    useModernNFT,
    useModernNFTContext
} from './01-core-nft-hooks';

// === ADMIN HOOKS ===
export {
    useNFTInsights as useNFTInsightsLegacy,
    useCollectionInsights,
    useAdminNFTInsights,
    useAdminCollectionInsights
} from './02-admin-useNFTInsights';

// === UI & USER ACTION HOOKS ===
export { useNFTUserActions } from './03-ui-useNFTUserActions';

// === UTILITY HOOKS ===
export { useNFTPriceData } from './05-utils-useNFTPriceData';
export { useNFTFilters } from './08-utils-useNFTFilters';
export { useWalletNFTs } from './09-wallet-useWalletNFTs';

// === COLLECTION HOOKS ===
export * from './collections';
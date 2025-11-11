/**
 * NFT & COLLECTION HOOKS
 * 
 * NFT-bezogene FunktionalitÃ¤ten (NICHT Marketplace Contract):
 * â€¢ Core: activeItems, modernNFT, NFTContext 
 * â€¢ Admin: NFT Insights, Collection Insights (Admin Panel)
 * â€¢ UI: User Actions, Price Data, Filters
 * â€¢ Wallet: WalletNFTs, Collection Display
 * â€¢ Collections: Collection Aggregation & Display Utils
 */

// === CORE NFT HOOKS ===
export {
    useActiveItems,
    useModernNFT,
    useModernNFTContext
} from './nft-hooks';

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
export { useWalletNFTs } from './useWalletNFTs';

// === COLLECTION HOOKS ===
export * from './collections';

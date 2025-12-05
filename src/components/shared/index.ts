/**
 * SHARED COMPONENTS - Cross-Route Components
 * 
 * Shared components used across multiple routes (marketplace, wallet, collections).
 * Route-specific components have been moved to their respective route directories:
 * - ListedNFTsList, CollectionsList → app/marketplace/components/
 * - WalletNFTsList → app/wallet/components/
 * - InvalidListingWarning → app/nft/[nftAddress]/[tokenId]/components/
 */

// Shared Components (used across multiple routes)
export { default as NFTFilterBar } from './NFTFilterBar';
export { NFTFilterSidebar } from './NFTFilterSidebar';
export { NFTGallery } from './NFTGallery';

// Re-export Types from central location (eliminates duplication)
export type {
    NFTScrollItem,
    NFTFilters,
    NFTSortOptions,
    FilterableNFTItem,
    ActiveItemsListProps,
    WalletNFTsListProps,
    AVAILABLE_CATEGORIES,
    AVAILABLE_RARITIES
} from '@/types/marketplace';

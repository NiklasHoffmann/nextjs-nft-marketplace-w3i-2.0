/**
 * Type definitions for /sell route
 * 
 * Centralized type definitions to avoid duplication across components.
 * Import from here instead of defining inline.
 * 
 * @module sell/types
 */

import { AggregatedNFT } from '@/types/core/core-nft-modern';

// ==================== Flow Types ====================

/**
 * Type of listing flow
 * - single: List one NFT
 * - batch: List multiple NFTs at once
 */
export type ListingType = 'single' | 'batch';

/**
 * Listing mode
 * - sale: Direct sale for ETH/USDC
 * - trade: NFT-for-NFT trade
 * - hybrid: Both sale and trade
 */
export type ListingMode = 'sale' | 'trade' | 'hybrid';

/**
 * Current step in the listing flow
 */
export type ListingStep = 'select' | 'whitelist' | 'approval' | 'form' | 'preview' | 'listing' | 'success';

/**
 * Status of async checks (whitelist, approval)
 */
export type StepStatus = 'not-started' | 'checking' | 'done' | 'failed';

/**
 * Progress step during transaction
 */
export type ProgressStep = 'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error';

// ==================== Pricing Types ====================

/**
 * Pricing strategy for batch listings
 * - fixed: Same price for all NFTs
 * - variable: Different prices per NFT
 */
export type PricingType = 'fixed' | 'variable';

/**
 * Accepted currencies
 */
export type Currency = 'ETH' | 'USDC';

// ==================== Trade Types ====================

/**
 * Type of trade offer
 * - specific: Trade for a specific NFT
 * - collection: Trade for any NFT from a collection
 * - open: Accept any NFT offers
 */
export type TradeType = 'specific' | 'collection' | 'open';

// ==================== Filter & Sort Types ====================

/**
 * NFT sorting options
 */
export type SortOption = 'name' | 'price' | 'likes' | 'views' | 'rating' | 'watchlist' | 'recent';

/**
 * Sort direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * NFT filter configuration
 */
export interface NFTFilterOptions {
    searchTerm: string;
    showOnlyUnlisted: boolean;
    sortBy: SortOption;
    sortOrder: SortOrder;
}

// ==================== Transaction Data Types ====================

/**
 * Single NFT transaction data
 */
export interface TransactionData {
    mode: ListingMode;
    selectedNFT: AggregatedNFT | null;
    price?: string;
    currency?: Currency;
    description?: string;
    targetNFT?: AggregatedNFT | null;
    targetCollection?: string;
    tradeType?: TradeType;
    allowOffers?: boolean;
}

/**
 * Batch NFT transaction data
 */
export interface BatchTransactionData {
    selectedNFTs: AggregatedNFT[];
    pricingType: PricingType;
    fixedPrice?: string;
    startPrice?: string;
    endPrice?: string;
    currency: Currency;
    description: string;
}

// ==================== Component Props Types ====================

/**
 * Props for NFT selection components
 */
export interface NFTSelectionProps {
    nfts: AggregatedNFT[];
    selectedNFT: AggregatedNFT | null;
    onSelect: (nft: AggregatedNFT) => void;
}

/**
 * Props for batch NFT selection
 */
export interface BatchNFTSelectionProps {
    nfts: AggregatedNFT[];
    selectedNFTs: Set<string>;
    onToggle: (nftId: string) => void;
}

/**
 * Props for form components
 */
export interface ListingFormProps {
    nft: AggregatedNFT;
    onSubmit: (data: TransactionData) => void;
    onCancel?: () => void;
}

/**
 * Props for preview components
 */
export interface PreviewProps {
    data: TransactionData | BatchTransactionData;
    onConfirm: () => void;
    onBack: () => void;
}

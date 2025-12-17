/**
 * Type definitions for /sell route
 */

import { AggregatedNFT } from '@/types/core/core-nft-modern';

export type ListingType = 'single' | 'batch';

export type ListingMode = 'sale' | 'trade' | 'hybrid';

export type PricingType = 'fixed' | 'variable';

export type TradeType = 'specific' | 'collection' | 'open';

export type Currency = 'ETH' | 'USDC';

export type SortOption = 'name' | 'price' | 'likes' | 'views' | 'rating' | 'watchlist' | 'recent';

export type SortOrder = 'asc' | 'desc';

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

export interface BatchTransactionData {
    selectedNFTs: AggregatedNFT[];
    pricingType: PricingType;
    fixedPrice?: string;
    startPrice?: string;
    endPrice?: string;
    currency: Currency;
    description: string;
}

export interface NFTFilterOptions {
    searchTerm: string;
    showOnlyUnlisted: boolean;
    sortBy: SortOption;
    sortOrder: SortOrder;
}

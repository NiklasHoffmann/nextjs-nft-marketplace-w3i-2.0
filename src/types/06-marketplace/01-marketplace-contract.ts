/**
 * MARKETPLACE CONTRACT TYPES
 * 
 * Smart Contract-spezifische Type Definitionen:
 * • Listing: createListing, updateListing, cancelListing Parameters
 * • Purchase: purchaseListing Parameters & Responses
 * • Admin: Fee Management, Whitelisting, Admin Functions
 * • Events: Contract Event Types & Filters
 */

// === LISTING OPERATIONS ===
export interface CreateListingParams {
    tokenAddress: string;
    tokenId: string;
    price: string; // in ETH
    desiredTokenAddress?: string;
    desiredTokenId?: string;
    buyerWhitelistEnabled?: boolean;
    allowedBuyers?: string[];
}

export interface UpdateListingParams {
    listingId: string;
    newPrice?: string;
    newDesiredTokenAddress?: string;
    newDesiredTokenId?: string;
    newBuyerWhitelistEnabled?: boolean;
    newAllowedBuyers?: string[];
}

// === PURCHASE OPERATIONS ===
export interface PurchaseListingParams {
    listingId: string;
    expectedPrice: string; // in ETH
    expectedDesiredTokenAddress?: string;
    expectedDesiredTokenId?: string;
    desiredErc1155Holder?: string; // for swap transactions
}

// === ADMIN OPERATIONS ===
export interface MarketplaceAdminParams {
    newFeeInBasisPoints?: number;
    collectionsToAdd?: string[];
    collectionsToRemove?: string[];
    buyersToAdd?: string[];
    buyersToRemove?: string[];
}

// === MARKETPLACE CONFIGURATION ===
export const MARKETPLACE_CONFIG = {
    // Add your deployed marketplace address here
    ADDRESS: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',

    // Common constants
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as const,

    // Fee constants (if you want to define them)
    MAX_FEE_BASIS_POINTS: 1000, // 10%
    DEFAULT_FEE_BASIS_POINTS: 250, // 2.5%
} as const;

// === CONTRACT EVENT TYPES ===
export interface MarketplaceEventFilter {
    fromBlock?: number;
    toBlock?: number;
    listingId?: string;
    seller?: string;
    buyer?: string;
}
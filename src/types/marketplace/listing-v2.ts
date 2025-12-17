/**
 * Subgraph v2 Types (Ideation Market)
 * 
 * TypeScript interfaces for the new subgraph schema
 */

export type TokenStandard = 'ERC721' | 'ERC1155';
export type ListingType = 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP';
export type ListingStatus = 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED';

/**
 * Listing Entity from Subgraph v2
 */
export interface ListingV2 {
    id: string;                      // "11155111-<listingId>"
    chainId: number;                 // 11155111 (Sepolia)
    listingId: string;               // BigInt as string
    tokenAddress: string;            // Contract address (Bytes)
    tokenId: string;                 // BigInt as string
    tokenStandard: TokenStandard;    // ERC721 | ERC1155
    erc1155QuantityListed?: string;  // BigInt as string (1155 only)
    remainingQuantity?: string;      // BigInt as string (1155 only)
    priceTotal: string;              // BigInt as string (Wei)
    unitPrice?: string;              // BigInt as string (1155 partial buys)
    buyerWhitelistEnabled: boolean;
    partialBuyEnabled: boolean;
    listingType: ListingType;        // PURE_ETH | SWAP_AND_ETH | PURE_SWAP
    feeRate: string;                 // BigInt as string (denominator 100_000)
    desiredTokenAddress?: string;    // Bytes (swap target)
    desiredTokenId?: string;         // BigInt as string (swap target)
    desiredErc1155Quantity?: string; // BigInt as string (swap 1155)
    seller: string;                  // Address (Bytes)
    status: ListingStatus;           // LISTED | PARTIALLY_FILLED | SOLD_OUT | CANCELED | INVALIDATED
    active: boolean;                 // Convenience flag
    createdAt: string;               // BigInt as string (timestamp)
}

/**
 * WhitelistedBuyer Entity from Subgraph v2
 */
export interface WhitelistedBuyerV2 {
    id: string;          // "11155111-<listingId>-<buyerLowerHex>"
    chainId: number;     // 11155111
    listingId: string;   // BigInt as string
    buyer: string;       // Address (Bytes)
    createdAt: string;   // BigInt as string (timestamp)
}

/**
 * Helper to convert v2 Listing to old format (for backward compatibility)
 */
export interface ListingV2ToV1Adapter {
    listingId: string;
    nftAddress: string;      // tokenAddress
    tokenId: string;
    isListed: boolean;       // active
    price: string;           // priceTotal
    seller: string;
    buyer: string | null;    // null if active
    desiredNftAddress?: string;  // desiredTokenAddress
    desiredTokenId?: string;
}

/**
 * Convert v2 Listing to v1 format
 */
export function convertListingV2ToV1(listing: ListingV2): ListingV2ToV1Adapter {
    return {
        listingId: listing.listingId,
        nftAddress: listing.tokenAddress,
        tokenId: listing.tokenId,
        isListed: listing.active,
        price: listing.priceTotal,
        seller: listing.seller,
        buyer: listing.status === 'SOLD_OUT' ? '0x0000000000000000000000000000000000000000' : null,
        desiredNftAddress: listing.desiredTokenAddress,
        desiredTokenId: listing.desiredTokenId
    };
}

/**
 * Helper to format listing ID for v2 queries
 * Format: "11155111-<listingId>"
 */
export function formatListingIdV2(listingId: string | number, chainId: number = 11155111): string {
    return `${chainId}-${listingId}`;
}

/**
 * Parse listing ID from v2 format
 */
export function parseListingIdV2(id: string): { chainId: number; listingId: string } {
    const [chainId, listingId] = id.split('-');
    
    if (!chainId || !listingId) {
        throw new Error(`Invalid listing ID format: ${id}`);
    }
    
    return {
        chainId: parseInt(chainId),
        listingId
    };
}

/**
 * Check if listing is a trade/swap
 */
export function isSwapListing(listing: ListingV2): boolean {
    return listing.listingType === 'PURE_SWAP' || listing.listingType === 'SWAP_AND_ETH';
}

/**
 * Check if listing accepts ETH
 */
export function acceptsETH(listing: ListingV2): boolean {
    return listing.listingType === 'PURE_ETH' || listing.listingType === 'SWAP_AND_ETH';
}

/**
 * Calculate fee amount from listing
 */
export function calculateFee(priceTotal: string, feeRate: string): bigint {
    const price = BigInt(priceTotal);
    const rate = BigInt(feeRate);
    return (price * rate) / BigInt(100_000);
}

/**
 * Get human-readable listing status
 */
export function getListingStatusLabel(status: ListingStatus): string {
    const labels: Record<ListingStatus, string> = {
        LISTED: 'Active',
        PARTIALLY_FILLED: 'Partially Filled',
        SOLD_OUT: 'Sold Out',
        CANCELED: 'Canceled',
        INVALIDATED: 'Invalidated'
    };
    return labels[status] || status;
}

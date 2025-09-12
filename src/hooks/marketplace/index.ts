/**
 * Marketplace Hooks - Centralized Export
 * 
 * Usage Examples:
 * 
 * // For listing operations
 * const { createListing, updateListing, cancelListing } = useMarketplaceListing(MARKETPLACE_ADDRESS);
 * 
 * // For purchasing
 * const { purchaseListing } = useMarketplacePurchase(MARKETPLACE_ADDRESS);
 * 
 * // For reading data
 * const { useListingById, useListingsByNFT } = useMarketplaceData(MARKETPLACE_ADDRESS);
 * 
 * // For user functions (including proceeds)
 * const { withdrawProceeds, proceeds, proceedsWei } = useMarketplaceUser(MARKETPLACE_ADDRESS);
 * 
 * // For admin functions
 * const { setInnovationFee } = useMarketplaceAdmin(MARKETPLACE_ADDRESS);
 */

export { useMarketplaceListing } from './useMarketplaceListing';
export { useMarketplacePurchase } from './useMarketplacePurchase';
export { useMarketplaceData } from './useMarketplaceData';
export { useMarketplaceUser } from './useMarketplaceUser';
export { useMarketplaceAdmin } from './useMarketplaceAdmin';

// Re-export types for convenience
//export type { 
//  CreateListingParams,
//  UpdateListingParams 
//} from './useMarketplaceListing';
//
//export type {
//  PurchaseListingParams
//} from './useMarketplacePurchase';

// Marketplace configuration
export const MARKETPLACE_CONFIG = {
  // Add your deployed marketplace address here
  ADDRESS: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',

  // Common constants
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as const,

  // Fee constants (if you want to define them)
  MAX_FEE_BASIS_POINTS: 1000, // 10%
  DEFAULT_FEE_BASIS_POINTS: 250, // 2.5%
} as const;

// Helper to get marketplace address from environment
export const getMarketplaceAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
  if (!address) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_ADDRESS environment variable is not set');
  }
  return address;
};
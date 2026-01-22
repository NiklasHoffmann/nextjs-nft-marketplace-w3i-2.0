/**
 * MARKETPLACE CONTRACT HOOKS
 * 
 * Direkte Interaktion mit Marketplace Smart Contract Funktionen:
 * â€¢ Data: getListingById, getListingsByNFT, isBuyerWhitelisted
 * â€¢ Listing: createListing, updateListing, cancelListing  
 * â€¢ Purchase: purchaseListing (ETH & NFT swaps)
 * â€¢ Admin: setInnovationFee, whitelisting, cleanListing
 * â€¢ User: withdrawProceeds, getProceeds
 */

// === CORE MARKETPLACE CONTRACT FUNCTIONS ===
export { useMarketplaceAdmin } from './useMarketplaceAdmin';
export { useMarketplaceData } from './useMarketplaceData';
export { useMarketplaceListing } from './useMarketplaceListing';
export { useMarketplacePurchase } from './useMarketplacePurchase';
export { useMarketplaceUser } from './useMarketplaceUser';
export { useMarketplaceEvents } from './useMarketplaceEvents';

// === MARKETPLACE ITEMS HOOKS (MongoDB-backed) ===
export { useMarketplaceItems, useMarketplaceCollections } from './useMarketplaceItems';
export { useMarketplaceItemDetail } from './useMarketplaceItemDetail';

// Helper to get marketplace address from environment
export const getMarketplaceAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
  if (!address) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_ADDRESS environment variable is not set');
  }
  return address;
};

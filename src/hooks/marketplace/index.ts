/**
 * MARKETPLACE CONTRACT HOOKS
 * 
 * Direkte Interaktion mit Marketplace Smart Contract Funktionen:
 * • Data: getListingById, getListingsByNFT, isBuyerWhitelisted
 * • Listing: createListing, updateListing, cancelListing  
 * • Purchase: purchaseListing (ETH & NFT swaps)
 * • Admin: setInnovationFee, whitelisting, cleanListing
 * • User: withdrawProceeds, getProceeds
 */

// === CORE MARKETPLACE CONTRACT FUNCTIONS ===
export { useMarketplaceAdmin } from './04-admin-useMarketplaceAdmin';
export { useMarketplaceData } from './01-core-useMarketplaceData';
export { useMarketplaceListing } from './02-core-useMarketplaceListing';
export { useMarketplacePurchase } from './03-core-useMarketplacePurchase';
export { useMarketplaceUser } from './05-user-useMarketplaceUser';

// Helper to get marketplace address from environment
export const getMarketplaceAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
  if (!address) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_ADDRESS environment variable is not set');
  }
  return address;
};
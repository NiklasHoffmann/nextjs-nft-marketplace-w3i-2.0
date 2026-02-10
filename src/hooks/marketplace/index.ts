/**
 * MARKETPLACE CONTRACT HOOKS
 * 
 * Direkte Interaktion mit Marketplace Smart Contract Funktionen:
 * â€¢ Data: getListingById, isBuyerWhitelisted
 * â€¢ Listing: createListing, updateListing, cancelListing  
 * â€¢ Purchase: purchaseListing (ETH & NFT swaps)
 * â€¢ Admin: setInnovationFee, whitelisting, cleanListing
 * â€¢ User: (removed; proceeds are forwarded directly)
 */

// === CORE MARKETPLACE CONTRACT FUNCTIONS ===
export { useMarketplaceAdmin } from './useMarketplaceAdmin';
export { useBuyerWhitelist } from './useBuyerWhitelist';
export { useMarketplaceData } from './useMarketplaceData';
export { useMarketplaceListing } from './useMarketplaceListing';
export { useMarketplacePurchase } from './useMarketplacePurchase';
export { useMarketplaceEvents } from './useMarketplaceEvents';
export { useMarketplaceContracts } from './useMarketplaceContracts';
export { useMarketplaceFees } from './useMarketplaceFees';

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

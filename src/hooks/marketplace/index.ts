export { useMarketplaceAdmin } from './04-admin-useMarketplaceAdmin';
export { useMarketplaceData } from './01-core-useMarketplaceData';
export { useMarketplaceListing } from './02-core-useMarketplaceListing';
export { useMarketplacePurchase } from './03-core-useMarketplacePurchase';
export { useMarketplaceUser } from './05-user-useMarketplaceUser';

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
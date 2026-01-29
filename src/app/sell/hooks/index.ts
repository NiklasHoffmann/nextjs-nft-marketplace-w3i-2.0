/**
 * Hook exports for /sell route
 * 
 * All hooks have been moved to global @/hooks/
 * This file is kept for backwards compatibility.
 */

// Re-export global hooks
export { useMarketplaceFees, useMarketplaceContracts } from '@/hooks/marketplace';
export { useNFTApproval } from '@/hooks/nfts';

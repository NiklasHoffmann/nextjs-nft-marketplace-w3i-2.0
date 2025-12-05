/**
 * CENTRAL HOOKS EXPORT
 * 
 * Alle Hooks importieren von hier: import { ... } from '@/hooks'
 * 
 * Organisation:
 * • marketplace/ - Marketplace Smart Contract Funktionen
 * • nfts/ - NFT Display, Admin, Utilities, Collections  
 * • interactions/ - User Action Tracking
 */

// Re-export all NFT hooks
export * from './nfts';

// Re-export all Marketplace hooks  
export * from './marketplace';

// Re-export all Interaction hooks
export * from './interactions';

// Performance hooks deprecated - folder kept for future real implementation

// Re-export context hooks
export { useNFTStats, useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';

// Utility hooks
export { useAdminStatus } from './useAdminStatus';
export { useHorizontalScroll } from './useHorizontalScroll';

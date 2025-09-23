/**
 * CENTRAL HOOKS EXPORT
 * 
 * Alle Hooks importieren von hier: import { ... } from '@/hooks'
 * 
 * Organisation:
 * • marketplace/ - Marketplace Smart Contract Funktionen
 * • nfts/ - NFT Display, Admin, Utilities, Collections  
 * • interactions/ - User Action Tracking
 * • performance/ - Performance Monitoring (deprecated)
 */

// Re-export all NFT hooks
export * from './nfts';

// Re-export all Marketplace hooks  
export * from './marketplace';

// Re-export all Interaction hooks
export * from './interactions';

// Re-export all Performance hooks
export * from './performance';

// Re-export context hooks
export { useNFTStats, useNFTUserStats } from '@/contexts/NFTStatsContext';
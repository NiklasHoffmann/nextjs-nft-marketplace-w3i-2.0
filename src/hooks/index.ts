/**
 * CENTRAL HOOKS EXPORT
 * 
 * All hooks can be imported from: import { ... } from '@/hooks'
 * 
 * Structure:
 * • marketplace/ - Marketplace smart contract operations
 * • multisig/ - MultiSig wallet & governance
 * • nfts/ - NFT data, insights, filters
 * • wallet/ - User wallet NFTs
 * • user/ - User interactions (likes, watchlist, ratings)
 * • ui/ - Reusable UI patterns (modal, form, tilt, scroll)
 * • admin/ - Admin-only functionality
 */

// === MARKETPLACE CONTRACT HOOKS ===
export * from './marketplace';

// === MULTISIG WALLET HOOKS ===
export * from './multisig';

// === NFT HOOKS ===
export * from './nfts';

// === WALLET HOOKS ===
export * from './wallet';

// === USER HOOKS ===
export * from './user';

// === UI UTILITY HOOKS ===
export * from './ui';

// === ADMIN HOOKS ===
export * from './admin';

// === CONTEXT RE-EXPORTS ===
export { useNFTStats, useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';

// === UTILITY HOOKS ===
export { useDebouncedAsync } from './useDebouncedAsync';
export { useContextDevtools } from './useContextDevtools';
export { useScrollPosition } from './useScrollPosition';

/**
 * CORE TYPES - Fundamental Data Structures
 * 
 * Grundlegende Datenstrukturen für NFT Marketplace:
 * • Modern: AggregatedNFT, NftCore, ActiveItem (aktuell verwendet)
 * • Legacy: Deprecated types (verfügbar aber nicht re-exportiert)
 * • Currency: ETH/USD Conversion, Price Formatting
 */

// === MODERN NFT TYPES (ACTIVE) ===
export * from './01-core-nft-modern';

// === CURRENCY & PRICE TYPES ===
export * from './02-core-currency';

// Note: Legacy types in 01-core-nft.ts and 01-core-nft-legacy.ts are deprecated
// Import directly if needed for migration: import { ... } from '@/types/01-core/01-core-nft'
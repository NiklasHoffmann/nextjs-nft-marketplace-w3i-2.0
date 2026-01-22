/**
 * DATABASE UTILITIES EXPORTS
 * 
 * Typed database access utilities and helper functions.
 * 
 * Usage:
 * import { getNFTMetadataCollection, upsertNFTMetadata } from '@/lib/db';
 */

// NFT Metadata Collection Utilities
export {
    getNFTMetadataCollection,
    upsertNFTMetadata,
    getNFTMetadata,
    getNFTsByOwner,
    updateNFTOwnership,
    getEnrichedNFTMetadata,
    createNFTMetadataIndexes,
} from './nft-metadata';

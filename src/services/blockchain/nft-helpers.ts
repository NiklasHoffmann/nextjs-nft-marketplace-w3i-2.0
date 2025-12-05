/**
 * NFT Blockchain Helpers
 * 
 * Re-exports formatting utilities from utils/formatters/nft
 * and validation utilities from utils/validation for backwards compatibility.
 * 
 * NOTE: Prefer importing directly from @/utils for new code.
 */

// Re-export NFT formatting utilities
export {
    truncateAddress,
    formatNFTDisplayName,
    formatCollectionDisplayName,
    getMediaType,
    formatRarityInfo,
    formatRoyaltyInfo,
    groupAttributesByType,
    getCollectionSizeCategory,
    createShareableNFTUrl
} from '@/utils/formatters/nft';

// Re-export validation utilities
export {
    isValidContractAddress,
    isValidNFTTokenId
} from '@/utils/validation';

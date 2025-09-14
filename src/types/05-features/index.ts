/**
 * Feature Types - Specific application features
 */

// NFT detail page related types
export * from './01-nft-detail';

// User interactions and personal data (excluding NFTIdentifier to avoid conflicts)
export type {
    UserNFTInteractions,
    CombinedUserInteractionData,
    UserNFTInteractionsResponse,
    CreateUserNFTInteractionRequest,
    UpdateUserNFTInteractionRequest,
    CombinedUserInteractionsResponse,
    NFTDetailData
} from './02-user-interactions';

// NFT Insights - Enhanced descriptions and metadata
export type {
    NFTProjectDescriptions,
    NFTFunctionalitiesDescriptions,
    TitleDescriptionPair,
    createEmptyNFTProjectDescriptions,
    createEmptyNFTFunctionalitiesDescriptions
} from './03-nft-insights';
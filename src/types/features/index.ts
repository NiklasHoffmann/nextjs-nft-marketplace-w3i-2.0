/**
 * FEATURE TYPES - Specific Application Features
 * 
 * Feature-spezifische Type Definitionen:
 * • NFT Detail: Detail Page, Enhanced Metadata, User Data
 * • User Interactions: Like, Watchlist, View History
 * • Insights: Enhanced Descriptions, Project Info, Partnerships
 * • Personalization: User Preferences, Customizations
 */

// === NFT DETAIL PAGE ===
export * from './nft-detail';

// === USER INTERACTIONS & PERSONALIZATION ===
export type {
    UserNFTInteractions,
    CombinedUserInteractionData,
    UserNFTInteractionsResponse,
    CreateUserNFTInteractionRequest,
    UpdateUserNFTInteractionRequest,
    CombinedUserInteractionsResponse,
    NFTDetailWithUserData
} from './user-interactions';

// === ENHANCED NFT INSIGHTS ===
export type {
    NFTProjectDescriptions,
    NFTFunctionalitiesDescriptions,
    TitleDescriptionPair,
    createEmptyNFTProjectDescriptions,
    createEmptyNFTFunctionalitiesDescriptions
} from './nft-insights';
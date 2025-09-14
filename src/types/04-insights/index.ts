/**
 * Insights Types - NFT metadata and analysis
 */

// Main insights interfaces (excluding NFTIdentifier to avoid conflicts)
export type {
    NFTInsights,
    CollectionInsights,
    UserInsightsPreferences,
    NFTInsightsFilter,
    NFTInsightsSort,
    NFTInsightsResponse,
    CollectionInsightsResponse,
    CreateNFTInsightsRequest,
    UpdateNFTInsightsRequest,
    CreateCollectionInsightsRequest,
    UpdateCollectionInsightsRequest
} from './01-insights-main';

// Public insights for frontend consumption (using common NFTIdentifier from main)
export type { PublicNFTInsights, PublicNFTInsightsResponse, CreatePublicNFTInsightsRequest, UpdatePublicNFTInsightsRequest } from './02-insights-public';

// Export common NFTIdentifier from main insights to avoid duplicates
export type { NFTIdentifier } from './01-insights-main';
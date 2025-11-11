/**
 * INSIGHTS TYPES - NFT Metadata & Analysis
 * 
 * NFT Insights & Analytics Type Definitionen:
 * • Admin Insights: Vollständige NFT/Collection Metadata (Admin Panel)
 * • Public Insights: Gefilterte Insights für Frontend
 * • Analytics: Statistiken, Trends, Performance Metriken
 * • CRUD: Create, Read, Update, Delete Request/Response Types
 */

// === ADMIN INSIGHTS (FULL DATA) ===
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
} from './insights-main';

// === PUBLIC INSIGHTS (FILTERED FOR FRONTEND) ===
export type {
    PublicNFTInsights,
    PublicNFTInsightsResponse,
    CreatePublicNFTInsightsRequest,
    UpdatePublicNFTInsightsRequest
} from './insights-public';
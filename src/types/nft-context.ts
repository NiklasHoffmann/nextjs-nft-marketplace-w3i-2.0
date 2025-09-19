/**
 * NFT Context Type Definitions
 * 
 * This file contains all type definitions used by the NFT Context system.
 * It provides a clean separation of concerns and improves maintainability.
 */

// Import existing core types to use internally
import type {
    NFTMetadata,
    NFTAttribute,
    NFTDetails,
    ActiveItem,
    NFTContractInfo,
    NFTAddress,
    TokenId,
    WalletAddress
} from '@/types/01-core/01-core-nft';

import type { AdminNFTInsight, NFTStats } from '@/types';

// Re-export for external use
export type {
    NFTMetadata,
    NFTAttribute,
    NFTDetails,
    ActiveItem,
    NFTContractInfo,
    NFTAddress,
    TokenId,
    WalletAddress
} from '@/types/01-core/01-core-nft';

export type { AdminNFTInsight, NFTStats } from '@/types';

// ===== STATE MANAGEMENT TYPES =====

export interface NFTLoadingState {
    metadata: boolean;
    insights: boolean;
    stats: boolean;
    contractInfo: boolean;
}

export interface NFTErrorState {
    metadata: string | null;
    insights: string | null;
    stats: string | null;
    contractInfo: string | null;
}

// ===== UNIFIED DATA STRUCTURE =====

/**
 * Comprehensive NFT data structure that combines all related information
 */
export interface NFTData {
    // Core identification
    nftAddress: string;
    tokenId: string;

    // Metadata and display information
    metadata: NFTMetadata | null | undefined;
    imageUrl: string | null;
    animationUrl: string | null;

    // Marketplace and ownership data
    isListed: boolean;
    price: string | null;
    seller: string | null;
    owner: string | null;
    listingId: string | null;

    // Analytics and insights
    insights: AdminNFTInsight | null;
    stats: NFTStats | null;
    contractInfo: NFTContractInfo | null;

    // State management
    loadingState: NFTLoadingState;
    errorState: NFTErrorState;

    // Metadata
    lastUpdated: number;
    cacheKey: string;
}

// ===== GRANULAR DATA ACCESS TYPES =====

/**
 * Optimized data structure for NFT card display
 * Contains only the essential data needed for card rendering
 */
export interface NFTCardData {
    nftAddress: string;
    tokenId: string;
    // Metadata (minimal)
    imageUrl: string | null;
    name: string | null;
    // Contract info
    contractInfo: NFTContractInfo | null;
    // Marketplace data
    price: string | null;
    listingId: string | null;
    isListed: boolean;
    // Card-specific insights
    customTitle: string | null;
    category: string | null;
    cardDescriptions: string[] | null;
    rarity: string | null;
    // Stats (card-relevant)
    averageRating: number | null;
    ratingCount: number | null;
    likeCount: number | null;
    watchlistCount: number | null;
    // Meta
    lastUpdated: number;
}

/**
 * Comprehensive data structure for NFT detail pages
 */
export interface NFTDetailData {
    nftAddress: string;
    tokenId: string;
    metadata: NFTMetadata | null | undefined;
    imageUrl: string | null;
    animationUrl: string | null;
    isListed: boolean;
    price: string | null;
    seller: string | null;
    owner: string | null;
    listingId: string | null;
    insights: AdminNFTInsight | null;
    stats: NFTStats | null;
    contractInfo: NFTContractInfo | null;
    lastUpdated: number;
}

// ===== CONTEXT TYPES =====

/**
 * NFT identifier used for cache keys and data access
 */
export interface NFTIdentifier {
    nftAddress: string;
    tokenId: string;
}

/**
 * NFT cache structure for performance optimization
 */
export interface NFTCache {
    [key: string]: NFTData;
}

/**
 * Preloader hook set for managing loading states
 */
export interface PreloaderHooks {
    preloadNFTData: (nftAddress: string, tokenId: string) => Promise<void>;
    preloadMultipleNFTs: (identifiers: NFTIdentifier[]) => Promise<void>;
    isDataPreloaded: (nftAddress: string, tokenId: string) => boolean;
    getPreloadProgress: () => { loaded: number; total: number };
}

/**
 * Admin-specific hooks for insights and analytics
 */
export interface AdminHooks {
    refreshInsights: (nftAddress: string, tokenId: string) => Promise<void>;
    refreshAllInsights: () => Promise<void>;
    getInsightsSummary: () => {
        totalNFTs: number;
        totalViews: number;
        averagePrice: number
    };
    exportInsightsData: () => Promise<string>;
}

/**
 * Main NFT Context interface
 */
export interface NFTContextType {
    // ===== DATA ACCESS =====

    // Unified data access
    getNFTData: (nftAddress: string, tokenId: string) => NFTData | null;

    // Granular data access
    getNFTCardData: (nftAddress: string, tokenId: string) => NFTCardData | null;
    getNFTDetailData: (nftAddress: string, tokenId: string) => NFTDetailData | null;

    // Wallet-based filtering
    getNFTsByWallet: (walletAddress: string) => NFTCardData[];
    getNFTsBySeller: (sellerAddress: string) => NFTCardData[];

    // ===== DATA OPERATIONS =====

    // Single NFT operations
    loadNFTData: (nftAddress: string, tokenId: string) => Promise<NFTData>;
    refreshNFTData: (nftAddress: string, tokenId: string) => Promise<void>;
    updateNFTData: (nftAddress: string, tokenId: string, updates: Partial<NFTData>) => void;
    updateNFTStats: (nftAddress: string, tokenId: string, statsUpdates: Partial<NFTStats>) => void;

    // Batch operations
    loadMultipleNFTs: (identifiers: NFTIdentifier[]) => Promise<NFTData[]>;
    refreshMultipleNFTs: (identifiers: NFTIdentifier[]) => Promise<void>;

    // ===== CACHE MANAGEMENT =====

    // Cache operations
    clearCache: () => void;
    clearExpiredCache: () => void;
    getCacheStats: () => { size: number; memoryUsage: string; hitRate: number };

    // Data validation
    isDataFresh: (nftAddress: string, tokenId: string, maxAge?: number) => boolean;

    // ===== SPECIALIZED HOOKS =====

    // Preloader functionality
    preloader: PreloaderHooks;

    // Admin functionality
    admin: AdminHooks;
}
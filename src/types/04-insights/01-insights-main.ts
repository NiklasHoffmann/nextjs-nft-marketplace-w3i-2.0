import { ObjectId } from 'mongodb';

// Base interface for NFT identification
export interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
    chainId?: number;
}

// NFT Insights main interface
export interface NFTInsights extends NFTIdentifier {
    _id?: ObjectId | string; // Allow both ObjectId and string for optimistic updates

    // Basic Information
    title?: string;
    description?: string;
    customName?: string;

    // Classification and Tags
    category?: string;
    tags: string[];

    // Ratings and Assessments
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    quality?: number; // 1-10 rating
    personalRating?: number; // 1-5 stars

    // Investment and Market Data
    purchasePrice?: number; // in ETH
    purchaseDate?: Date;
    targetSellPrice?: number; // in ETH
    marketAnalysis?: string;

    // Collection-level insights
    collectionInsights?: {
        floorPrice?: number;
        totalVolume?: number;
        holderCount?: number;
        marketCap?: number;
        socialSentiment?: 'bullish' | 'bearish' | 'neutral';
        lastUpdated?: Date;
    };

    // Technical Analysis
    technicalMetrics?: {
        rsi?: number;
        movingAverage?: number;
        volatility?: number;
        liquidityScore?: number;
    };

    // User Preferences and Flags
    isWatchlisted: boolean;
    isFavorite: boolean;
    isForSale: boolean;
    isPrivate: boolean;

    // Investment Strategy
    strategy?: 'hold' | 'flip' | 'trade' | 'collect';
    investmentGoal?: string;
    riskLevel?: 'low' | 'medium' | 'high';

    // Social and Community Data
    socialMetrics?: {
        twitterMentions?: number;
        discordActivity?: number;
        redditScore?: number;
        influencerScore?: number;
    };

    // Custom Fields
    customFields?: {
        [key: string]: string | number | boolean | Date;
    };

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string; // wallet address
    updatedBy?: string; // wallet address

    // Analytics Tracking
    viewCount?: number;
    shareCount?: number;
    lastViewedAt?: Date;
}

// Interface for Collection-level insights
export interface CollectionInsights {
    _id?: ObjectId;
    contractAddress: string;
    chainId?: number;

    // Basic Collection Info
    name?: string;
    symbol?: string;
    description?: string;
    website?: string;
    discord?: string;
    twitter?: string;

    // Market Data
    floorPrice?: number;
    totalVolume?: number;
    totalSales?: number;
    holderCount?: number;
    marketCap?: number;

    // Performance Metrics
    priceChange24h?: number;
    priceChange7d?: number;
    priceChange30d?: number;
    volumeChange24h?: number;

    // Rarity and Distribution
    rarityDistribution?: {
        common: number;
        uncommon: number;
        rare: number;
        epic: number;
        legendary: number;
    };

    // Community Metrics
    socialMetrics?: {
        twitterFollowers?: number;
        discordMembers?: number;
        telegramMembers?: number;
        redditMembers?: number;
    };

    // Analysis
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    investmentRating?: number; // 1-10
    riskAssessment?: 'low' | 'medium' | 'high';
    marketPosition?: 'emerging' | 'established' | 'declining';

    // Technical Data
    totalSupply?: number;
    mintDate?: Date;
    royalties?: number;

    // User Data
    isWatched: boolean;
    personalNotes?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    dataLastUpdated?: Date;
}

// User Preferences for the insights system
export interface UserInsightsPreferences {
    _id?: ObjectId;
    walletAddress: string;

    // Display Preferences
    defaultView?: 'grid' | 'list' | 'detailed';
    sortPreference?: 'date' | 'price' | 'rating' | 'alphabetical';
    hiddenCategories?: string[];

    // Notification Preferences
    priceAlerts: boolean;
    rarityAlerts: boolean;
    marketUpdateAlerts: boolean;
    socialMentionAlerts: boolean;

    // Privacy Settings
    profilePublic: boolean;
    showInvestmentData: boolean;
    allowDataSharing: boolean;

    // Custom Settings
    customCategories?: string[];
    customTags?: string[];

    createdAt: Date;
    updatedAt: Date;
}

// Search and Filter interfaces
export interface NFTInsightsFilter {
    contractAddress?: string;
    tokenId?: string;
    category?: string;
    tags?: string[];
    rarity?: string[];
    quality?: { min?: number; max?: number };
    personalRating?: { min?: number; max?: number };
    purchasePrice?: { min?: number; max?: number };
    isWatchlisted?: boolean;
    isFavorite?: boolean;
    isForSale?: boolean;
    strategy?: string[];
    riskLevel?: string[];
    createdBy?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface NFTInsightsSort {
    field: keyof NFTInsights;
    direction: 'asc' | 'desc';
}

// Response interfaces for API
export interface NFTInsightsResponse {
    success: boolean;
    data?: NFTInsights | NFTInsights[];
    error?: string;
    count?: number;
    page?: number;
    totalPages?: number;
    hasMore?: boolean;
}

export interface CollectionInsightsResponse {
    success: boolean;
    data?: CollectionInsights | CollectionInsights[];
    error?: string;
}

// Create/Update request interfaces
export interface CreateNFTInsightsRequest extends Partial<Omit<NFTInsights, '_id' | 'createdAt' | 'updatedAt'>> {
    contractAddress: string;
    tokenId: string;
}

export interface UpdateNFTInsightsRequest extends Partial<Omit<NFTInsights, '_id' | 'createdAt' | 'updatedAt'>> {
    _id?: ObjectId | string;
}

export interface CreateCollectionInsightsRequest extends Partial<Omit<CollectionInsights, '_id' | 'createdAt' | 'updatedAt'>> {
    contractAddress: string;
}

export interface UpdateCollectionInsightsRequest extends Partial<Omit<CollectionInsights, '_id' | 'createdAt' | 'updatedAt'>> {
    _id?: ObjectId | string;
}
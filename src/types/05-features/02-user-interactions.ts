import { ObjectId } from 'mongodb';

// Base interface for NFT identification
export interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
    chainId?: number;
}

// User-specific NFT interactions and personal data
export interface UserNFTInteractions extends NFTIdentifier {
    _id?: ObjectId | string;
    userId: string; // Wallet address or user ID

    // Personal Tracking
    isWatchlisted?: boolean;
    isFavorite?: boolean;
    personalRating?: number; // 1-5 stars
    personalNotes?: string;
    customTags?: string[]; // User's personal tags

    // Investment/Trading Data
    purchasePrice?: number;
    purchaseDate?: string;
    purchaseCurrency?: string; // ETH, USDC, etc.
    targetSellPrice?: number;
    targetSellDate?: string;
    actualSellPrice?: number;
    actualSellDate?: string;

    // Strategy and Goals
    strategy?: 'hold' | 'flip' | 'stake' | 'collect' | 'utility';
    investmentGoal?: string; // "Hold for 2 years", "Sell at 2x", etc.
    riskLevel?: 'low' | 'medium' | 'high';
    timeHorizon?: 'short' | 'medium' | 'long'; // < 6 months, 6-24 months, > 24 months

    // Trading History
    transactions?: Array<{
        type: 'buy' | 'sell' | 'transfer';
        price?: number;
        currency?: string;
        date: string;
        txHash?: string;
        marketplace?: string;
        notes?: string;
    }>;

    // Performance Tracking
    currentValue?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    holdingPeriod?: number; // days

    // User Behavior
    viewCount?: number; // How often user viewed this NFT
    lastViewed?: string;
    shareCount?: number; // How often user shared this NFT

    // Alerts and Notifications
    priceAlerts?: Array<{
        type: 'above' | 'below';
        price: number;
        currency: string;
        isActive: boolean;
        createdAt: string;
    }>;

    // Privacy Settings
    isPrivate?: boolean; // If true, don't show any data to other users
    shareableFields?: string[]; // Which fields can be public (for leaderboards, etc.)

    // Metadata
    createdAt?: string;
    updatedAt?: string;
    syncedAt?: string; // Last time data was synced with blockchain
}

// API Response types for User NFT Interactions
export interface UserNFTInteractionsResponse {
    success: boolean;
    data?: UserNFTInteractions | UserNFTInteractions[];
    error?: string;
    count?: number;
    page?: number;
    totalPages?: number;
    hasMore?: boolean;
}

// Request types for creating/updating user interactions
export interface CreateUserNFTInteractionRequest extends Omit<UserNFTInteractions, '_id' | 'createdAt' | 'updatedAt'> {
    contractAddress: string;
    tokenId: string;
    userId: string;
}

export interface UpdateUserNFTInteractionRequest extends Partial<Omit<UserNFTInteractions, '_id' | 'contractAddress' | 'tokenId' | 'userId' | 'createdAt'>> {
    contractAddress: string;
    tokenId: string;
    userId: string;
}

// Combined user interaction data (from /api/user/interactions)
export interface CombinedUserInteractionData {
    // Favorites
    isFavorite: boolean;
    favoriteAddedAt?: string;

    // Ratings
    rating?: number;
    ratedAt?: string;

    // Watchlist
    isWatchlisted: boolean;
    watchlistAddedAt?: string;

    // Personal Data (extensible for future features)
    personalNotes?: string;
    personalRating?: number;
    strategy?: string;
    investmentGoal?: string;
    riskLevel?: string;

    // Metadata
    userId: string;
    contractAddress: string;
    tokenId: string;
    lastUpdated: string;
}

// API Response for combined user interactions
export interface CombinedUserInteractionsResponse {
    success: boolean;
    data?: CombinedUserInteractionData;
    error?: string;
}

// Combined view for NFT detail page
export interface NFTDetailData {
    nftIdentifier: NFTIdentifier;
    publicInsights?: PublicNFTInsights;
    userInteractions?: UserNFTInteractions;
    userWalletAddress?: string;
}

// Import the public insights types
import { PublicNFTInsights } from '../04-insights/02-insights-public';
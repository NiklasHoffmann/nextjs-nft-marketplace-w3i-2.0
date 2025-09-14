import { ObjectId } from 'mongodb';

// Base interface for NFT identification
export interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
    chainId?: number;
}

// Public NFT Insights - Admin managed, visible to everyone
export interface PublicNFTInsights extends NFTIdentifier {
    _id?: ObjectId | string;

    // Basic Information
    title?: string;
    description?: string;
    customName?: string;

    // Classification and Features
    category?: string;
    tags: string[];
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    quality?: number; // 1-10 scale

    // Utility and Functionality  
    utilities?: string[]; // ["Access to VIP events", "Staking rewards", "Governance voting"]
    functions?: string[]; // ["PFP", "Gaming avatar", "Metaverse access"]
    roadmapFeatures?: string[]; // Planned features/utilities

    // Technical Information
    technicalMetrics?: {
        tokenStandard?: string; // ERC-721, ERC-1155
        royaltyPercentage?: number;
        mintDate?: string;
        totalSupply?: number;
        isRevealable?: boolean;
        hasMetadata?: boolean;
        ipfsHash?: string;
    };

    // Market Analysis (Admin perspective)
    marketAnalysis?: {
        floorPriceHistory?: Array<{ date: string; price: number; currency: string; }>;
        volumeHistory?: Array<{ date: string; volume: number; currency: string; }>;
        rarityRank?: number;
        rarityScore?: number;
        marketCap?: number;
        liquidityScore?: number; // 1-10
    };

    // Collection Context
    collectionInsights?: {
        collectionFloor?: number;
        collectionVolume?: number;
        collectionSize?: number;
        creatorRoyalty?: number;
        isVerified?: boolean;
        socialLinks?: {
            twitter?: string;
            discord?: string;
            website?: string;
        };
    };

    // Community and Social
    communityMetrics?: {
        holderCount?: number;
        activeTraders?: number;
        socialMentions?: number;
        communityRating?: number; // Average of all user ratings
        totalRatings?: number;
    };

    // Admin metadata
    isVerified?: boolean;
    verificationDate?: string;
    lastUpdated?: string;
    createdAt?: string;
    updatedAt?: string;
    adminNotes?: string;
}

// API Response types for Public NFT Insights
export interface PublicNFTInsightsResponse {
    success: boolean;
    data?: PublicNFTInsights | PublicNFTInsights[];
    error?: string;
    count?: number;
    page?: number;
    totalPages?: number;
    hasMore?: boolean;
}

// Request types for creating/updating public insights (admin only)
export interface CreatePublicNFTInsightsRequest extends Omit<PublicNFTInsights, '_id' | 'createdAt' | 'updatedAt'> {
    contractAddress: string;
    tokenId: string;
}

export interface UpdatePublicNFTInsightsRequest extends Partial<Omit<PublicNFTInsights, '_id' | 'contractAddress' | 'tokenId' | 'createdAt'>> {
    contractAddress: string;
    tokenId: string;
}
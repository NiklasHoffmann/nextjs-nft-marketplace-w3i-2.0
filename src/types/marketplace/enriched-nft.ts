/**
 * Enriched NFT Types for MongoDB
 * 
 * Complete NFT data structure that combines data from:
 * - The Graph (marketplace/blockchain data)
 * - IPFS (metadata)
 * - Smart Contract (contract data)
 * - Stats API (social stats)
 * - Insights API (curated insights)
 */

import { ObjectId } from 'mongodb';

export interface EnrichedNFTDocument {
    // MongoDB ID
    _id?: ObjectId;

    // NFT Identifier
    contractAddress: string;
    tokenId: string;

    // Listing ID (duplicated from marketplace.listingId for easier access/indexing)
    listingId: string | null;

    // ===== THE GRAPH DATA (v2 Schema) =====
    marketplace: {
        // Core Listing Data
        listingId: string | null;
        isListed: boolean;
        isValid?: boolean; // Marketplace validation status
        invalidReasons?: string[] | null; // Reasons why listing is invalid
        invalidatedAt?: Date | null; // When was it invalidated

        // Pricing (v1 & v2 compatible)
        price: string | null; // Wei as string (priceTotal or legacy price)
        priceTotal?: string | null; // v2: Total price in Wei
        unitPrice?: string | null; // v2: Price per unit (ERC1155 partial buys)
        currency?: string | null; // Payment currency (0x0 = native ETH, WETH address = WETH)

        // Parties
        seller: string | null;
        buyer: string | null;

        // Swap Data (v1 & v2)
        desiredContractAddress: string | null; // v1 field name
        desiredTokenAddress?: string | null; // v2 field name
        desiredTokenId: string | null;
        desiredErc1155Quantity?: string | null; // v2: Amount for ERC1155 swaps

        // v2-only Fields (New Schema)
        tokenStandard?: 'ERC721' | 'ERC1155' | null; // Token type
        listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP' | null; // Listing type
        status?: 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED' | null;

        // ERC1155 Support
        erc1155QuantityListed?: string | null; // Total quantity listed
        remainingQuantity?: string | null; // Remaining quantity available

        // Advanced Features
        buyerWhitelistEnabled?: boolean; // Buyer whitelist restriction
        partialBuyEnabled?: boolean; // Partial purchases allowed (ERC1155)
        feeRate?: string | null; // Dynamic fee rate (denominator: 100,000)

        // Chain Info
        chainId?: number; // v2: Chain ID (e.g., 11155111 for Sepolia)

        // Timestamps
        createdAt?: string | Date | null; // Listing creation time
        syncedAt?: Date | null; // Last sync from subgraph
    };

    // ===== IPFS METADATA =====
    metadata: {
        name: string;
        description: string | null;
        image: string | null; // IPFS hash or URL
        animationUrl: string | null;
        externalUrl: string | null;
        attributes: Array<{
            trait_type: string;
            value: any;
            display_type?: string;
        }>;
    };

    // ===== CONTRACT DATA =====
    contract: {
        owner: string | null;
        tokenURI: string | null;
        name: string | null;
        symbol: string | null;
        totalSupply: number | null;
        contractType?: 'ERC721' | 'ERC1155' | null;
        ownerBalance: number | null;
        approvedAddress: string | null;
        approved?: string | null; // Alias for approvedAddress (API compatibility)
    };

    // ===== BLOCKCHAIN STATE (on-demand synced) =====
    blockchain?: {
        owner: string | null;
        approved: string | null;
        isApprovedForAll: boolean;
        lastSyncedAt: Date | null;
    };

    // ===== INSIGHTS =====
    insights: {
        customTitle: string | null;
        category: string | null;
        tags: string[];
        rarity: string | null;
        cardDescriptions: string[] | null;
        // Project info
        projectDescriptions: any | null;
        functionalitiesDescriptions: any | null;
        projectWebsite: string | null;
        projectTwitter: string | null;
        projectDiscord: string | null;
        partnerships: string[] | null;
    };

    // ===== DATA QUALITY FLAGS =====
    dataQuality: {
        hasMetadata: boolean;
        hasInsights: boolean;
        metadataSource: 'ipfs' | 'cache' | 'none';
    };

    // ===== TIMESTAMPS =====
    createdAt: Date;
    lastUpdated: Date;
    metadataLastUpdated: Date | null;
    insightsLastUpdated: Date | null;
}

/**
 * Collection Statistics Document
 */
export interface CollectionStatsDocument {
    _id?: ObjectId;

    // Collection Identifier
    contractAddress: string;

    // Basic Info
    name: string;
    symbol: string;

    // Supply Info
    totalSupply: number;
    listedCount: number;
    unlistedCount: number;

    // Financial Stats
    floorPrice: string | null; // ETH as string
    averagePrice: string | null;
    totalValue: string; // Total value of all listed items

    // Visual
    imageUrl: string | null;
    previewImages: string[]; // Up to 4 preview images

    // Social Stats (aggregated from NFTs)
    totalLikes: number;
    totalWatchlist: number;
    totalViews: number;

    // Timestamps
    lastUpdated: Date;
}

/**
 * API Query Parameters
 */
export interface MarketplaceQueryParams {
    // Pagination
    page?: number;
    limit?: number;

    // Text Search
    search?: string;

    // Marketplace Filters
    contractAddress?: string;
    minPrice?: string;
    maxPrice?: string;
    seller?: string;
    isListed?: boolean;

    // Metadata Filters
    category?: string;
    rarity?: string;
    tags?: string[];

    // Stats Filters
    minRating?: number;
    minViews?: number;
    minLikes?: number;
    minWatchlistCount?: number;

    // Sorting
    sortBy?: 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created';
    sortOrder?: 'asc' | 'desc';
}

/**
 * API Response
 */
export interface MarketplaceItemsResponse {
    success: boolean;
    data: {
        items: EnrichedNFTDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
        filters?: {
            appliedFilters: any;
            availableCategories: string[];
            availableRarities: string[];
            priceRange: { min: string; max: string };
        };
        timestamp: number;
        cached: boolean;
    };
    error?: string;
}

export interface CollectionsResponse {
    success: boolean;
    data: {
        collections: CollectionStatsDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        summary: {
            totalCollections: number;
            totalListedNFTs: number;
            totalValue: string;
        };
    };
    timestamp: number;
    error?: string;
}

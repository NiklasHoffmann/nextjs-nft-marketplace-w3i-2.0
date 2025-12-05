
/**
 * NFT Metadata Collection Schema
 * 
 * Central source of truth for all NFT data in the marketplace.
 * Stores static metadata and tracks current ownership.
 * Referenced by marketplace_items for listings.
 */

export interface NFTMetadata {
    // Unique identifier
    contractAddress: string;  // Contract address (lowercase)
    tokenId: string;     // Token ID as string

    // Static metadata (immutable)
    metadata: {
        name: string | null;
        description: string | null;
        image: string | null;
        animationUrl?: string | null;
        externalUrl?: string | null;
        attributes?: Array<{
            trait_type: string;
            value: string | number;
            display_type?: string;
        }>;
        // Raw IPFS hash for cache invalidation
        imageHash?: string | null;
        metadataHash?: string | null;
    };

    // Contract information (mostly static)
    contract: {
        name: string | null;
        symbol: string | null;
        totalSupply?: number | null;
        contractType?: 'ERC721' | 'ERC1155' | null;
        tokenURI?: string | null;
        owner?: string | null;        // ✅ Current owner from blockchain
        ownerBalance?: number | null; // ✅ Owner's balance from this collection
        approved?: string | null;     // ✅ ERC-721 approved address (for marketplace transfers)
    };

    // Dynamic ownership data
    currentOwner: string | null;  // Current owner address (lowercase)
    ownerHistory: Array<{
        owner: string;          // Owner address
        acquiredAt: string;     // Timestamp
        transferredAt?: string; // Timestamp (if transferred)
        source: 'mint' | 'transfer' | 'purchase' | 'unknown';
    }>;

    // Verification & sync
    lastVerified: string;    // Last ownership verification timestamp
    lastMetadataUpdate: string; // Last time metadata was fetched

    // Timestamps
    firstSeen: string;       // First time NFT was discovered
    createdAt: string;       // Document creation
    updatedAt: string;       // Last document update
}

/**
 * Indexed fields for fast queries:
 * 
 * 1. Compound unique index: { contractAddress: 1, tokenId: 1 }
 *    - Primary key for NFT identification
 * 
 * 2. Index: { currentOwner: 1 }
 *    - Fast wallet NFT queries
 * 
 * 3. Index: { 'metadata.name': 1 }
 *    - Search by NFT name
 * 
 * 4. Index: { 'contract.name': 1 }
 *    - Search by collection name
 * 
 * 5. Index: { lastVerified: 1 }
 *    - Find stale ownership data for background refresh
 */

/**
 * API Response format (enriched with references)
 */
export interface EnrichedNFTMetadata extends NFTMetadata {
    // Listing status (from marketplace_items)
    isListed?: boolean;
    listings?: Array<{
        listingId: string;
        price: string;
        seller: string;
        listedAt: string;
    }>;

    // Stats (from nft_stats)
    stats?: {
        viewCount: number;
        likeCount: number;
        watchlistCount: number;
        averageRating: number;
        ratingCount: number;
    };

    // User interactions (from user collections)
    userInteractions?: {
        isFavorited?: boolean;
        isWatchlisted?: boolean;
        userRating?: number;
    };
}

/**
 * Sync operation result
 */
export interface NFTMetadataSyncResult {
    total: number;
    new: number;
    updated: number;
    transferred: number;
    unchanged: number;
    errors: Array<{
        contractAddress: string;
        tokenId: string;
        error: string;
    }>;
    duration: number; // milliseconds
}

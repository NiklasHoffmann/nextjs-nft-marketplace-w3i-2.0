import { devLog } from '@/utils/devLog';
import type {
    AggregatedNFT,
    NFTIdentifier,
    ActiveItem,
    NftCore,
    NftMeta,
    SocialStats,
    Insight,
    DataSource
} from '@/types/core/core-nft-modern';

/**
 * Creates a unique key for an NFT
 */
export function createNFTKey(contractAddress: string, tokenId: string): `${string}-${string}` {
    // Defensive handling - ensure both parameters are strings, but warn on empty values
    const safeAddress = (contractAddress || '').toLowerCase();
    const safeTokenId = tokenId || '';

    if (!contractAddress || !tokenId) {
        devLog.warn('nft-aggregation', 'createNFTKey: Empty parameters detected', { contractAddress, tokenId });
    }

    return `${safeAddress}-${safeTokenId}`;
}

/**
 * Creates a base AggregatedNFT structure
 */
export function createBaseAggregatedNFT(
    contractAddress: string,
    tokenId: string
): AggregatedNFT {
    // Defensive parameter handling - DON'T default to empty string
    if (!contractAddress || !tokenId) {
        devLog.warn('nft-aggregation', 'createBaseAggregatedNFT: Invalid parameters', { contractAddress, tokenId });
    }

    const safeAddress = contractAddress; // Keep the original value, don't default to empty
    const safeTokenId = tokenId || '';

    return {
        key: createNFTKey(safeAddress, safeTokenId),
        contractAddress: safeAddress as `0x${string}`,
        tokenId: safeTokenId,
        listed: false,
        core: {
            contractAddress: safeAddress as `0x${string}`,
            tokenId: safeTokenId,
            tokenURI: null,
            name: null,
            owner: null,
            symbol: null
        },
        lastUpdated: Date.now(),
        sources: {
            blockchain: false,
            metadata: false,
            marketplace: false,
            social: false,
            insights: false
        }
    };
}

/**
 * Merges multiple data sources into a single AggregatedNFT
 */
export function mergeAggregatedNFT(base: AggregatedNFT, ...updates: Partial<AggregatedNFT>[]): AggregatedNFT {
    let merged = { ...base };

    for (const update of updates) {
        if (!update) continue;

        merged = {
            ...merged,
            // Always use latest listing info
            listed: update.listed ?? merged.listed,

            // Merge core data (deep merge)
            core: update.core ? {
                ...merged.core,
                ...update.core
            } : merged.core,

            // Update optional sections if provided
            meta: update.meta || merged.meta,
            listing: update.listing || merged.listing,
            social: update.social ? {
                ...merged.social,
                ...update.social
            } : merged.social,
            insight: update.insight || merged.insight,

            // Always update timestamps and sources
            lastUpdated: update.lastUpdated || Date.now(),
            sources: update.sources ? {
                ...merged.sources,
                ...update.sources
            } : merged.sources
        };
    }

    return merged;
}

/**
 * Checks if AggregatedNFT data is fresh (simplified version for cache management)
 */
export function isDataFresh(nft: AggregatedNFT, maxAge: number = 300000): boolean {
    const age = Date.now() - nft.lastUpdated;
    return age < maxAge;
}

/**
 * Gets data freshness for all sources
 */
export function getDataFreshness(nft: AggregatedNFT) {
    const now = Date.now();
    const age = now - nft.lastUpdated;

    return {
        blockchain: age < 5 * 60 * 1000,      // 5 minutes
        metadata: age < 12 * 60 * 60 * 1000,  // 12 hours
        marketplace: age < 30 * 1000,         // 30 seconds
        social: age < 2 * 60 * 1000,          // 2 minutes
        insights: age < 60 * 60 * 1000        // 1 hour
    };
}

/**
 * Creates display-ready data from AggregatedNFT
 */
export function getDisplayData(nft: AggregatedNFT) {
    // Defensive name handling - ensure we always return a string
    const displayName = nft.meta?.name || nft.core.name || `#${nft.tokenId}`;

    return {
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        name: displayName || '', // Ensure never null/undefined
        image: nft.meta?.image || null,
        animation_url: nft.meta?.animationUrl || null,
        description: nft.meta?.description || null,

        // Marketplace info
        isListed: nft.listed,
        price: nft.listing?.price || null,
        seller: nft.listing?.seller || null,
        listingId: nft.listing?.listingId || null,

        // Owner
        owner: nft.core.owner,

        // Social stats
        likeCount: nft.social?.likeCount || 0,
        watchlistCount: nft.social?.watchlistCount || 0,
        averageRating: nft.social?.averageRating || null,
        ratingCount: nft.social?.ratingCount || 0,

        // Insights
        customTitle: nft.insight?.customTitle || null,
        category: nft.insight?.category || null,
        rarity: nft.insight?.rarity || null,

        // Metadata
        lastUpdated: nft.lastUpdated
    };
}

/**
 * Filter functions for AggregatedNFT arrays
 */

export function filterByOwner(nfts: AggregatedNFT[], ownerAddress: string): AggregatedNFT[] {
    const normalized = ownerAddress.toLowerCase();
    return nfts.filter(nft => nft.core.owner?.toLowerCase() === normalized);
}

export function filterBySeller(nfts: AggregatedNFT[], sellerAddress: string): AggregatedNFT[] {
    const normalized = sellerAddress.toLowerCase();
    return nfts.filter(nft =>
        nft.listed &&
        nft.listing?.seller.toLowerCase() === normalized
    );
}

export function filterListed(nfts: AggregatedNFT[]): AggregatedNFT[] {
    return nfts.filter(nft => nft.listed && nft.listing);
}

/**
 * Sort functions for AggregatedNFT arrays
 */

export function sortNFTs(nfts: AggregatedNFT[], sortBy: 'price' | 'name' | 'recent' = 'recent'): AggregatedNFT[] {
    return [...nfts].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                const priceA = parseFloat(a.listing?.price || '0');
                const priceB = parseFloat(b.listing?.price || '0');
                return priceB - priceA;

            case 'name':
                const nameA = a.meta?.name || a.core.name || a.tokenId;
                const nameB = b.meta?.name || b.core.name || b.tokenId;
                return nameA.localeCompare(nameB);

            case 'recent':
            default:
                return b.lastUpdated - a.lastUpdated;
        }
    });
}

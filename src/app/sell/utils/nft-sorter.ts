/**
 * Utility functions for sorting NFTs
 */

import { AggregatedNFT } from '@/types/core/core-nft-modern';
import { SortOption, SortOrder } from '../types';

/**
 * Sorts NFTs based on the provided sort option and order
 */
export function sortNFTs(
    nfts: AggregatedNFT[],
    sortBy: SortOption,
    sortOrder: SortOrder
): AggregatedNFT[] {
    return [...nfts].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
            case 'name':
                aValue = a.core.name || a.meta?.name || `NFT #${a.tokenId}`;
                bValue = b.core.name || b.meta?.name || `NFT #${b.tokenId}`;
                break;
            case 'price':
                aValue = a.listed && a.listing?.price ? parseFloat(a.listing.price) : 0;
                bValue = b.listed && b.listing?.price ? parseFloat(b.listing.price) : 0;
                break;
            case 'likes':
                aValue = a.social?.likeCount || 0;
                bValue = b.social?.likeCount || 0;
                break;
            case 'views':
                aValue = a.social?.viewCount || 0;
                bValue = b.social?.viewCount || 0;
                break;
            case 'rating':
                aValue = a.social?.averageRating || 0;
                bValue = b.social?.averageRating || 0;
                break;
            case 'watchlist':
                aValue = a.social?.watchlistCount || 0;
                bValue = b.social?.watchlistCount || 0;
                break;
            case 'recent':
                aValue = a.lastUpdated;
                bValue = b.lastUpdated;
                break;
            default:
                return 0;
        }

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortOrder === 'asc' ? comparison : -comparison;
        }

        // Handle numeric comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            const comparison = aValue - bValue;
            return sortOrder === 'asc' ? comparison : -comparison;
        }

        // Handle date comparison
        if (sortBy === 'recent') {
            const aDate = new Date(aValue).getTime();
            const bDate = new Date(bValue).getTime();
            const comparison = aDate - bDate;
            return sortOrder === 'asc' ? comparison : -comparison;
        }

        return 0;
    });
}

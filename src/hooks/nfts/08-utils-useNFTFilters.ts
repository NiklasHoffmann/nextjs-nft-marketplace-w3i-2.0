import { useMemo } from 'react';
import { formatEther } from '@/utils';
import type { NFTFilters, NFTSortOptions } from '@/components/03-marketplace/05-filters-NFTFilterBar';

export interface FilterableNFTItem {
    contractAddress: string;
    tokenId: string;
    price?: string | null;
    isListed: boolean;
    // From Context/Card Data
    imageUrl?: string | null;
    name?: string | null;
    customTitle?: string | null;
    category?: string | null;
    cardDescriptions?: string[] | null;
    rarity?: string | null;
    averageRating?: number | null;
    ratingCount?: number | null;
    favoriteCount?: number | null; // Updated from likeCount
    watchlistCount?: number | null;
    viewCount?: number | null;
    tags?: string[] | null;
    // Marketplace specific
    listingId?: string;
    seller?: string;
    buyer?: string | null;
    desiredNftAddress?: string;
    desiredTokenId?: string;
}

/**
 * Hook for filtering and sorting NFT items
 */
export function useNFTFilters(
    items: FilterableNFTItem[],
    filters: NFTFilters,
    sort: NFTSortOptions
) {
    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // Apply filters
        result = result.filter(item => {
            // Search filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const searchableText = [
                    item.name,
                    item.customTitle,
                    item.contractAddress,
                    item.tokenId,
                    ...(item.cardDescriptions || [])
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchLower)) {
                    return false;
                }
            }

            // Category filter
            if (filters.categories.length > 0) {
                if (!item.category || !filters.categories.includes(item.category)) {
                    return false;
                }
            }

            // Rarity filter
            if (filters.rarities.length > 0) {
                if (!item.rarity || !filters.rarities.includes(item.rarity)) {
                    return false;
                }
            }

            // Price filters (only for listed items)
            if (item.isListed && item.price) {
                const priceInEth = parseFloat(formatEther(item.price));

                if (filters.priceMin && priceInEth < filters.priceMin) {
                    return false;
                }

                if (filters.priceMax && priceInEth > filters.priceMax) {
                    return false;
                }
            } else if (filters.priceMin || filters.priceMax) {
                // If price filters are set but item has no price, exclude it
                return false;
            }

            // Rating filter
            if (filters.minRating && (!item.averageRating || item.averageRating < filters.minRating)) {
                return false;
            }

            // Views filter (we don't have direct views, so we'll skip this for now)
            if (filters.minViews && filters.minViews > 0) {
                if (!item.viewCount || item.viewCount < filters.minViews) {
                    return false;
                }
            }

            // Likes filter (updated to use favoriteCount)
            if (filters.minLikes && filters.minLikes > 0) {
                if (!item.favoriteCount || item.favoriteCount < filters.minLikes) {
                    return false;
                }
            }

            // Watchlist filter
            if (filters.minWatchlistCount && filters.minWatchlistCount > 0) {
                if (!item.watchlistCount || item.watchlistCount < filters.minWatchlistCount) {
                    return false;
                }
            }

            return true;
        });

        // Apply sorting
        result.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sort.field) {
                case 'price':
                    // Convert price to number for comparison
                    aValue = a.price ? parseFloat(formatEther(a.price)) : 0;
                    bValue = b.price ? parseFloat(formatEther(b.price)) : 0;
                    break;

                case 'rating':
                    aValue = a.averageRating || 0;
                    bValue = b.averageRating || 0;
                    break;

                case 'views':
                    aValue = a.viewCount || 0;
                    bValue = b.viewCount || 0;
                    break;

                case 'likes':
                    aValue = a.favoriteCount || 0;
                    bValue = b.favoriteCount || 0;
                    break;

                case 'watchlistCount':
                    aValue = a.watchlistCount || 0;
                    bValue = b.watchlistCount || 0;
                    break;

                case 'name':
                    aValue = (a.customTitle || a.name || `NFT #${a.tokenId}`).toLowerCase();
                    bValue = (b.customTitle || b.name || `NFT #${b.tokenId}`).toLowerCase();
                    break;

                case 'created':
                    // Sort by tokenId as proxy for creation order
                    aValue = parseInt(a.tokenId) || 0;
                    bValue = parseInt(b.tokenId) || 0;
                    break;

                default:
                    aValue = 0;
                    bValue = 0;
            }

            // Handle different data types
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sort.direction === 'asc' ? comparison : -comparison;
            } else {
                const comparison = (aValue || 0) - (bValue || 0);
                return sort.direction === 'asc' ? comparison : -comparison;
            }
        });

        return result;
    }, [items, filters, sort]);

    return {
        filteredItems: filteredAndSortedItems,
        totalCount: items.length,
        filteredCount: filteredAndSortedItems.length,
    };
}

/**
 * Helper to get unique categories from items
 */
export function getUniqueCategories(items: FilterableNFTItem[]): string[] {
    const categories = items
        .map(item => item.category)
        .filter((category): category is string => !!category);

    return Array.from(new Set(categories)).sort();
}

/**
 * Helper to get unique rarities from items
 */
export function getUniqueRarities(items: FilterableNFTItem[]): string[] {
    const rarities = items
        .map(item => item.rarity)
        .filter((rarity): rarity is string => !!rarity);

    return Array.from(new Set(rarities)).sort();
}

/**
 * Helper to get price range from items
 */
export function getPriceRange(items: FilterableNFTItem[]): { min: number; max: number } {
    const prices = items
        .filter(item => item.isListed && item.price)
        .map(item => parseFloat(formatEther(item.price!)));

    if (prices.length === 0) {
        return { min: 0, max: 0 };
    }

    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
}
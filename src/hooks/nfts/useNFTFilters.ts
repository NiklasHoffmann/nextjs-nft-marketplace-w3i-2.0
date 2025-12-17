import { useMemo } from 'react';
import { formatEther } from '@/utils';
import type { NFTFilters, NFTSortOptions, FilterableNFTItem } from '@/types/marketplace';

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
                    item.symbol,
                    item.category,
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

            // Price filters
            // Apply to listed items: filter by price range
            // Apply to unlisted items: only exclude if BOTH min and max are set and we want "only listed in range"
            if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
                if (item.isListed && item.price) {
                    // Listed item - apply price filter
                    const priceInEth = parseFloat(formatEther(item.price));

                    if (filters.priceMin !== undefined && priceInEth < filters.priceMin) {
                        return false;
                    }

                    if (filters.priceMax !== undefined && priceInEth > filters.priceMax) {
                        return false;
                    }
                }
                // Unlisted items pass through (no price to filter on)
            }

            // Rating filter
            // If filter is active (> 0), only show NFTs WITH stats that meet criteria
            if (filters.minRating !== undefined && filters.minRating > 0) {
                // Exclude NFTs without stats data
                if (item.averageRating === undefined || item.averageRating === null) {
                    return false;
                }
                // Apply filter
                if (item.averageRating < filters.minRating) {
                    return false;
                }
            }

            // Views filter
            if (filters.minViews !== undefined && filters.minViews > 0) {
                if (item.viewCount === undefined || item.viewCount === null) {
                    return false;
                }
                if (item.viewCount < filters.minViews) {
                    return false;
                }
            }

            // Likes filter
            // If filter is active (> 0), only show NFTs WITH stats that meet criteria
            // If filter is inactive (0 or undefined), show all NFTs
            if (filters.minLikes !== undefined && filters.minLikes > 0) {
                // Exclude NFTs without stats data
                if (item.favoriteCount === undefined || item.favoriteCount === null) {
                    return false;
                }
                // Apply filter
                if (item.favoriteCount < filters.minLikes) {
                    return false;
                }
            }

            // Watchlist filter
            if (filters.minWatchlistCount !== undefined && filters.minWatchlistCount > 0) {
                if (item.watchlistCount === undefined || item.watchlistCount === null) {
                    return false;
                }
                if (item.watchlistCount < filters.minWatchlistCount) {
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
                    // Convert price to number for comparison (handle both listed and unlisted)
                    // Unlisted items get value 0 and are sorted to the end when desc
                    aValue = (a.isListed && a.price) ? parseFloat(formatEther(a.price)) : -Infinity;
                    bValue = (b.isListed && b.price) ? parseFloat(formatEther(b.price)) : -Infinity;
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
                    aValue = a.likeCount || 0;
                    bValue = b.likeCount || 0;
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
                case 'tokenId':
                    // Sort by tokenId numerically (not as string)
                    aValue = parseInt(a.tokenId) || 0;
                    bValue = parseInt(b.tokenId) || 0;
                    break;

                case 'rarity':
                    // Sort by rarity (legendary > epic > rare > uncommon > common)
                    const rarityOrder: { [key: string]: number } = {
                        'legendary': 5,
                        'epic': 4,
                        'rare': 3,
                        'uncommon': 2,
                        'common': 1
                    };
                    aValue = rarityOrder[a.rarity?.toLowerCase() || ''] || 0;
                    bValue = rarityOrder[b.rarity?.toLowerCase() || ''] || 0;
                    break;

                default:
                    // Default to price if unknown field
                    aValue = (a.isListed && a.price) ? parseFloat(formatEther(a.price)) : -Infinity;
                    bValue = (b.isListed && b.price) ? parseFloat(formatEther(b.price)) : -Infinity;
            }

            // Handle different data types
            let comparison: number;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = (aValue || 0) - (bValue || 0);
            }

            // Apply direction
            const result = sort.direction === 'asc' ? comparison : -comparison;

            // Secondary sort by tokenId for stability (wenn Werte gleich sind)
            if (result === 0) {
                const aTokenId = parseInt(a.tokenId) || 0;
                const bTokenId = parseInt(b.tokenId) || 0;
                return sort.direction === 'asc' ? aTokenId - bTokenId : bTokenId - aTokenId;
            }

            return result;
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

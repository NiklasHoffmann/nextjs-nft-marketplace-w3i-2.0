/**
 * Marketplace V2 Hooks
 * 
 * Modern fetch-based hooks for the new MongoDB-backed marketplace API
 * With caching support to prevent unnecessary reloads
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { devLog } from '@/utils/devLog';
import { useMarketplaceItems } from '@/contexts/marketplace-items';
import { useCollections } from '@/contexts/collections';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';

interface UseMarketplaceV2Options {
  // Pagination
  page?: number;
  limit?: number;

  // Search
  search?: string;

  // Filters
  contractAddress?: string;
  minPrice?: string;
  maxPrice?: string;
  seller?: string;
  isListed?: boolean;
  category?: string;
  rarity?: string;
  tags?: string[];
  minRating?: number;
  minViews?: number;
  minLikes?: number;
  minWatchlistCount?: number;

  // Sorting
  sortBy?: 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created';
  sortOrder?: 'asc' | 'desc';

  // Auto-fetch on mount
  autoFetch?: boolean;
}

interface UseMarketplaceV2Return {
  items: EnrichedNFTDocument[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  filters: {
    availableCategories: string[];
    availableRarities: string[];
    priceRange: { min: string; max: string };
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  setPage: (page: number) => void;
}

/**
 * Hook for fetching marketplace items from the new V2 API
 * With intelligent caching to prevent unnecessary reloads
 */
export function useMarketplaceV2(options: UseMarketplaceV2Options = {}): UseMarketplaceV2Return {
  const {
    page: initialPage = 1,
    limit = 20,
    autoFetch = true,
    ...filters
  } = options;

  const [items, setItems] = useState<EnrichedNFTDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState<UseMarketplaceV2Return['pagination']>(null);
  const [availableFilters, setAvailableFilters] = useState<UseMarketplaceV2Return['filters']>(null);

  // Get cache context
  const cache = useMarketplaceItems();

  // Prevent concurrent loadMore calls
  const loadingRef = useRef(false);

  // Create cache key from filters
  const createFilterKey = useCallback(() => {
    return JSON.stringify({
      search: filters.search || '',
      contractAddress: filters.contractAddress || '',
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
      seller: filters.seller || '',
      isListed: filters.isListed ?? true,
      category: filters.category || '',
      rarity: filters.rarity || '',
      tags: filters.tags?.join(',') || '',
      minRating: filters.minRating || 0,
      minViews: filters.minViews || 0,
      minLikes: filters.minLikes || 0,
      minWatchlistCount: filters.minWatchlistCount || 0,
      sortBy: filters.sortBy || 'price',
      sortOrder: filters.sortOrder || 'desc',
    });
  }, [
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    filters.category,
    filters.rarity,
    filters.tags?.join(','),
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
  ]);

  /**
   * Fetch items from API (with cache support)
   */
  const fetchItems = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loadingRef.current) {
      devLog.debug('marketplace', `⏸️ Fetch already in progress, skipping duplicate call for page ${pageNum}`);
      return;
    }

    // Check cache first (only for page 1, not for pagination)
    if (!append && pageNum === 1) {
      const filterKey = createFilterKey();
      const cached = cache.getCached(filterKey);

      if (cached) {
        devLog.cache('marketplace', `✅ Using cached data (${cached.data.items.length} items)`);
        setItems(cached.data.items);
        setPagination(cached.data.pagination);
        setAvailableFilters(cached.data.filters || null);
        setLoading(false);
        return;
      }
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        sortBy: filters.sortBy || 'price',
        sortOrder: filters.sortOrder || 'desc',
        ...(filters.search && { search: filters.search }),
        ...(filters.contractAddress && { contractAddress: filters.contractAddress }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.seller && { seller: filters.seller }),
        ...(filters.isListed !== undefined && { isListed: filters.isListed.toString() }),
        ...(filters.category && { category: filters.category }),
        ...(filters.rarity && { rarity: filters.rarity }),
        ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags.join(',') }),
        ...(filters.minRating !== undefined && { minRating: filters.minRating.toString() }),
        ...(filters.minViews !== undefined && { minViews: filters.minViews.toString() }),
        ...(filters.minLikes !== undefined && { minLikes: filters.minLikes.toString() }),
        ...(filters.minWatchlistCount !== undefined && { minWatchlistCount: filters.minWatchlistCount.toString() }),
      });

      const response = await fetch(`/api/marketplace/items?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: MarketplaceItemsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Debug logging removed for production

      // Update state
      if (append) {
        setItems(prev => {
          // Deduplication: Filter out items that already exist (by listingId)
          const existingIds = new Set(prev.map(item => item.listingId).filter(Boolean));
          const newItems = data.data.items.filter(item => {
            if (!item.listingId) return true; // Keep items without listingId
            return !existingIds.has(item.listingId); // Skip duplicates
          });

          return [...prev, ...newItems];
        });
      } else {
        setItems(data.data.items);

        // Cache the result (only for page 1)
        if (pageNum === 1) {
          const filterKey = createFilterKey();
          cache.setCache(filterKey, data.data);
        }
      }

      setPagination(data.data.pagination);
      setAvailableFilters(data.data.filters || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items';
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [
    limit,
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    filters.category,
    filters.rarity,
    filters.tags?.join(','),
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
    cache,
    createFilterKey,
  ]);

  /**
   * Refetch current page
   */
  const refetch = useCallback(async () => {
    await fetchItems(page, false);
  }, [page, fetchItems]);

  /**
   * Load next page (append to current items)
   */
  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || loading) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchItems(nextPage, true);
  }, [pagination, loading, page, fetchItems]);

  /**
   * Set page number (replace items)
   */
  const setPageNumber = useCallback(async (newPage: number) => {
    setPage(newPage);
    await fetchItems(newPage, false);
  }, [fetchItems]);

  // Auto-fetch on mount or when filters change
  useEffect(() => {
    if (autoFetch) {
      // Clear old items immediately to prevent duplicates
      setItems([]);
      setPage(1);
      fetchItems(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoFetch,
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    filters.category,
    filters.rarity,
    filters.tags?.join(','),
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
    // fetchItems intentionally omitted to prevent infinite loop
  ]);

  return {
    items,
    loading,
    error,
    pagination,
    filters: availableFilters,
    refetch,
    loadMore,
    setPage: setPageNumber,
  };
}

/**
 * Hook for fetching collections from the V2 API
 */
interface UseCollectionsV2Options {
  page?: number;
  limit?: number;
  minFloorPrice?: string;
  maxFloorPrice?: string;
  minListedCount?: number;
  sortBy?: 'floorPrice' | 'totalListed' | 'totalValue' | 'name';
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}

/**
 * useCollectionsV2 - Wrapper around CollectionsContext
 * 
 * Provides backward-compatible API for CollectionsTableV2 component.
 * Now uses CollectionsContext instead of direct API calls for better
 * performance and caching.
 */
export function useCollectionsV2(options: UseCollectionsV2Options = {}) {
  const {
    page: initialPage = 1,
    limit = 20,
    autoFetch = true,
    minFloorPrice,
    maxFloorPrice,
    minListedCount,
    sortBy = 'totalValue',
    sortOrder = 'desc',
  } = options;

  const {
    collections: allCollections,
    loading,
    error: contextError,
    totalCollections,
    totalListedItems,
    refresh
  } = useCollections();

  const [page, setPage] = useState(initialPage);

  // Filter and sort collections client-side
  const filteredCollections = useMemo(() => {
    let filtered = [...allCollections];

    // Apply filters
    if (minFloorPrice) {
      const minPrice = parseFloat(minFloorPrice);
      filtered = filtered.filter(c =>
        c.floorPrice && c.floorPrice >= minPrice
      );
    }

    if (maxFloorPrice) {
      const maxPrice = parseFloat(maxFloorPrice);
      filtered = filtered.filter(c =>
        c.floorPrice && c.floorPrice <= maxPrice
      );
    }

    if (minListedCount) {
      filtered = filtered.filter(c => c.itemCount >= minListedCount);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'floorPrice':
          aValue = a.floorPrice ? a.floorPrice : Infinity;
          bValue = b.floorPrice ? b.floorPrice : Infinity;
          break;
        case 'totalValue':
          aValue = a.totalValue || 0;
          bValue = b.totalValue || 0;
          break;
        case 'totalListed':
          aValue = a.itemCount;
          bValue = b.itemCount;
          break;
        case 'name':
          aValue = a.contractName || a.contractSymbol || '';
          bValue = b.contractName || b.contractSymbol || '';
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [allCollections, minFloorPrice, maxFloorPrice, minListedCount, sortBy, sortOrder]);

  // Paginate
  const paginatedCollections = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredCollections.slice(startIndex, startIndex + limit);
  }, [filteredCollections, page, limit]);

  // Calculate pagination info
  const pagination = useMemo(() => ({
    currentPage: page,
    totalPages: Math.ceil(filteredCollections.length / limit),
    totalCount: filteredCollections.length,
    hasMore: page * limit < filteredCollections.length,
  }), [filteredCollections.length, page, limit]);

  // Summary stats
  const summary = useMemo(() => ({
    totalCollections: filteredCollections.length,
    totalListedNFTs: filteredCollections.reduce((sum, c) => sum + c.itemCount, 0),
    totalValue: filteredCollections.reduce((sum, c) => sum + (c.totalValue || 0), 0).toFixed(6),
  }), [filteredCollections]);

  const setPageNumber = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const refetch = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    collections: paginatedCollections,
    loading,
    error: contextError,
    pagination,
    summary,
    refetch,
    setPage: setPageNumber,
  };
}

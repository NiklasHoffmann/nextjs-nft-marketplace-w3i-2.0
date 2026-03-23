/**
 * Marketplace Items Hooks
 * 
 * Modern fetch-based hooks for the MongoDB-backed marketplace API
 * With caching support to prevent unnecessary reloads
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMarketplaceItems as useMarketplaceItemsContext } from '@/contexts/marketplace-items';
import { useCollections } from '@/contexts/collections';
import type { EnrichedNFTDocument, MarketplaceItemsResponse } from '@/types/marketplace/enriched-nft';
import { devLog } from '@/utils';

function parseFloorPrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

interface UseMarketplaceItemsOptions {
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
  category?: string | string[];
  tokenStandard?: 'ERC721' | 'ERC1155' | Array<'ERC721' | 'ERC1155'>;
  rarity?: string | string[];
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

  // Include filter facets (categories/rarities/price range)
  includeFilters?: boolean;
}

interface UseMarketplaceItemsReturn {
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
 * Hook for fetching marketplace items from MongoDB API
 * With intelligent caching to prevent unnecessary reloads
 */
export function useMarketplaceItems(options: UseMarketplaceItemsOptions = {}): UseMarketplaceItemsReturn {
  const CACHE_VERSION = 2;
  const {
    page: initialPage = 1,
    limit = 20,
    autoFetch = true,
    includeFilters = true,
    ...filters
  } = options;

  // Get cache context
  const cacheContext = useMarketplaceItemsContext();

  const filterKey = useMemo(() => JSON.stringify({
    cacheVersion: CACHE_VERSION,
    refreshSeed: cacheContext.refreshTrigger,
    search: filters.search || '',
    contractAddress: filters.contractAddress || '',
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
    seller: filters.seller || '',
    isListed: filters.isListed ?? true,
    category: filters.category || '',
    tokenStandard: filters.tokenStandard || '',
    rarity: filters.rarity || '',
    tags: filters.tags?.join(',') || '',
    minRating: filters.minRating || 0,
    minViews: filters.minViews || 0,
    minLikes: filters.minLikes || 0,
    minWatchlistCount: filters.minWatchlistCount || 0,
    sortBy: filters.sortBy || 'price',
    sortOrder: filters.sortOrder || 'desc',
    includeFilters,
  }), [
    cacheContext.refreshTrigger,
    includeFilters,
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    filters.category,
    filters.tokenStandard,
    filters.rarity,
    filters.tags?.join(','),
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const initialCachedEntry = useMemo(() => cacheContext.getCached(filterKey), [cacheContext, filterKey]);

  const [items, setItems] = useState<EnrichedNFTDocument[]>(() => initialCachedEntry?.data.items ?? []);
  const [loading, setLoading] = useState(() => autoFetch && !initialCachedEntry);
  const [initialLoading, setInitialLoading] = useState(() => autoFetch && !initialCachedEntry);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState<UseMarketplaceItemsReturn['pagination']>(() => initialCachedEntry?.data.pagination ?? null);
  const [availableFilters, setAvailableFilters] = useState<UseMarketplaceItemsReturn['filters']>(() => initialCachedEntry?.data.filters || null);
  const itemsRef = useRef<EnrichedNFTDocument[]>(initialCachedEntry?.data.items ?? []);

  // Prevent concurrent loadMore calls
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /**
   * Fetch items from API (with cache support)
   */
  const fetchItems = useCallback(async (pageNum: number, append: boolean = false) => {
    // Don't block if previous request is still running - abort it instead
    // This allows React Strict Mode double-renders to work correctly

    // Abort any pending request before starting a new one (prevents race conditions)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      loadingRef.current = false; // Reset loading ref when aborting
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Check cache first (only for page 1, not for pagination)
    // IMPORTANT: Check cache BEFORE clearing items to avoid flicker
    devLog.info('🔍 [useMarketplaceItems] Checking cache for key:', filterKey);

    let hasFreshCacheHit = false;

    if (!append && pageNum === 1) {
      const cached = cacheContext.getCached(filterKey);

      if (cached) {
        hasFreshCacheHit = true;
        devLog.info('✅ [useMarketplaceItems] Cache HIT - using cached data and revalidating in background:', cached.data.items.length);
        // Show cached data immediately, then continue with background API revalidation.
        setItems(cached.data.items);
        setPagination(cached.data.pagination);
        setAvailableFilters(cached.data.filters || null);
        setLoading(false);
        setInitialLoading(false);
      } else {
        devLog.info('❌ [useMarketplaceItems] Cache MISS - fetching from API');
      }
    }

    // Clear items AFTER cache check (only if cache miss and not appending)
    // This prevents flickering when cache is available
    // FIXED: Don't clear items immediately - keep showing old data until new data arrives
    // Only clear on initial load or when explicitly needed
    if (!append && !hasFreshCacheHit && items.length === 0) {
      devLog.info('🗑️ [useMarketplaceItems] Initial load - clearing items');
      setItems([]);
    } else if (!append && !hasFreshCacheHit && items.length > 0) {
      devLog.info('♻️ [useMarketplaceItems] Keeping old items until new data arrives');
      // Keep old items displayed - they'll be replaced when new data arrives
    }

    loadingRef.current = true;
    if (!hasFreshCacheHit) {
      setLoading(true);
    }
    setError(null);

    devLog.info('🌐 [useMarketplaceItems] Starting API request...');

    try {
      // Build query string
      const effectiveLimit = (!append && pageNum === 1 && hasFreshCacheHit)
        ? Math.max(limit, itemsRef.current.length)
        : limit;

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: effectiveLimit.toString(),
        sortBy: filters.sortBy || 'price',
        sortOrder: filters.sortOrder || 'desc',
        ...(filters.search && { search: filters.search }),
        ...(filters.contractAddress && { contractAddress: filters.contractAddress }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.seller && { seller: filters.seller }),
        ...(filters.isListed !== undefined && { isListed: filters.isListed.toString() }),
        ...(filters.category && { category: Array.isArray(filters.category) ? filters.category.join(',') : filters.category }),
        ...(filters.tokenStandard && { tokenStandard: Array.isArray(filters.tokenStandard) ? filters.tokenStandard.join(',') : filters.tokenStandard }),
        ...(filters.rarity && { rarity: Array.isArray(filters.rarity) ? filters.rarity.join(',') : filters.rarity }),
        ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags.join(',') }),
        ...(filters.minRating !== undefined && { minRating: filters.minRating.toString() }),
        ...(filters.minViews !== undefined && { minViews: filters.minViews.toString() }),
        ...(filters.minLikes !== undefined && { minLikes: filters.minLikes.toString() }),
        ...(filters.minWatchlistCount !== undefined && { minWatchlistCount: filters.minWatchlistCount.toString() }),
        ...(includeFilters === false && { includeFilters: 'false' }),
      });

      const response = await fetch(`/api/marketplace/items?${params.toString()}`, {
        signal: abortController.signal
      });

      devLog.info('📡 [useMarketplaceItems] Response received:', response.status, response.ok);

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails += ` - ${errorData.error || errorData.message || 'Unknown error'}`;
        } catch (e) {
          // Could not parse error response
        }
        throw new Error(errorDetails);
      }

      const data: MarketplaceItemsResponse = await response.json();

      const itemsFromApi = Array.isArray(data.data?.items) ? data.data.items : [];
      devLog.info('📊 [useMarketplaceItems] API Response:', {
        success: data.success,
        itemsCount: itemsFromApi.length,
        pagination: data.data?.pagination,
        firstItem: itemsFromApi[0]
      });

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Only update if this request wasn't aborted
      if (!abortController.signal.aborted) {
        // Update state
        if (append) {
          const previousItems = itemsRef.current;

          // Deduplication: Filter out items that already exist (by listingId)
          const existingIds = new Set(previousItems.map(item => item.listingId).filter(Boolean));
          const newItems = itemsFromApi.filter((item: EnrichedNFTDocument) => {
            if (!item.listingId) return true; // Keep items without listingId
            return !existingIds.has(item.listingId); // Skip duplicates
          });

          const mergedItems = [...previousItems, ...newItems];
          setItems(mergedItems);
          itemsRef.current = mergedItems;

          // Persist appended pages in cache so back-navigation restores all loaded items.
          if (data.data) {
            cacheContext.setCache(filterKey, {
              ...data.data,
              items: mergedItems,
            });
          }
        } else {
          setItems(itemsFromApi);
          itemsRef.current = itemsFromApi;

          // Cache the result (only for page 1)
          if (pageNum === 1 && data.data && Array.isArray(data.data.items)) {
            cacheContext.setCache(filterKey, data.data);
          }
        }

        if (data.data?.pagination) {
          setPagination(data.data.pagination);
        } else {
          setPagination({
            page: pageNum,
            limit,
            total: itemsFromApi.length,
            totalPages: itemsFromApi.length > 0 ? 1 : 0,
            hasMore: false,
          });
        }
        setAvailableFilters(data.data?.filters || null);
        setInitialLoading(false);
        setLoading(false); // Set loading false immediately after setting data
      }
    } catch (err) {
      // Ignore abort errors (normal flow when filters change)
      if (err instanceof Error && err.name === 'AbortError') {
        devLog.info('⚠️ [useMarketplaceItems] Request aborted (normal)');
        // If this aborted request is still the active one, ensure UI is not left in loading state.
        if (abortControllerRef.current === abortController) {
          setLoading(false);
          setInitialLoading(false);
        }
        loadingRef.current = false; // Reset loading ref on abort
        return;
      }

      devLog.error('❌ [useMarketplaceItems] Fetch error:', err);

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items';
      setError(errorMessage);
      setInitialLoading(false);
      setLoading(false); // Set loading false on error too
    } finally {
      loadingRef.current = false;
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [
    limit,
    includeFilters,
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    filters.category,
    filters.tokenStandard,
    filters.rarity,
    filters.tags?.join(','),
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
    cacheContext,
    filterKey,
  ]);

  /**
   * Refetch list from first page.
   *
   * This avoids replacing accumulated infinite-scroll data with only the
   * current page slice when returning from background/tab switches.
   */
  const refetch = useCallback(async () => {
    setPage(1);
    await fetchItems(1, false);
  }, [fetchItems]);

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

  // Auto-fetch when filters change OR when cache is invalidated via SSE
  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    devLog.info('[useMarketplaceItems] useEffect triggered - fetching with stale-while-revalidate...');

    const cached = cacheContext.getCached(filterKey);

    // Keep current items visible until fresh payload arrives.
    // If we already have cache for this filter key, do not re-enter the initial loading state.
    setLoading(!cached);
    if (cached) {
      setInitialLoading(false);
      setItems(cached.data.items);
      setPagination(cached.data.pagination);
      setAvailableFilters(cached.data.filters || null);
    }

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset page when filters change
    setPage(1);

    // Call fetchItems directly (not via ref to avoid race condition)
    devLog.info('[useMarketplaceItems] Calling fetchItems...');
    fetchItems(1, false);

    // NO cleanup - let requests complete even if component unmounts or re-renders
    // This is safe because:
    // 1. loadingRef prevents duplicate requests
    // 2. AbortController is checked before setting state
    // 3. React Strict Mode won't abort our initial fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoFetch,
    cacheContext.refreshTrigger, // NEW: Refetch when SSE invalidates cache
    // fetchItems removed from dependencies to prevent infinite loop!
    // Stringify complex types for stable dependencies
    filters.search,
    filters.contractAddress,
    filters.minPrice,
    filters.maxPrice,
    filters.seller,
    filters.isListed,
    JSON.stringify(filters.category), // Handle arrays
    JSON.stringify(filters.tokenStandard), // Handle arrays
    JSON.stringify(filters.rarity),   // Handle arrays
    JSON.stringify(filters.tags),     // Handle arrays
    filters.minRating,
    filters.minViews,
    filters.minLikes,
    filters.minWatchlistCount,
    filters.sortBy,
    filters.sortOrder,
    filterKey,
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
interface UseMarketplaceCollectionsOptions {
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
 * useMarketplaceCollections - Wrapper around CollectionsContext
 * 
 * Provides backward-compatible API for CollectionsTableV2 component.
 * Now uses CollectionsContext instead of direct API calls for better
 * performance and caching.
 */
export function useMarketplaceCollections(options: UseMarketplaceCollectionsOptions = {}) {
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
        (() => {
          const floorPrice = parseFloorPrice(c.floorPrice);
          return floorPrice !== null && floorPrice >= minPrice;
        })()
      );
    }

    if (maxFloorPrice) {
      const maxPrice = parseFloat(maxFloorPrice);
      filtered = filtered.filter(c =>
        (() => {
          const floorPrice = parseFloorPrice(c.floorPrice);
          return floorPrice !== null && floorPrice <= maxPrice;
        })()
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
          aValue = parseFloorPrice(a.floorPrice) ?? Infinity;
          bValue = parseFloorPrice(b.floorPrice) ?? Infinity;
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

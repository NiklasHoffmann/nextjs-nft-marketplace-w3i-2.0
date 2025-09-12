import { useState, useEffect, useCallback } from 'react';
import {
    NFTInsights,
    CollectionInsights,
    CreateNFTInsightsRequest,
    UpdateNFTInsightsRequest,
    NFTInsightsResponse,
    CollectionInsightsResponse
} from '@/types/insights';

interface UseNFTInsightsOptions {
    contractAddress?: string;
    tokenId?: string;
    autoFetch?: boolean;
}

interface UseNFTInsightsReturn {
    insights: NFTInsights | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    create: (data: CreateNFTInsightsRequest) => Promise<NFTInsights>;
    update: (data: UpdateNFTInsightsRequest) => Promise<NFTInsights>;
    remove: (id: string) => Promise<void>;
}

// Hook for individual NFT insights
export function useNFTInsights(options: UseNFTInsightsOptions = {}): UseNFTInsightsReturn {
    const { contractAddress, tokenId, autoFetch = true } = options;

    const [insights, setInsights] = useState<NFTInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        if (!contractAddress || !tokenId) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                tokenId,
                limit: '1'
            });

            const response = await fetch(`/api/insights/nft?${params}`, {
                // Add cache headers for background refresh optimization
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const result: NFTInsightsResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch insights');
            }

            // Set the first result or null if no insights found
            setInsights(Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null);

        } catch (err) {
            console.error('Error fetching NFT insights:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setInsights(null);
        } finally {
            setLoading(false);
        }
    }, [contractAddress, tokenId]);

    const createInsights = useCallback(async (data: CreateNFTInsightsRequest): Promise<NFTInsights> => {
        try {
            // Optimistic update: immediately set loading state and optimistic data
            const optimisticInsights: NFTInsights = {
                _id: 'temp-' + Date.now().toString() as string,
                contractAddress: data.contractAddress.toLowerCase(),
                tokenId: data.tokenId,
                chainId: data.chainId,
                title: data.title,
                description: data.description,
                customName: data.customName,
                category: data.category,
                tags: data.tags || [],
                rarity: data.rarity,
                quality: data.quality,
                personalRating: data.personalRating,
                purchasePrice: data.purchasePrice,
                purchaseDate: data.purchaseDate,
                targetSellPrice: data.targetSellPrice,
                marketAnalysis: data.marketAnalysis,
                collectionInsights: data.collectionInsights,
                technicalMetrics: data.technicalMetrics,
                isWatchlisted: data.isWatchlisted || false,
                isFavorite: data.isFavorite || false,
                isForSale: data.isForSale || false,
                isPrivate: data.isPrivate || false,
                strategy: data.strategy,
                investmentGoal: data.investmentGoal,
                riskLevel: data.riskLevel,
                socialMetrics: data.socialMetrics,
                customFields: data.customFields,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: data.createdBy?.toLowerCase(),
                updatedBy: data.createdBy?.toLowerCase(),
                viewCount: 0,
                shareCount: 0
            };

            // Optimistically update the UI
            setInsights(optimisticInsights);
            console.log('✨ Optimistic update applied for insights creation');

            const response = await fetch('/api/insights/nft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result: NFTInsightsResponse = await response.json();

            if (!result.success) {
                // Rollback optimistic update on error
                setInsights(null);
                throw new Error(result.error || 'Failed to create insights');
            }

            const newInsights = result.data as NFTInsights;
            setInsights(newInsights); // Replace optimistic data with server data
            console.log('✅ Server confirmed insights creation');
            return newInsights;

        } catch (err) {
            console.error('Error creating NFT insights:', err);
            // Rollback optimistic update
            setInsights(null);
            throw err;
        }
    }, []);

    const updateInsights = useCallback(async (data: UpdateNFTInsightsRequest): Promise<NFTInsights> => {
        const previousInsights = insights; // Store current state for rollback
        
        try {
            if (previousInsights) {
                // Optimistic update: merge new data with existing insights
                const optimisticUpdatedInsights: NFTInsights = {
                    ...previousInsights,
                    ...data,
                    _id: previousInsights._id, // Keep the existing _id
                    updatedAt: new Date(),
                };
                
                // Optimistically update the UI
                setInsights(optimisticUpdatedInsights);
                console.log('✨ Optimistic update applied for insights update');
            }

            const response = await fetch('/api/insights/nft', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result: NFTInsightsResponse = await response.json();

            if (!result.success) {
                // Rollback optimistic update on error
                setInsights(previousInsights);
                throw new Error(result.error || 'Failed to update insights');
            }

            const updatedInsights = result.data as NFTInsights;
            setInsights(updatedInsights); // Replace optimistic data with server data
            console.log('✅ Server confirmed insights update');
            return updatedInsights;

        } catch (err) {
            console.error('Error updating NFT insights:', err);
            // Rollback optimistic update
            setInsights(previousInsights);
            throw err;
        }
    }, [insights]);

    const removeInsights = useCallback(async (id: string): Promise<void> => {
        try {
            const response = await fetch(`/api/insights/nft?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete insights');
            }

            setInsights(null);

        } catch (err) {
            console.error('Error deleting NFT insights:', err);
            throw err;
        }
    }, []);

    // Auto-fetch with background refresh
    useEffect(() => {
        if (autoFetch && contractAddress && tokenId) {
            fetchInsights();

            // Set up background refresh interval for critical insights data
            const intervalId = setInterval(() => {
                fetchInsights();
            }, 2 * 60 * 1000); // Every 2 minutes

            return () => clearInterval(intervalId);
        }
    }, [autoFetch, fetchInsights, contractAddress, tokenId]);

    return {
        insights,
        loading,
        error,
        refetch: fetchInsights,
        create: createInsights,
        update: updateInsights,
        remove: removeInsights
    };
}

// Hook for multiple NFT insights (with filters)
interface UseNFTInsightsListOptions {
    contractAddress?: string;
    category?: string;
    tags?: string[];
    isWatchlisted?: boolean;
    isFavorite?: boolean;
    createdBy?: string;
    limit?: number;
    autoFetch?: boolean;
}

interface UseNFTInsightsListReturn {
    insights: NFTInsights[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    hasMore: boolean;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
}

export function useNFTInsightsList(options: UseNFTInsightsListOptions = {}): UseNFTInsightsListReturn {
    const {
        contractAddress,
        category,
        tags,
        isWatchlisted,
        isFavorite,
        createdBy,
        limit = 20,
        autoFetch = true
    } = options;

    const [insights, setInsights] = useState<NFTInsights[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchInsights = useCallback(async (page: number = 1, append: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: ((page - 1) * limit).toString(),
                sortBy: 'updatedAt',
                sortOrder: 'desc'
            });

            if (contractAddress) params.append('contractAddress', contractAddress);
            if (category) params.append('category', category);
            if (tags && tags.length > 0) params.append('tags', tags.join(','));
            if (typeof isWatchlisted === 'boolean') params.append('isWatchlisted', isWatchlisted.toString());
            if (typeof isFavorite === 'boolean') params.append('isFavorite', isFavorite.toString());
            if (createdBy) params.append('createdBy', createdBy);

            const response = await fetch(`/api/insights/nft?${params}`);
            const result: NFTInsightsResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch insights');
            }

            const newInsights = Array.isArray(result.data) ? result.data : [];

            if (append) {
                setInsights(prev => [...prev, ...newInsights]);
            } else {
                setInsights(newInsights);
            }

            setTotalCount(result.totalPages ? result.totalPages * limit : newInsights.length);
            setHasMore(result.hasMore || false);
            setCurrentPage(page);

        } catch (err) {
            console.error('Error fetching NFT insights list:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            if (!append) {
                setInsights([]);
            }
        } finally {
            setLoading(false);
        }
    }, [contractAddress, category, tags, isWatchlisted, isFavorite, createdBy, limit]);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore) {
            await fetchInsights(currentPage + 1, true);
        }
    }, [loading, hasMore, currentPage, fetchInsights]);

    const refetch = useCallback(async () => {
        await fetchInsights(1, false);
    }, [fetchInsights]);

    useEffect(() => {
        if (autoFetch) {
            fetchInsights();
        }
    }, [autoFetch, fetchInsights]);

    return {
        insights,
        loading,
        error,
        totalCount,
        hasMore,
        refetch,
        loadMore
    };
}

// Hook for collection insights
interface UseCollectionInsightsOptions {
    contractAddress?: string;
    autoFetch?: boolean;
}

interface UseCollectionInsightsReturn {
    insights: CollectionInsights | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useCollectionInsights(options: UseCollectionInsightsOptions = {}): UseCollectionInsightsReturn {
    const { contractAddress, autoFetch = true } = options;

    const [insights, setInsights] = useState<CollectionInsights | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        if (!contractAddress) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                limit: '1'
            });

            const response = await fetch(`/api/insights/collection?${params}`);
            const result: CollectionInsightsResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch collection insights');
            }

            setInsights(Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null);

        } catch (err) {
            console.error('Error fetching collection insights:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setInsights(null);
        } finally {
            setLoading(false);
        }
    }, [contractAddress]);

    useEffect(() => {
        if (autoFetch && contractAddress) {
            fetchInsights();
        }
    }, [autoFetch, fetchInsights, contractAddress]);

    return {
        insights,
        loading,
        error,
        refetch: fetchInsights
    };
}
import { useState, useEffect, useCallback } from 'react';
import {
    AdminNFTInsight,
    AdminCollectionInsight
} from '@/types';

// Hook for reading NFT insights (public access)
// PURPOSE: Holt EINZELNE NFT-Insight-Daten fÃ¼r ein spezifisches NFT (contractAddress + tokenId)
// USE CASE: NFT-Detail-Seiten, wo du die Insights fÃ¼r genau ein NFT anzeigen willst
// FEATURES: Auto-refresh alle 2 Minuten, Background-Updates, einzelnes NFT
interface UseNFTInsightsOptions {
    contractAddress?: string;
    tokenId?: string;
    autoFetch?: boolean;
}

interface UseNFTInsightsReturn {
    insights: AdminNFTInsight | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useNFTInsights(options: UseNFTInsightsOptions = {}): UseNFTInsightsReturn {
    const { contractAddress, tokenId, autoFetch = true } = options;

    const [insights, setInsights] = useState<AdminNFTInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        // Allow empty tokenId for collection-wide insights
        if (!contractAddress) {

            return;
        }

        // tokenId can be empty string for collection-wide insights
        if (tokenId === undefined || tokenId === null) {

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                tokenId: tokenId || '', // Ensure empty string is passed for collection-wide
                limit: '1'
            });

            const response = await fetch(`/api/nft/insights?${params}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch insights');
            }

            // Set the first result or null if no insights found
            const insightsData = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;

            setInsights(insightsData);

        } catch (err) {
            console.error('âŒ Error fetching NFT insights:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setInsights(null);
        } finally {

            setLoading(false);
        }
    }, [contractAddress, tokenId]);

    // Auto-fetch with background refresh
    useEffect(() => {

        // Allow empty string tokenId for collection-wide insights
        if (autoFetch && contractAddress && tokenId !== undefined && tokenId !== null) {
            fetchInsights();

            // Set up background refresh interval for critical insights data
            const intervalId = setInterval(() => {
                fetchInsights();
            }, 2 * 60 * 1000); // Every 2 minutes

            return () => clearInterval(intervalId);
        }
        return undefined;
    }, [autoFetch, fetchInsights, contractAddress, tokenId]);

    return {
        insights,
        loading,
        error,
        refetch: fetchInsights
    };
}

// Hook for Admin NFT Insights CUD operations
// PURPOSE: Create, Update, Delete Operationen fÃ¼r NFT-Insights (Admin-only)
// USE CASE: Admin-Panel, wo Admins neue NFT-Insights erstellen/bearbeiten kÃ¶nnen
// FEATURES: Keine State-Verwaltung, nur API-Calls fÃ¼r CUD-Operationen
interface UseAdminNFTInsightsOptions {
    contractAddress?: string;
    tokenId?: string;
}

interface AdminNFTInsightCreateRequest {
    contractAddress: string;
    tokenId: string;
    title?: string;
    description?: string;
    descriptions?: string[];  // âœ¨ Neu: Array fÃ¼r mehrere Descriptions
    category?: string;
    tags?: string[];
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    partnerships?: string[];
    partnershipDetails?: string;
    createdBy: string;
}

interface AdminNFTInsightUpdateRequest extends Partial<AdminNFTInsightCreateRequest> {
    contractAddress: string;
    tokenId: string;
}

interface UseAdminNFTInsightsReturn {
    create: (data: AdminNFTInsightCreateRequest) => Promise<AdminNFTInsight>;
    update: (data: AdminNFTInsightUpdateRequest) => Promise<AdminNFTInsight>;
    remove: (contractAddress: string, tokenId: string) => Promise<void>;
}

export function useAdminNFTInsights(): UseAdminNFTInsightsReturn {
    const createInsights = useCallback(async (data: AdminNFTInsightCreateRequest): Promise<AdminNFTInsight> => {
        try {
            const response = await fetch('/api/nft/admin/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create insights');
            }

            return result.data as AdminNFTInsight;

        } catch (err) {
            console.error('Error creating NFT insights:', err);
            throw err;
        }
    }, []);

    const updateInsights = useCallback(async (data: AdminNFTInsightUpdateRequest): Promise<AdminNFTInsight> => {
        try {
            const response = await fetch('/api/nft/admin/insights', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to update insights');
            }

            return result.data as AdminNFTInsight;

        } catch (err) {
            console.error('Error updating NFT insights:', err);
            throw err;
        }
    }, []);

    const removeInsights = useCallback(async (contractAddress: string, tokenId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/nft/admin/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete insights');
            }

        } catch (err) {
            console.error('Error deleting NFT insights:', err);
            throw err;
        }
    }, []);

    return {
        create: createInsights,
        update: updateInsights,
        remove: removeInsights
    };
}

// Hook for multiple NFT insights (with filters)
// PURPOSE: Holt LISTE von NFT-Insights mit Filtern, Pagination, Search
// USE CASE: Overview-Seiten, NFT-Listen, Admin-Dashboards mit vielen NFTs
// FEATURES: Filtering, Pagination, Load-More, Sorting, Search-Funktionen
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
    insights: AdminNFTInsight[];
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

    const [insights, setInsights] = useState<AdminNFTInsight[]>([]);
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

            const response = await fetch(`/api/nft/insights?${params}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch insights');
            }

            const newInsights = Array.isArray(result.data) ? result.data as AdminNFTInsight[] : [];

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
// PURPOSE: Holt EINZELNE Collection-Insight-Daten fÃ¼r eine spezifische Collection (nur contractAddress)
// USE CASE: Collection-Detail-Seiten, wo du die Insights fÃ¼r eine ganze Collection anzeigen willst
// FEATURES: Einfacher Read-Only Hook fÃ¼r Collection-Level-Daten (Floor Price, Volume, etc.)
interface UseCollectionInsightsOptions {
    contractAddress?: string;
    autoFetch?: boolean;
}

interface UseCollectionInsightsReturn {
    insights: AdminCollectionInsight | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useCollectionInsights(options: UseCollectionInsightsOptions = {}): UseCollectionInsightsReturn {
    const { contractAddress, autoFetch = true } = options;

    const [insights, setInsights] = useState<AdminCollectionInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        if (!contractAddress) {

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                limit: '1'
            });

            const response = await fetch(`/api/nft/insights/collections?${params}`);

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch collection insights');
            }

            const insightsData = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] as AdminCollectionInsight : null;

            setInsights(insightsData);

        } catch (err) {
            console.error('âŒ useCollectionInsights: Error fetching collection insights:', err);
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

// Hook for Admin Collection Insights CUD operations
// PURPOSE: Create, Update, Delete Operationen fÃ¼r Collection-Insights (Admin-only)
// USE CASE: Admin-Panel, wo Admins Collection-Level-Insights verwalten kÃ¶nnen
// FEATURES: Keine State-Verwaltung, nur API-Calls fÃ¼r Collection CUD-Operationen
interface AdminCollectionInsightCreateRequest {
    contractAddress: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    partnerships?: string[];
    partnershipDetails?: string;
    createdBy: string;
}

interface AdminCollectionInsightUpdateRequest extends Partial<AdminCollectionInsightCreateRequest> {
    contractAddress: string;
}

interface UseAdminCollectionInsightsReturn {
    create: (data: AdminCollectionInsightCreateRequest) => Promise<AdminCollectionInsight>;
    update: (data: AdminCollectionInsightUpdateRequest) => Promise<AdminCollectionInsight>;
    remove: (contractAddress: string) => Promise<void>;
}

export function useAdminCollectionInsights(): UseAdminCollectionInsightsReturn {
    const createInsights = useCallback(async (data: AdminCollectionInsightCreateRequest): Promise<AdminCollectionInsight> => {
        try {
            const response = await fetch('/api/nft/admin/insights/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create collection insights');
            }

            return result.data as AdminCollectionInsight;

        } catch (err) {
            console.error('Error creating collection insights:', err);
            throw err;
        }
    }, []);

    const updateInsights = useCallback(async (data: AdminCollectionInsightUpdateRequest): Promise<AdminCollectionInsight> => {
        try {
            const response = await fetch('/api/nft/admin/insights/collections', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to update collection insights');
            }

            return result.data as AdminCollectionInsight;

        } catch (err) {
            console.error('Error updating collection insights:', err);
            throw err;
        }
    }, []);

    const removeInsights = useCallback(async (contractAddress: string): Promise<void> => {
        try {
            const response = await fetch(`/api/nft/admin/insights/collections?contractAddress=${contractAddress}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete collection insights');
            }

        } catch (err) {
            console.error('Error deleting collection insights:', err);
            throw err;
        }
    }, []);

    return {
        create: createInsights,
        update: updateInsights,
        remove: removeInsights
    };
}

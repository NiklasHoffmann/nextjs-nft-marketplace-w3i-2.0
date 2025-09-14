import { useState, useEffect, useCallback } from 'react';

interface NFTStats {
    contractAddress: string;
    tokenId: string;
    viewCount: number;
    favoriteCount: number;
    averageRating: number;
    ratingCount: number;
    watchlistCount: number;
    lastViewed?: string;
}

interface UseNFTStatsOptions {
    contractAddress?: string;
    tokenId?: string;
    autoFetch?: boolean;
    refetchInterval?: number;
}

interface UseNFTStatsReturn {
    stats: NFTStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    recordView: () => Promise<void>;
}

export function useNFTStats(options: UseNFTStatsOptions = {}): UseNFTStatsReturn {
    const {
        contractAddress,
        tokenId,
        autoFetch = true,
        refetchInterval
    } = options;

    const [stats, setStats] = useState<NFTStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch NFT stats
    const fetchStats = useCallback(async () => {
        if (!contractAddress || !tokenId) {
            setStats(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                contractAddress,
                tokenId
            });

            const response = await fetch(`/api/nft/stats?${params}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const result = await response.json();

            if (result.success && result.data) {
                setStats(result.data);
                console.log('✅ NFT stats loaded:', result.data);
            } else {
                setError(result.error || 'Failed to fetch NFT stats');
            }

        } catch (err) {
            console.error('❌ Error fetching NFT stats:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [contractAddress, tokenId]);

    // Record a view for this NFT
    const recordView = useCallback(async () => {
        if (!contractAddress || !tokenId) return;

        try {
            await fetch('/api/nft/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress,
                    tokenId,
                    userId: null // Could be enhanced with actual user ID
                }),
            });

            // Refetch stats after recording view
            setTimeout(() => {
                fetchStats();
            }, 500);

        } catch (err) {
            console.error('❌ Error recording view:', err);
        }
    }, [contractAddress, tokenId, fetchStats]);

    // Auto-fetch stats
    useEffect(() => {
        if (autoFetch && contractAddress && tokenId) {
            fetchStats();
        }
    }, [autoFetch, contractAddress, tokenId, fetchStats]);

    // Set up refetch interval if specified
    useEffect(() => {
        if (refetchInterval && contractAddress && tokenId) {
            const interval = setInterval(fetchStats, refetchInterval);
            return () => clearInterval(interval);
        }
    }, [refetchInterval, contractAddress, tokenId, fetchStats]);

    // Listen for user interaction changes to refresh stats
    useEffect(() => {
        if (!contractAddress || !tokenId) return;

        const handleStatsChange = (event: CustomEvent) => {
            const { contractAddress: eventContractAddress, tokenId: eventTokenId } = event.detail;
            if (eventContractAddress === contractAddress && eventTokenId === tokenId) {
                console.log('🔄 Refreshing NFT stats due to user interaction change');
                fetchStats();
            }
        };

        window.addEventListener('nftStatsChanged', handleStatsChange as EventListener);
        return () => {
            window.removeEventListener('nftStatsChanged', handleStatsChange as EventListener);
        };
    }, [contractAddress, tokenId, fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
        recordView
    };
}
/**
 * @deprecated Legacy Performance Hook - nur noch in Debug-Komponenten verwendet  
 * Hook ist ein Stub ohne echte Performance-Daten
 * Migration: Implementiere echte Performance-Überwachung oder entferne Abhängigkeiten
 */

/**
 * NFT Performance Hook - Echte Performance-Metriken aus NFTContext
 */

import { useModernNFTContext } from '@/contexts/NFTContext';
import { useMemo } from 'react';

export function useNFTPerformance() {
    const { getCacheStats } = useModernNFTContext();

    // Hole echte Cache-Statistiken
    const realCacheStats = useMemo(() => {
        try {
            return getCacheStats();
        } catch (error) {
            console.warn('useNFTPerformance: getCacheStats not available', error);
            return { total: 0, fresh: 0, expired: 0, memoryUsage: '0 KB' };
        }
    }, [getCacheStats]);

    // Berechne Hit-Rate aus fresh/total
    const hitRate = realCacheStats.total > 0
        ? Math.round((realCacheStats.fresh / realCacheStats.total) * 100)
        : 0;

    return {
        // Moderne Performance-Metriken
        count: realCacheStats.total,
        memoryUsage: realCacheStats.memoryUsage,
        averageResponseTime: 0, // TODO: Implement real response time tracking
        cacheHitRate: hitRate,
        totalRequests: 0, // TODO: Implement request tracking
        errorRate: 0, // TODO: Implement error tracking
        isLoading: false,
        error: null,

        // Legacy compatibility properties (mapped to real data)
        total: realCacheStats.total,
        fresh: realCacheStats.fresh,
        stale: realCacheStats.expired, // expired = stale
        loadingCount: 0 // TODO: Track loading states
    };
}
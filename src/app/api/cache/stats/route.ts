// app/api/cache/stats/route.ts
import { NextResponse } from 'next/server';
import { getCacheStats } from '@/utils/04-blockchain/smart-cache';

export async function GET() {
    try {
        const stats = getCacheStats();

        const response = {
            timestamp: new Date().toISOString(),
            ...stats,
            summary: {
                totalCachedContracts: stats.contractProperties.size,
                totalCachedTokens: stats.tokenMetadata.size,
                totalCachedOwnership: stats.ownership.size,
                totalCachedApprovals: stats.approval.size,
                totalMemoryUsage: (
                    (stats.contractProperties.calculatedSize || 0) +
                    (stats.tokenMetadata.calculatedSize || 0) +
                    (stats.ownership.calculatedSize || 0) +
                    (stats.approval.calculatedSize || 0)
                ) / (1024 * 1024), // Convert to MB
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return NextResponse.json(
            { error: 'Failed to get cache statistics' },
            { status: 500 }
        );
    }
}
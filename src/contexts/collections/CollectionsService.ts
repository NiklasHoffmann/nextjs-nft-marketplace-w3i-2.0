'use client';

/**
 * Collections Service
 *
 * Handles all API interactions for collection data.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils';

export interface Collection {
    contractAddress: string;
    contractName?: string;
    contractSymbol?: string;
    itemCount: number;
    floorPrice: string | null;
    floorPriceCurrency?: string | null;
    totalValue: number;
    displayTotalValue?: number;
    totalValueCurrency?: string | null;
    currencyTotals?: Array<{
        currency: string;
        totalValue: number;
    }>;
    averagePrice: number | null;
    imageUrl: string | null;
    previewImages: string[];
    insights?: {
        customTitle?: string;
        category?: string;
        tags?: string[];
        rarity?: string;
        description?: string;
        totalSupply?: number;
        blockchainTotalSupply?: number;
        hasInsights: boolean;
    };
    // Additional stats from marketplace_collections
    totalSupply?: number;
    totalSupplyUnits?: number;
    totalLikes?: number;
    totalViews?: number;
    totalWatchlist?: number;
    totalRatings?: number;
    averageRating?: number;
    uniqueOwners?: number;
    lastSyncedAt?: Date;
    erc721ItemCount?: number;
    erc1155ItemCount?: number;
    erc1155ListedUnits?: number;
    erc1155RemainingUnits?: number;
    partialBuyEnabledCount?: number;
}

export interface CollectionsApiResponse {
    success: boolean;
    data?: {
        collections: Collection[];
        count: number;
    };
    error?: string;
}

export class CollectionsService {
    /**
     * Fetch collections from API
     */
    static async fetchCollections(includeInsights = true): Promise<Collection[]> {
        devLog.info('🔵 [CollectionsService] ========== FETCHING COLLECTIONS ==========');
        devLog.info(`⏳ Step 1/2: Fetching from /api/collections...`);

        try {
            const startTime = Date.now();
            const response = await fetch(`/api/collections?includeInsights=${includeInsights}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data: CollectionsApiResponse = await response.json();
            const fetchTime = Date.now() - startTime;

            devLog.success(`Step 1/2 Complete: Fetched ${data.data?.count || 0} collections in ${fetchTime}ms`);
            devLog.info(`⏳ Step 2/2: Processing data...`);

            if (!data.success || !data.data || !Array.isArray(data.data.collections)) {
                throw new Error('Invalid API response format');
            }

            const processedCollections = data.data.collections as Collection[];

            const totalTime = Date.now() - startTime;
            devLog.success(`Step 2/2 Complete: Processed in ${totalTime - fetchTime}ms`);

            // Calculate statistics
            const withInsights = processedCollections.filter(c => c.insights?.hasInsights).length;
            const totalItems = processedCollections.reduce((sum, c) => sum + c.itemCount, 0);

            devLog.info('📊 [CollectionsService] ========== FINAL STATS ==========');
            devLog.info(`• Total Collections: ${processedCollections.length}`);
            devLog.info(`• Total Listed Items: ${totalItems}`);
            devLog.info(`• With Insights: ${withInsights}`);
            devLog.info(`• Total Processing Time: ${totalTime}ms`);
            devLog.info('========================================');

            return processedCollections;

        } catch (err) {
            devLog.error('[CollectionsService] Error fetching collections:', err);
            throw err;
        }
    }

    /**
     * Get collection by contract address
     */
    static getCollection(collections: Collection[], contractAddress: string): Collection | undefined {
        return collections.find(
            c => c.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
        );
    }

    /**
     * Get collection by symbol
     */
    static getBySymbol(collections: Collection[], symbol: string): Collection | undefined {
        return collections.find(
            c => c.contractSymbol?.toLowerCase() === symbol.toLowerCase()
        );
    }

    /**
     * Calculate collection statistics
     */
    static calculateStats(collections: Collection[]) {
        return {
            totalCollections: collections.length,
            totalListedItems: collections.reduce((sum, c) => sum + c.itemCount, 0),
            collectionsWithInsights: collections.filter(c => c.insights?.hasInsights).length
        };
    }
}
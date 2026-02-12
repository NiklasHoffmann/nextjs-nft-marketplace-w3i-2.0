'use client';

/**
 * Wallet NFTs Enricher Service
 *
 * Handles data enrichment logic for wallet NFTs.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils';
import type { ExternalNFT, WalletNFT } from './WalletNFTsService';

export class WalletNFTsEnricher {
    /**
     * Enrich external NFTs with marketplace data
     * @deprecated Use WalletNFTsService.enrichWithMarketplaceData instead
     */
    static async enrichWithMarketplaceData(nfts: ExternalNFT[]): Promise<WalletNFT[]> {
        return WalletNFTsService.enrichWithMarketplaceData(nfts);
    }

    /**
     * Fetch insights data for multiple contracts in parallel
     * @deprecated Use WalletNFTsService.fetchInsightsData instead
     */
    static async fetchInsightsData(nfts: ExternalNFT[]): Promise<Map<string, any>> {
        return WalletNFTsService.fetchInsightsData(nfts);
    }

    /**
     * Apply insights data to NFTs
     * @deprecated Use WalletNFTsService.applyInsights instead
     */
    static applyInsights(nfts: WalletNFT[], insightsLookup: Map<string, any>): WalletNFT[] {
        return WalletNFTsService.applyInsights(nfts, insightsLookup);
    }

    /**
     * Enrich NFTs with insights data from MongoDB
     * @deprecated Use WalletNFTsService methods instead
     */
    static async enrichWithInsights(nfts: WalletNFT[]): Promise<WalletNFT[]> {
        if (nfts.length === 0) return [];

        try {
            // Fetch insights for each unique contract address
            const uniqueContracts = [...new Set(nfts.map(n => n.contractAddress))];

            const insightsPromises = uniqueContracts.map(async (contractAddress) => {
                try {
                    const response = await fetch(`/api/nft/insights?contractAddress=${contractAddress}`);
                    const result = await response.json();

                    if (result.success && result.data) {
                        return { contractAddress, insights: result.data };
                    }
                } catch (error) {
                    devLog.warn(`Failed to fetch insights for ${contractAddress}`);
                }
                return { contractAddress, insights: [] };
            });

            const insightsResults = await Promise.all(insightsPromises);

            // Create lookup map
            const insightsLookup = new Map<string, any>();
            insightsResults.forEach(({ contractAddress, insights }) => {
                if (Array.isArray(insights)) {
                    insights.forEach(insight => {
                        const key = `${contractAddress.toLowerCase()}-${insight.tokenId || ''}`;
                        insightsLookup.set(key, insight);
                    });
                }
            });

            // Enrich NFTs with insights
            return nfts.map(nft => {
                const key = `${nft.contractAddress?.toLowerCase()}-${nft.tokenId}`;
                const keyWithoutToken = `${nft.contractAddress?.toLowerCase()}-`; // Collection-wide insights

                const specificInsights = insightsLookup.get(key);
                const collectionInsights = insightsLookup.get(keyWithoutToken);
                const insights = specificInsights || collectionInsights;

                if (insights) {
                    return {
                        ...nft,
                        category: insights.category,
                        rarity: insights.rarity,
                        insights: {
                            customTitle: insights.customTitle,
                            cardDescriptions: insights.cardDescriptions,
                            category: insights.category,
                            rarity: insights.rarity
                        },
                        hasInsightsData: true
                    };
                }

                return nft;
            });

        } catch (error) {
            devLog.error('Error enriching with insights:', error);
            return nfts;
        }
    }
}

// Import here to avoid circular dependency
import { WalletNFTsService } from './WalletNFTsService';
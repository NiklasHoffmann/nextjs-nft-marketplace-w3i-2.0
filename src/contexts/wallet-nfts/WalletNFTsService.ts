'use client';

/**
 * Wallet NFTs Service
 *
 * Handles all API interactions for wallet NFT data.
 * Separated from context to follow Single Responsibility Principle.
 */

import { devLog } from '@/utils/devLog';
import type { EnrichedNFTDocument } from '@/types/marketplace/enriched-nft';

// External NFT data from Alchemy/Moralis
export interface ExternalNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    image?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    contractName?: string;
    contractSymbol?: string;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string;
}

// Enriched wallet NFT with marketplace data
export interface WalletNFT extends ExternalNFT {
    // Marketplace enrichment
    isListed?: boolean;
    listingPrice?: string;
    listingId?: string;
    seller?: string;
    currency?: string; // Payment token address (ETH = 0x0, WETH/USDC/etc = token address)
    listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP';
    // Contract data from blockchain
    totalSupply?: number | null;
    owner?: string | null;
    tokenURI?: string | null;
    approved?: string | null;
    ownerBalance?: number | null;
    // Metadata enrichment from MongoDB
    category?: string;
    rarity?: string;
    insights?: {
        customTitle?: string;
        cardDescriptions?: string[];
        category?: string;
        rarity?: string;
    };
    // Stats from nft_stats collection
    stats?: {
        likeCount?: number;
        viewCount?: number;
        averageRating?: number;
        watchlistCount?: number;
        ratingCount?: number;
    };
    // Data quality flags
    hasMarketplaceData: boolean;
    hasInsightsData: boolean;
}

export class WalletNFTsService {
    /**
     * Fetch NFTs for the connected wallet from DB-first approach
     */
    static async fetchWalletNFTs(walletAddress: string): Promise<WalletNFT[]> {
        devLog.info('\n🔵 [WalletNFTsService] ========== START (DB-First) ==========');
        devLog.info(`📍 Wallet: ${walletAddress}`);

        // Step 1: Fast load from DB (instant)
        devLog.info('⚡ Step 1/2: Loading from database (instant)...');
        const dbResponse = await fetch(`/api/user/nfts?walletAddress=${walletAddress}`);

        if (dbResponse.ok) {
            const dbResult = await dbResponse.json();

            if (dbResult.success && dbResult.data.nfts && dbResult.data.nfts.length > 0) {
                devLog.success(`Step 1/2 Complete: ${dbResult.data.nfts.length} NFTs from database`);

                // Convert to WalletNFT format
                const walletNFTs: WalletNFT[] = dbResult.data.nfts.map((nft: any, index: number) => {
                    // DEBUG: Log first listed NFT
                    if (nft.isListed && index === 0) {
                        console.log('🔍 [WalletNFTsService] First listed NFT from API:', {
                            tokenId: nft.tokenId,
                            price: nft.price,
                            currency: nft.currency,
                            listingType: nft.listingType,
                            listingsPriceFromArray: nft.listings?.[0]?.price,
                            listingsCurrencyFromArray: nft.listings?.[0]?.currency
                        });
                    }
                    
                    return {
                        contractAddress: nft.contractAddress,
                        tokenId: nft.tokenId,
                        name: nft.metadata?.name,
                        description: nft.metadata?.description,
                        image: nft.metadata?.image,
                        animationUrl: nft.metadata?.animationUrl,
                        attributes: nft.metadata?.attributes,
                        contractName: nft.contract?.name,
                        contractSymbol: nft.contract?.symbol,
                        tokenType: nft.contract?.contractType || 'ERC721',
                        totalSupply: nft.contract?.totalSupply,
                        owner: nft.contract?.owner || nft.currentOwner,
                        tokenURI: nft.contract?.tokenURI,
                        approved: nft.contract?.approved,
                        ownerBalance: nft.contract?.ownerBalance,
                        isListed: nft.isListed || false,
                        // Use flattened fields from API (from $addFields), fallback to listings array
                        listingPrice: nft.price || nft.listings?.[0]?.price,
                        listingId: nft.listingId || nft.listings?.[0]?.listingId,
                        seller: nft.seller || nft.listings?.[0]?.seller,
                        currency: nft.currency || nft.listings?.[0]?.currency,
                        listingType: nft.listingType || nft.listings?.[0]?.listingType,
                        hasMarketplaceData: !!nft.listings?.length,
                        hasInsightsData: !!nft.insights,
                        insights: nft.insights,
                        // Stats from API response (loaded via $lookup in /api/user/nfts)
                        stats: nft.stats ? {
                            likeCount: nft.stats.likeCount,
                            viewCount: nft.stats.viewCount,
                            averageRating: nft.stats.averageRating,
                            watchlistCount: nft.stats.watchlistCount,
                            ratingCount: nft.stats.ratingCount
                        } : undefined
                    };
                });

                // DEBUG: Log first mapped listed NFT
                const firstMappedListed = walletNFTs.find(n => n.isListed);
                if (firstMappedListed) {
                    console.log('🔍 [WalletNFTsService] First mapped listed NFT:', {
                        tokenId: firstMappedListed.tokenId,
                        listingPrice: firstMappedListed.listingPrice,
                        currency: firstMappedListed.currency,
                        listingType: firstMappedListed.listingType
                    });
                }

                // Step 2: Background sync (verify ownership)
                devLog.info('🔄 Step 2/2: Background sync starting...');
                fetch(`/api/user/nfts/sync?userId=${walletAddress}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(res => res.json())
                    .then(syncResult => {
                        if (syncResult.success) {
                            const { new: newCount, transferred, updated } = syncResult.data;
                            devLog.success(`Background sync complete: ${newCount} new, ${transferred} transferred, ${updated} updated`);
                        }
                    })
                    .catch(err => devLog.warn('Background sync failed:', err));

                devLog.success('[WalletNFTsService] ========== SUCCESS (DB Cache) ==========\n');
                return walletNFTs;
            }
        }

        // Fallback: No DB data, fetch from Alchemy + save
        devLog.warn('No DB data found, falling back to full fetch...');
        devLog.info('⏳ Step 1/3: Fetching from /api/wallet/nfts...');
        const response = await fetch(`/api/wallet/nfts?address=${walletAddress}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch wallet NFTs: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch wallet NFTs');
        }

        const externalNFTs: ExternalNFT[] = result.data || [];
        devLog.success(`Step 1/3 Complete: ${externalNFTs.length} NFTs from ${result.source || 'external API'}`);

        if (externalNFTs.length === 0) {
            return [];
        }

        // Step 2: Parallel enrichment (marketplace + insights)
        devLog.info('⏳ Step 2/3: Enriching with marketplace + insights (parallel)...');
        const enrichStartTime = Date.now();

        const [marketplaceResult, insightsResult] = await Promise.allSettled([
            this.enrichWithMarketplaceData(externalNFTs),
            this.fetchInsightsData(externalNFTs)
        ]);

        // Merge marketplace data
        let enrichedNFTs: WalletNFT[] = [];
        if (marketplaceResult.status === 'fulfilled') {
            enrichedNFTs = marketplaceResult.value;
        } else {
            devLog.warn('Marketplace enrichment failed:', marketplaceResult.reason);
            enrichedNFTs = externalNFTs.map(nft => ({
                ...nft,
                hasMarketplaceData: false,
                hasInsightsData: false
            }));
        }

        // Merge insights data
        if (insightsResult.status === 'fulfilled') {
            enrichedNFTs = this.applyInsights(enrichedNFTs, insightsResult.value);
        } else {
            devLog.warn('Insights enrichment failed:', insightsResult.reason);
        }

        const enrichDuration = Date.now() - enrichStartTime;
        const listedCount = enrichedNFTs.filter(n => n.isListed).length;
        const insightsCount = enrichedNFTs.filter(n => n.category || n.rarity).length;
        devLog.success(`Step 2/3 Complete: ${listedCount} listed, ${insightsCount} with insights (${enrichDuration}ms)`);

        // Step 3: Save to DB + cache
        devLog.info('⏳ Step 3/3: Saving to DB and caching...');

        // Trigger sync to save to DB
        fetch(`/api/user/nfts/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
        }).catch(err => devLog.warn('Failed to save to DB:', err));

        const totalDuration = Date.now();
        devLog.success('Step 3/3 Complete: Data cached & saved to DB');
        devLog.info('\n📊 Final Stats:');
        devLog.info(`   • Total NFTs: ${enrichedNFTs.length}`);
        devLog.info(`   • Listed: ${enrichedNFTs.filter(n => n.isListed).length}`);
        devLog.info(`   • Unlisted: ${enrichedNFTs.filter(n => !n.isListed).length}`);
        devLog.info(`   • With Insights: ${enrichedNFTs.filter(n => n.category || n.rarity).length}`);
        devLog.info(`   • Total Time: ${totalDuration}ms`);
        devLog.success('[WalletNFTsService] ========== SUCCESS ==========\n');

        return enrichedNFTs;
    }

    /**
     * Enrich external NFTs with marketplace data
     */
    static async enrichWithMarketplaceData(nfts: ExternalNFT[]): Promise<WalletNFT[]> {
        if (nfts.length === 0) return [];

        try {
            // Fetch all marketplace items to check listing status
            const response = await fetch('/api/marketplace/items?limit=100');
            const result = await response.json();

            if (!result.success) {
                devLog.warn('Failed to fetch marketplace data for enrichment');
                return nfts.map(nft => ({ ...nft, hasMarketplaceData: false, hasInsightsData: false }));
            }

            const marketplaceItems: EnrichedNFTDocument[] = result.data.items || [];

            // Create lookup map
            const marketplaceLookup = new Map<string, EnrichedNFTDocument>();
            marketplaceItems.forEach(item => {
                if (!item.contractAddress) return; // Skip invalid items
                const key = `${item.contractAddress.toLowerCase()}-${item.tokenId}`;
                marketplaceLookup.set(key, item);
            });

            // Enrich NFTs
            return nfts.map(nft => {
                // Return default state if missing contractAddress
                if (!nft.contractAddress) {
                    return {
                        ...nft,
                        isListed: false,
                        hasMarketplaceData: false,
                        hasInsightsData: false
                    };
                }

                const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
                const marketplaceData = marketplaceLookup.get(key);

                if (marketplaceData?.marketplace?.isListed) {
                    return {
                        ...nft,
                        isListed: true,
                        listingPrice: marketplaceData.marketplace.price?.toString(),
                        listingId: marketplaceData.listingId || undefined,
                        seller: marketplaceData.marketplace.seller || undefined,
                        currency: marketplaceData.marketplace.currency || undefined,
                        listingType: marketplaceData.marketplace.listingType || undefined,
                        hasMarketplaceData: true,
                        hasInsightsData: false
                    };
                }

                return {
                    ...nft,
                    isListed: false,
                    hasMarketplaceData: false,
                    hasInsightsData: false
                };
            });

        } catch (error) {
            devLog.error('Error enriching with marketplace data:', error);
            return nfts.map(nft => ({ ...nft, hasMarketplaceData: false, hasInsightsData: false }));
        }
    }

    /**
     * Fetch insights data for multiple contracts in parallel
     */
    static async fetchInsightsData(nfts: ExternalNFT[]): Promise<Map<string, any>> {
        if (nfts.length === 0) return new Map();

        try {
            const uniqueContracts = [...new Set(nfts.map(n => n.contractAddress))];

            const insightsPromises = uniqueContracts.map(async (contractAddress) => {
                try {
                    const response = await fetch(`/api/nft/insights?contractAddress=${contractAddress}`);
                    if (!response.ok) return { contractAddress, insights: [] };

                    const result = await response.json();
                    return {
                        contractAddress,
                        insights: result.success && result.data ? result.data : []
                    };
                } catch (error) {
                    devLog.warn(`Failed to fetch insights for ${contractAddress}`);
                    return { contractAddress, insights: [] };
                }
            });

            const insightsResults = await Promise.allSettled(insightsPromises);

            // Build lookup map
            const insightsLookup = new Map<string, any>();
            insightsResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { contractAddress, insights } = result.value;
                    if (!contractAddress || !Array.isArray(insights)) return; // Skip invalid data
                    insights.forEach(insight => {
                        const key = `${contractAddress.toLowerCase()}-${insight.tokenId || ''}`;
                        insightsLookup.set(key, insight);
                    });
                }
            });

            return insightsLookup;
        } catch (error) {
            devLog.error('Error fetching insights data:', error);
            return new Map();
        }
    }

    /**
     * Apply insights data to NFTs
     */
    static applyInsights(nfts: WalletNFT[], insightsLookup: Map<string, any>): WalletNFT[] {
        return nfts.map(nft => {
            // Skip insights lookup if missing contractAddress
            if (!nft.contractAddress) {
                return {
                    ...nft,
                    hasInsightsData: false
                };
            }

            const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
            const keyWithoutToken = `${nft.contractAddress.toLowerCase()}-`; // Collection-wide

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
    }
}
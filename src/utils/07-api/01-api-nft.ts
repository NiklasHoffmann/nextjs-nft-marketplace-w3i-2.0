/**
 * NFT Context API Layer
 * 
 * Data fetching functions for the NFT context system.
 * Handles all external API calls with robust error handling and fallbacks.
 */

import type { NFTMetadata, AdminNFTInsight, NFTStats } from '@/types';

// ===== API RESPONSE TYPES =====

interface ContractInfo {
    name?: string;
    symbol?: string;
    owner?: string;
    ownerBalance?: string;
    totalSupply?: string;
    approvedAddress?: string;
}

interface MetadataApiResponse {
    metadata: NFTMetadata;
    imageUrl: string;
    animationUrl?: string;
    contractInfo?: ContractInfo;
    cached?: boolean;
}

interface InsightsApiResponse {
    success: boolean;
    data: AdminNFTInsight[];
}

interface StatsApiResponse {
    success: boolean;
    data: NFTStats | null;
}

// ===== METADATA API =====

/**
 * Fetches NFT metadata from API
 * @param contractAddress - The NFT contract address
 * @param tokenId - The NFT token ID
 * @returns Promise resolving to metadata and image URL
 */
export const fetchNFTMetadata = async (contractAddress: string, tokenId: string): Promise<MetadataApiResponse> => {
    const response = await fetch(`/api/nft/metadata?address=${contractAddress}&tokenId=${tokenId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch NFT metadata: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched NFT Metadata:', data);
    return data;
};

// ===== INSIGHTS API =====

/**
 * Fetches NFT insights with proper fallback handling
 * 
 * This function handles both NFT-specific and collection-wide insights:
 * 1. First tries to fetch NFT-specific insights (contractAddress + tokenId)
 * 2. If no specific insights found, looks for collection insights (contractAddress without tokenId)
 * 3. Returns fallback data if both fail
 * 
 * IMPORTANT: Collection insights must have no tokenId or empty tokenId to be considered collection-wide
 * 
 * @param contractAddress - The NFT contract address
 * @param tokenId - The NFT token ID
 * @returns Promise resolving to insight data or null
 */
export const fetchNFTInsights = async (contractAddress: string, tokenId: string): Promise<AdminNFTInsight | null> => {
    try {
        // 1. Try to fetch NFT-specific insights first (contractAddress + tokenId)
        const nftSpecificParams = new URLSearchParams({
            contractAddress,
            tokenId,
            limit: '1'
        });

        const nftResponse = await fetch(`/api/nft/insights?${nftSpecificParams}`);
        const nftResult: InsightsApiResponse = await nftResponse.json();

        if (nftResult.success && Array.isArray(nftResult.data) && nftResult.data.length > 0) {
            console.log(`✅ Found NFT-specific insight for ${contractAddress}/${tokenId}`);
            return nftResult.data[0];
        }

        // 2. Try to fetch collection-wide insights using the separate function
        console.log(`🔍 No NFT-specific insight found for ${contractAddress}/${tokenId}, trying collection-wide insights...`);
        const collectionInsight = await fetchCollectionInsights(contractAddress);

        if (collectionInsight) {
            console.log(`📋 Found collection-wide insight for ${contractAddress}, applying to token ${tokenId}`);
            // Adapt collection insight to specific NFT by adding tokenId
            return { ...collectionInsight, tokenId };
        }

        console.log(`❌ No insights found for ${contractAddress}/${tokenId} (neither NFT-specific nor collection-wide)`);
        return null;

    } catch (error) {
        // Return null instead of throwing errors for missing data
        console.warn(`❌ No insights found for NFT ${contractAddress}/${tokenId}:`, error);
        return null;
    }
};

/**
 * Fetches collection-wide insights (without specific tokenId)
 * Only returns documents that are truly collection-wide (no tokenId field or empty tokenId)
 * 
 * @param contractAddress - The NFT contract address
 * @returns Promise resolving to collection insight data or null
 */
export const fetchCollectionInsights = async (contractAddress: string): Promise<AdminNFTInsight | null> => {
    try {
        const params = new URLSearchParams({
            contractAddress,
            limit: '20' // Get more results to properly filter for collection-wide documents
        });

        const response = await fetch(`/api/nft/insights?${params}`);
        const result: InsightsApiResponse = await response.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            // Filter for documents that are truly collection-wide (no tokenId, empty string, or null)
            const collectionInsight = result.data.find(doc =>
                !doc.tokenId ||
                doc.tokenId === '' ||
                doc.tokenId === null ||
                doc.tokenId === undefined ||
                doc.tokenId.trim() === ''
            );

            if (collectionInsight) {
                console.log(`📋 Found true collection-wide insight for ${contractAddress} (no tokenId)`);
                return collectionInsight;
            } else {
                console.log(`⚠️ No collection-wide insight found for ${contractAddress}. Found ${result.data.length} NFT-specific documents only.`);
                // Log a sample to help debug
                if (result.data.length > 0) {
                    console.log(`📝 Sample document tokenIds:`, result.data.slice(0, 3).map(d => d.tokenId));
                }
            }
        }

        return null;
    } catch (error) {
        console.warn(`Failed to fetch collection insights for ${contractAddress}:`, error);
        return null;
    }
};

// ===== STATS API =====

/**
 * Fetches NFT stats from API
 * @param contractAddress - The NFT contract address
 * @param tokenId - The NFT token ID
 * @returns Promise resolving to stats data or null
 */
export const fetchNFTStats = async (contractAddress: string, tokenId: string): Promise<NFTStats | null> => {
    const params = new URLSearchParams({
        contractAddress,
        tokenId
    });

    const response = await fetch(`/api/nft/stats?${params}`);
    const result: StatsApiResponse = await response.json();

    if (!result.success) {
        return null;
    }

    return result.data || null;
};

// ===== BATCH API OPERATIONS =====

/**
 * Fetches data for multiple NFTs in parallel
 * @param nfts - Array of NFT identifiers
 * @returns Promise resolving to array of results
 */
export const fetchMultipleNFTs = async (nfts: Array<{ contractAddress: string; tokenId: string }>) => {
    const promises = nfts.map(async (nft) => {
        const [metadataResult, insightsResult, statsResult] = await Promise.allSettled([
            fetchNFTMetadata(nft.contractAddress, nft.tokenId),
            fetchNFTInsights(nft.contractAddress, nft.tokenId),
            fetchNFTStats(nft.contractAddress, nft.tokenId),
        ]);

        return {
            nft,
            metadata: metadataResult.status === 'fulfilled' ? metadataResult.value : null,
            insights: insightsResult.status === 'fulfilled' ? insightsResult.value : null,
            stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
            errors: {
                metadata: metadataResult.status === 'rejected' ? metadataResult.reason : null,
                insights: insightsResult.status === 'rejected' ? insightsResult.reason : null,
                stats: statsResult.status === 'rejected' ? statsResult.reason : null,
            }
        };
    });

    return Promise.all(promises);
};

// ===== API HEALTH CHECK =====

/**
 * Checks if the NFT APIs are available
 * @returns Promise resolving to health status
 */
export const checkAPIHealth = async (): Promise<{
    metadata: boolean;
    insights: boolean;
    stats: boolean;
}> => {
    const testContract = '0x0000000000000000000000000000000000000000';
    const testTokenId = '1';

    const [metadataTest, insightsTest, statsTest] = await Promise.allSettled([
        fetch(`/api/nft/metadata?address=${testContract}&tokenId=${testTokenId}`).then(r => r.ok),
        fetch(`/api/nft/insights?contractAddress=${testContract}&tokenId=${testTokenId}&limit=1`).then(r => r.ok),
        fetch(`/api/nft/stats?contractAddress=${testContract}&tokenId=${testTokenId}`).then(r => r.ok),
    ]);

    return {
        metadata: metadataTest.status === 'fulfilled' && metadataTest.value,
        insights: insightsTest.status === 'fulfilled' && insightsTest.value,
        stats: statsTest.status === 'fulfilled' && statsTest.value,
    };
};
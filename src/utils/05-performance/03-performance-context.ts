/**
 * NFT Context Utilities
 * 
 * Utility functions and helpers for the NFT context system.
 * Separated from main context for better organization and testability.
 */

import type { NFTData, NFTLoadingState, NFTErrorState, NFTCache } from '@/types/nft-context';

// ===== KEY GENERATION =====

/**
 * Creates a standardized cache key for NFT data
 * @param contractAddress - The NFT contract address
 * @param tokenId - The NFT token ID
 * @returns Standardized cache key in format "contractAddress:tokenId"
 */
export const createNFTKey = (contractAddress: string, tokenId: string): string => {
    if (!contractAddress || !tokenId) {
        console.warn('createNFTKey: Invalid parameters', { contractAddress, tokenId });
        return 'invalid:invalid';
    }
    return `${contractAddress.toLowerCase()}:${tokenId}`;
};

// ===== DATA FACTORY FUNCTIONS =====

/**
 * Creates empty NFT data structure with default values
 * @param nftAddress - The NFT contract address
 * @param tokenId - The NFT token ID
 * @returns Empty NFTData structure with all fields initialized
 */
export const createEmptyNFTData = (nftAddress: string, tokenId: string): NFTData => ({
    nftAddress,
    tokenId,
    metadata: null,
    imageUrl: null,
    animationUrl: null,
    isListed: false,
    price: null,
    seller: null,
    owner: null,
    listingId: null,
    insights: null,
    stats: null,
    contractInfo: null,
    loadingState: createEmptyLoadingState(),
    errorState: createEmptyErrorState(),
    lastUpdated: Date.now(),
    cacheKey: createNFTKey(nftAddress, tokenId)
});

/**
 * Creates empty loading state with all fields set to false
 * @returns Empty loading state
 */
export const createEmptyLoadingState = (): NFTLoadingState => ({
    metadata: false,
    insights: false,
    stats: false,
    contractInfo: false,
});

/**
 * Creates empty error state with all fields set to null
 * @returns Empty error state
 */
export const createEmptyErrorState = (): NFTErrorState => ({
    metadata: null,
    insights: null,
    stats: null,
    contractInfo: null,
});

/**
 * Creates standardized error message for NFT data loading failures
 * @param dataType - Type of data that failed to load
 * @param error - The error that occurred
 * @param nftAddress - NFT contract address (optional)
 * @param tokenId - NFT token ID (optional)
 * @returns Formatted error message
 */
export const createNFTErrorMessage = (
    dataType: 'metadata' | 'insights' | 'stats' | 'contractInfo',
    error: any,
    nftAddress?: string,
    tokenId?: string
): string => {
    const baseMessage = `Failed to load ${dataType}`;
    const identifier = nftAddress && tokenId ? ` for ${nftAddress}:${tokenId}` : '';
    const errorDetails = error?.message || String(error);
    
    return `${baseMessage}${identifier}: ${errorDetails}`;
};

// ===== CACHE UTILITIES =====

/**
 * Calculates cache statistics
 * @param cache - The NFT cache object
 * @returns Cache statistics including size, memory usage, and hit rate
 */
export const calculateCacheStats = (cache: NFTCache) => {
    const size = Object.keys(cache).length;
    const memoryUsage = `${Math.round(JSON.stringify(cache).length / 1024)} KB`;
    
    // Calculate hit rate based on fresh data
    const freshDataCount = Object.values(cache).filter(data => 
        isDataFresh(data)
    ).length;
    const hitRate = size > 0 ? freshDataCount / size : 0;
    
    return { size, memoryUsage, hitRate };
};

/**
 * Checks if NFT data is fresh (within specified time)
 * @param nftData - The NFT data to check
 * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns True if data is fresh, false otherwise
 */
export const isDataFresh = (nftData: NFTData | undefined, maxAgeMs: number = 5 * 60 * 1000): boolean => {
    if (!nftData?.lastUpdated) return false;
    return (Date.now() - nftData.lastUpdated) < maxAgeMs;
};

/**
 * Filters cache entries by age, keeping only fresh data
 * @param cache - The cache to filter
 * @param cutoffTime - Timestamp cutoff (entries older than this are removed)
 * @returns Filtered cache with only fresh entries
 */
export const filterCacheByAge = (cache: NFTCache, cutoffTime: number): NFTCache => {
    const filtered: NFTCache = {};
    
    Object.entries(cache).forEach(([key, data]) => {
        if (data.lastUpdated >= cutoffTime) {
            filtered[key] = data;
        }
    });
    
    return filtered;
};

// ===== BATCH PROCESSING UTILITIES =====

/**
 * Creates batches from an array for processing
 * @param items - Array of items to batch
 * @param batchSize - Size of each batch
 * @returns Array of batches
 */
export const createBatches = <T>(items: T[], batchSize: number): T[][] => {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
};

/**
 * Creates a delay promise for batch processing
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms));

// ===== VALIDATION UTILITIES =====

/**
 * Validates NFT identifier format
 * @param nftAddress - NFT contract address to validate
 * @param tokenId - NFT token ID to validate
 * @returns True if valid, false otherwise
 */
export const isValidNFTIdentifier = (nftAddress: string, tokenId: string): boolean => {
    // Check if address looks like an Ethereum address (0x + 40 hex chars)
    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!addressPattern.test(nftAddress)) return false;
    
    // Check if tokenId is a valid number or string
    if (!tokenId || tokenId.trim() === '') return false;
    
    return true;
};
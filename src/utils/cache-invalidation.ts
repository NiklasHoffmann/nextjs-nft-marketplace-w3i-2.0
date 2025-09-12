/**
 * Enhanced cache invalidation strategies for NFT marketplace data
 * Provides smart cache management based on data source and context
 */

import { QueryClient } from '@tanstack/react-query';

export interface CacheInvalidationConfig {
  // Blockchain events that trigger invalidation
  blockNumber?: bigint;
  contractAddress?: string;
  tokenId?: string;
  
  // User-specific triggers
  userAddress?: string;
  
  // Data type priorities
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Invalidation strategy
  strategy: 'immediate' | 'batched' | 'smart' | 'background';
}

export class CacheInvalidationManager {
  private queryClient: QueryClient;
  private invalidationQueue: Set<string> = new Set();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Smart cache invalidation based on blockchain state changes
   */
  invalidateOnBlockchainEvent(config: CacheInvalidationConfig): void {
    const { blockNumber, contractAddress, tokenId, strategy, priority } = config;
    
    if (!blockNumber || !contractAddress) return;
    
    // Critical data gets immediate invalidation
    if (priority === 'critical' || strategy === 'immediate') {
      this.executeInvalidation(contractAddress, tokenId);
      return;
    }
    
    // Smart invalidation based on block intervals
    if (strategy === 'smart') {
      this.smartBlockBasedInvalidation(blockNumber, contractAddress, tokenId);
      return;
    }
    
    // Batched invalidation for performance
    if (strategy === 'batched') {
      this.queueForBatchInvalidation(contractAddress, tokenId);
      return;
    }
    
    // Background invalidation (low priority)
    if (strategy === 'background') {
      setTimeout(() => this.executeInvalidation(contractAddress, tokenId), 5000);
    }
  }
  
  /**
   * Invalidate cache based on smart block-based rules
   */
  private smartBlockBasedInvalidation(
    blockNumber: bigint, 
    contractAddress: string, 
    tokenId?: string
  ): void {
    // NFT metadata: invalidate every 50 blocks (~10 minutes)
    if (blockNumber % 50n === 0n) {
      this.invalidateNFTMetadata(contractAddress, tokenId);
    }
    
    // Contract data: invalidate every 100 blocks (~20 minutes)
    if (blockNumber % 100n === 0n) {
      this.invalidateContractData(contractAddress);
    }
    
    // Market data: invalidate every 25 blocks (~5 minutes)
    if (blockNumber % 25n === 0n) {
      this.invalidateMarketData(contractAddress);
    }
    
    // Insights data: invalidate every 200 blocks (~40 minutes)
    if (blockNumber % 200n === 0n) {
      this.invalidateInsightsData(contractAddress, tokenId);
    }
  }
  
  /**
   * Execute immediate cache invalidation
   */
  private executeInvalidation(contractAddress: string, tokenId?: string): void {
    console.log(`🔄 Executing cache invalidation for ${contractAddress}${tokenId ? `:${tokenId}` : ''}`);
    
    // Invalidate all related queries
    this.invalidateNFTMetadata(contractAddress, tokenId);
    this.invalidateContractData(contractAddress);
    this.invalidateMarketData(contractAddress);
    this.invalidateInsightsData(contractAddress, tokenId);
  }
  
  /**
   * Queue items for batched invalidation
   */
  private queueForBatchInvalidation(contractAddress: string, tokenId?: string): void {
    const key = `${contractAddress}${tokenId ? `:${tokenId}` : ''}`;
    this.invalidationQueue.add(key);
    
    // Process batch after delay
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatchInvalidation();
    }, 2000); // 2 second batch delay
  }
  
  /**
   * Process all queued invalidations in batch
   */
  private processBatchInvalidation(): void {
    console.log(`🔄 Processing batch invalidation for ${this.invalidationQueue.size} items`);
    
    for (const item of this.invalidationQueue) {
      const [contractAddress, tokenId] = item.split(':');
      this.executeInvalidation(contractAddress, tokenId);
    }
    
    this.invalidationQueue.clear();
    this.batchTimeout = null;
  }
  
  /**
   * Invalidate NFT metadata cache
   */
  private invalidateNFTMetadata(contractAddress: string, tokenId?: string): void {
    if (tokenId) {
      this.queryClient.invalidateQueries({
        queryKey: ['nft-metadata', contractAddress, tokenId]
      });
    } else {
      this.queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === 'nft-metadata' && 
          query.queryKey[1] === contractAddress
      });
    }
  }
  
  /**
   * Invalidate contract data cache
   */
  private invalidateContractData(contractAddress: string): void {
    this.queryClient.invalidateQueries({
      predicate: (query) => 
        query.queryKey[0] === 'readContract' && 
        JSON.stringify(query.queryKey).includes(contractAddress)
    });
  }
  
  /**
   * Invalidate market/subgraph data cache
   */
  private invalidateMarketData(contractAddress: string): void {
    this.queryClient.invalidateQueries({
      predicate: (query) => 
        (query.queryKey.includes('items') || query.queryKey.includes('market')) &&
        JSON.stringify(query.queryKey).includes(contractAddress)
    });
  }
  
  /**
   * Invalidate insights data cache
   */
  private invalidateInsightsData(contractAddress: string, tokenId?: string): void {
    if (tokenId) {
      this.queryClient.invalidateQueries({
        queryKey: ['nft-insights', contractAddress, tokenId]
      });
    } else {
      this.queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === 'nft-insights' && 
          query.queryKey[1] === contractAddress
      });
    }
  }
  
  /**
   * Manual cache refresh for specific data types
   */
  manualRefresh = {
    nftData: (contractAddress: string, tokenId: string) => {
      this.executeInvalidation(contractAddress, tokenId);
    },
    
    contractData: (contractAddress: string) => {
      this.invalidateContractData(contractAddress);
    },
    
    marketData: (contractAddress?: string) => {
      if (contractAddress) {
        this.invalidateMarketData(contractAddress);
      } else {
        // Refresh all market data
        this.queryClient.invalidateQueries({
          predicate: (query) => 
            query.queryKey.includes('items') || 
            query.queryKey.includes('market') ||
            query.queryKey.includes('active')
        });
      }
    },
    
    insightsData: (contractAddress?: string, tokenId?: string) => {
      if (contractAddress && tokenId) {
        this.invalidateInsightsData(contractAddress, tokenId);
      } else {
        // Refresh all insights
        this.queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'nft-insights'
        });
      }
    }
  };
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      queuedInvalidations: this.invalidationQueue.size
    };
  }
  
  /**
   * Emergency cache clear (use with caution)
   */
  emergencyCacheClear(): void {
    console.warn('🚨 Emergency cache clear initiated');
    this.queryClient.clear();
    this.invalidationQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Singleton instance
let cacheManager: CacheInvalidationManager | null = null;

export function createCacheInvalidationManager(queryClient: QueryClient): CacheInvalidationManager {
  if (!cacheManager) {
    cacheManager = new CacheInvalidationManager(queryClient);
  }
  return cacheManager;
}

export function getCacheInvalidationManager(): CacheInvalidationManager | null {
  return cacheManager;
}

// Helper functions for common invalidation scenarios
export const cacheInvalidationHelpers = {
  onNFTTransfer: (contractAddress: string, tokenId: string, queryClient: QueryClient) => {
    const manager = new CacheInvalidationManager(queryClient);
    manager.invalidateOnBlockchainEvent({
      contractAddress,
      tokenId,
      priority: 'critical',
      strategy: 'immediate'
    });
  },
  
  onPriceUpdate: (contractAddress: string, tokenId: string, queryClient: QueryClient) => {
    const manager = new CacheInvalidationManager(queryClient);
    manager.invalidateOnBlockchainEvent({
      contractAddress,
      tokenId,
      priority: 'high',
      strategy: 'immediate'
    });
  },
  
  onBlockMined: (blockNumber: bigint, queryClient: QueryClient) => {
    const manager = new CacheInvalidationManager(queryClient);
    manager.invalidateOnBlockchainEvent({
      blockNumber,
      priority: 'medium',
      strategy: 'smart'
    });
  }
};
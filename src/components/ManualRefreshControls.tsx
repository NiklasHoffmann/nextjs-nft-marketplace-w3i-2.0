"use client";

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createCacheInvalidationManager } from '@/utils/cache-invalidation';

interface ManualRefreshControlsProps {
  contractAddress?: string;
  tokenId?: string;
  showCacheStats?: boolean;
  className?: string;
}

export default function ManualRefreshControls({
  contractAddress,
  tokenId,
  showCacheStats = false,
  className = ""
}: ManualRefreshControlsProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const cacheManager = createCacheInvalidationManager(queryClient);

  const handleRefresh = async (type: string) => {
    setIsRefreshing(type);
    
    try {
      switch (type) {
        case 'nft':
          if (contractAddress && tokenId) {
            cacheManager.manualRefresh.nftData(contractAddress, tokenId);
          }
          break;
          
        case 'contract':
          if (contractAddress) {
            cacheManager.manualRefresh.contractData(contractAddress);
          }
          break;
          
        case 'market':
          cacheManager.manualRefresh.marketData(contractAddress);
          break;
          
        case 'insights':
          cacheManager.manualRefresh.insightsData(contractAddress, tokenId);
          break;
          
        case 'all':
          if (contractAddress && tokenId) {
            cacheManager.manualRefresh.nftData(contractAddress, tokenId);
          }
          cacheManager.manualRefresh.marketData(contractAddress);
          cacheManager.manualRefresh.insightsData(contractAddress, tokenId);
          break;
      }
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Failed to refresh ${type}:`, error);
    } finally {
      setIsRefreshing(null);
    }
  };

  const updateCacheStats = () => {
    setCacheStats(cacheManager.getCacheStats());
  };

  const handleEmergencyReset = () => {
    if (confirm('⚠️ This will clear all cached data. Are you sure?')) {
      cacheManager.emergencyCacheClear();
      setCacheStats(null);
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-700">Manual Refresh Controls</h3>
        {showCacheStats && (
          <button
            onClick={updateCacheStats}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Show Cache Stats
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => handleRefresh('nft')}
          disabled={isRefreshing !== null || (!contractAddress || !tokenId)}
          className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {isRefreshing === 'nft' ? '⟳' : '🎨'} NFT Data
        </button>
        
        <button
          onClick={() => handleRefresh('contract')}
          disabled={isRefreshing !== null || !contractAddress}
          className="px-3 py-2 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {isRefreshing === 'contract' ? '⟳' : '📝'} Contract
        </button>
        
        <button
          onClick={() => handleRefresh('market')}
          disabled={isRefreshing !== null}
          className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {isRefreshing === 'market' ? '⟳' : '📊'} Market
        </button>
        
        <button
          onClick={() => handleRefresh('insights')}
          disabled={isRefreshing !== null}
          className="px-3 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {isRefreshing === 'insights' ? '⟳' : '💡'} Insights
        </button>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => handleRefresh('all')}
          disabled={isRefreshing !== null}
          className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md transition-colors font-medium"
        >
          {isRefreshing === 'all' ? '⟳ Refreshing...' : '🔄 Refresh All'}
        </button>
        
        <button
          onClick={handleEmergencyReset}
          disabled={isRefreshing !== null}
          className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
          title="Emergency cache clear"
        >
          🚨
        </button>
      </div>
      
      {cacheStats && (
        <div className="mt-3 p-3 bg-white rounded border text-xs">
          <h4 className="font-medium mb-2">Cache Statistics</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>Total Queries: <span className="font-mono">{cacheStats.totalQueries}</span></div>
            <div>Stale Queries: <span className="font-mono text-orange-600">{cacheStats.staleQueries}</span></div>
            <div>Fetching: <span className="font-mono text-blue-600">{cacheStats.fetchingQueries}</span></div>
            <div>Queued: <span className="font-mono text-purple-600">{cacheStats.queuedInvalidations}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
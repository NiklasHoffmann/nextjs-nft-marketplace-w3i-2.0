"use client";

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReadContract, useBlockNumber } from 'wagmi';
import { erc721Abi } from 'viem';
import { useEffect } from 'react';
import { createCacheInvalidationManager } from '@/utils/cache-invalidation';

/**
 * Simplified and unified NFT data hook
 * Replaces: useNFTMetadata, useNFTMetadataOptimized, useNFTDetailLogic metadata logic
 */

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  [key: string]: any;
}

interface NFTData {
  // Metadata
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  
  // Contract Info (only essential)
  contractName: string | null;
  contractSymbol: string | null;
  owner: string | null;
  
  // Status
  loading: boolean;
  error: string | null;
  
  // Quick Access
  name: string | null;
  description: string | null;
  attributes: NFTMetadata['attributes'];
  
  // Manual refresh capabilities
  refetchMetadata: () => Promise<any>;
  refetchAll: () => Promise<void>;
}

// Unified metadata fetcher
async function fetchNFTMetadata(address: string, tokenId: string): Promise<{
  metadata: NFTMetadata | null;
  imageUrl: string | null;
}> {
  try {
    const response = await fetch(`/api/nft-metadata?address=${address}&tokenId=${tokenId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      metadata: data.metadata,
      imageUrl: data.imageUrl
    };
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    return { metadata: null, imageUrl: null };
  }
}

export function useNFT(address: string, tokenId: string): NFTData {
  const queryClient = useQueryClient();

  // Contract calls (only essential ones)
  const contractArgs = useMemo(() => {
    try {
      return address && tokenId ? [BigInt(tokenId)] as const : undefined;
    } catch {
      return undefined;
    }
  }, [address, tokenId]);

  // Blockchain state monitoring
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    query: { refetchInterval: 12000 } // Every 12 seconds (typical Ethereum block time)
  });

  // Essential contract data
  const { data: contractName, isLoading: nameLoading } = useReadContract({
    address: address as `0x${string}`,
    abi: erc721Abi,
    functionName: 'name',
    query: { enabled: !!address }
  });

  const { data: contractSymbol, isLoading: symbolLoading } = useReadContract({
    address: address as `0x${string}`,
    abi: erc721Abi,
    functionName: 'symbol',
    query: { enabled: !!address }
  });

  const { data: owner, isLoading: ownerLoading } = useReadContract({
    address: address as `0x${string}`,
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: contractArgs,
    query: { enabled: !!contractArgs }
  });

  // Metadata with React Query and smart cache invalidation
  const {
    data: metadataData,
    isLoading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata
  } = useQuery({
    queryKey: ['nft-metadata', address, tokenId],
    queryFn: () => fetchNFTMetadata(address, tokenId),
    enabled: !!address && !!tokenId,
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 60 * 60 * 1000, // 60 min
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  });

  // Enhanced smart cache invalidation using CacheInvalidationManager
  useEffect(() => {
    if (blockNumber && address && tokenId) {
      const cacheManager = createCacheInvalidationManager(queryClient);
      
      cacheManager.invalidateOnBlockchainEvent({
        blockNumber,
        contractAddress: address,
        tokenId,
        priority: 'medium',
        strategy: 'smart'
      });
    }
  }, [blockNumber, address, tokenId, queryClient]);

  // Combined loading state
  const loading = nameLoading || symbolLoading || ownerLoading || metadataLoading;

  // Combined error state
  const error = metadataError?.message || null;

  // Manual refresh function for all data
  const refetchAll = async () => {
    await Promise.allSettled([
      refetchMetadata(),
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === 'readContract' && 
          JSON.stringify(query.queryKey).includes(address)
      })
    ]);
  };

  return useMemo(() => ({
    // Metadata
    metadata: metadataData?.metadata || null,
    imageUrl: metadataData?.imageUrl || null,
    
    // Contract Info
    contractName: contractName ? String(contractName) : null,
    contractSymbol: contractSymbol ? String(contractSymbol) : null,
    owner: owner ? String(owner) : null,
    
    // Status
    loading,
    error,
    
    // Quick Access
    name: metadataData?.metadata?.name || null,
    description: metadataData?.metadata?.description || null,
    attributes: metadataData?.metadata?.attributes || [],
    
    // Manual refresh capabilities
    refetchMetadata,
    refetchAll,
  }), [
    metadataData,
    contractName,
    contractSymbol, 
    owner,
    loading,
    error,
    refetchMetadata,
    refetchAll
  ]);
}
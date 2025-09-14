"use client";

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReadContract, useBlockNumber } from 'wagmi';
import { erc721Abi } from 'viem';
import { useEffect } from 'react';
import { createCacheInvalidationManager } from '@/utils/cache-invalidation';

// Hook for fetching and managing NFT data
// PURPOSE: Simplified and unified NFT data hook
// USE CASE: Displaying NFT details across the app
// PARAMETERS: contract address, token ID
// FEATURES: Metadata fetching, essential contract data, loading/error states, manual refresh
// RETURNS: Metadata, Contract Info (name, symbol, owner, totalSupply), Loading/Error states, Quick access properties, Manual refresh functions
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
  totalSupply: string | null;

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

// Fetch NFT metadata from backend API
// PURPOSE: Fetches metadata from a backend API endpoint
// USE CASE: Used internally by useNFT hook
// FEATURES: Error handling, returns structured metadata and image URL
// RETURNS: Metadata, Image URL
async function fetchNFTMetadata(address: string, tokenId: string): Promise<{
  metadata: NFTMetadata | null;
  imageUrl: string | null;
}> {
  try {
    const response = await fetch(`/api/nft/metadata?address=${address}&tokenId=${tokenId}`);

    // Handle 404 gracefully - token may not exist or have metadata
    if (response.status === 404) {
      console.warn(`NFT metadata not found for ${address}:${tokenId}`);
      return { metadata: null, imageUrl: null };
    }

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

// Main hook
// PURPOSE: Simplified and unified NFT data hook
// USE CASE: Displaying NFT details across the app
// FEATURES: Metadata fetching, essential contract data, loading/error states, manual refresh
// RETURNS: Metadata, Contract Info (name, symbol, owner, totalSupply), Loading/Error states, Quick access properties, Manual refresh functions
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

  const { data: totalSupply } = useReadContract({
    address: address as `0x${string}`,
    abi: erc721Abi,
    functionName: 'totalSupply',
    query: { enabled: !!address }
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
    totalSupply: totalSupply ? String(totalSupply) : null,

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
    totalSupply,
    loading,
    error,
    refetchMetadata,
    refetchAll
  ]);
}
/**
 * Marketplace Data Reading Hook
 * Handles: All view/read functions for marketplace data
 * All functions here are read-only and do not modify state
 * Use with caution: heavy queries may impact performance
 * Consider using pagination or batching for large datasets
 * All functions: getListingById, isBuyerWhitelisted, isCollectionWhitelisted,
 * getInnovationFee, getNextListingId, getContractOwner, getWhitelistedCollections
 * 
 */
"use client";

import { useReadContract, useReadContracts } from 'wagmi';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';

export function useMarketplaceData(marketplaceAddress: string) {

  // Single listing by ID
  const useListingById = (listingId: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: GETTER_FACET_ABI,
      functionName: 'getListingByListingId',
      args: [BigInt(listingId)],
      query: {
        enabled: !!listingId && listingId !== "0"
      }
    });
  };

  // Check if buyer is whitelisted for a listing
  const useBuyerWhitelist = (listingId: string, buyerAddress: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: GETTER_FACET_ABI,
      functionName: 'isBuyerWhitelisted',
      args: [BigInt(listingId), buyerAddress as `0x${string}`],
      query: {
        enabled: !!listingId && !!buyerAddress
      }
    });
  };

  // Check if collection is whitelisted
  const useCollectionWhitelist = (collectionAddress: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: GETTER_FACET_ABI,
      functionName: 'isCollectionWhitelisted',
      args: [collectionAddress as `0x${string}`],
      query: {
        enabled: !!collectionAddress
      }
    });
  };

  // Marketplace metadata
  const useMarketplaceInfo = () => {
    return useReadContracts({
      contracts: [
        {
          address: marketplaceAddress as `0x${string}`,
          abi: GETTER_FACET_ABI,
          functionName: 'getInnovationFee'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: GETTER_FACET_ABI,
          functionName: 'getNextListingId'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: GETTER_FACET_ABI,
          functionName: 'getContractOwner'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: GETTER_FACET_ABI,
          functionName: 'getWhitelistedCollections'
        }
      ]
    });
  };

  // Helper to get marketplace fee percentage
  const getMarketplaceFeePercentage = (feeRate: number): number => {
    // Fee rate is per 100000 (e.g., 1000 = 1.00%)
    return feeRate / 1000;
  };

  // Helper to calculate total cost including fees
  const calculateTotalCost = (price: bigint, feeRate: number): bigint => {
    const feeAmount = (price * BigInt(feeRate)) / BigInt(100000);
    return price + feeAmount;
  };

  return {
    useListingById,
    useBuyerWhitelist,
    useCollectionWhitelist,
    useMarketplaceInfo,
    // Helper functions
    getMarketplaceFeePercentage,
    calculateTotalCost
  };
}

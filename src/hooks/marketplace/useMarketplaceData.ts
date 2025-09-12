/**
 * Marketplace Data Reading Hook
 * Handles: All view/read functions for marketplace data
 * All functions here are read-only and do not modify state
 * Use with caution: heavy queries may impact performance
 * Consider using pagination or batching for large datasets
 * All functions: getListingById, getListingsByNFT, isBuyerWhitelisted, isCollectionWhitelisted,
 * getInnovationFee, getNextListingId, getContractOwner, getWhitelistedCollections
 * 
 */
"use client";

import { useReadContract, useReadContracts } from 'wagmi';
import marketplaceAbi from '@/constants/marketplace.abi.json';

export function useMarketplaceData(marketplaceAddress: string) {

  // Single listing by ID
  const useListingById = (listingId: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: marketplaceAbi,
      functionName: 'getListingByListingId',
      args: [BigInt(listingId)],
      query: {
        enabled: !!listingId && listingId !== "0"
      }
    });
  };

  // All listings for a specific NFT
  const useListingsByNFT = (tokenAddress: string, tokenId: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: marketplaceAbi,
      functionName: 'getListingsByNFT',
      args: [tokenAddress as `0x${string}`, BigInt(tokenId)],
      query: {
        enabled: !!tokenAddress && !!tokenId
      }
    });
  };

  // Check if buyer is whitelisted for a listing
  const useBuyerWhitelist = (listingId: string, buyerAddress: string) => {
    return useReadContract({
      address: marketplaceAddress as `0x${string}`,
      abi: marketplaceAbi,
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
      abi: marketplaceAbi,
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
          abi: marketplaceAbi,
          functionName: 'getInnovationFee'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: marketplaceAbi,
          functionName: 'getNextListingId'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: marketplaceAbi,
          functionName: 'getContractOwner'
        },
        {
          address: marketplaceAddress as `0x${string}`,
          abi: marketplaceAbi,
          functionName: 'getWhitelistedCollections'
        }
      ]
    });
  };

  // Helper to get marketplace fee percentage
  const getMarketplaceFeePercentage = (feeRate: number): number => {
    // Assuming feeRate is in basis points (e.g., 250 = 2.5%)
    return feeRate / 100;
  };

  // Helper to calculate total cost including fees
  const calculateTotalCost = (price: bigint, feeRate: number): bigint => {
    const feeAmount = (price * BigInt(feeRate)) / BigInt(10000);
    return price + feeAmount;
  };

  return {
    useListingById,
    useListingsByNFT,
    useBuyerWhitelist,
    useCollectionWhitelist,
    useMarketplaceInfo,
    // Helper functions
    getMarketplaceFeePercentage,
    calculateTotalCost
  };
}
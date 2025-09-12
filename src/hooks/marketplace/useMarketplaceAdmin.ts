/**
 * Marketplace Admin Operations Hook
 * Handles: Admin functions like fee management, whitelisting
 * Only callable by contract owner/admin
 * All functions: setInnovationFee, addWhitelistedCollection, removeWhitelistedCollection,
 * batchAddWhitelistedCollections, cleanListing, addBuyerWhitelistAddresses,
 * removeBuyerWhitelistAddresses
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import marketplaceAbi from '@/constants/marketplace.abi.json';

export function useMarketplaceAdmin(marketplaceAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Write contract hooks
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });


  // Set marketplace innovation fee (admin only)
  const setInnovationFee = async (newFeeInBasisPoints: number) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'setInnovationFee',
        args: [newFeeInBasisPoints] // e.g., 250 = 2.5%
      });
    } catch (err: any) {
      setError(err.message || 'Failed to set innovation fee');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add collection to whitelist (admin only)
  const addWhitelistedCollection = async (collectionAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'addWhitelistedCollection',
        args: [collectionAddress as `0x${string}`]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add whitelisted collection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove collection from whitelist (admin only)
  const removeWhitelistedCollection = async (collectionAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'removeWhitelistedCollection',
        args: [collectionAddress as `0x${string}`]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to remove whitelisted collection');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Batch add collections to whitelist (admin only)
  const batchAddWhitelistedCollections = async (collectionAddresses: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'batchAddWhitelistedCollections',
        args: [collectionAddresses as `0x${string}`[]]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to batch add whitelisted collections');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clean invalid listing (admin/anyone can call)
  const cleanListing = async (listingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'cleanListing',
        args: [BigInt(listingId)]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to clean listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Manage buyer whitelist for specific listing
  const addBuyerWhitelistAddresses = async (listingId: string, buyerAddresses: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'addBuyerWhitelistAddresses',
        args: [BigInt(listingId), buyerAddresses as `0x${string}`[]]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add buyer whitelist addresses');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeBuyerWhitelistAddresses = async (listingId: string, buyerAddresses: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'removeBuyerWhitelistAddresses',
        args: [BigInt(listingId), buyerAddresses as `0x${string}`[]]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to remove buyer whitelist addresses');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Listing maintenance (available to anyone)
    cleanListing,

    // Listing-specific admin
    addBuyerWhitelistAddresses,
    removeBuyerWhitelistAddresses,

    // Global admin functions
    setInnovationFee,
    addWhitelistedCollection,
    removeWhitelistedCollection,
    batchAddWhitelistedCollections,

    // State
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    txHash
  };
}
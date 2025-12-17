/**
 * Marketplace Admin Operations Hook
 * Handles: Admin functions like fee management, whitelisting
 * Only callable by contract owner/admin
 * All functions: setInnovationFee, addWhitelistedCollection, removeWhitelistedCollection,
 * batchAddWhitelistedCollections, cleanListing, addBuyerWhitelistAddresses,
 * removeBuyerWhitelistAddresses
 */
"use client";

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNotifications } from '@/contexts/notifications';
import marketplaceAbi from '@/constants/marketplace.abi.json';

export function useMarketplaceAdmin(marketplaceAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [loadingNotifId, setLoadingNotifId] = useState<string | null>(null);
  const notifications = useNotifications();

  // Write contract hooks
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    timeout: 60000, // 60 seconds timeout
    pollingInterval: 2000, // Check every 2 seconds
  });

  // Handle success
  useEffect(() => {
    if (isSuccess && txHash && currentOperation && loadingNotifId) {
      console.log('✅ [Admin] Transaction confirmed:', {
        operation: currentOperation,
        txHash,
      });
      
      notifications.clearAll();
      notifications.success(
        'Transaction Successful!',
        `${currentOperation} completed successfully`,
        {
          txHash,
          duration: 8000
        }
      );
      
      setCurrentOperation(null);
      setLoadingNotifId(null);
    }
  }, [isSuccess, txHash, currentOperation, loadingNotifId, notifications]);


  // Set marketplace innovation fee (admin only)
  const setInnovationFee = async (newFeeInBasisPoints: number) => {
    console.log('🔧 [Admin] Setting innovation fee:', {
      marketplace: marketplaceAddress,
      newFee: newFeeInBasisPoints,
      percentage: newFeeInBasisPoints / 100
    });
    
    const notifId = notifications.loading(
      'Setting Innovation Fee',
      `Updating fee to ${newFeeInBasisPoints / 100}%...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation('Innovation Fee Update');

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'setInnovationFee',
        args: [newFeeInBasisPoints],
        gas: BigInt(100000)
      });
      
      console.log('📡 [Admin] Innovation fee transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to set innovation fee:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to set innovation fee');
      setError(err.message || 'Failed to set innovation fee');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add collection to whitelist (admin only)
  const addWhitelistedCollection = async (collectionAddress: string) => {
    console.log('➕ [Admin] Adding collection to whitelist:', {
      marketplace: marketplaceAddress,
      collection: collectionAddress
    });
    
    const notifId = notifications.loading(
      'Adding Collection',
      'Adding collection to whitelist...'
    );
    setLoadingNotifId(notifId);
    setCurrentOperation('Add Collection to Whitelist');

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'addWhitelistedCollection',
        args: [collectionAddress as `0x${string}`],
        gas: BigInt(150000), // Increased from 100k
      });
      
      console.log('📡 [Admin] Add collection transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to add collection:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to add collection to whitelist');
      setError(err.message || 'Failed to add whitelisted collection');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove collection from whitelist (admin only)
  const removeWhitelistedCollection = async (collectionAddress: string) => {
    console.log('➖ [Admin] Removing collection from whitelist:', {
      marketplace: marketplaceAddress,
      collection: collectionAddress
    });
    
    const notifId = notifications.loading(
      'Removing Collection',
      'Removing collection from whitelist...'
    );
    setLoadingNotifId(notifId);
    setCurrentOperation('Remove Collection from Whitelist');

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'removeWhitelistedCollection',
        args: [collectionAddress as `0x${string}`],
        gas: BigInt(150000), // Increased from 100k
      });
      
      console.log('📡 [Admin] Remove collection transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to remove collection:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to remove collection from whitelist');
      setError(err.message || 'Failed to remove whitelisted collection');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Batch add collections to whitelist (admin only)
  const batchAddWhitelistedCollections = async (collectionAddresses: string[]) => {
    console.log('📦 [Admin] Batch adding collections to whitelist:', {
      marketplace: marketplaceAddress,
      count: collectionAddresses.length,
      collections: collectionAddresses
    });
    
    const notifId = notifications.loading(
      'Batch Adding Collections',
      `Adding ${collectionAddresses.length} collection(s) to whitelist...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation(`Batch Add ${collectionAddresses.length} Collections`);

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'batchAddWhitelistedCollections',
        args: [collectionAddresses as `0x${string}`[]],
        gas: BigInt(200000)
      });
      
      console.log('📡 [Admin] Batch add transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to batch add collections:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to batch add collections');
      setError(err.message || 'Failed to batch add whitelisted collections');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Batch remove collections from whitelist (admin only)
  const batchRemoveWhitelistedCollections = async (collectionAddresses: string[]) => {
    console.log('📦 [Admin] Batch removing collections from whitelist:', {
      marketplace: marketplaceAddress,
      count: collectionAddresses.length,
      collections: collectionAddresses
    });
    
    const notifId = notifications.loading(
      'Batch Removing Collections',
      `Removing ${collectionAddresses.length} collection(s) from whitelist...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation(`Batch Remove ${collectionAddresses.length} Collections`);

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'batchRemoveWhitelistedCollections',
        args: [collectionAddresses as `0x${string}`[]],
        gas: BigInt(200000)
      });
      
      console.log('📡 [Admin] Batch remove transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to batch remove collections:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to batch remove collections');
      setError(err.message || 'Failed to batch remove whitelisted collections');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clean invalid listing (admin/anyone can call)
  const cleanListing = async (listingId: string) => {
    console.log('🧹 [Admin] Cleaning listing:', {
      marketplace: marketplaceAddress,
      listingId
    });
    
    const notifId = notifications.loading(
      'Cleaning Listing',
      `Removing invalid listing #${listingId}...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation(`Clean Listing #${listingId}`);

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'cleanListing',
        args: [BigInt(listingId)],
        gas: BigInt(150000)
      });
      
      console.log('📡 [Admin] Clean listing transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to clean listing:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to clean listing');
      setError(err.message || 'Failed to clean listing');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Manage buyer whitelist for specific listing
  const addBuyerWhitelistAddresses = async (listingId: string, buyerAddresses: string[]) => {
    console.log('👥 [Admin] Adding buyers to listing whitelist:', {
      marketplace: marketplaceAddress,
      listingId,
      count: buyerAddresses.length,
      buyers: buyerAddresses
    });
    
    const notifId = notifications.loading(
      'Adding Buyer Whitelist',
      `Adding ${buyerAddresses.length} buyer(s) to listing #${listingId}...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation(`Add ${buyerAddresses.length} Buyers to Listing #${listingId}`);

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'addBuyerWhitelistAddresses',
        args: [BigInt(listingId), buyerAddresses as `0x${string}`[]],
        gas: BigInt(200000)
      });
      
      console.log('📡 [Admin] Add buyer whitelist transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to add buyer whitelist:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to add buyer whitelist');
      setError(err.message || 'Failed to add buyer whitelist addresses');
      setCurrentOperation(null);
      setLoadingNotifId(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeBuyerWhitelistAddresses = async (listingId: string, buyerAddresses: string[]) => {
    console.log('👥 [Admin] Removing buyers from listing whitelist:', {
      marketplace: marketplaceAddress,
      listingId,
      count: buyerAddresses.length,
      buyers: buyerAddresses
    });
    
    const notifId = notifications.loading(
      'Removing Buyer Whitelist',
      `Removing ${buyerAddresses.length} buyer(s) from listing #${listingId}...`
    );
    setLoadingNotifId(notifId);
    setCurrentOperation(`Remove ${buyerAddresses.length} Buyers from Listing #${listingId}`);

    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'removeBuyerWhitelistAddresses',
        args: [BigInt(listingId), buyerAddresses as `0x${string}`[]],
        gas: BigInt(200000)
      });
      
      console.log('📡 [Admin] Remove buyer whitelist transaction sent to wallet');
    } catch (err: any) {
      console.error('❌ [Admin] Failed to remove buyer whitelist:', err);
      notifications.clearAll();
      notifications.error('Transaction Failed', err.message || 'Failed to remove buyer whitelist');
      setError(err.message || 'Failed to remove buyer whitelist addresses');
      setCurrentOperation(null);
      setLoadingNotifId(null);
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
    batchRemoveWhitelistedCollections,

    // State
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    txHash
  };
}

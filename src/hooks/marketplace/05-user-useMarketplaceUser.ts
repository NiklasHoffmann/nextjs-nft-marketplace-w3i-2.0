/**
 * Marketplace User Operations Hook
 * Handles: User functions like proceeds withdrawal and reading user proceeds
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import marketplaceAbi from '@/constants/marketplace.abi.json';

export function useMarketplaceUser(marketplaceAddress: string) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read user proceeds from contract
  const {
    data: proceedsData,
    isLoading: proceedsLoading,
    error: readError,
    refetch: refetchProceeds
  } = useReadContract({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getProceeds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!marketplaceAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Write contract hooks
  const {
    writeContract,
    data: txHash,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: transactionError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle withdraw proceeds
  const withdrawProceeds = useCallback(async () => {
    if (!address || !marketplaceAddress) {
      setError('Wallet not connected or invalid network');
      return;
    }

    if (!proceedsData || proceedsData === BigInt(0)) {
      setError('No proceeds to withdraw');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'withdrawProceeds',
      });
    } catch (err: any) {
      console.error('Error withdrawing proceeds:', err);
      setError('Failed to withdraw proceeds');
      setIsLoading(false);
    }
  }, [address, marketplaceAddress, proceedsData, writeContract]);

  // Handle transaction completion
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setError(null);
      // Refetch proceeds after successful withdrawal
      refetchProceeds();
    } else if (transactionError) {
      setIsLoading(false);
      setError('Transaction failed');
    }
  }, [isSuccess, transactionError, refetchProceeds]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setIsLoading(false);
      setError(writeError.message || 'Failed to initiate withdrawal');
    }
  }, [writeError]);

  // Handle read error
  useEffect(() => {
    if (readError) {
      setError(readError.message || 'Failed to read proceeds');
    }
  }, [readError]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isConfirming || (!!txHash && !isSuccess && !transactionError));
  }, [isConfirming, txHash, isSuccess, transactionError]);

  // Format proceeds data
  const proceeds = proceedsData ? formatEther(proceedsData as bigint) : '0';
  const proceedsWei = (proceedsData as bigint) || BigInt(0);

  return {
    // Proceeds data
    proceeds,
    proceedsWei,
    proceedsLoading,
    refetchProceeds,

    // User functions
    withdrawProceeds,

    // State
    isLoading: isLoading || isConfirming,
    isWithdrawing: isLoading,
    isSuccess,
    error,
    txHash
  };
}
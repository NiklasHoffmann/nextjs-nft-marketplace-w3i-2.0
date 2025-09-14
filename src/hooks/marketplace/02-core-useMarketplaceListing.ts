/**
 * Marketplace Listing Operations Hook
 * Handles: createListing, updateListing, cancelListing
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import marketplaceAbi from '@/constants/marketplace.abi.json';

interface CreateListingParams {
  tokenAddress: string;
  tokenId: string;
  price: string; // in ETH
  desiredTokenAddress?: string;
  desiredTokenId?: string;
  buyerWhitelistEnabled?: boolean;
  allowedBuyers?: string[];
}

interface UpdateListingParams {
  listingId: string;
  newPrice?: string;
  newDesiredTokenAddress?: string;
  newDesiredTokenId?: string;
  newBuyerWhitelistEnabled?: boolean;
  newAllowedBuyers?: string[];
}

export function useMarketplaceListing(marketplaceAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Write contract hooks
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createListing = async ({
    tokenAddress,
    tokenId,
    price,
    desiredTokenAddress = "0x0000000000000000000000000000000000000000",
    desiredTokenId = "0",
    buyerWhitelistEnabled = false,
    allowedBuyers = []
  }: CreateListingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'createListing',
        args: [
          tokenAddress, // tokenAddress
          BigInt(tokenId), // tokenId
          "0x0000000000000000000000000000000000000000", // erc1155Holder (not needed for ERC721)
          parseEther(price), // price
          desiredTokenAddress, // desiredTokenAddress
          BigInt(desiredTokenId), // desiredTokenId
          BigInt("0"), // desiredErc1155Quantity (not needed for ERC721)
          BigInt("1"), // erc1155Quantity (always 1 for ERC721)
          buyerWhitelistEnabled, // buyerWhitelistEnabled
          false, // partialBuyEnabled (not needed for ERC721)
          allowedBuyers // allowedBuyers
        ]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateListing = async ({
    listingId,
    newPrice,
    newDesiredTokenAddress,
    newDesiredTokenId,
    newBuyerWhitelistEnabled,
    newAllowedBuyers = []
  }: UpdateListingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'updateListing',
        args: [
          BigInt(listingId),
          newPrice ? parseEther(newPrice) : undefined,
          newDesiredTokenAddress || "0x0000000000000000000000000000000000000000",
          BigInt(newDesiredTokenId || "0"),
          BigInt("0"), // newDesiredErc1155Quantity
          BigInt("1"), // newErc1155Quantity
          newBuyerWhitelistEnabled || false,
          false, // newPartialBuyEnabled
          newAllowedBuyers
        ]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelListing = async (listingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'cancelListing',
        args: [BigInt(listingId)]
      });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createListing,
    updateListing,
    cancelListing,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    txHash
  };
}
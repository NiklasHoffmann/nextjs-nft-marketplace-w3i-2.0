/**
 * Marketplace Purchase Operations Hook
 * Handles: purchaseListing (both ETH sales and NFT swaps)
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import marketplaceAbi from '@/constants/marketplace.abi.json';

interface PurchaseListingParams {
  listingId: string;
  expectedPrice: string; // in ETH
  expectedDesiredTokenAddress?: string;
  expectedDesiredTokenId?: string;
  desiredErc1155Holder?: string; // for swap transactions
}

export function useMarketplacePurchase(marketplaceAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Write contract hooks
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const purchaseListing = async ({
    listingId,
    expectedPrice,
    expectedDesiredTokenAddress = "0x0000000000000000000000000000000000000000",
    expectedDesiredTokenId = "0",
    desiredErc1155Holder = "0x0000000000000000000000000000000000000000"
  }: PurchaseListingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const isSwap = expectedDesiredTokenAddress !== "0x0000000000000000000000000000000000000000";
      const ethValue = isSwap ? BigInt(0) : parseEther(expectedPrice);

      await writeContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'purchaseListing',
        args: [
          BigInt(listingId), // listingId
          parseEther(expectedPrice), // expectedPrice
          BigInt("1"), // expectedErc1155Quantity (always 1 for ERC721)
          expectedDesiredTokenAddress, // expectedDesiredTokenAddress
          BigInt(expectedDesiredTokenId), // expectedDesiredTokenId
          BigInt("0"), // expectedDesiredErc1155Quantity (not needed for ERC721)
          BigInt("1"), // erc1155PurchaseQuantity (always 1 for ERC721)
          desiredErc1155Holder // desiredErc1155Holder (for swaps)
        ],
        value: ethValue
      });
    } catch (err: any) {
      setError(err.message || 'Failed to purchase listing');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if listing is a swap
  const isSwapListing = (desiredTokenAddress: string): boolean => {
    return desiredTokenAddress !== "0x0000000000000000000000000000000000000000";
  };

  return {
    purchaseListing,
    isSwapListing,
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    txHash
  };
}
/**
 * Marketplace Purchase Operations Hook
 * Handles: purchaseListing (both ETH sales and NFT swaps)
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { IDEATION_MARKET_FACET_ABI } from '@/config/abis/ideation-market-facet';
import { getAvailableTokens, ZERO_ADDRESS } from '@/config/tokens';

interface PurchaseListingParams {
  listingId: string;
  expectedPrice: string; // in ETH
  expectedCurrency?: string; // Payment token address (default: ETH)
  expectedDesiredTokenAddress?: string;
  expectedDesiredTokenId?: string;
  desiredErc1155Holder?: string; // for swap transactions
  onProgress?: (step: 'preparing' | 'signing' | 'pending' | 'success', txHash?: string) => void; // Progress callback with optional hash
}

export function useMarketplacePurchase(marketplaceAddress: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>(undefined);
  const chainId = useChainId();

  const publicClient = usePublicClient();

  // Write contract hooks
  const { writeContractAsync, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
    status: receiptStatus
  } = useWaitForTransactionReceipt({
    hash: submittedHash, // Use the hash we stored
  });

  // Combine errors from both hooks
  const combinedError = error || (writeError ? String(writeError) : null) || (receiptError ? String(receiptError) : null);

  console.log('🔍 Hook state:', {
    submittedHash,
    isConfirming,
    isSuccess,
    receiptStatus,
    hasReceiptError: !!receiptError,
    receiptError: receiptError ? String(receiptError) : null
  });

  const purchaseListing = async ({
    listingId,
    expectedPrice,
    expectedCurrency = ZERO_ADDRESS, // Default: ETH
    expectedDesiredTokenAddress = ZERO_ADDRESS,
    expectedDesiredTokenId = "0",
    desiredErc1155Holder = ZERO_ADDRESS,
    onProgress
  }: PurchaseListingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      onProgress?.('preparing');

      const isSwap = expectedDesiredTokenAddress !== ZERO_ADDRESS;
      const isNative = expectedCurrency === ZERO_ADDRESS;

      const tokens = getAvailableTokens(chainId);
      const match = tokens.find((token) => token.address.toLowerCase() === expectedCurrency.toLowerCase());
      const priceDecimals = isNative ? 18 : (match?.decimals ?? 18);
      const expectedPriceUnits = parseUnits(expectedPrice, priceDecimals);
      
      // Only send ETH value if paying with native ETH (not WETH or swap)
      const ethValue = (isSwap || !isNative) ? BigInt(0) : parseUnits(expectedPrice, 18);

      console.log('🚀 Calling writeContractAsync with:', {
        listingId,
        expectedPrice,
        expectedCurrency,
        isSwap,
        isNative,
        ethValue: ethValue.toString(),
        expectedDesiredTokenAddress,
        expectedDesiredTokenId
      });

      onProgress?.('signing');

      // Use writeContractAsync which returns the transaction hash directly
      const hash = await writeContractAsync({
        address: marketplaceAddress as `0x${string}`,
        abi: IDEATION_MARKET_FACET_ABI,
        functionName: 'purchaseListing',
        args: [
          BigInt(listingId), // listingId
          expectedPriceUnits, // expectedPrice
          (expectedCurrency || ZERO_ADDRESS) as `0x${string}`, // expectedCurrency (0x0 for ETH, WETH address for WETH)
          BigInt("0"), // expectedErc1155Quantity (0 for ERC721, quantity for ERC1155)
          expectedDesiredTokenAddress as `0x${string}`, // expectedDesiredTokenAddress
          BigInt(expectedDesiredTokenId), // expectedDesiredTokenId
          BigInt("0"), // expectedDesiredErc1155Quantity (not needed for pure ETH sales)
          BigInt("0"), // erc1155PurchaseQuantity (0 for ERC721, quantity for ERC1155)
          desiredErc1155Holder as `0x${string}` // desiredErc1155Holder (for swaps)
        ] as const,
        value: ethValue,
        gas: BigInt(500000) // Safe limit: high enough for NFT purchases, well below 16.7M cap
      });

      console.log('✅ Transaction submitted! Hash:', hash);
      setSubmittedHash(hash); // Store hash for useWaitForTransactionReceipt

      onProgress?.('pending', hash);

      // Manually check the transaction receipt
      // This helps catch reverted transactions immediately
      if (publicClient) {
        console.log('🔍 Waiting for transaction receipt:', hash);
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 120_000 // 2 minutes
        });

        console.log('📋 Transaction receipt:', {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });

        if (receipt.status === 'reverted') {
          const errorMsg = 'Transaction reverted on blockchain. The NFT may have been sold, removed, or the price changed.';
          console.error('❌', errorMsg);
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        onProgress?.('success', hash);
      }

      return hash;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to purchase listing';
      console.error('❌ useMarketplacePurchase error:', {
        message: errorMessage,
        error: err,
        stack: err.stack
      });
      setError(errorMessage);
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
    error: combinedError, // Now includes writeError AND receiptError
    txHash: submittedHash // Return the submitted hash
  };
}

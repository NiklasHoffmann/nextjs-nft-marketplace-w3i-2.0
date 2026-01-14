/**
 * Marketplace Listing Operations Hook
 * Handles: createListing, updateListing, cancelListing
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseEther, getAddress } from 'viem';
import marketplaceAbi from '@/constants/marketplace.abi.json';

const ERC721_ABI = [
  {
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'operator', type: 'address' }],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

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
  const [submittedHash, setSubmittedHash] = useState<string | undefined>();
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  // Write contract hooks - capture errors from wagmi
  const {
    writeContractAsync,
    data: txHash,
    error: writeError,
    isError: isWriteError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
    isError: isReceiptError
  } = useWaitForTransactionReceipt({
    hash: submittedHash as `0x${string}` | undefined,
  });

  // Debug: Log when submittedHash changes
  console.log('🔍 [useMarketplaceListing] Current state:', {
    submittedHash,
    isConfirming,
    isSuccess,
    hasError: !!receiptError
  });

  // Combined error state - prioritize receipt errors over write errors
  const error = receiptError || writeError;
  const isError = isReceiptError || isWriteError;

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
      console.log('🔵 [useMarketplaceListing] createListing called');
      console.log('📋 Parameters:', {
        tokenAddress,
        tokenId,
        price,
        priceInWei: parseEther(price).toString(),
        marketplaceAddress,
        desiredTokenAddress,
        desiredTokenId,
        buyerWhitelistEnabled,
        allowedBuyers
      });

      setIsLoading(true);

      // CRITICAL: Ensure all addresses are checksummed
      const checksummedTokenAddress = getAddress(tokenAddress);
      const checksummedDesiredTokenAddress = desiredTokenAddress !== "0x0000000000000000000000000000000000000000"
        ? getAddress(desiredTokenAddress)
        : "0x0000000000000000000000000000000000000000";

      console.log('🔐 Checksummed addresses:', {
        original: tokenAddress,
        checksummed: checksummedTokenAddress,
        desiredOriginal: desiredTokenAddress,
        desiredChecksummed: checksummedDesiredTokenAddress
      });

      const args = [
        checksummedTokenAddress, // tokenAddress (CHECKSUMMED!)
        BigInt(tokenId), // tokenId
        "0x0000000000000000000000000000000000000000", // erc1155Holder (not needed for ERC721)
        parseEther(price), // price
        "0x0000000000000000000000000000000000000000", // currency (0x0 = ETH/native token)
        checksummedDesiredTokenAddress, // desiredTokenAddress (CHECKSUMMED!)
        BigInt(desiredTokenId), // desiredTokenId
        BigInt("0"), // desiredErc1155Quantity (not needed for ERC721)
        BigInt("0"), // erc1155Quantity (0 for ERC721, >0 for ERC1155)
        buyerWhitelistEnabled, // buyerWhitelistEnabled
        false, // partialBuyEnabled (not needed for ERC721)
        allowedBuyers // allowedBuyers
      ];

      console.log('📝 Contract args (detailed):');
      console.log('  [0] tokenAddress:', args[0]);
      console.log('  [1] tokenId:', args[1]?.toString());
      console.log('  [2] erc1155Holder:', args[2]);
      console.log('  [3] price (wei):', args[3]?.toString());
      console.log('  [4] currency:', args[4]);
      console.log('  [5] desiredTokenAddress:', args[5]);
      console.log('  [6] desiredTokenId:', args[6]?.toString());
      console.log('  [7] desiredErc1155Quantity:', args[7]?.toString());
      console.log('  [8] erc1155Quantity:', args[8]?.toString());
      console.log('  [9] buyerWhitelistEnabled:', args[9]);
      console.log('  [10] partialBuyEnabled:', args[10]);
      console.log('  [11] allowedBuyers:', args[11]);

      // CRITICAL: Check and ensure approval before proceeding
      if (publicClient && userAddress) {
        console.log('🔍 Checking ACTUAL approval status on-chain...');
        try {
          // Check if marketplace is approved for all
          const isApprovedForAll = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'isApprovedForAll',
            args: [userAddress, marketplaceAddress as `0x${string}`]
          });

          // Check if this specific token is approved
          const approvedAddress = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'getApproved',
            args: [BigInt(tokenId)]
          });

          const isSingleApproved = approvedAddress?.toLowerCase() === marketplaceAddress.toLowerCase();
          const actuallyApproved = isApprovedForAll || isSingleApproved;

          console.log('✅ ACTUAL Approval Check:', {
            isApprovedForAll,
            approvedAddress,
            isSingleApproved,
            marketplaceAddress,
            userAddress,
            actuallyApproved
          });

          if (!actuallyApproved) {
            console.log('⚠️ NFT NOT APPROVED - Requesting approval from user...');

            // Ask user to approve
            if (!window.confirm('This NFT needs to be approved for the marketplace.\n\nClick OK to approve all your NFTs from this collection for trading.\n\n(This is a one-time approval per collection)')) {
              throw new Error('User cancelled approval. Please approve the NFT collection to list items.');
            }

            console.log('📝 Sending setApprovalForAll transaction...');

            // Send approval transaction
            const approvalTx = await writeContractAsync({
              address: tokenAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'setApprovalForAll',
              args: [marketplaceAddress as `0x${string}`, true]
            });

            console.log('⏳ Waiting for approval transaction confirmation...');
            console.log('🔗 Approval TX:', approvalTx);

            // Wait for approval confirmation (we need to create a separate waiter)
            let approvalConfirmed = false;
            let attempts = 0;
            while (!approvalConfirmed && attempts < 60) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              try {
                const newApprovalStatus = await publicClient.readContract({
                  address: tokenAddress as `0x${string}`,
                  abi: ERC721_ABI,
                  functionName: 'isApprovedForAll',
                  args: [userAddress, marketplaceAddress as `0x${string}`]
                });
                if (newApprovalStatus) {
                  approvalConfirmed = true;
                  console.log('✅ Approval confirmed on-chain!');
                }
              } catch (e) {
                console.log('⏳ Still waiting for approval confirmation...');
              }
              attempts++;
            }

            if (!approvalConfirmed) {
              throw new Error('Approval transaction timed out. Please try again.');
            }
          } else {
            console.log('✅ Already approved - proceeding...');
          }
        } catch (approvalCheckError: any) {
          console.error('❌ Approval check/request failed:', approvalCheckError);
          throw approvalCheckError;
        }
      }

      // Simulate the transaction first to get detailed revert reason
      console.log('🔍 Simulating transaction to check for errors...');
      try {
        if (publicClient && userAddress) {
          await publicClient.simulateContract({
            address: marketplaceAddress as `0x${string}`,
            abi: marketplaceAbi,
            functionName: 'createListing',
            args,
            account: userAddress, // Use actual user address for simulation
          });
          console.log('✅ Simulation successful - transaction should work');
        }
      } catch (simError: any) {
        // Check error type first to reduce unnecessary logging
        const errorMessage = simError.message || '';

        // Check for already listed error - silent handling
        const isAlreadyListedError = errorMessage.includes('IdeationMarket__AlreadyListed') ||
          errorMessage.includes('AlreadyListed');

        if (isAlreadyListedError) {
          console.warn('⚠️ NFT is already listed - will redirect to detail page');
          const alreadyListedError = new Error('ALREADY_LISTED');
          (alreadyListedError as any).code = 'ALREADY_LISTED';
          throw alreadyListedError;
        }

        // For other errors, log details
        console.error('❌ Simulation failed:', errorMessage);

        // Check for approval errors - block transaction
        const isApprovalError = errorMessage.includes('NotAuthorizedOperator') ||
          errorMessage.includes('not approved') ||
          errorMessage.includes('ERC721: transfer caller is not owner nor approved');

        if (isApprovalError) {
          console.error('🚫 APPROVAL ERROR - Blocking transaction');
          throw new Error('NFT is not approved for the marketplace. Please approve it first.');
        }

        // Check for whitelist errors
        const isWhitelistError = errorMessage.includes('0x529266cb') ||
          errorMessage.includes('NotWhitelisted') ||
          errorMessage.includes('CollectionWhitelist');

        if (isWhitelistError) {
          console.warn('⚠️ Whitelist simulation error detected');
          console.warn('⚠️ Verifying whitelist status with contract...');

          // Double-check whitelist status directly from contract
          if (!publicClient) {
            throw new Error('Public client not available');
          }

          try {
            const whitelistStatus = await publicClient.readContract({
              address: marketplaceAddress as `0x${string}`,
              abi: marketplaceAbi,
              functionName: 'isCollectionWhitelisted',
              args: [checksummedTokenAddress as `0x${string}`]
            });

            console.log('📡 Direct contract check - isWhitelisted:', whitelistStatus);

            if (!whitelistStatus) {
              console.error('🚫 WHITELIST ERROR - Collection is NOT whitelisted!');
              throw new Error(`Collection ${checksummedTokenAddress} is not whitelisted on this marketplace`);
            }

            console.log('✅ Collection IS whitelisted - simulation error was false positive');
            console.log('⚠️ Proceeding with transaction...');
          } catch (whitelistCheckError) {
            console.error('❌ Failed to verify whitelist status:', whitelistCheckError);
            throw new Error('Failed to verify collection whitelist status');
          }
        } else {
          // For other errors, just warn but continue
          console.warn('⚠️ Proceeding with transaction despite simulation failure...');
        }
      }

      console.log('⛽ Setting gas limit to 800,000 to avoid estimation issues');

      const contractConfig = {
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'createListing' as const,
        args,
        gas: BigInt(800000) // Increased from 500k
      };

      console.log('📤 Sending transaction with config:', {
        address: contractConfig.address,
        functionName: contractConfig.functionName,
        gasLimit: contractConfig.gas.toString(),
        argsLength: contractConfig.args.length
      });

      const hash = await writeContractAsync(contractConfig);

      console.log('✅ [useMarketplaceListing] Transaction sent successfully');
      console.log('📋 Transaction hash:', hash);
      setSubmittedHash(hash);

      return hash;
    } catch (err: any) {
      console.error('❌ [useMarketplaceListing] TRANSACTION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error Type:', err.name || 'Unknown');
      console.error('Error Message:', err.message);

      if (err.shortMessage) {
        console.error('Short Message:', err.shortMessage);
      }

      if (err.details) {
        console.error('Details:', err.details);
      }

      if (err.metaMessages && err.metaMessages.length > 0) {
        console.error('Meta Messages:', err.metaMessages);
      }

      if (err.cause) {
        console.error('Cause:', err.cause);
      }

      if (err.code) {
        console.error('Error Code:', err.code);
      }

      // Check for specific error types
      if (err.message?.toLowerCase().includes('user rejected') ||
        err.message?.toLowerCase().includes('user denied')) {
        console.error('🚫 USER REJECTED TRANSACTION IN WALLET');
      } else if (err.message?.toLowerCase().includes('gas')) {
        console.error('⛽ GAS-RELATED ERROR DETECTED');
        console.error('This could be: insufficient gas, gas limit too low, or network congestion');
      } else if (err.message?.toLowerCase().includes('insufficient funds')) {
        console.error('💰 INSUFFICIENT FUNDS - User does not have enough ETH');
      } else if (err.message?.toLowerCase().includes('nonce')) {
        console.error('🔢 NONCE ERROR - Transaction ordering issue');
      } else if (err.message?.toLowerCase().includes('revert')) {
        console.error('🔄 CONTRACT REVERTED - Smart contract rejected the transaction');
        if (err.reason) {
          console.error('Revert Reason:', err.reason);
        }
      }

      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Full Error Object:', err);

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

      await writeContractAsync({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'updateListing',
        args: [
          BigInt(listingId),
          newPrice ? parseEther(newPrice) : undefined,
          newDesiredTokenAddress || "0x0000000000000000000000000000000000000000",
          BigInt(newDesiredTokenId || "0"),
          BigInt("0"), // newDesiredErc1155Quantity (0 for ERC721)
          BigInt("0"), // newErc1155Quantity (0 for ERC721)
          newBuyerWhitelistEnabled || false,
          false, // newPartialBuyEnabled
          newAllowedBuyers
        ],
        gas: BigInt(300000)
      });
    } catch (err: any) {
      console.error('❌ [useMarketplaceListing] Update failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelListing = async (listingId: string) => {
    try {
      setIsLoading(true);

      await writeContractAsync({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
        gas: BigInt(150000)
      });
    } catch (err: any) {
      console.error('❌ [useMarketplaceListing] Cancel failed:', err);
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
    isError,
    error,
    txHash: submittedHash
  };
}

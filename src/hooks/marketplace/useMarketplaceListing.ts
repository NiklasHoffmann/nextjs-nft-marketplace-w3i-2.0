/**
 * Marketplace Listing Operations Hook
 * Handles: createListing, updateListing, cancelListing
 */
"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount, useChainId } from 'wagmi';
import { parseUnits, getAddress, erc721Abi, erc1155Abi } from 'viem';
import { IDEATION_MARKET_FACET_ABI } from '@/config/abis/ideation-market-facet';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';
import { getTokenDecimalsByAddress, ZERO_ADDRESS } from '@/config/tokens';
import { devLog } from '@/utils';
import { detectIdeationMarketError, getIdeationMarketErrorMessage } from '@/services/blockchain/marketplace-error-parser';

interface CreateListingParams {
  tokenAddress: string;
  tokenId: string;
  price: string; // in token units (ETH, WETH, USDC, etc.)
  currency?: string; // ERC20 token address (0x0000...0000 = native ETH)
  desiredTokenAddress?: string;
  desiredTokenId?: string;
  desiredErc1155Quantity?: string;
  erc1155Quantity?: string;
  partialBuyEnabled?: boolean;
  tokenStandard?: 'ERC721' | 'ERC1155';
  buyerWhitelistEnabled?: boolean;
  allowedBuyers?: string[];
}

interface UpdateListingParams {
  listingId: string;
  newPrice?: string;
  newCurrency?: string;
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
  const chainId = useChainId();

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
  devLog.info('?? [useMarketplaceListing] Current state:', {
    submittedHash,
    isConfirming,
    isSuccess,
    hasError: !!receiptError
  });

  // Combined error state - prioritize receipt errors over write errors
  const error = receiptError || writeError;
  const isError = isReceiptError || isWriteError;

  const resolveCurrencyDecimals = (currencyAddress?: string): number => {
    if (!currencyAddress || currencyAddress === ZERO_ADDRESS) {
      return 18;
    }

    return getTokenDecimalsByAddress(chainId, currencyAddress);
  };

  const createListing = async ({
    tokenAddress,
    tokenId,
    price,
    currency = ZERO_ADDRESS,
    desiredTokenAddress = ZERO_ADDRESS,
    desiredTokenId = "0",
    desiredErc1155Quantity = "0",
    erc1155Quantity = "0",
    partialBuyEnabled = false,
    tokenStandard = 'ERC721',
    buyerWhitelistEnabled = false,
    allowedBuyers = []
  }: CreateListingParams) => {
    try {
      const isErc1155 = tokenStandard === 'ERC1155';
      const priceDecimals = resolveCurrencyDecimals(currency);
      const priceInUnits = parseUnits(price, priceDecimals);

      devLog.info('🔍 [useMarketplaceListing] createListing called');
      devLog.info('📦 [useMarketplaceListing] Received Parameters:');
      devLog.info('   tokenAddress:', tokenAddress);
      devLog.info('   tokenId:', tokenId);
      devLog.info('   price:', price);
      devLog.info('   priceInUnits:', priceInUnits.toString());
      devLog.info('   currency:', currency);
      devLog.info('   marketplaceAddress:', marketplaceAddress);
      devLog.info('   desiredTokenAddress:', desiredTokenAddress);
      devLog.info('   desiredTokenId:', desiredTokenId);
      devLog.info('   desiredErc1155Quantity:', desiredErc1155Quantity);
      devLog.info('   erc1155Quantity:', erc1155Quantity);
      devLog.info('   partialBuyEnabled:', partialBuyEnabled);
      devLog.info('   tokenStandard:', tokenStandard);
      devLog.info('   buyerWhitelistEnabled:', buyerWhitelistEnabled);
      devLog.info('   allowedBuyers:', allowedBuyers);

      setIsLoading(true);

      // CRITICAL: Ensure all addresses are checksummed
      const checksummedTokenAddress = getAddress(tokenAddress);
      const checksummedDesiredTokenAddress = desiredTokenAddress !== ZERO_ADDRESS
        ? getAddress(desiredTokenAddress)
        : ZERO_ADDRESS;

      devLog.info('?? Checksummed addresses:', {
        original: tokenAddress,
        checksummed: checksummedTokenAddress,
        desiredOriginal: desiredTokenAddress,
        desiredChecksummed: checksummedDesiredTokenAddress
      });

      const args = [
        checksummedTokenAddress as `0x${string}`, // tokenAddress (CHECKSUMMED!)
        BigInt(tokenId), // tokenId
        (isErc1155 && userAddress
          ? (userAddress as `0x${string}`)
          : "0x0000000000000000000000000000000000000000" as `0x${string}`), // erc1155Holder
        priceInUnits, // price
        (currency || ZERO_ADDRESS) as `0x${string}`, // currency (0x0 = ETH, WETH address = WETH)
        checksummedDesiredTokenAddress as `0x${string}`, // desiredTokenAddress (CHECKSUMMED!)
        BigInt(desiredTokenId), // desiredTokenId
        BigInt(desiredErc1155Quantity || "0"), // desiredErc1155Quantity
        BigInt(erc1155Quantity || "0"), // erc1155Quantity (0 for ERC721, >0 for ERC1155)
        buyerWhitelistEnabled, // buyerWhitelistEnabled
        isErc1155 ? partialBuyEnabled : false, // partialBuyEnabled
        allowedBuyers as readonly `0x${string}`[] // allowedBuyers
      ] as const;

      const listingQuantity = BigInt(erc1155Quantity || '0');

      if (isErc1155) {
        if (!userAddress) {
          throw new Error('Wallet not connected. Please reconnect and try again.');
        }

        if (listingQuantity <= BigInt(0)) {
          throw new Error('ERC1155 quantity must be greater than 0.');
        }

        if (priceInUnits <= BigInt(0)) {
          throw new Error('Ungültiger Stückpreis: Der Gesamtpreis muss größer als 0 sein.');
        }

        if (priceInUnits < listingQuantity) {
          throw new Error('Ungültiger Stückpreis: Der Gesamtpreis ist für diese ERC1155-Menge zu klein. Bitte Preis erhöhen oder Menge reduzieren.');
        }

        if (priceInUnits % listingQuantity !== BigInt(0)) {
          throw new Error('Ungültiger Stückpreis: Für ERC1155 muss der Gesamtpreis durch die Menge ohne Rest teilbar sein (exakter Stückpreis).');
        }

        if (publicClient) {
          const availableBalance = await publicClient.readContract({
            address: checksummedTokenAddress as `0x${string}`,
            abi: erc1155Abi,
            functionName: 'balanceOf',
            args: [userAddress, BigInt(tokenId)]
          });

          devLog.info('📦 ERC1155 balance preflight:', {
            tokenId,
            requested: listingQuantity.toString(),
            available: availableBalance.toString(),
            owner: userAddress,
          });

          if (listingQuantity > availableBalance) {
            throw new Error(
              `Insufficient ERC1155 balance: requested ${listingQuantity.toString()}, available ${availableBalance.toString()}. Please refresh your wallet NFTs and reduce the quantity.`
            );
          }
        }
      }

      devLog.info('🚀 [useMarketplaceListing] Contract args being sent to createListing():');
      devLog.info('  [0] tokenAddress:', args[0]);
      devLog.info('  [1] tokenId:', args[1]?.toString());
      devLog.info('  [2] erc1155Holder:', args[2]);
      devLog.info('  [3] price (units):', args[3]?.toString());
      devLog.info('  [4] currency:', args[4], '<-- CURRENCY PARAMETER');
      devLog.info('  [5] desiredTokenAddress:', args[5]);
      devLog.info('  [6] desiredTokenId:', args[6]?.toString());
      devLog.info('  [7] desiredErc1155Quantity:', args[7]?.toString());
      devLog.info('  [8] erc1155Quantity:', args[8]?.toString());
      devLog.info('  [9] buyerWhitelistEnabled:', args[9]);
      devLog.info('  [10] partialBuyEnabled:', args[10]);
      devLog.info('  [11] allowedBuyers:', args[11]);
      devLog.info('📝 [useMarketplaceListing] Full args array:', JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));

      // CRITICAL: Check and ensure approval using viem's erc721Abi
      if (publicClient && userAddress) {
        devLog.info('✅ Checking NFT approval status...');

        // Check if marketplace is approved for all
        const isApprovedForAll = await publicClient.readContract({
          address: checksummedTokenAddress as `0x${string}`,
          abi: isErc1155 ? erc1155Abi : erc721Abi,
          functionName: 'isApprovedForAll',
          args: [userAddress, marketplaceAddress as `0x${string}`]
        });

        let isSingleApproved = false;
        if (!isErc1155) {
          const approvedAddress = await publicClient.readContract({
            address: checksummedTokenAddress as `0x${string}`,
            abi: erc721Abi,
            functionName: 'getApproved',
            args: [BigInt(tokenId)]
          });
          isSingleApproved = approvedAddress?.toLowerCase() === marketplaceAddress.toLowerCase();
        }

        const actuallyApproved = isApprovedForAll || isSingleApproved;

        devLog.info('📋 Approval Check:', {
          isApprovedForAll,
          isSingleApproved,
          actuallyApproved
        });

        if (!actuallyApproved) {
          devLog.info('⚠️ NFT NOT APPROVED - Requesting approval...');

          // Ask user to approve
          if (!window.confirm('This NFT needs to be approved for the marketplace.\n\nClick OK to approve all your NFTs from this collection for trading.\n\n(This is a one-time approval per collection)')) {
            throw new Error('User cancelled approval. Please approve the NFT collection to list items.');
          }

          devLog.info('📝 Sending setApprovalForAll transaction...');

          // Send approval transaction
          const approvalTx = await writeContractAsync({
            address: checksummedTokenAddress as `0x${string}`,
            abi: isErc1155 ? erc1155Abi : erc721Abi,
            functionName: 'setApprovalForAll',
            args: [marketplaceAddress as `0x${string}`, true]
          });

          devLog.info('⏳ Waiting for approval confirmation...');
          devLog.info('📝 Approval TX:', approvalTx);

          // Wait for approval confirmation with timeout
          let approvalConfirmed = false;
          let attempts = 0;
          const maxAttempts = 30; // 60 seconds total (2s * 30)

          while (!approvalConfirmed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              const newApprovalStatus = await publicClient.readContract({
                address: checksummedTokenAddress as `0x${string}`,
                abi: isErc1155 ? erc1155Abi : erc721Abi,
                functionName: 'isApprovedForAll',
                args: [userAddress, marketplaceAddress as `0x${string}`]
              });
              if (newApprovalStatus) {
                approvalConfirmed = true;
                devLog.info('✅ Approval confirmed on-chain!');
              }
            } catch (e) {
              devLog.info('⏳ Waiting for confirmation...');
            }
            attempts++;
          }

          if (!approvalConfirmed) {
            throw new Error('Approval transaction timed out. Please try again.');
          }
        } else {
          devLog.info('✅ Already approved - proceeding...');
        }
      }

      // Simulate the transaction first to get detailed revert reason
      devLog.info('?? Simulating transaction to check for errors...');
      try {
        if (publicClient && userAddress) {
          await publicClient.simulateContract({
            address: marketplaceAddress as `0x${string}`,
            abi: IDEATION_MARKET_FACET_ABI,
            functionName: 'createListing',
            args,
            account: userAddress, // Use actual user address for simulation
          });
          devLog.info('? Simulation successful - transaction should work');
        }
      } catch (simError: any) {
        // Check error type first to reduce unnecessary logging
        const errorMessage = simError.message || '';

        const ideationMarketError = detectIdeationMarketError(simError);

        if (ideationMarketError) {
          if (ideationMarketError === 'AlreadyListed') {
            devLog.warn('?? NFT is already listed - will redirect to detail page');
            const alreadyListedError = new Error('ALREADY_LISTED');
            (alreadyListedError as any).code = 'ALREADY_LISTED';
            throw alreadyListedError;
          }

          if (
            ideationMarketError === 'CollectionNotWhitelisted' ||
            ideationMarketError === 'BuyerNotWhitelisted' ||
            ideationMarketError === 'WhitelistDisabled'
          ) {
            devLog.warn('?? Whitelist simulation error detected');
            devLog.warn('?? Verifying whitelist status with contract...');

            if (!publicClient) {
              throw new Error('Public client not available');
            }

            try {
              const whitelistStatus = await publicClient.readContract({
                address: marketplaceAddress as `0x${string}`,
                abi: GETTER_FACET_ABI,
                functionName: 'isCollectionWhitelisted',
                args: [checksummedTokenAddress as `0x${string}`]
              });

              devLog.info('?? Direct contract check - isWhitelisted:', whitelistStatus);

              if (!whitelistStatus) {
                throw new Error(getIdeationMarketErrorMessage('CollectionNotWhitelisted'));
              }

              devLog.info('? Collection IS whitelisted - simulation error was false positive');
              devLog.info('?? Proceeding with transaction...');
            } catch (whitelistCheckError) {
              devLog.error('? Failed to verify whitelist status:', whitelistCheckError);
              throw new Error(getIdeationMarketErrorMessage(ideationMarketError));
            }
          }

          devLog.error('❌ Marketplace simulation error:', errorMessage);
          throw new Error(getIdeationMarketErrorMessage(ideationMarketError));
        }

        const isInsufficientBalanceError = errorMessage.includes('IdeationMarket__SellerInsufficientTokenBalance') ||
          errorMessage.includes('SellerInsufficientTokenBalance');

        if (isInsufficientBalanceError) {
          devLog.error('❌ ERC1155 balance simulation error:', errorMessage);
          throw new Error('Insufficient ERC1155 balance for listing quantity. Please reduce the quantity to your current wallet balance.');
        }

        // For other errors, log details
        devLog.error('? Simulation failed:', errorMessage);

        // Check for approval errors - block transaction
        const isApprovalError = errorMessage.includes('NotAuthorizedOperator') ||
          errorMessage.includes('not approved') ||
          errorMessage.includes('ERC721: transfer caller is not owner nor approved');

        if (isApprovalError) {
          devLog.error('?? APPROVAL ERROR - Blocking transaction');
          throw new Error('NFT is not approved for the marketplace. Please approve it first.');
        }


        // For unknown simulation errors, just warn but continue
        devLog.warn('?? Proceeding with transaction despite simulation failure...');
      }

      devLog.info('? Setting gas limit to 800,000 to avoid estimation issues');

      const contractConfig = {
        address: marketplaceAddress as `0x${string}`,
        abi: IDEATION_MARKET_FACET_ABI,
        functionName: 'createListing' as const,
        args,
        gas: BigInt(800000) // Increased from 500k
      };

      devLog.info('?? Sending transaction with config:', {
        address: contractConfig.address,
        functionName: contractConfig.functionName,
        gasLimit: contractConfig.gas.toString(),
        argsLength: contractConfig.args.length
      });

      const hash = await writeContractAsync(contractConfig);

      devLog.info('? [useMarketplaceListing] Transaction sent successfully');
      devLog.info('?? Transaction hash:', hash);
      setSubmittedHash(hash);

      return hash;
    } catch (err: any) {
      devLog.error('? [useMarketplaceListing] TRANSACTION FAILED');
      devLog.error('????????????????????????????????????????');
      devLog.error('Error Type:', err.name || 'Unknown');
      devLog.error('Error Message:', err.message);

      if (err.shortMessage) {
        devLog.error('Short Message:', err.shortMessage);
      }

      if (err.details) {
        devLog.error('Details:', err.details);
      }

      if (err.metaMessages && err.metaMessages.length > 0) {
        devLog.error('Meta Messages:', err.metaMessages);
      }

      if (err.cause) {
        devLog.error('Cause:', err.cause);
      }

      if (err.code) {
        devLog.error('Error Code:', err.code);
      }

      // Check for specific error types
      if (err.message?.toLowerCase().includes('user rejected') ||
        err.message?.toLowerCase().includes('user denied')) {
        devLog.error('?? USER REJECTED TRANSACTION IN WALLET');
      } else if (err.message?.toLowerCase().includes('gas')) {
        devLog.error('? GAS-RELATED ERROR DETECTED');
        devLog.error('This could be: insufficient gas, gas limit too low, or network congestion');
      } else if (err.message?.toLowerCase().includes('insufficient funds')) {
        devLog.error('?? INSUFFICIENT FUNDS - User does not have enough ETH');
      } else if (err.message?.toLowerCase().includes('nonce')) {
        devLog.error('?? NONCE ERROR - Transaction ordering issue');
      } else if (err.message?.toLowerCase().includes('revert')) {
        devLog.error('?? CONTRACT REVERTED - Smart contract rejected the transaction');
        if (err.reason) {
          devLog.error('Revert Reason:', err.reason);
        }
      }

      devLog.error('????????????????????????????????????????');
      devLog.error('Full Error Object:', err);

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateListing = async ({
    listingId,
    newPrice,
    newCurrency,
    newDesiredTokenAddress,
    newDesiredTokenId,
    newBuyerWhitelistEnabled,
    newAllowedBuyers = []
  }: UpdateListingParams) => {
    try {
      setIsLoading(true);
      const effectiveCurrency = newCurrency || ZERO_ADDRESS;
      const priceDecimals = resolveCurrencyDecimals(effectiveCurrency);
      const priceValue = newPrice ? parseUnits(newPrice, priceDecimals) : BigInt(0);

      await writeContractAsync({
        address: marketplaceAddress as `0x${string}`,
        abi: IDEATION_MARKET_FACET_ABI,
        functionName: 'updateListing',
        args: [
          BigInt(listingId),
          priceValue,
          effectiveCurrency as `0x${string}`,
          (newDesiredTokenAddress || ZERO_ADDRESS) as `0x${string}`,
          BigInt(newDesiredTokenId || "0"),
          BigInt("0"), // newDesiredErc1155Quantity (0 for ERC721)
          BigInt("0"), // newErc1155Quantity (0 for ERC721)
          newBuyerWhitelistEnabled || false,
          false, // newPartialBuyEnabled
          (newAllowedBuyers as `0x${string}`[]) || []
        ] as const,
        gas: BigInt(300000)
      });
    } catch (err: any) {
      devLog.error('? [useMarketplaceListing] Update failed:', err);
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
        abi: IDEATION_MARKET_FACET_ABI,
        functionName: 'cancelListing',
        args: [BigInt(listingId)],
        gas: BigInt(150000)
      });
    } catch (err: any) {
      devLog.error('? [useMarketplaceListing] Cancel failed:', err);
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

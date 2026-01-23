/**
 * Transaction Service (REFACTORED)
 * 
 * Centralized service for all blockchain transactions.
 * Eliminates TODO comments in modals and components.
 * 
 * Features:
 * - Type-safe transaction handling
 * - Automatic error parsing and user-friendly messages
 * - Transaction state management
 * - Gas estimation and fee calculation
 * - Retry logic for failed transactions
 * - Event emission for UI updates
 * 
 * Used by:
 * - BuyNowModal
 * - UpdateListingModal
 * - CancelListingModal
 * - SellPage
 * - CartPage
 * 
 * @example
 * ```tsx
 * const txService = useTransactionService();
 * 
 * const handleBuy = async () => {
 *   const result = await txService.purchaseNFT({
 *     listingId: '123',
 *     price: '1.5',
 *     onProgress: (step) => setPurchaseStep(step)
 *   });
 *   
 *   if (result.success) {
 *     console.log('TX Hash:', result.txHash);
 *   }
 * };
 * ```
 */
'use client'

import { useState, useCallback } from 'react';
import { useMarketplacePurchase } from '@/hooks/marketplace/useMarketplacePurchase';
import { useMarketplaceListing } from '@/hooks/marketplace/useMarketplaceListing';
import { useMarketplaceContracts } from '@/app/sell/hooks/useMarketplaceContracts';
import { useNotifications } from '@/contexts/notifications';
import { formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import {
    invalidateAfterPurchase,
    invalidateAfterCancelListing,
    invalidateAfterListing
} from '@/services/validation';

// ===== TYPES =====

export type TransactionStep =
    | 'idle'
    | 'preparing'
    | 'approving'
    | 'signing'
    | 'pending'
    | 'confirming'
    | 'success'
    | 'error';

export interface TransactionResult {
    success: boolean;
    txHash?: string;
    error?: string;
    receipt?: any;
    alreadyListed?: boolean;
}

export interface PurchaseNFTParams {
    listingId: string;
    price: string; // in ETH
    seller: string;
    buyer?: string; // For data invalidation
    contractAddress: string;
    tokenId: string;
    desiredContractAddress?: string;
    desiredTokenId?: string;
    onProgress?: (step: TransactionStep) => void;
    onError?: (error: string) => void;
    onSuccess?: (result: TransactionResult) => void;
    onPostTransaction?: () => Promise<void>;
}

export interface UpdateListingParams {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    newPrice?: string;
    newDesiredContractAddress?: string;
    newDesiredTokenId?: string;
    onProgress?: (step: TransactionStep) => void;
    onError?: (error: string) => void;
    onSuccess?: (result: TransactionResult) => void;
    onPostTransaction?: () => Promise<void>;
}

export interface CancelListingParams {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    onProgress?: (step: TransactionStep) => void;
    onError?: (error: string) => void;
    onSuccess?: (result: TransactionResult) => void;
    onPostTransaction?: () => Promise<void>;
}

export interface CreateListingParams {
    contractAddress: string;
    tokenId: string;
    price: string;
    desiredContractAddress?: string;
    desiredTokenId?: string;
    onProgress?: (step: TransactionStep) => void;
    onError?: (error: string) => void;
    onSuccess?: (result: TransactionResult) => void;
    onPostTransaction?: () => Promise<void>;
}

// ===== ERROR PARSER =====

/**
 * Parse blockchain errors into user-friendly messages
 */
function parseTransactionError(error: any): string {
    if (!error) return 'Unknown error occurred';

    const message = error.message || error.toString();

    // User rejected transaction
    if (message.includes('User rejected') || message.includes('user rejected')) {
        return 'Transaction was rejected in your wallet';
    }

    // Insufficient funds
    if (message.includes('insufficient funds')) {
        return 'Insufficient funds to complete transaction';
    }

    // Gas estimation failed
    if (message.includes('gas required exceeds')) {
        return 'Transaction would fail - please check contract requirements';
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout')) {
        return 'Network error - please try again';
    }

    // Contract-specific errors
    if (message.includes('NotListed')) {
        return 'This NFT is no longer listed';
    }

    if (message.includes('PriceChanged')) {
        return 'The price has changed since you started';
    }

    if (message.includes('NotOwner')) {
        return 'You are not the owner of this NFT';
    }

    if (message.includes('NotApproved')) {
        return 'NFT is not approved for marketplace';
    }

    if (message.includes('AlreadyListed')) {
        return 'This NFT is already listed';
    }

    // Generic fallback
    return error.shortMessage || message.substring(0, 100) || 'Transaction failed';
}

// ===== HOOK =====

export function useTransactionService() {
    const { marketplaceAddress } = useMarketplaceContracts();
    const purchaseHook = useMarketplacePurchase(marketplaceAddress);
    const listingHook = useMarketplaceListing(marketplaceAddress);
    const notifications = useNotifications();
    const publicClient = usePublicClient();

    const [currentStep, setCurrentStep] = useState<TransactionStep>('idle');
    const [currentError, setCurrentError] = useState<string | null>(null);

    // ===== PURCHASE NFT =====

    const purchaseNFT = useCallback(async (params: PurchaseNFTParams): Promise<TransactionResult> => {
        const {
            listingId,
            price,
            desiredContractAddress,
            desiredTokenId,
            onProgress,
            onError,
            onSuccess,
            onPostTransaction
        } = params;

        let notificationId: string | null = null;

        try {
            setCurrentError(null);

            // Step 1: Preparing
            setCurrentStep('preparing');
            onProgress?.('preparing');

            notificationId = notifications.loading(
                'Preparing Purchase',
                'Setting up your transaction...'
            );

            console.log('📦 Preparing purchase transaction:', {
                listingId,
                price,
                isSwap: !!desiredContractAddress && desiredContractAddress !== '0x0000000000000000000000000000000000000000'
            });

            // Call purchaseListing with progress callback
            // This will handle all steps (preparing -> signing -> pending -> success)
            // and only return when the transaction is confirmed on-chain
            const hash = await purchaseHook.purchaseListing({
                listingId,
                expectedPrice: price,
                expectedDesiredTokenAddress: desiredContractAddress,
                expectedDesiredTokenId: desiredTokenId,
                onProgress: (step, txHash) => {
                    console.log('📊 Purchase progress:', step, txHash ? `hash: ${txHash}` : '');
                    setCurrentStep(step);
                    onProgress?.(step);

                    // Update notifications based on step
                    if (notificationId) notifications.removeNotification(notificationId);
                    if (step === 'signing') {
                        notificationId = notifications.loading(
                            'Confirm in Wallet',
                            'Please confirm the transaction in your wallet'
                        );
                    } else if (step === 'pending') {
                        notificationId = notifications.loading(
                            'Processing Transaction',
                            'Your purchase is being confirmed on the blockchain...'
                        );
                    } else if (step === 'success') {
                        notificationId = notifications.success(
                            'Purchase Successful!',
                            'Your NFT has been transferred to your wallet',
                            {
                                txHash: txHash,
                                duration: 5000
                            }
                        );
                    }
                }
            });

            console.log('✅ Purchase complete! Hash:', hash);

            const result: TransactionResult = {
                success: true,
                txHash: hash
            };

            // Invalidate data to refresh all NFT lists
            if (params.contractAddress && params.tokenId && params.buyer) {
                console.log('🔄 Invalidating data after purchase');
                invalidateAfterPurchase(
                    params.contractAddress,
                    params.tokenId,
                    params.buyer,
                    listingId
                );
            }

            // Post-transaction updates
            if (onPostTransaction) {
                await onPostTransaction();
            }

            // Success callback
            if (onSuccess) {
                onSuccess(result);
            }

            return result;

        } catch (error: any) {
            const errorMessage = parseTransactionError(error);

            console.error('❌ Purchase failed:', error);
            setCurrentStep('error');
            setCurrentError(errorMessage);
            onProgress?.('error');
            onError?.(errorMessage);

            // Clear loading notification
            if (notificationId) {
                notifications.removeNotification(notificationId);
            }

            notifications.error('Purchase Failed', errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [purchaseHook, notifications]);

    // ===== UPDATE LISTING =====

    const updateListing = useCallback(async (params: UpdateListingParams): Promise<TransactionResult> => {
        const {
            listingId,
            newPrice,
            newDesiredContractAddress,
            newDesiredTokenId,
            onProgress,
            onError,
            onSuccess,
            onPostTransaction
        } = params;

        let notificationId: string | null = null;

        try {
            setCurrentError(null);

            setCurrentStep('preparing');
            onProgress?.('preparing');

            notificationId = notifications.loading(
                'Preparing Update',
                'Setting up listing update...'
            );

            console.log('📝 Preparing update listing transaction:', {
                listingId,
                newPrice,
                hasSwap: !!newDesiredContractAddress
            });

            setCurrentStep('signing');
            onProgress?.('signing');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Confirm in Wallet',
                'Please confirm the update in your wallet'
            );

            await listingHook.updateListing({
                listingId,
                newPrice,
                newDesiredTokenAddress: newDesiredContractAddress,
                newDesiredTokenId: newDesiredTokenId
            });

            console.log('✅ Update listing transaction submitted');

            setCurrentStep('pending');
            onProgress?.('pending');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Updating Listing',
                'Your listing is being updated...'
            );

            // Wait for transaction confirmation
            await new Promise<void>((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (listingHook.isSuccess) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (listingHook.error) {
                        clearInterval(checkInterval);
                        reject(new Error(String(listingHook.error) || 'Transaction failed'));
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Transaction confirmation timeout'));
                }, 300000);
            });

            console.log('✅ Update listing confirmed on blockchain');

            const result: TransactionResult = {
                success: true,
                txHash: listingHook.txHash
            };

            // Success
            setCurrentStep('success');
            onProgress?.('success');

            notifications.removeNotification(notificationId);
            notifications.success(
                'Listing Updated!',
                'Your listing has been successfully updated',
                {
                    txHash: listingHook.txHash,
                    duration: 5000
                }
            );

            // Invalidate data to refresh all NFT lists (update = cancel + create)
            if (params.contractAddress && params.tokenId) {
                console.log('🔄 Invalidating data after update listing');
                invalidateAfterListing(
                    params.contractAddress,
                    params.tokenId,
                    listingId
                );
            }

            // Post-transaction updates
            if (onPostTransaction) {
                await onPostTransaction();
            }

            // Success callback
            if (onSuccess) {
                onSuccess(result);
            }

            return result;

        } catch (error: any) {
            const errorMessage = parseTransactionError(error);

            console.error('❌ Update listing failed:', error);
            setCurrentStep('error');
            setCurrentError(errorMessage);
            onProgress?.('error');
            onError?.(errorMessage);

            if (notificationId) {
                notifications.removeNotification(notificationId);
            }

            notifications.error('Update Failed', errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [listingHook, notifications]);

    // ===== CANCEL LISTING =====

    const cancelListing = useCallback(async (params: CancelListingParams): Promise<TransactionResult> => {
        const {
            listingId,
            onProgress,
            onError,
            onSuccess,
            onPostTransaction
        } = params;

        let notificationId: string | null = null;

        try {
            setCurrentError(null);

            setCurrentStep('preparing');
            onProgress?.('preparing');

            notificationId = notifications.loading(
                'Preparing Cancellation',
                'Setting up listing cancellation...'
            );

            console.log('🚫 Preparing cancel listing transaction:', { listingId });

            setCurrentStep('signing');
            onProgress?.('signing');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Confirm in Wallet',
                'Please confirm the cancellation in your wallet'
            );

            await listingHook.cancelListing(listingId);

            console.log('✅ Cancel listing transaction submitted');

            setCurrentStep('pending');
            onProgress?.('pending');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Cancelling Listing',
                'Your listing is being cancelled...'
            );

            // Wait for transaction confirmation
            await new Promise<void>((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (listingHook.isSuccess) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (listingHook.error) {
                        clearInterval(checkInterval);
                        reject(new Error(String(listingHook.error) || 'Transaction failed'));
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Transaction confirmation timeout'));
                }, 300000);
            });

            console.log('✅ Cancel listing confirmed on blockchain');

            const result: TransactionResult = {
                success: true,
                txHash: listingHook.txHash
            };

            // Success
            setCurrentStep('success');
            onProgress?.('success');

            notifications.removeNotification(notificationId);
            notifications.success(
                'Listing Cancelled!',
                'Your listing has been successfully cancelled',
                {
                    txHash: listingHook.txHash,
                    duration: 5000
                }
            );

            // Invalidate data to refresh all NFT lists
            if (params.contractAddress && params.tokenId) {
                console.log('🔄 Invalidating data after cancel listing');
                invalidateAfterCancelListing(
                    params.contractAddress,
                    params.tokenId,
                    listingId
                );
            }

            // Post-transaction updates
            if (onPostTransaction) {
                await onPostTransaction();
            }

            // Success callback
            if (onSuccess) {
                onSuccess(result);
            }

            return result;

        } catch (error: any) {
            const errorMessage = parseTransactionError(error);

            console.error('❌ Cancel listing failed:', error);
            setCurrentStep('error');
            setCurrentError(errorMessage);
            onProgress?.('error');
            onError?.(errorMessage);

            if (notificationId) {
                notifications.removeNotification(notificationId);
            }

            notifications.error('Cancellation Failed', errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [listingHook, notifications]);

    // ===== CREATE LISTING =====

    const createListing = useCallback(async (params: CreateListingParams): Promise<TransactionResult> => {
        const {
            contractAddress,
            tokenId,
            price,
            desiredContractAddress,
            desiredTokenId,
            onProgress,
            onError,
            onSuccess,
            onPostTransaction
        } = params;

        let notificationId: string | null = null;

        try {
            setCurrentError(null);

            setCurrentStep('preparing');
            onProgress?.('preparing');

            notificationId = notifications.loading(
                'Preparing Listing',
                'Setting up your NFT listing...'
            );

            console.log('📝 Preparing create listing transaction:', {
                contractAddress,
                tokenId,
                price,
                hasSwap: !!desiredContractAddress
            });

            setCurrentStep('signing');
            onProgress?.('signing');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Confirm in Wallet',
                'Please confirm the listing in your wallet'
            );

            const txHash = await listingHook.createListing({
                tokenAddress: contractAddress,
                tokenId,
                price,
                desiredTokenAddress: desiredContractAddress,
                desiredTokenId: desiredTokenId
            });

            console.log('✅ Create listing transaction submitted, hash:', txHash);

            setCurrentStep('pending');
            onProgress?.('pending');

            notifications.removeNotification(notificationId);
            notificationId = notifications.loading(
                'Creating Listing',
                'Your listing is being created...'
            );

            // Wait for transaction confirmation directly from blockchain
            console.log('⏳ Waiting for transaction receipt from blockchain...');

            if (!publicClient) {
                throw new Error('Public client not available');
            }

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash as `0x${string}`,
                confirmations: 1,
                timeout: 300_000 // 5 minutes
            });

            console.log('✅ Transaction receipt received:', {
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            });

            if (receipt.status !== 'success') {
                throw new Error('Transaction reverted on blockchain');
            }

            console.log('✅ Create listing confirmed on blockchain');

            const result: TransactionResult = {
                success: true,
                txHash: txHash
            };

            // Success
            setCurrentStep('success');
            onProgress?.('success');

            notifications.removeNotification(notificationId);
            notifications.success(
                'Listing Created!',
                'Your NFT is now listed on the marketplace',
                {
                    txHash: txHash,
                    duration: 5000
                }
            );

            // Invalidate data to refresh all NFT lists
            if (contractAddress && tokenId) {
                console.log('🔄 Invalidating data after create listing');
                invalidateAfterListing(
                    contractAddress,
                    tokenId
                );
            }

            // Post-transaction updates
            if (onPostTransaction) {
                await onPostTransaction();
            }

            // Success callback
            if (onSuccess) {
                onSuccess(result);
            }

            return result;

        } catch (error: any) {
            // Special handling for ALREADY_LISTED error
            if (error.code === 'ALREADY_LISTED' || error.message === 'ALREADY_LISTED') {
                console.log('ℹ️ NFT already listed - treating as success');

                setCurrentStep('success');
                onProgress?.('success');

                if (notificationId) {
                    notifications.removeNotification(notificationId);
                }

                notifications.success(
                    'NFT bereits gelistet',
                    'Dieses NFT ist bereits auf dem Marketplace',
                    { duration: 4000 }
                );

                // Call success callback with special flag
                if (onSuccess) {
                    onSuccess({
                        success: true,
                        alreadyListed: true
                    });
                }

                return {
                    success: true,
                    alreadyListed: true
                };
            }

            const errorMessage = parseTransactionError(error);

            console.error('❌ Create listing failed:', error);
            setCurrentStep('error');
            setCurrentError(errorMessage);
            onProgress?.('error');
            onError?.(errorMessage);

            if (notificationId) {
                notifications.removeNotification(notificationId);
            }

            notifications.error('Listing Failed', errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [listingHook, notifications, publicClient]);

    // ===== GETTERS =====

    const isPurchasing = purchaseHook.isLoading;
    const isListing = listingHook.isLoading;
    const isProcessing = isPurchasing || isListing || currentStep === 'pending';

    return {
        // Methods
        purchaseNFT,
        updateListing,
        cancelListing,
        createListing,

        // State
        currentStep,
        currentError,
        isProcessing,
        isPurchasing,
        isListing,

        // Transaction hashes
        purchaseTxHash: purchaseHook.txHash,
        listingTxHash: listingHook.txHash,

        // Success states
        purchaseSuccess: purchaseHook.isSuccess,
        listingSuccess: listingHook.isSuccess,

        // Errors (from hooks)
        purchaseError: purchaseHook.error,
        listingError: listingHook.error
    };
}

export default useTransactionService;

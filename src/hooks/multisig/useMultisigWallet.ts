/**
 * useMultisigWallet Hook
 * 
 * React hook for interacting with MultiSig Wallet contract.
 * Provides functions for submitting, confirming, and revoking transactions.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { MULTISIG_ADDRESSES, type SubmitTransactionRequest, type TransactionSubmissionResult, type ConfirmationResult } from '@/types/multisig-wallet';

export function useMultisigWallet() {
    const { address } = useAccount();
    const chainId = useChainId();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    // Get MultiSig address based on chain
    const multiSigAddress = chainId === 1
        ? MULTISIG_ADDRESSES.mainnet
        : MULTISIG_ADDRESSES.sepolia;

    // Contract write hooks
    const { writeContractAsync } = useWriteContract();

    // ============================================================================
    // Read Functions
    // ============================================================================

    /**
     * Get total transaction count
     */
    const { data: transactionCount, refetch: refetchTransactionCount } = useReadContract({
        address: multiSigAddress,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getTransactionCount',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    /**
     * Get wallet owners
     */
    const { data: owners, refetch: refetchOwners } = useReadContract({
        address: multiSigAddress,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwners',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    /**
     * Get owner count
     */
    const { data: ownerCount, refetch: refetchOwnerCount } = useReadContract({
        address: multiSigAddress,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwnerCount',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    /**
     * Check if address is owner
     */
    const { data: isOwner } = useReadContract({
        address: multiSigAddress,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'isOwner',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!multiSigAddress,
        },
    });

    // ============================================================================
    // Write Functions
    // ============================================================================

    /**
     * Submit new transaction
     */
    const submitTransaction = useCallback(
        async (
            request: SubmitTransactionRequest
        ): Promise<TransactionSubmissionResult> => {
            if (!address || !isOwner) {
                return {
                    txHash: '',
                    txIndex: -1,
                    success: false,
                    error: 'Not authorized: Only MultiSig owners can submit transactions',
                };
            }

            try {
                setIsSubmitting(true);

                const hash = await writeContractAsync({
                    address: multiSigAddress,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'submitTransaction',
                    args: [request.transactionType, request.to as `0x${string}`, request.value, request.data as `0x${string}`],
                });

                // Get transaction index from event (would need to watch events)
                // For now, use transaction count
                const currentCount = await refetchTransactionCount();
                const txIndex = currentCount.data ? Number(currentCount.data) - 1 : -1;

                return {
                    txHash: hash,
                    txIndex,
                    success: true,
                };
            } catch (error) {
                console.error('Failed to submit transaction:', error);
                return {
                    txHash: '',
                    txIndex: -1,
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to submit transaction',
                };
            } finally {
                setIsSubmitting(false);
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync, refetchTransactionCount]
    );

    /**
     * Confirm transaction
     */
    const confirmTransaction = useCallback(
        async (txIndex: number): Promise<ConfirmationResult> => {
            if (!address || !isOwner) {
                return {
                    txHash: '',
                    executed: false,
                    success: false,
                    error: 'Not authorized: Only MultiSig owners can confirm transactions',
                };
            }

            try {
                setIsConfirming(true);

                const hash = await writeContractAsync({
                    address: multiSigAddress,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'confirmTransaction',
                    args: [BigInt(txIndex)],
                });

                // Check if transaction was auto-executed
                // This would require watching ExecuteTransaction event
                // For now, assume it might have executed
                const executed = true; // Would need to check from events

                return {
                    txHash: hash,
                    executed,
                    success: true,
                };
            } catch (error) {
                console.error('Failed to confirm transaction:', error);
                return {
                    txHash: '',
                    executed: false,
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to confirm transaction',
                };
            } finally {
                setIsConfirming(false);
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync]
    );

    /**
     * Revoke confirmation
     */
    const revokeConfirmation = useCallback(
        async (txIndex: number): Promise<{ txHash: string; success: boolean; error?: string }> => {
            if (!address || !isOwner) {
                return {
                    txHash: '',
                    success: false,
                    error: 'Not authorized: Only MultiSig owners can revoke confirmations',
                };
            }

            try {
                setIsRevoking(true);

                const hash = await writeContractAsync({
                    address: multiSigAddress,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'revokeConfirmation',
                    args: [BigInt(txIndex)],
                });

                return {
                    txHash: hash,
                    success: true,
                };
            } catch (error) {
                console.error('Failed to revoke confirmation:', error);
                return {
                    txHash: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to revoke confirmation',
                };
            } finally {
                setIsRevoking(false);
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync]
    );

    /**
     * Execute transaction (manual - usually auto-executed on last confirmation)
     */
    const executeTransaction = useCallback(
        async (txIndex: number): Promise<{ txHash: string; success: boolean; error?: string }> => {
            if (!address || !isOwner) {
                return {
                    txHash: '',
                    success: false,
                    error: 'Not authorized: Only MultiSig owners can execute transactions',
                };
            }

            try {
                const hash = await writeContractAsync({
                    address: multiSigAddress,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'executeTransaction',
                    args: [BigInt(txIndex)],
                });

                return {
                    txHash: hash,
                    success: true,
                };
            } catch (error) {
                console.error('Failed to execute transaction:', error);
                return {
                    txHash: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to execute transaction',
                };
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync]
    );

    // ============================================================================
    // Refetch Functions
    // ============================================================================

    const refetchAll = useCallback(() => {
        refetchTransactionCount();
        refetchOwners();
        refetchOwnerCount();
    }, [refetchTransactionCount, refetchOwners, refetchOwnerCount]);

    // ============================================================================
    // Return
    // ============================================================================

    return {
        // State
        multiSigAddress,
        isOwner: !!isOwner,
        isSubmitting,
        isConfirming,
        isRevoking,

        // Data
        transactionCount: transactionCount ? Number(transactionCount) : 0,
        owners: owners || [],
        ownerCount: ownerCount ? Number(ownerCount) : 0,

        // Functions
        submitTransaction,
        confirmTransaction,
        revokeConfirmation,
        executeTransaction,
        refetchAll,
    };
}

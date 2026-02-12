/**
 * useMultisigWallet Hook
 * 
 * React hook for interacting with MultiSig Wallet contract.
 * Provides functions for submitting, confirming, and revoking transactions.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId, usePublicClient } from 'wagmi';
import { decodeAbiParameters, decodeEventLog } from 'viem';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { getMultisigAddress } from '@/config';
import { MULTISIG_ADDRESSES, TransactionType, type SubmitTransactionRequest, type TransactionSubmissionResult, type ConfirmationResult } from '@/types';
import { devLog } from '@/utils';

export function useMultisigWallet() {
    const { address } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    const extractRevertReason = (error: any): string | null => {
        const data = error?.data || error?.cause?.data;
        if (typeof data !== 'string') return null;

        if (data.startsWith('0x08c379a0') && data.length >= 10) {
            try {
                const [reason] = decodeAbiParameters([{ type: 'string' }], `0x${data.slice(10)}`);
                return typeof reason === 'string' ? reason : null;
            } catch {
                return null;
            }
        }

        if (data.startsWith('0x4e487b71') && data.length >= 10) {
            try {
                const [code] = decodeAbiParameters([{ type: 'uint256' }], `0x${data.slice(10)}`);
                return `Panic: 0x${BigInt(code).toString(16)}`;
            } catch {
                return null;
            }
        }

        return null;
    };

    const formatSimulationError = (error: any): string => {
        const decodedReason = extractRevertReason(error);
        if (decodedReason) return decodedReason;

        const metaMessages = Array.isArray(error?.metaMessages)
            ? error.metaMessages.join(' | ')
            : '';

        return (
            metaMessages
            || error?.shortMessage
            || error?.details
            || error?.message
            || 'Simulation failed'
        );
    };

    // Get MultiSig address based on chain
    const multiSigAddress = chainId
        ? (getMultisigAddress(chainId) || (chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia))
        : undefined;

    // Contract write hooks
    const { writeContractAsync } = useWriteContract();

    // ============================================================================
    // Read Functions
    // ============================================================================

    /**
     * Get wallet owners
     */
    const { data: owners, refetch: refetchOwners } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
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
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
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
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
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

                if (publicClient) {
                    if (!multiSigAddress) {
                        return {
                            txHash: '',
                            txIndex: -1,
                            success: false,
                            error: 'MultiSig address not configured for this network.',
                        };
                    }

                    const code = await publicClient.getBytecode({
                        address: multiSigAddress as `0x${string}`
                    });

                    if (!code || code === '0x') {
                        return {
                            txHash: '',
                            txIndex: -1,
                            success: false,
                            error: `No MultiSig contract found at ${multiSigAddress} on this network. Check your chain.`
                        };
                    }

                    try {
                        await publicClient.simulateContract({
                            address: multiSigAddress as `0x${string}`,
                            abi: MULTISIG_WALLET_ABI,
                            functionName: 'submitTransaction',
                            args: [
                                request.transactionType,
                                request.to as `0x${string}`,
                                request.value,
                                request.data as `0x${string}`
                            ],
                            account: address as `0x${string}`
                        });
                    } catch (simulationError: any) {
                        const reason = formatSimulationError(simulationError);

                        if (request.transactionType === TransactionType.Other) {
                            try {
                                await publicClient.simulateContract({
                                    address: multiSigAddress as `0x${string}`,
                                    abi: MULTISIG_WALLET_ABI,
                                    functionName: 'submitTransaction',
                                    args: [
                                        7,
                                        request.to as `0x${string}`,
                                        request.value,
                                        request.data as `0x${string}`
                                    ],
                                    account: address as `0x${string}`
                                });

                                return {
                                    txHash: '',
                                    txIndex: -1,
                                    success: false,
                                    error: 'MultiSig enum mismatch detected. This deployment expects TransactionType.Other = 7. Please confirm the deployed contract enum order.'
                                };
                            } catch {
                                // Fall through to original simulation error.
                            }
                        }

                        return {
                            txHash: '',
                            txIndex: -1,
                            success: false,
                            error: `Simulation failed: ${reason}`
                        };
                    }
                }

                const hash = await writeContractAsync({
                    address: multiSigAddress as `0x${string}`,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'submitTransaction',
                    args: [request.transactionType, request.to as `0x${string}`, request.value, request.data as `0x${string}`],
                    gas: BigInt(500000)
                });

                let txIndex = -1;
                if (publicClient) {
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    if (receipt.status !== 'success') {
                        return {
                            txHash: hash,
                            txIndex: -1,
                            success: false,
                            error: 'Transaction reverted. Please check parameters or permissions.'
                        };
                    }

                    if (multiSigAddress) {
                        for (const log of receipt.logs) {
                            if (log.address.toLowerCase() !== multiSigAddress.toLowerCase()) continue;
                            try {
                                const decoded = decodeEventLog({
                                    abi: MULTISIG_WALLET_ABI,
                                    data: log.data,
                                    topics: log.topics
                                });

                                if (decoded.eventName === 'SubmitTransaction') {
                                    const args = decoded.args as { txIndex?: bigint };
                                    if (args?.txIndex !== undefined) {
                                        txIndex = Number(args.txIndex);
                                        break;
                                    }
                                }
                            } catch {
                                // Ignore non-matching logs
                            }
                        }
                    }
                }

                return {
                    txHash: hash,
                    txIndex,
                    success: true,
                };
            } catch (error) {
                const decodedReason = extractRevertReason(error);
                devLog.error('Failed to submit transaction:', error);
                return {
                    txHash: '',
                    txIndex: -1,
                    success: false,
                    error: decodedReason || (error instanceof Error ? error.message : 'Failed to submit transaction'),
                };
            } finally {
                setIsSubmitting(false);
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync, publicClient]
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
                    address: multiSigAddress as `0x${string}`,
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
                devLog.error('Failed to confirm transaction:', error);
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
                    address: multiSigAddress as `0x${string}`,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'revokeConfirmation',
                    args: [BigInt(txIndex)],
                });

                return {
                    txHash: hash,
                    success: true,
                };
            } catch (error) {
                devLog.error('Failed to revoke confirmation:', error);
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
     * Deactivate your pending transaction
     */
    const deactivateMyPendingTransaction = useCallback(
        async (txIndex: number): Promise<{ txHash: string; success: boolean; error?: string }> => {
            if (!address || !isOwner) {
                return {
                    txHash: '',
                    success: false,
                    error: 'Not authorized: Only MultiSig owners can deactivate transactions',
                };
            }

            try {
                setIsDeactivating(true);

                const hash = await writeContractAsync({
                    address: multiSigAddress as `0x${string}`,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'deactivateMyPendingTransaction',
                    args: [BigInt(txIndex)],
                });

                if (publicClient) {
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    if (receipt.status !== 'success') {
                        return {
                            txHash: hash,
                            success: false,
                            error: 'Transaction reverted. Please check permissions.'
                        };
                    }
                }

                return {
                    txHash: hash,
                    success: true,
                };
            } catch (error) {
                devLog.error('Failed to deactivate transaction:', error);
                return {
                    txHash: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to deactivate transaction',
                };
            } finally {
                setIsDeactivating(false);
            }
        },
        [address, isOwner, multiSigAddress, writeContractAsync, publicClient]
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
                    address: multiSigAddress as `0x${string}`,
                    abi: MULTISIG_WALLET_ABI,
                    functionName: 'executeTransaction',
                    args: [BigInt(txIndex)],
                });

                return {
                    txHash: hash,
                    success: true,
                };
            } catch (error) {
                devLog.error('Failed to execute transaction:', error);
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
        refetchOwners();
        refetchOwnerCount();
    }, [refetchOwners, refetchOwnerCount]);

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
        isDeactivating,

        // Data
        transactionCount: null,
        owners: owners || [],
        ownerCount: ownerCount ? Number(ownerCount) : 0,

        // Functions
        submitTransaction,
        confirmTransaction,
        revokeConfirmation,
        deactivateMyPendingTransaction,
        executeTransaction,
        refetchAll,
    };
}

/**
 * useMultisigPendingTransactions Hook
 * 
 * Fetches and manages pending MultiSig transactions with enhanced metadata.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { getMultisigAddress } from '@/config';
import { MULTISIG_ADDRESSES, type PendingMultiSigTx, type MultiSigTransaction } from '@/types';
import { enhancePendingTransaction } from '@/services/multisig';

export function useMultisigPendingTransactions(diamondAddress: string) {
    const { address } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const [pendingTxs, setPendingTxs] = useState<PendingMultiSigTx[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const multiSigAddress = chainId
        ? (getMultisigAddress(chainId) || (chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia))
        : undefined;

    // Get transaction count
    const { data: txCount } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getTransactionCount',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    // Get owner count
    const { data: ownerCount } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwnerCount',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    // Get owners
    const { data: owners } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwners',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    // Fetch all pending transactions
    const fetchPendingTransactions = useCallback(async () => {
        if (!multiSigAddress || !txCount || !ownerCount || !owners || !address || !publicClient) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const count = Number(txCount);
            const transactions: PendingMultiSigTx[] = [];

            // Fetch each transaction
            for (let i = 0; i < count; i++) {
                try {
                    const tx = await publicClient.readContract({
                        address: multiSigAddress as `0x${string}`,
                        abi: MULTISIG_WALLET_ABI,
                        functionName: 'getTransaction',
                        args: [BigInt(i)],
                    }) as MultiSigTransaction;

                    // Only include active transactions
                    if (!tx.isActive) continue;

                    // Get confirmations for this transaction
                    const confirmations: string[] = [];
                    for (const owner of owners as string[]) {
                        const isConfirmed = await publicClient.readContract({
                            address: multiSigAddress as `0x${string}`,
                            abi: MULTISIG_WALLET_ABI,
                            functionName: 'isConfirmed',
                            args: [BigInt(i), owner as `0x${string}`],
                        });

                        if (isConfirmed) {
                            confirmations.push(owner);
                        }
                    }

                    // Enhance transaction with metadata
                    const enhanced = enhancePendingTransaction(
                        tx,
                        i,
                        confirmations,
                        address,
                        Number(ownerCount),
                        diamondAddress
                    );

                    transactions.push(enhanced);
                } catch (err) {
                    console.error(`Failed to fetch transaction ${i}:`, err);
                }
            }

            setPendingTxs(transactions);
        } catch (err) {
            console.error('Failed to fetch pending transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    }, [txCount, ownerCount, owners, address, publicClient, multiSigAddress, diamondAddress]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchPendingTransactions();
    }, [fetchPendingTransactions]);

    return {
        pendingTransactions: pendingTxs,
        isLoading,
        error,
        refetch: fetchPendingTransactions,
    };
}

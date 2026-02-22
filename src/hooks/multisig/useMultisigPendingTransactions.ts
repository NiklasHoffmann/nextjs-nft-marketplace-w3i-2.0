/**
 * useMultisigPendingTransactions Hook
 * 
 * Fetches and manages pending MultiSig transactions with enhanced metadata.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useChainId, usePublicClient } from 'wagmi';
import { decodeEventLog, parseAbiItem } from 'viem';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { getMultisigAddress } from '@/config';
import { MULTISIG_ADDRESSES, type PendingMultiSigTx, type MultiSigTransaction } from '@/types';
import { enhancePendingTransaction } from '@/services/multisig';
import { devLog } from '@/utils';

type PendingTransactionsOptions = {
    includeInactive?: boolean;
    maxTransactions?: number;
};

const ALCHEMY_FREE_TIER_LOG_RANGE = BigInt(9);
const MAX_LOG_QUERY_REQUESTS = BigInt(150);

export function useMultisigPendingTransactions(
    diamondAddress: string,
    options?: PendingTransactionsOptions
) {
    const { address } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const [pendingTxs, setPendingTxs] = useState<PendingMultiSigTx[]>([]);
    const [recentTxs, setRecentTxs] = useState<PendingMultiSigTx[]>([]);
    const [eventFallbackCount, setEventFallbackCount] = useState(0);
    const [eventFallbackError, setEventFallbackError] = useState<string | null>(null);
    const [eventFallbackRange, setEventFallbackRange] = useState<string>('');
    const [eventFallbackTotal, setEventFallbackTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const includeInactive = options?.includeInactive ?? false;
    const maxTransactions = options?.maxTransactions ?? 25;

    const multiSigAddress = chainId
        ? (getMultisigAddress(chainId) || (chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia))
        : undefined;

    // Get owner count
    const { data: ownerCount, error: ownerCountError } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwnerCount',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    // Get owners
    const { data: owners, error: ownersError } = useReadContract({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwners',
        query: {
            enabled: !!multiSigAddress,
        },
    });

    // Fetch all pending transactions
    const fetchPendingTransactions = useCallback(async () => {
        const hasOwnerCount = ownerCount !== undefined && ownerCount !== null;
        const hasOwners = Array.isArray(owners);
        const userAddress = address || '0x0000000000000000000000000000000000000000';

        if (!multiSigAddress || !hasOwnerCount || !hasOwners || !publicClient) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setEventFallbackError(null);

            const latestBlock = await publicClient.getBlockNumber();
            const maxSafeBlockWindow = (ALCHEMY_FREE_TIER_LOG_RANGE + BigInt(1)) * MAX_LOG_QUERY_REQUESTS;
            const blockWindow = BigInt(50000) > maxSafeBlockWindow ? maxSafeBlockWindow : BigInt(50000);
            const fromBlock = latestBlock > blockWindow ? latestBlock - blockWindow : BigInt(0);
            setEventFallbackRange(`${fromBlock.toString()}-${latestBlock.toString()}`);

            const submitEvent = parseAbiItem(
                'event SubmitTransaction(uint8 indexed _transactionType, uint256 indexed txIndex, address indexed to, uint256 value, address tokenAddress, uint256 amountOrTokenId, address owner, bytes data)'
            );

            const logs: Awaited<ReturnType<typeof publicClient.getLogs>> = [];
            let chunkStart = fromBlock;

            while (chunkStart <= latestBlock) {
                const chunkEnd = chunkStart + ALCHEMY_FREE_TIER_LOG_RANGE > latestBlock
                    ? latestBlock
                    : chunkStart + ALCHEMY_FREE_TIER_LOG_RANGE;

                const chunkLogs = await publicClient.getLogs({
                    address: multiSigAddress as `0x${string}`,
                    event: submitEvent,
                    fromBlock: chunkStart,
                    toBlock: chunkEnd,
                });

                logs.push(...chunkLogs);
                chunkStart = chunkEnd + BigInt(1);
            }

            const txIndexSet = new Set<number>();
            const logByIndex = new Map<number, typeof logs[number]>();
            for (const log of logs) {
                let index: number | undefined;
                try {
                    const decoded = decodeEventLog({
                        abi: [submitEvent],
                        data: log.data,
                        topics: log.topics,
                    });
                    if (decoded.eventName !== 'SubmitTransaction') continue;
                    const args = decoded.args as { txIndex?: bigint };
                    index = args.txIndex !== undefined ? Number(args.txIndex) : undefined;
                } catch {
                    continue;
                }
                if (index === undefined || Number.isNaN(index)) continue;
                txIndexSet.add(index);
                logByIndex.set(index, log);
            }

            const txIndices = Array.from(txIndexSet).sort((a, b) => a - b);
            setEventFallbackTotal(txIndices.length);

            const recentIndices = txIndices.slice(-maxTransactions);
            const transactions: PendingMultiSigTx[] = [];
            const recentTransactions: PendingMultiSigTx[] = [];

            const readTransactionByIndex = async (txIndex: number): Promise<MultiSigTransaction | null> => {
                try {
                    const result = await publicClient.readContract({
                        address: multiSigAddress as `0x${string}`,
                        abi: MULTISIG_WALLET_ABI,
                        functionName: 'transactions',
                        args: [BigInt(txIndex)],
                    }) as any;

                    return {
                        transactionType: Number(result.transactionType ?? result[0]),
                        isActive: Boolean(result.isActive ?? result[1]),
                        numConfirmations: BigInt(result.numConfirmations ?? result[2]),
                        owner: String(result.owner ?? result[3]),
                        to: String(result.to ?? result[4]),
                        value: BigInt(result.value ?? result[5]),
                        data: String(result.data ?? result[6]),
                    } as MultiSigTransaction;
                } catch (readError) {
                    devLog.error(`Failed to fetch transaction ${txIndex}:`, readError);
                    return null;
                }
            };

            const indicesToLoad = includeInactive ? recentIndices : txIndices;
            for (const index of indicesToLoad) {
                const tx = await readTransactionByIndex(index);
                const log = logByIndex.get(index);

                if (!tx && log) {
                    let args: {
                        _transactionType?: number;
                        txIndex?: bigint;
                        to?: `0x${string}`;
                        value?: bigint;
                        owner?: `0x${string}`;
                        data?: `0x${string}`;
                    } = {};

                    try {
                        const decoded = decodeEventLog({
                            abi: [submitEvent],
                            data: log.data,
                            topics: log.topics,
                        });
                        if (decoded.eventName === 'SubmitTransaction') {
                            args = decoded.args as typeof args;
                        }
                    } catch {
                        // Keep empty args fallback
                    }

                    const fallbackTx: MultiSigTransaction = {
                        transactionType: Number(args._transactionType ?? 0),
                        isActive: false,
                        numConfirmations: BigInt(0),
                        owner: String(args.owner || ''),
                        to: String(args.to || ''),
                        value: BigInt(args.value ?? 0),
                        data: String(args.data || '0x'),
                    };

                    const enhancedFallback = enhancePendingTransaction(
                        fallbackTx,
                        index,
                        [],
                        userAddress,
                        Number(ownerCount),
                        diamondAddress
                    );

                    recentTransactions.push(enhancedFallback);
                    continue;
                }

                if (!tx) continue;

                // Get confirmations for this transaction
                const confirmations: string[] = [];
                for (const owner of owners as string[]) {
                    try {
                        const isConfirmed = await publicClient.readContract({
                            address: multiSigAddress as `0x${string}`,
                            abi: MULTISIG_WALLET_ABI,
                            functionName: 'isConfirmed',
                            args: [BigInt(index), owner as `0x${string}`],
                        });

                        if (isConfirmed) {
                            confirmations.push(owner);
                        }
                    } catch (confirmError) {
                        devLog.error(`Failed to fetch confirmations for ${index}:`, confirmError);
                    }
                }

                const enhanced = enhancePendingTransaction(
                    tx,
                    index,
                    confirmations,
                    userAddress,
                    Number(ownerCount),
                    diamondAddress
                );

                if (tx.isActive) {
                    transactions.push(enhanced);
                }

                if (includeInactive && recentIndices.includes(index)) {
                    recentTransactions.push(enhanced);
                }
            }

            setPendingTxs(transactions);
            if (includeInactive) {
                setRecentTxs(recentTransactions.reverse());
                setEventFallbackCount(recentIndices.length);
                setEventFallbackError(null);
            } else {
                setEventFallbackCount(0);
                setEventFallbackError(null);
                setEventFallbackRange('');
                setEventFallbackTotal(0);
            }
        } catch (err) {
            devLog.error('Failed to fetch pending transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    }, [ownerCount, owners, address, publicClient, multiSigAddress, diamondAddress, includeInactive, maxTransactions]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchPendingTransactions();
    }, [fetchPendingTransactions]);

    return {
        pendingTransactions: pendingTxs,
        recentTransactions: recentTxs,
        isLoading,
        error,
        refetch: fetchPendingTransactions,
        stats: {
            multisigAddress: multiSigAddress || '',
            ownerCount: ownerCount ? Number(ownerCount) : 0,
            owners: Array.isArray(owners) ? owners : [],
            eventFallbackCount,
            eventFallbackError,
            eventFallbackRange,
            eventFallbackTotal,
            ownerCountError: ownerCountError?.message || '',
            ownersError: ownersError?.message || '',
        },
    };
}

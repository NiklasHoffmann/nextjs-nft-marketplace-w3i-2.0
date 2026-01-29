/**
 * NFT Approval Hook
 * 
 * Global hook for managing NFT approval for marketplace operations.
 * Provides comprehensive approval management with optimistic updates.
 * 
 * @module hooks/nfts
 * 
 * Features:
 * - Check current approval status (single & all)
 * - Approve single NFT
 * - Approve all NFTs from collection
 * - Smart approval (only if needed)
 * - Automatic status refetch after approval
 * 
 * @example
 * ```tsx
 * const approval = useNFTApproval({
 *   nftContractAddress: '0x...',
 *   tokenId: '123',
 *   marketplaceAddress: '0x...',
 *   enabled: true
 * });
 * 
 * // Check status
 * if (!approval.isFullyApproved) {
 *   await approval.ensureApproval(true); // preferAll
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc721Abi } from 'viem';

export interface UseNFTApprovalParams {
    /** NFT contract address to approve */
    nftContractAddress: `0x${string}`;
    /** Token ID to approve (for single approval) */
    tokenId: string;
    /** Marketplace address to approve for */
    marketplaceAddress: `0x${string}`;
    /** Enable/disable hook execution */
    enabled?: boolean;
}

export interface UseNFTApprovalReturn {
    /** NFT is approved (either single or all) */
    isFullyApproved: boolean;
    /** This specific token is approved */
    isSingleApproved: boolean;
    /** All tokens from collection are approved */
    isApprovedForAll: boolean;
    /** Transaction is pending or confirming */
    isLoading: boolean;
    /** Transaction is confirming on-chain */
    isConfirming: boolean;
    /** Transaction succeeded */
    isSuccess: boolean;
    /** Approve single NFT */
    approveSingle: () => Promise<void>;
    /** Approve all NFTs from collection */
    approveAll: () => Promise<void>;
    /** Smart approval - only approves if needed */
    ensureApproval: (preferAll?: boolean) => Promise<boolean>;
    /** Manually refetch approval status */
    refetch: () => void;
    /** Transaction hash (if approval was sent) */
    txHash?: `0x${string}`;
}

/**
 * Hook for managing NFT approval status and actions
 */
export function useNFTApproval({
    nftContractAddress,
    tokenId,
    marketplaceAddress,
    enabled = true
}: UseNFTApprovalParams): UseNFTApprovalReturn {
    const { address: userAddress } = useAccount();

    // Check approval for specific token
    const { data: approvedAddress, refetch: refetchApproved } = useReadContract({
        address: nftContractAddress,
        abi: erc721Abi,
        functionName: 'getApproved',
        args: [BigInt(tokenId)],
        query: {
            enabled: enabled && !!tokenId && tokenId !== '0'
        }
    });

    // Check approval for all tokens
    const { data: isApprovedForAll, refetch: refetchApprovedForAll } = useReadContract({
        address: nftContractAddress,
        abi: erc721Abi,
        functionName: 'isApprovedForAll',
        args: userAddress && marketplaceAddress ? [userAddress, marketplaceAddress] : undefined,
        query: {
            enabled: enabled && !!userAddress && !!marketplaceAddress
        }
    });

    // Write contract hooks for approval
    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash
    });

    // Computed approval status
    const isSingleApproved = approvedAddress === marketplaceAddress;
    const isFullyApproved = isSingleApproved || (isApprovedForAll as boolean);

    /**
     * Approve single NFT for marketplace
     */
    const approveSingle = async (): Promise<void> => {
        if (!enabled) {
            throw new Error('Approval hook is disabled');
        }

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'approve',
                args: [marketplaceAddress, BigInt(tokenId)]
            });
        } catch (err: any) {
            console.error('❌ Single approval failed:', err);
            throw err;
        }
    };

    /**
     * Approve all NFTs from collection for marketplace
     */
    const approveAll = async (): Promise<void> => {
        if (!enabled) {
            throw new Error('Approval hook is disabled');
        }

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'setApprovalForAll',
                args: [marketplaceAddress, true]
            });
        } catch (err: any) {
            console.error('❌ ApproveAll failed:', err);
            throw err;
        }
    };

    /**
     * Smart approval - only approves if needed
     * @param preferAll - Prefer approving all tokens instead of single
     * @returns true if approved (or already approved), false if failed
     */
    const ensureApproval = async (preferAll = false): Promise<boolean> => {
        if (isFullyApproved) {
            return true; // Already approved!
        }

        try {
            if (preferAll) {
                await approveAll();
            } else {
                await approveSingle();
            }
            return true;
        } catch (err) {
            console.error('❌ ensureApproval failed:', err);
            return false;
        }
    };

    // Refetch approval status after successful transaction
    useEffect(() => {
        if (!isSuccess) return;

        // Small delay to ensure blockchain state is updated
        const timer = setTimeout(() => {
            refetchApproved();
            refetchApprovedForAll();
        }, 1000);

        return () => clearTimeout(timer);
    }, [isSuccess, refetchApproved, refetchApprovedForAll]);

    return {
        // Status
        isFullyApproved,
        isSingleApproved,
        isApprovedForAll: isApprovedForAll as boolean,

        // Loading states
        isLoading: isPending || isConfirming,
        isConfirming,
        isSuccess,

        // Actions
        approveSingle,
        approveAll,
        ensureApproval,

        // Manual refetch
        refetch: () => {
            refetchApproved();
            refetchApprovedForAll();
        },

        // Transaction
        txHash
    };
}

/**
 * NFT Approval Hook
 * 
 * Manages NFT approval for marketplace listing
 * Features:
 * - Check current approval status (single & all)
 * - Approve single NFT
 * - Approve all NFTs from collection
 * - Smart approval (only if needed)
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc721Abi } from 'viem';

interface UseNFTApprovalParams {
    nftContractAddress: `0x${string}`;
    tokenId: string;
    marketplaceAddress: `0x${string}`;
    enabled?: boolean;
}

export function useNFTApproval({
    nftContractAddress,
    tokenId,
    marketplaceAddress,
    enabled = true
}: UseNFTApprovalParams) {
    const { address: userAddress } = useAccount();

    // Check approval for specific token
    const { data: approvedAddress, refetch: refetchApproved } = useReadContract({
        address: nftContractAddress,
        abi: erc721Abi,
        functionName: 'getApproved',
        args: [BigInt(tokenId)],
        query: {
            enabled: enabled && !!tokenId
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

    // Approve single NFT
    const approveSingle = async () => {
        if (!enabled) return;

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'approve',
                args: [marketplaceAddress, BigInt(tokenId)]
            });
        } catch (err: any) {
            throw err;
        }
    };

    // Approve all NFTs from collection
    const approveAll = async () => {
        if (!enabled) return;

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'setApprovalForAll',
                args: [marketplaceAddress, true]
            });
        } catch (err: any) {
            throw err;
        }
    };

    // Smart approval - only approves if needed
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
            return false;
        }
    };

    // Refetch approval status after successful transaction
    useEffect(() => {
        if (isSuccess) {
            // Refetch approval status
            refetchApproved();
            refetchApprovedForAll();
        }
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

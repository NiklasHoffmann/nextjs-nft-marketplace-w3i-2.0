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
import { useNotifications } from '@/contexts/notifications';

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
    const notifications = useNotifications();
    const { success, error: notifyError, loading: notifyLoading } = notifications;
    const [loadingNotificationId, setLoadingNotificationId] = useState<string | null>(null);

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

        const notifId = notifyLoading('Approving NFT', 'Please confirm the transaction in your wallet...');
        setLoadingNotificationId(notifId);

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'approve',
                args: [marketplaceAddress, BigInt(tokenId)]
            });
        } catch (err: any) {
            // Clear loading notification and show error
            notifications.clearAll();
            notifyError('Approval Cancelled', err.message || 'NFT approval was cancelled');
            setLoadingNotificationId(null);
            throw err;
        }
    };

    // Approve all NFTs from collection
    const approveAll = async () => {
        if (!enabled) return;

        const notifId = notifyLoading('Approving Collection', 'Please confirm the transaction in your wallet...');
        setLoadingNotificationId(notifId);

        try {
            await writeContract({
                address: nftContractAddress,
                abi: erc721Abi,
                functionName: 'setApprovalForAll',
                args: [marketplaceAddress, true]
            });
        } catch (err: any) {
            // Clear loading notification and show error
            notifications.clearAll();
            notifyError('Approval Cancelled', err.message || 'Collection approval was cancelled');
            setLoadingNotificationId(null);
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
        if (isSuccess && loadingNotificationId) {
            // Clear all pending notifications (removes loading notification)
            notifications.clearAll();
            
            // Show success
            success('Approval Successful', 'Your NFT is now approved for listing!', { duration: 5000 });
            setLoadingNotificationId(null);

            // Refetch approval status
            refetchApproved();
            refetchApprovedForAll();
        }
    }, [isSuccess, loadingNotificationId, success, notifications, refetchApproved, refetchApprovedForAll]);

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

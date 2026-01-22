/**
 * useAdminMode Hook
 * 
 * Detects current admin mode (Single-Owner vs MultiSig).
 */

'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { DIAMOND_ABI } from '@/config/abis/diamond';
import { MULTISIG_ADDRESSES, AdminMode, type AdminModeInfo } from '@/types/multisig-wallet';

export function useAdminMode(diamondAddress: string): AdminModeInfo {
    const { address } = useAccount();
    const chainId = useChainId();

    const multiSigAddress = chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia;

    // Get current owner
    const { data: currentOwner } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'owner',
    });

    // Get pending owner (if ownership transfer is in progress)
    const { data: pendingOwner } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPendingOwner',
    });

    // Determine mode
    const isMultiSigOwner = currentOwner?.toLowerCase() === multiSigAddress.toLowerCase();
    const isTransitioning = pendingOwner && pendingOwner !== '0x0000000000000000000000000000000000000000';
    const isSingleOwner = !isMultiSigOwner && !isTransitioning;

    let mode: AdminMode;
    if (isTransitioning) {
        mode = AdminMode.TRANSITIONING;
    } else if (isMultiSigOwner) {
        mode = AdminMode.MULTISIG;
    } else {
        mode = AdminMode.SINGLE_OWNER;
    }

    // Can use direct admin if single owner and user is the owner
    const canUseDirect = mode === AdminMode.SINGLE_OWNER && address?.toLowerCase() === currentOwner?.toLowerCase();

    return {
        mode,
        currentOwner: currentOwner as string,
        pendingOwner: pendingOwner as string | undefined,
        isMultiSigOwner,
        canUseDirect,
        multiSigAddress,
    };
}

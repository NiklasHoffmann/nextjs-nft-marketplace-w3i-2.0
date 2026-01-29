/**
 * WETH Hook
 * 
 * Features:
 * - Wrap ETH → WETH (deposit)
 * - Unwrap WETH → ETH (withdraw)
 * - Check WETH balance
 * - Check/Set WETH allowance for marketplace
 * - Approve WETH for marketplace spending
 */

'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { WETH_ABI } from '@/config/abis/weth';
import { getWETHAddress } from '@/config/tokens';

interface UseWETHParams {
    marketplaceAddress?: `0x${string}`;
}

export function useWETH({ marketplaceAddress }: UseWETHParams = {}) {
    const { address: userAddress } = useAccount();
    const chainId = useChainId();
    const wethAddress = getWETHAddress(chainId);

    const [error, setError] = useState<string | null>(null);

    // Read WETH balance
    const { data: wethBalance, refetch: refetchBalance } = useReadContract({
        address: wethAddress,
        abi: WETH_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!wethAddress }
    });

    // Read ETH balance
    const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
        address: userAddress,
    });

    // Read allowance (for marketplace)
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: wethAddress,
        abi: WETH_ABI,
        functionName: 'allowance',
        args: userAddress && marketplaceAddress ? [userAddress, marketplaceAddress] : undefined,
        query: { enabled: !!userAddress && !!marketplaceAddress && !!wethAddress }
    });

    // Write contracts
    const { 
        writeContract: wrapETH, 
        data: wrapHash, 
        isPending: isWrapping 
    } = useWriteContract();

    const { 
        writeContract: unwrapWETH, 
        data: unwrapHash, 
        isPending: isUnwrapping 
    } = useWriteContract();

    const { 
        writeContract: approveWETH, 
        data: approveHash, 
        isPending: isApproving 
    } = useWriteContract();

    // Wait for confirmations
    const { isLoading: isWrapConfirming, isSuccess: isWrapSuccess } = useWaitForTransactionReceipt({
        hash: wrapHash,
    });

    const { isLoading: isUnwrapConfirming, isSuccess: isUnwrapSuccess } = useWaitForTransactionReceipt({
        hash: unwrapHash,
    });

    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    /**
     * Wrap ETH to WETH
     */
    const wrap = async (amount: string) => {
        if (!wethAddress) {
            setError('WETH not available on this network');
            return;
        }

        try {
            setError(null);
            const amountWei = parseEther(amount);

            await wrapETH({
                address: wethAddress,
                abi: WETH_ABI,
                functionName: 'deposit',
                value: amountWei
            });
        } catch (err: any) {
            setError(err.message || 'Failed to wrap ETH');
            throw err;
        }
    };

    /**
     * Unwrap WETH to ETH
     */
    const unwrap = async (amount: string) => {
        if (!wethAddress) {
            setError('WETH not available on this network');
            return;
        }

        try {
            setError(null);
            const amountWei = parseEther(amount);

            await unwrapWETH({
                address: wethAddress,
                abi: WETH_ABI,
                functionName: 'withdraw',
                args: [amountWei]
            });
        } catch (err: any) {
            setError(err.message || 'Failed to unwrap WETH');
            throw err;
        }
    };

    /**
     * Approve WETH for marketplace
     */
    const approve = async (amount?: string) => {
        if (!wethAddress || !marketplaceAddress) {
            setError('WETH or marketplace not available');
            return;
        }

        try {
            setError(null);
            // Default: approve max uint256 for unlimited approval
            const amountWei = amount ? parseEther(amount) : BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

            await approveWETH({
                address: wethAddress,
                abi: WETH_ABI,
                functionName: 'approve',
                args: [marketplaceAddress, amountWei]
            });
        } catch (err: any) {
            setError(err.message || 'Failed to approve WETH');
            throw err;
        }
    };

    /**
     * Check if user has enough WETH allowance
     */
    const hasEnoughAllowance = (requiredAmount: string): boolean => {
        if (!allowance) return false;
        const required = parseEther(requiredAmount);
        return (allowance as bigint) >= required;
    };

    return {
        // Addresses
        wethAddress,
        
        // Balances
        wethBalance: wethBalance ? formatEther(wethBalance as bigint) : '0',
        wethBalanceWei: (wethBalance as bigint) || BigInt(0),
        ethBalance: ethBalance?.value ? formatEther(ethBalance.value) : '0',
        ethBalanceWei: ethBalance?.value || BigInt(0),
        
        // Allowance
        allowance: allowance ? formatEther(allowance as bigint) : '0',
        allowanceWei: (allowance as bigint) || BigInt(0),
        hasEnoughAllowance,
        
        // Actions
        wrap,
        unwrap,
        approve,
        
        // Refetch functions
        refetchBalance,
        refetchEthBalance,
        refetchAllowance,
        
        // State
        isWrapping: isWrapping || isWrapConfirming,
        isUnwrapping: isUnwrapping || isUnwrapConfirming,
        isApproving: isApproving || isApproveConfirming,
        isWrapSuccess,
        isUnwrapSuccess,
        isApproveSuccess,
        
        // Transaction hashes
        wrapHash,
        unwrapHash,
        approveHash,
        
        error
    };
}

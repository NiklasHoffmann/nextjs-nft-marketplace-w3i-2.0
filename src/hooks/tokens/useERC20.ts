/**
 * Generic ERC20 Hook
 * 
 * Works with any ERC20 token (WETH, USDC, DAI, etc.)
 * 
 * Features:
 * - Check token balance
 * - Check/Set token allowance
 * - Approve token for spender
 */

'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { WETH_ABI } from '@/config/abis/weth'; // ERC20 standard ABI

interface UseERC20Params {
    tokenAddress?: `0x${string}`;
    spenderAddress?: `0x${string}`; // e.g., marketplace address
    decimals?: number; // Token decimals (18 for WETH/DAI, 6 for USDC)
}

export function useERC20({ tokenAddress, spenderAddress, decimals = 18 }: UseERC20Params = {}) {
    const { address: userAddress } = useAccount();
    const [error, setError] = useState<string | null>(null);

    // Read token balance
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: tokenAddress,
        abi: WETH_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!tokenAddress }
    });

    // Read allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: WETH_ABI,
        functionName: 'allowance',
        args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
        query: { enabled: !!userAddress && !!spenderAddress && !!tokenAddress }
    });

    // Write contract
    const { 
        writeContract: approveToken, 
        data: approveHash, 
        isPending: isApproving 
    } = useWriteContract();

    // Wait for confirmation
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    /**
     * Approve token for spender
     */
    const approve = async (amount?: string) => {
        if (!tokenAddress || !spenderAddress) {
            setError('Token or spender not available');
            return;
        }

        try {
            setError(null);
            // Default: approve max uint256 for unlimited approval
            const amountWei = amount 
                ? parseUnits(amount, decimals)
                : BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

            await approveToken({
                address: tokenAddress,
                abi: WETH_ABI,
                functionName: 'approve',
                args: [spenderAddress, amountWei]
            });
        } catch (err: any) {
            setError(err.message || 'Failed to approve token');
            throw err;
        }
    };

    /**
     * Check if user has enough balance
     */
    const hasEnoughBalance = (requiredAmount: string): boolean => {
        if (!balance) return false;
        try {
            const required = parseUnits(requiredAmount, decimals);
            return balance >= required;
        } catch {
            return false;
        }
    };

    /**
     * Check if spender has enough allowance
     */
    const hasEnoughAllowance = (requiredAmount: string): boolean => {
        if (!allowance) return false;
        try {
            const required = parseUnits(requiredAmount, decimals);
            return allowance >= required;
        } catch {
            return false;
        }
    };

    return {
        // Addresses
        tokenAddress,
        spenderAddress,
        
        // Balances
        balance: balance ? formatUnits(balance as bigint, decimals) : '0',
        balanceWei: (balance as bigint) || BigInt(0),
        
        // Allowance
        allowance: allowance ? formatUnits(allowance as bigint, decimals) : '0',
        allowanceWei: (allowance as bigint) || BigInt(0),
        hasEnoughAllowance,
        hasEnoughBalance,
        
        // Actions
        approve,
        
        // Refetch functions
        refetchBalance,
        refetchAllowance,
        
        // State
        isApproving: isApproving || isApproveConfirming,
        isApproveSuccess,
        
        // Transaction hash
        approveHash,
        
        error
    };
}

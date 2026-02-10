"use client";

import { useCallback, useMemo, useState } from 'react';
import { getAddress, isAddress } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BUYER_WHITELIST_FACET_ABI } from '@/config/abis/buyer-whitelist-facet';

interface BuyerWhitelistResult {
    isLoading: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error?: Error | null;
    txHash?: `0x${string}`;
    addBuyers: (listingId: string, buyers: string[]) => Promise<`0x${string}`>;
    removeBuyers: (listingId: string, buyers: string[]) => Promise<`0x${string}`>;
}

export function useBuyerWhitelist(marketplaceAddress: `0x${string}`): BuyerWhitelistResult {
    const [isLoading, setIsLoading] = useState(false);
    const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
    const { writeContractAsync, error: writeError } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess,
        error: receiptError
    } = useWaitForTransactionReceipt({
        hash: pendingHash
    });

    const error = useMemo(() => receiptError || writeError, [receiptError, writeError]);

    const normalizeAddresses = useCallback((buyers: string[]): `0x${string}`[] => {
        const valid = buyers
            .map((buyer) => buyer.trim())
            .filter(Boolean)
            .map((buyer) => {
                if (!isAddress(buyer)) {
                    throw new Error(`Invalid address: ${buyer}`);
                }
                return getAddress(buyer) as `0x${string}`;
            });

        return Array.from(new Set(valid));
    }, []);

    const addBuyers = useCallback(async (listingId: string, buyers: string[]) => {
        if (!listingId) {
            throw new Error('Listing ID is required');
        }
        if (!buyers.length) {
            throw new Error('At least one buyer address is required');
        }

        const normalized = normalizeAddresses(buyers);
        try {
            setIsLoading(true);
            const hash = await writeContractAsync({
                address: marketplaceAddress,
                abi: BUYER_WHITELIST_FACET_ABI,
                functionName: 'addBuyerWhitelistAddresses',
                args: [BigInt(listingId), normalized]
            });
            setPendingHash(hash as `0x${string}`);
            return hash as `0x${string}`;
        } finally {
            setIsLoading(false);
        }
    }, [marketplaceAddress, normalizeAddresses, writeContractAsync]);

    const removeBuyers = useCallback(async (listingId: string, buyers: string[]) => {
        if (!listingId) {
            throw new Error('Listing ID is required');
        }
        if (!buyers.length) {
            throw new Error('At least one buyer address is required');
        }

        const normalized = normalizeAddresses(buyers);
        try {
            setIsLoading(true);
            const hash = await writeContractAsync({
                address: marketplaceAddress,
                abi: BUYER_WHITELIST_FACET_ABI,
                functionName: 'removeBuyerWhitelistAddresses',
                args: [BigInt(listingId), normalized]
            });
            setPendingHash(hash as `0x${string}`);
            return hash as `0x${string}`;
        } finally {
            setIsLoading(false);
        }
    }, [marketplaceAddress, normalizeAddresses, writeContractAsync]);

    return {
        isLoading,
        isConfirming,
        isSuccess,
        error,
        txHash: pendingHash,
        addBuyers,
        removeBuyers
    };
}

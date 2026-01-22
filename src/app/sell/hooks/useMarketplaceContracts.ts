/**
 * Marketplace Contracts Hook
 * 
 * Provides marketplace contract address and write functions
 */

'use client';

import { useMarketplaceListing } from '@/hooks/marketplace/useMarketplaceListing';
import { useChainId } from 'wagmi';
import { NETWORK_CONFIG } from '@/config/networks';

export function useMarketplaceContracts() {
    const chainId = useChainId();

    // Get marketplace address from network mapping
    const marketplaceAddress = (NETWORK_CONFIG[chainId.toString()]?.NftMarketplace?.[0] || '') as `0x${string}`;

    const { createListing, isLoading, error, isSuccess, isError, txHash } = useMarketplaceListing(marketplaceAddress);

    return {
        marketplaceAddress,
        createListing,
        isLoading,
        isSuccess,
        isError,
        txHash,
        error
    };
}

/**
 * Marketplace Contracts Hook
 * 
 * Provides marketplace contract address and write functions
 */

'use client';

import { useMarketplaceListing } from '@/hooks/marketplace/useMarketplaceListing';
import { useChainId } from 'wagmi';
import networkMapping from '@/constants/network.mapping.json';

type NetworkMapping = {
    [key: string]: {
        NftMarketplace: string[];
    };
};

export function useMarketplaceContracts() {
    const chainId = useChainId();
    
    // Get marketplace address from network mapping
    const mapping = networkMapping as NetworkMapping;
    const marketplaceAddress = (mapping[chainId.toString()]?.NftMarketplace?.[0] || '') as `0x${string}`;
    
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

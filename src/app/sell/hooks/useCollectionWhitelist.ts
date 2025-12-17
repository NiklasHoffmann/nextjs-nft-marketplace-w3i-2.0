/**
 * Collection Whitelist Hook
 * 
 * Checks if NFT collection is whitelisted on marketplace
 */

'use client';

import { useReadContract } from 'wagmi';
import { useMarketplaceData } from '@/hooks/marketplace';

interface UseCollectionWhitelistParams {
    collectionAddress: `0x${string}`;
    marketplaceAddress: `0x${string}`;
    enabled?: boolean;
}

export function useCollectionWhitelist({
    collectionAddress,
    marketplaceAddress,
    enabled = true
}: UseCollectionWhitelistParams) {
    const { useCollectionWhitelist: checkWhitelist } = useMarketplaceData(marketplaceAddress);
    
    const { data: isWhitelisted, isLoading, refetch } = checkWhitelist(collectionAddress);

    return {
        isWhitelisted: isWhitelisted as boolean,
        isLoading,
        refetch
    };
}

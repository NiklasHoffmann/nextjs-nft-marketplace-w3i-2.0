/**
 * Utility functions for filtering NFTs
 */

import { AggregatedNFT } from '@/types/core/core-nft-modern';

interface FilterOptions {
    searchTerm?: string;
    showOnlyUnlisted?: boolean;
}

/**
 * Filters NFTs based on search term and listing status
 */
export function filterNFTs(
    nfts: AggregatedNFT[],
    options: FilterOptions = {}
): AggregatedNFT[] {
    const { searchTerm = '', showOnlyUnlisted = false } = options;

    const filtered = nfts.filter(nft => {
        // Filter by listing status
        if (showOnlyUnlisted && nft.listed) {
            return false;
        }

        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchesName = nft.meta?.name?.toLowerCase().includes(search);
            const matchesTokenId = nft.tokenId?.toLowerCase().includes(search);
            const matchesAddress = nft.contractAddress?.toLowerCase().includes(search);

            return matchesName || matchesTokenId || matchesAddress;
        }

        return true;
    });

    // Log filtering statistics
    if (showOnlyUnlisted) {
        const listedCount = nfts.filter(n => n.listed).length;
        if (listedCount > 0) {
            console.log(`🔍 Filtered out ${listedCount} already listed NFTs`);
        }
    }

    return filtered;
}

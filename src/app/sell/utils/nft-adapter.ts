/**
 * Adapter utilities for converting between different NFT types
 */

import { AggregatedNFT } from '@/types/core/core-nft-modern';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

/**
 * Converts a WalletNFT to AggregatedNFT format for sell components
 */
export function walletNFTToAggregatedNFT(nft: WalletNFT): AggregatedNFT {
    return {
        key: `${nft.contractAddress}-${nft.tokenId}`,
        contractAddress: nft.contractAddress as `0x${string}`,
        tokenId: nft.tokenId,
        listed: nft.isListed || false,
        listing: nft.isListed ? {
            listingId: nft.listingId || '',
            contractAddress: nft.contractAddress as `0x${string}`,
            tokenId: nft.tokenId,
            isListed: true,
            price: nft.listingPrice || '0',
            seller: (nft.seller as `0x${string}`) || '0x0000000000000000000000000000000000000000',
            buyer: null,
            desiredContractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
            desiredTokenId: null
        } : undefined,
        core: {
            contractAddress: nft.contractAddress as `0x${string}`,
            tokenId: nft.tokenId,
            tokenURI: null,
            name: nft.contractName || null,
            owner: null,
            symbol: nft.contractSymbol || null,
            contractName: nft.contractName || null,
            contractSymbol: nft.contractSymbol || null
        },
        meta: {
            name: nft.name || undefined,
            description: nft.description || undefined,
            image: nft.image || undefined,
            animationUrl: nft.animationUrl || undefined
        },
        lastUpdated: Date.now(),
        sources: {
            blockchain: true,
            metadata: true,
            marketplace: nft.hasMarketplaceData,
            social: false,
            insights: nft.hasInsightsData
        },
        insight: nft.insights ? {
            contractAddress: nft.contractAddress as `0x${string}`,
            customTitle: nft.insights.customTitle,
            category: nft.insights.category,
            tags: [],
            cardDescription: nft.insights.cardDescriptions,
            rarity: nft.insights.rarity,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        } : undefined
    };
}

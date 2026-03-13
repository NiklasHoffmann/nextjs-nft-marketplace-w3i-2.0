import type { FilterableNFTItem, NFTScrollItem } from '@/types/marketplace';
import type { EnrichedNFTDocument } from '@/types/marketplace/enriched-nft';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';

export function normalizePrice(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'toString' in value) {
        return String(value);
    }
    return String(value);
}

export function mapEnrichedNFTToScrollItem(nft: EnrichedNFTDocument): NFTScrollItem {
    const price = normalizePrice(
        (nft as any).priceTotal
        ?? nft.marketplace?.priceTotal
        ?? (nft as any).price
        ?? nft.marketplace?.price
    );
    const desiredContractAddress =
        (nft as any).desiredContractAddress
        || (nft as any).desiredTokenAddress
        || nft.marketplace?.desiredContractAddress
        || (nft.marketplace as any)?.desiredTokenAddress
        || undefined;
    const desiredTokenId =
        (nft as any).desiredTokenId
        || nft.marketplace?.desiredTokenId
        || undefined;
    const listingType =
        (nft as any).listingType
        || nft.marketplace?.listingType
        || undefined;

    return {
        contractAddress: nft.contractAddress.toLowerCase(),
        tokenId: nft.tokenId,
        price: price || undefined,
        isListed: (nft as any).isListed ?? nft.marketplace?.isListed ?? false,
        listingId: (nft as any).listingId || nft.marketplace?.listingId || undefined,
        seller: (nft as any).seller || nft.marketplace?.seller || undefined,
        buyer: (nft as any).buyer || nft.marketplace?.buyer || undefined,
        desiredContractAddress,
        desiredTokenId,
        listingType,
        chainId: (nft as any).chainId ?? nft.marketplace?.chainId ?? undefined,
        currency: (nft as any).currency || nft.marketplace?.currency || undefined,
        tokenStandard: (nft as any).tokenStandard || nft.marketplace?.tokenStandard || (nft as any).tokenType || null,
        erc1155QuantityListed: (nft as any).erc1155QuantityListed || nft.marketplace?.erc1155QuantityListed || null,
        remainingQuantity: (nft as any).remainingQuantity || nft.marketplace?.remainingQuantity || null,
        unitPrice: (nft as any).unitPrice || nft.marketplace?.unitPrice || null,
        partialBuyEnabled: (nft as any).partialBuyEnabled ?? nft.marketplace?.partialBuyEnabled ?? false,
        metadata: nft.metadata ? {
            name: nft.metadata.name,
            description: nft.metadata.description,
            image: nft.metadata.image,
            animationUrl: nft.metadata.animationUrl,
            externalUrl: nft.metadata.externalUrl,
            attributes: nft.metadata.attributes
        } : undefined,
        insights: nft.insights ? {
            customTitle: nft.insights.customTitle || undefined,
            category: nft.insights.category || undefined,
            tags: nft.insights.tags || undefined,
            rarity: nft.insights.rarity || undefined,
            cardDescriptions: nft.insights.cardDescriptions || undefined,
            projectDescriptions: nft.insights.projectDescriptions || undefined,
            functionalitiesDescriptions: nft.insights.functionalitiesDescriptions || undefined,
            projectWebsite: nft.insights.projectWebsite || undefined,
            projectTwitter: nft.insights.projectTwitter || undefined,
            projectDiscord: nft.insights.projectDiscord || undefined,
            partnerships: nft.insights.partnerships || undefined
        } : undefined,
        contract: nft.contract ? {
            name: nft.contract.name,
            symbol: nft.contract.symbol,
            totalSupply: nft.contract.totalSupply,
            owner: nft.contract.owner,
            tokenURI: nft.contract.tokenURI,
            approved: (nft.contract as any).approvedAddress || null,
            ownerBalance: (nft.contract as any).ownerBalance
        } : undefined
    };
}

export function mapEnrichedNFTToFilterableItem(
    nft: EnrichedNFTDocument,
    fallbackChainId?: number
): FilterableNFTItem {
    const desiredContractAddress =
        (nft as any).desiredContractAddress
        || (nft as any).desiredTokenAddress
        || nft.marketplace?.desiredContractAddress
        || (nft.marketplace as any)?.desiredTokenAddress
        || undefined;
    const desiredTokenId =
        (nft as any).desiredTokenId
        || nft.marketplace?.desiredTokenId
        || undefined;
    const listingType =
        (nft as any).listingType
        || nft.marketplace?.listingType
        || undefined;

    return {
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        price: nft.marketplace?.price || (nft as any).price || null,
        currency: nft.marketplace?.currency || (nft as any).currency || undefined,
        listingType,
        tokenStandard: (nft as any).tokenStandard || nft.marketplace?.tokenStandard || (nft as any).tokenType || null,
        erc1155QuantityListed: (nft as any).erc1155QuantityListed || nft.marketplace?.erc1155QuantityListed || null,
        remainingQuantity: (nft as any).remainingQuantity || nft.marketplace?.remainingQuantity || null,
        unitPrice: (nft as any).unitPrice || nft.marketplace?.unitPrice || null,
        partialBuyEnabled: (nft as any).partialBuyEnabled ?? nft.marketplace?.partialBuyEnabled ?? false,
        chainId: nft.marketplace?.chainId ?? (nft as any).chainId ?? fallbackChainId,
        isListed: nft.marketplace?.isListed ?? false,
        listingId: nft.listingId || undefined,
        seller: nft.marketplace?.seller || undefined,
        buyer: nft.marketplace?.buyer || undefined,
        desiredContractAddress,
        desiredTokenId,
        metadata: nft.metadata ? {
            name: nft.metadata.name || null,
            description: nft.metadata.description || null,
            image: nft.metadata.image || null,
            animationUrl: nft.metadata.animationUrl || null,
            externalUrl: nft.metadata.externalUrl || null,
            attributes: nft.metadata.attributes || []
        } : undefined,
        contract: nft.contract ? {
            name: nft.contract.name || null,
            symbol: nft.contract.symbol || null,
            totalSupply: nft.contract.totalSupply || null,
            owner: nft.contract.owner || null,
            tokenURI: nft.contract.tokenURI || null
        } : undefined,
        insights: nft.insights ? {
            customTitle: nft.insights.customTitle || undefined,
            category: nft.insights.category || undefined,
            tags: nft.insights.tags || [],
            rarity: nft.insights.rarity || undefined,
            cardDescriptions: nft.insights.cardDescriptions || undefined
        } : undefined,
        name: nft.metadata?.name || null,
        category: nft.insights?.category || null,
        rarity: nft.insights?.rarity || null,
        customTitle: nft.insights?.customTitle || null,
        averageRating: (nft as any).stats?.averageRating ?? undefined,
        ratingCount: (nft as any).stats?.ratingCount ?? undefined,
        viewCount: (nft as any).stats?.viewCount ?? undefined,
        likeCount: (nft as any).stats?.likeCount ?? undefined,
        watchlistCount: (nft as any).stats?.watchlistCount ?? undefined
    };
}

export function mapWalletNFTToScrollItem(nft: WalletNFT, connectedWallet?: string | null): NFTScrollItem {
    const desiredContractAddress =
        (nft as any).desiredContractAddress
        || (nft as any).desiredTokenAddress
        || undefined;
    const desiredTokenId =
        (nft as any).desiredTokenId
        || undefined;

    return {
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        price: nft.listingPrice,
        isListed: nft.isListed || false,
        listingId: nft.listingId,
        seller: nft.seller,
        chainId: (nft as any).chainId,
        currency: nft.currency,
        listingType: nft.listingType,
        tokenStandard: (nft as any).listingTokenStandard ?? (nft as any).tokenType ?? null,
        erc1155QuantityListed: (nft as any).erc1155QuantityListed ?? null,
        remainingQuantity: (nft as any).remainingQuantity ?? null,
        unitPrice: (nft as any).unitPrice ?? null,
        partialBuyEnabled: (nft as any).partialBuyEnabled ?? false,
        buyer: undefined,
        desiredContractAddress,
        desiredTokenId,
        name: nft.name || `NFT #${nft.tokenId}`,
        symbol: nft.contractSymbol || undefined,
        category: nft.insights?.category || nft.category || null,
        categories: nft.insights?.category ? [nft.insights.category] : nft.category ? [nft.category] : [],
        description: nft.description || null,
        imageUrl: nft.image || null,
        rarity: nft.insights?.rarity || nft.rarity || null,
        customTitle: nft.insights?.customTitle || null,
        cardDescriptions: nft.insights?.cardDescriptions || null,
        tags: [],
        averageRating: nft.stats?.averageRating ?? undefined,
        ratingCount: nft.stats?.ratingCount ?? undefined,
        likeCount: nft.stats?.likeCount ?? undefined,
        viewCount: nft.stats?.viewCount ?? undefined,
        favoriteCount: nft.stats?.likeCount ?? undefined,
        watchlistCount: nft.stats?.watchlistCount ?? undefined,
        metadata: {
            name: nft.name || null,
            description: nft.description || null,
            image: nft.image || null,
            animationUrl: nft.animationUrl || undefined,
            externalUrl: undefined,
            attributes: nft.attributes || undefined,
        },
        insights: nft.insights ? {
            customTitle: nft.insights.customTitle || undefined,
            category: nft.insights.category || nft.category || undefined,
            tags: [],
            rarity: nft.insights.rarity || nft.rarity || undefined,
            cardDescriptions: nft.insights.cardDescriptions || undefined,
            projectDescriptions: undefined,
            functionalitiesDescriptions: undefined,
            projectWebsite: undefined,
            projectTwitter: undefined,
            projectDiscord: undefined,
            partnerships: [],
        } : undefined,
        contract: {
            name: nft.contractName || null,
            symbol: nft.contractSymbol || null,
            totalSupply: nft.totalSupply || null,
            owner: nft.owner || connectedWallet || null,
            tokenURI: nft.tokenURI || null,
            approved: nft.approved || null,
            ownerBalance: nft.ownerBalance || null,
        },
    };
}

export function mapWalletNFTToFilterableItem(nft: WalletNFT, connectedWallet?: string | null): FilterableNFTItem {
    const scrollItem = mapWalletNFTToScrollItem(nft, connectedWallet);

    return {
        ...scrollItem,
        contractAddress: nft.contractAddress,
        isListed: !!nft.isListed,
        name: nft.name || scrollItem.name || null,
        symbol: nft.contractSymbol || scrollItem.symbol || null,
        category: nft.insights?.category || nft.category || scrollItem.category || null,
        rarity: nft.insights?.rarity || nft.rarity || scrollItem.rarity || null,
        averageRating: nft.stats?.averageRating ?? scrollItem.averageRating ?? null,
        ratingCount: nft.stats?.ratingCount ?? scrollItem.ratingCount ?? null,
        likeCount: nft.stats?.likeCount ?? (scrollItem as any).likeCount ?? null,
        watchlistCount: nft.stats?.watchlistCount ?? scrollItem.watchlistCount ?? null,
        viewCount: nft.stats?.viewCount ?? scrollItem.viewCount ?? null,
        customTitle: nft.insights?.customTitle || scrollItem.customTitle || null,
        cardDescriptions: nft.insights?.cardDescriptions || scrollItem.cardDescriptions || null,
        imageUrl: nft.image || scrollItem.imageUrl || null,
    };
}

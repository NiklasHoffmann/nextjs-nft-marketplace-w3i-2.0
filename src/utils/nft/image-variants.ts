import { extractIpfsInfoFromUrl, resolveNftImageUrl } from './image-url';

export type NFTImageVariant = 'thumb' | 'small' | 'card' | 'detail' | 'original';

export interface NFTImageVariants {
    thumb?: string | null;
    small?: string | null;
    card?: string | null;
    detail?: string | null;
    original?: string | null;
}

export interface NFTImageMeta {
    width?: number | null;
    height?: number | null;
    mimeType?: string | null;
}

export const NFT_IMAGE_VARIANT_WIDTHS: Record<Exclude<NFTImageVariant, 'original'>, number> = {
    thumb: 128,
    small: 220,
    card: 560,
    detail: 1400,
};

const buildIpfsVariantUrl = (sourceUrl: string, width?: number): string | null => {
    const ipfsInfo = extractIpfsInfoFromUrl(sourceUrl);
    if (!ipfsInfo) return null;

    const fullHash = ipfsInfo.path ? `${ipfsInfo.hash}/${ipfsInfo.path}` : ipfsInfo.hash;
    const widthQuery = width ? `&w=${width}` : '';
    return `/api/nft/image/${encodeURIComponent(fullHash)}?v=7${widthQuery}`;
};

export const buildNFTImageVariants = (sourceUrl: string): NFTImageVariants => {
    const normalized = sourceUrl?.trim() || '';
    if (!normalized) return {};

    const ipfsOriginal = buildIpfsVariantUrl(normalized);
    const original = ipfsOriginal || resolveNftImageUrl(normalized, normalized);

    const thumb = buildIpfsVariantUrl(normalized, NFT_IMAGE_VARIANT_WIDTHS.thumb) || original;
    const small = buildIpfsVariantUrl(normalized, NFT_IMAGE_VARIANT_WIDTHS.small) || original;
    const card = buildIpfsVariantUrl(normalized, NFT_IMAGE_VARIANT_WIDTHS.card) || original;
    const detail = buildIpfsVariantUrl(normalized, NFT_IMAGE_VARIANT_WIDTHS.detail) || original;

    return {
        thumb,
        small,
        card,
        detail,
        original,
    };
};

export const getNFTVariantWidth = (variant: NFTImageVariant): number | undefined => {
    if (variant === 'original') return undefined;
    return NFT_IMAGE_VARIANT_WIDTHS[variant];
};

export const resolveNFTImageByVariant = (
    sourceUrl: string,
    variant: NFTImageVariant,
    variants?: NFTImageVariants | null,
    tokenId?: string | number | bigint,
): string => {
    const fromVariants = variants?.[variant] || (variant !== 'original' ? variants?.original : null);
    if (fromVariants) {
        return resolveNftImageUrl(fromVariants, fromVariants, {
            width: getNFTVariantWidth(variant),
            tokenId,
        });
    }

    if (variant === 'original') {
        return resolveNftImageUrl(sourceUrl, sourceUrl, { tokenId });
    }

    return resolveNftImageUrl(sourceUrl, sourceUrl, {
        width: getNFTVariantWidth(variant),
        tokenId,
    });
};

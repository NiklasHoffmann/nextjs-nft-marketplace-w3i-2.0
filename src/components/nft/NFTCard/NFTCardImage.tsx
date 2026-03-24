/**
 * NFTCardImage - Image section for NFT cards
 * Shows NFT image with description side-by-side (50/50 split)
 */

import { memo } from 'react';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import type { NFTImageVariants } from '@/utils';

interface NFTCardImageProps {
    imageUrl: string | null;
    imageVariants?: NFTImageVariants | null;
    tokenId: string;
    descriptions: string[];
    priority?: boolean;
}

export const NFTCardImage = memo<NFTCardImageProps>(({
    imageUrl,
    imageVariants,
    tokenId,
    descriptions,
    priority = false
}) => {
    const hasVariantImage = Boolean(
        imageVariants
        && Object.values(imageVariants).some((value) => typeof value === 'string' && value.trim().length > 0)
    );
    const hasImage = Boolean((imageUrl && imageUrl.trim().length > 0) || hasVariantImage);
    const hasDescription = descriptions.length > 0;

    if (hasImage && !hasDescription) {
        return (
            <div className="h-full w-full min-w-0 flex-1">
                <div className="rounded-md border-2 border-white/50 overflow-hidden relative h-full w-full">
                    <OptimizedNFTImage
                        imageUrl={imageUrl ?? ''}
                        imageVariants={imageVariants}
                        tokenId={tokenId}
                        variant="card"
                        className="object-cover h-full w-full"
                        fill={true}
                        sizes="(max-width: 640px) 86vw, (max-width: 1024px) 36vw, 560px"
                        priority={priority}
                    />
                    <div className="absolute inset-0 rounded-md ring-1 ring-white/20 pointer-events-none"></div>
                </div>
            </div>
        );
    }

    if (!hasImage && hasDescription) {
        return (
            <div className="h-full w-full min-w-0 flex-1">
                <div
                    className="bg-white/95 backdrop-blur-sm pr-1 pt-1 rounded-md shadow-lg text-xs h-full overflow-hidden text-right break-words hyphens-auto"
                    lang="de"
                >
                    {descriptions[0]}
                </div>
            </div>
        );
    }

    if (!hasImage && !hasDescription) {
        return (
            <div className="h-full w-full min-w-0 flex-1">
                <div className="rounded-md border-2 border-white/50 bg-white/80 h-full w-full flex items-center justify-center text-gray-400">
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-1 h-full w-full min-w-0 flex-1">
            <div className="h-full overflow-hidden">
                <div className="rounded-md border-2 border-white/50 overflow-hidden relative h-full w-full">
                    <OptimizedNFTImage
                        imageUrl={imageUrl ?? ''}
                        imageVariants={imageVariants}
                        tokenId={tokenId}
                        variant="small"
                        className="object-cover h-full w-full"
                        fill={true}
                        sizes="220px"
                        priority={priority}
                    />
                    <div className="absolute inset-0 rounded-md ring-1 ring-white/20 pointer-events-none"></div>
                </div>
            </div>

            <div className="min-w-0 h-full">
                <div
                    className="bg-white/95 backdrop-blur-sm pr-1 pt-1 rounded-md shadow-lg text-xs h-full overflow-hidden text-right break-words hyphens-auto"
                    lang="de"
                >
                    {descriptions[0]}
                </div>
            </div>
        </div>
    );
});

NFTCardImage.displayName = 'NFTCardImage';

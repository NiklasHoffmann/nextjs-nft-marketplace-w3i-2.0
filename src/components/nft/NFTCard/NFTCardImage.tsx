/**
 * NFTCardImage - Image section for NFT cards
 * Shows NFT image with description side-by-side (50/50 split)
 */

import { memo } from 'react';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';

interface NFTCardImageProps {
    imageUrl: string | null;
    tokenId: string;
    descriptions: string[];
    priority?: boolean;
}

export const NFTCardImage = memo<NFTCardImageProps>(({
    imageUrl,
    tokenId,
    descriptions,
    priority = false
}) => {
    const hasImage = Boolean(imageUrl);
    const hasDescription = descriptions.length > 0;

    if (hasImage && !hasDescription) {
        return (
            <div className="h-full w-full min-w-0">
                <div className="rounded-md border-2 border-white/50 overflow-hidden relative h-full w-full">
                    <OptimizedNFTImage
                        imageUrl={imageUrl ?? ''}
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
            <div className="h-full w-full min-w-0">
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
        return null;
    }

    return (
        <div className="grid grid-cols-2 gap-1 h-full min-w-0">
            <div className="h-full overflow-hidden">
                <div className="rounded-md border-2 border-white/50 overflow-hidden relative h-full w-full">
                    <OptimizedNFTImage
                        imageUrl={imageUrl ?? ''}
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

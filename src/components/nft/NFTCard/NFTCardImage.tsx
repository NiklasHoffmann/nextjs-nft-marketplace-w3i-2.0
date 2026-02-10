/**
 * NFTCardImage - Image section for NFT cards
 * Shows NFT image with description side-by-side (50/50 split)
 */

import { memo } from 'react';
import OptimizedNFTImage from '../OptimizedNFTImage';

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

    return (
        <div className="flex gap-1 h-full">
            {/* Left: Image - 50% - full height, auto width, center-aligned */}
            {hasImage && (
                <div className="w-1/2 flex justify-center items-stretch overflow-hidden">
                    <div className="rounded-md border-2 border-white/50 backdrop-blur-sm overflow-hidden relative h-full">
                        <OptimizedNFTImage
                            imageUrl={imageUrl ?? ''}
                            tokenId={tokenId}
                            className="object-contain h-full w-auto"
                            fill={false}
                            width={240}
                            height={240}
                            priority={priority}
                        />
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 rounded-md ring-1 ring-white/20 pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* Right: Description - 50% - fills available space */}
            {hasDescription && (
                <div className="w-1/2">
                    <div
                        className="bg-white/95 backdrop-blur-sm pr-1 pt-1 rounded-md shadow-lg text-xs h-full overflow-hidden text-right break-words hyphens-auto"
                        lang="de"
                    >
                        {descriptions[0]}
                    </div>
                </div>
            )}
        </div>
    );
});

NFTCardImage.displayName = 'NFTCardImage';

"use client";

import React from 'react';
import { OptimizedNFTImage } from '@/components/nft';
import { ImagePlaceholderIcon } from '@/components/icons';

interface CollectionCardPreviewProps {
    previewImages?: string[];
    contractAddress: string;
    contractName?: string;
    className?: string;
}

/**
 * Preview image grid for collection cards
 * Shows up to 4 NFT images in a 2x2 grid
 */
export const CollectionCardPreview = React.memo(({
    previewImages,
    contractAddress,
    contractName = 'Collection',
    className,
}: CollectionCardPreviewProps) => {
    const rootClassName = `relative overflow-hidden rounded-md ${className || 'h-52'}`;

    if (!previewImages || previewImages.length === 0) {
        return (
            <div className={rootClassName}>
                <div className="flex items-center justify-center h-full text-gray-500 bg-white/80 border border-black/10 rounded-md">
                    <ImagePlaceholderIcon className="w-14 h-14" />
                </div>
            </div>
        );
    }

    return (
        <div className={rootClassName}>
            <div className="relative z-10 grid grid-cols-2 gap-1 h-full p-0">
                {previewImages.slice(0, 4).map((imageUrl: string, imgIndex: number) => (
                    <div key={imgIndex} className="relative rounded-md overflow-hidden bg-white/90 shadow-sm border border-black/10">
                        <OptimizedNFTImage
                            imageUrl={imageUrl}
                            tokenId={`${contractAddress}-preview-${imgIndex}`}
                            alt={`${contractName} Preview ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                            variant="small"
                            disableVisualEffects={true}
                            fill
                            sizes="(max-width: 640px) 220px, (max-width: 1024px) 220px, 220px"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

CollectionCardPreview.displayName = 'CollectionCardPreview';

export default CollectionCardPreview;

"use client";

import React from 'react';
import { OptimizedNFTImage } from '@/components/nft';
import { ImagePlaceholderIcon } from '@/components/icons';

interface CollectionCardPreviewProps {
    previewImages?: string[];
    contractAddress: string;
    contractName?: string;
}

/**
 * Preview image grid for collection cards
 * Shows up to 4 NFT images in a 2x2 grid
 */
export const CollectionCardPreview = React.memo(({
    previewImages,
    contractAddress,
    contractName = 'Collection',
}: CollectionCardPreviewProps) => {
    if (!previewImages || previewImages.length === 0) {
        return (
            <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md overflow-hidden">
                <div className="flex items-center justify-center h-full text-gray-400">
                    <ImagePlaceholderIcon className="w-14 h-14" />
                </div>
            </div>
        );
    }

    const firstPreviewImage = previewImages[0] || '';

    return (
        <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md overflow-hidden">
            <div className="absolute inset-0">
                <OptimizedNFTImage
                    imageUrl={firstPreviewImage}
                    tokenId={`${contractAddress}-preview-bg`}
                    alt={`${contractName} Background`}
                    className="w-full h-full object-cover"
                    fill
                />
                <div className="absolute inset-0 backdrop-blur-sm bg-white/40" />
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-1 h-full p-1">
                {previewImages.slice(0, 4).map((imageUrl: string, imgIndex: number) => (
                    <div key={imgIndex} className="rounded-md overflow-hidden bg-white shadow-sm border border-black/10">
                        <OptimizedNFTImage
                            imageUrl={imageUrl}
                            tokenId={`${contractAddress}-preview-${imgIndex}`}
                            alt={`${contractName} Preview ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                            width={150}
                            height={150}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

CollectionCardPreview.displayName = 'CollectionCardPreview';

export default CollectionCardPreview;

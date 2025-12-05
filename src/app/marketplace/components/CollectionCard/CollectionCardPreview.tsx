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
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="flex items-center justify-center h-full text-gray-400">
                    <ImagePlaceholderIcon className="w-20 h-20" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="grid grid-cols-2 gap-1 h-full p-2">
                {previewImages.slice(0, 4).map((imageUrl: string, imgIndex: number) => (
                    <div key={imgIndex} className="rounded-lg overflow-hidden bg-white shadow-sm">
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

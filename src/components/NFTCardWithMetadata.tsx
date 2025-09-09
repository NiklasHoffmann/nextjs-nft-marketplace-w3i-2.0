// app/components/NFTCardWithMetadata.tsx
"use client";

import NFTCard from "./NFTCard";
import { useNFTMetadataOptimized } from "../hooks/useNFTMetadataOptimized";

interface NFTCardWithMetadataProps {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    desiredNftAddress: string;
    desiredTokenId: string;
    priority?: boolean;
}

export default function NFTCardWithMetadata(props: NFTCardWithMetadataProps) {
    const { imageUrl, loading, error, cached, stale } = useNFTMetadataOptimized(props.nftAddress, props.tokenId);

    // Show loading state if needed (optional)
    // if (loading) {
    //     return <NFTCardSkeleton />;
    // }

    return (
        <>
            <NFTCard
                {...props}
                imageUrl={imageUrl || undefined}
                priority={props.priority}
            />
            {/* Debug info for development (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 text-xs bg-black/50 text-white px-1">
                    {cached ? '📦' : '🌐'} {stale ? '⏰' : '✅'}
                </div>
            )}
        </>
    );
}

// app/components/NFTCardWithMetadata.tsx
"use client";

import NFTCard from "./01-core-NFTCard";
import { useNFT } from "@/hooks";

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
    enableInsights?: boolean; // New prop for insights integration
}

export default function NFTCardWithMetadata(props: NFTCardWithMetadataProps) {
    const { imageUrl, loading, error } = useNFT(props.nftAddress, props.tokenId);

    return (
        <NFTCard
            {...props}
            imageUrl={imageUrl || undefined}
            priority={props.priority}
            enableInsights={props.enableInsights}
        />
    );
}

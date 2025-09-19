// app/nft/[nftAddress]/page.tsx
// Server component for Next.js 15+ async params handling

import React from "react";
import CollectionPageClient from "./CollectionPageClient";

interface CollectionPageProps {
    params: Promise<{
        nftAddress: string;
    }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    // Await the params in Next.js 15+
    const { nftAddress: encodedAddress } = await params;
    const contractAddress = decodeURIComponent(encodedAddress);

    return <CollectionPageClient contractAddress={contractAddress} />;
}
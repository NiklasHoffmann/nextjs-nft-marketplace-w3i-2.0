// app/collection/[contractAddress]/page.tsx
// Server component for Next.js 15+ async params handling
// NFT Collection Übersichtsseite - zeigt alle NFTs einer Collection

import React from "react";
import { CollectionPageClient } from "./components";

interface CollectionPageProps {
    params: Promise<{
        contractAddress: string;
    }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    // Await the params in Next.js 15+
    const { contractAddress: encodedAddress } = await params;
    const contractAddress = decodeURIComponent(encodedAddress);

    return <CollectionPageClient contractAddress={contractAddress} />;
}

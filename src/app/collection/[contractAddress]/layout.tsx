'use client';

import React, { use } from 'react';
import { useCollections } from '@/contexts/collections/CollectionsContext';
import type { Collection } from '@/contexts/collections/CollectionsService';
import { CollectionHeader } from './components';

export default function CollectionLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ contractAddress: string }>;
}) {
    const { contractAddress: encodedAddress } = use(params);
    const contractAddress = decodeURIComponent(encodedAddress);
    const { collections } = useCollections();

    const collection = collections.find(
        (col: Collection) => col.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );

    // Calculate stats from collection
    const totalListings = collection?.itemCount || 0;
    const totalVolume = collection?.totalValue || 0;
    const avgPrice = collection?.averagePrice || 0;
    const floorPrice = collection?.floorPrice || 0;
    const totalViews = collection?.totalViews || 0;
    const totalLikes = collection?.totalLikes || 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                <CollectionHeader
                    contractAddress={contractAddress}
                    contractName={collection?.contractName || ''}
                    contractSymbol={collection?.contractSymbol || ''}
                    totalListings={totalListings}
                    totalVolume={totalVolume}
                    avgPrice={avgPrice}
                    floorPrice={floorPrice}
                    totalViews={totalViews}
                    totalLikes={totalLikes}
                />
                <div className="pt-[120px]">
                    {children}
                </div>
            </main>
        </div>
    );
}

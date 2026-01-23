import React, { use } from 'react';
import { useCollections } from '@/contexts/CollectionsContext';
import CollectionHeader from '@/app/nft/components/CollectionHeader';

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
        (col) => col.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );

    // Calculate stats from collection
    const totalListings = collection?.stats.totalListings || 0;
    const totalVolume = collection?.stats.totalVolume || 0;
    const avgPrice = totalListings > 0 ? totalVolume / totalListings : 0;
    const floorPrice = collection?.stats.floorPrice || 0;
    const totalViews = collection?.insights?.totalViews || 0;
    const totalLikes = collection?.insights?.totalLikes || 0;

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

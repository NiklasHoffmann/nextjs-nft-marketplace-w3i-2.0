'use client';

import { ReactNode, use, useMemo, useState, useCallback } from 'react';
import { useMarketplaceItemDetail } from '@/hooks';
import NFTDetailHeader from './components/DetailHeader';

export default function NFTDetailLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ contractAddress: string; tokenId: string }>;
}) {
    const { contractAddress, tokenId } = use(params);

    // Fetch NFT data with hook (like useCollections in Collection layout)
    const { nft: nftData, loading } = useMarketplaceItemDetail({
        contractAddress,
        tokenId,
        autoFetch: true
    });

    // Extract metadata
    const metadata = nftData?.metadata;
    const contractInfo = nftData?.contract;
    const publicInsights = nftData?.insights;

    const finalName = useMemo(() => {
        return publicInsights?.customTitle || metadata?.name || `Token #${tokenId}`;
    }, [publicInsights?.customTitle, metadata?.name, tokenId]);

    const [isFavorited, setIsFavorited] = useState(false);

    const handleToggleFavorite = useCallback(() => {
        setIsFavorited(prev => !prev);
        // TODO: Implement favorite persistence (API call)
    }, []);

    const handleShare = useCallback(() => {
        const url = `${window.location.origin}/nft/${contractAddress}/${tokenId}`;
        if (navigator.share) {
            navigator.share({ title: finalName, url });
        } else {
            navigator.clipboard.writeText(url);
        }
    }, [contractAddress, tokenId, finalName]);

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                {!loading && nftData && (
                    <NFTDetailHeader
                        name={finalName}
                        tokenId={tokenId}
                        contractName={contractInfo?.name || null}
                        collection={contractInfo?.name || null}
                        contractSymbol={contractInfo?.symbol || null}
                        contractAddress={contractAddress}
                        imageUrl={metadata?.image || undefined}
                        isFavorited={isFavorited}
                        onToggleFavorite={handleToggleFavorite}
                        onShare={handleShare}
                    />
                )}
                <div className="pt-[120px]">
                    {children}
                </div>
            </main>
        </div>
    );
}

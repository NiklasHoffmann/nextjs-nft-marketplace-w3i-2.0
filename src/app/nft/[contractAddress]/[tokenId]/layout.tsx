'use client';

import { ReactNode, use, useMemo, useState, useCallback, useEffect } from 'react';
import { useMarketplaceItemDetail } from '@/hooks';
import { useUserInteractions } from '@/hooks/user/useUserInteractions';
import { useAccount } from 'wagmi';
import { devLog } from '@/utils';
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
        return (publicInsights as any)?.customTitle || (publicInsights as any)?.title || metadata?.name || `Token #${tokenId}`;
    }, [publicInsights, metadata?.name, tokenId]);

    const { address } = useAccount();
    const { isFavorited, toggleFavorite } = useUserInteractions({
        contractAddress,
        tokenId,
        userWalletAddress: address,
        autoFetch: true
    });
    const [localFavorited, setLocalFavorited] = useState(false);

    useEffect(() => {
        if (!address) {
            setLocalFavorited(false);
        }
    }, [address]);

    const handleToggleFavorite = useCallback(async () => {
        if (!address) {
            setLocalFavorited(prev => !prev);
            devLog.warn('[NFT Detail] Favorite requires wallet connection');
            return;
        }

        try {
            await toggleFavorite();
        } catch (error) {
            devLog.error('[NFT Detail] Failed to toggle favorite:', error);
        }
    }, [address, toggleFavorite]);

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
                        isFavorited={address ? isFavorited : localFavorited}
                        onToggleFavorite={handleToggleFavorite}
                        onShare={handleShare}
                    />
                )}
                <div className="pt-[100px]">
                    {children}
                </div>
            </main>
        </div>
    );
}

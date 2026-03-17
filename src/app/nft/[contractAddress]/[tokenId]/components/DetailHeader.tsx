"use client";

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { PageHeader } from '@/components/layout/PageHeader';
import { NFTDetailHeaderProps } from '@/types';
import { formatNFTDisplayName, formatCollectionDisplayName } from '@/utils';
import { useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';
import { NFTInteractionCards } from './NFTInteractionCards';

interface ExtendedNFTDetailHeaderProps extends NFTDetailHeaderProps {
    // Remove individual stats props - now using context
}

export default function NFTDetailHeader({
    name,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    contractAddress,
    imageUrl: _imageUrl,
    // Keep these for backward compatibility (will be overridden by context)
    isFavorited: legacyIsFavorited,
    onToggleFavorite: _legacyOnToggleFavorite,
    onShare
}: ExtendedNFTDetailHeaderProps) {
    // Get wallet connection state
    const { address: userAddress, isConnected } = useAccount();

    // Use the new unified stats context
    const {
        stats,
        userInteractions,
        toggleFavorite,
        toggleWatchlist,
        setRating,
    } = useNFTUserStats(contractAddress, tokenId, userAddress);

    // Use useMemo with individual values to ensure updates are detected
    const displayStats = useMemo(() => ({
        viewCount: stats?.viewCount ?? 0,
        likeCount: stats?.likeCount ?? 0,
        watchlistCount: stats?.watchlistCount ?? 0,
        averageRating: stats?.averageRating ?? 0,
        ratingCount: stats?.ratingCount ?? 0
    }), [
        stats?.viewCount,
        stats?.likeCount,
        stats?.watchlistCount,
        stats?.averageRating,
        stats?.ratingCount
    ]);

    const displayUserInteractions = useMemo(() => ({
        isFavorited: userInteractions?.isFavorited ?? legacyIsFavorited ?? false,
        isWatchlisted: userInteractions?.isWatchlisted ?? false,
        userRating: userInteractions?.userRating ?? 0,
    }), [
        userInteractions?.isFavorited,
        userInteractions?.isWatchlisted,
        userInteractions?.userRating,
        legacyIsFavorited
    ]);

    return (
        <PageHeader
            backLink={{
                href: "/marketplace",
                label: "Back to Marketplace"
            }}
            icon={{
                type: "text-badge",
                text: contractSymbol || '?'
            }}
            title={formatNFTDisplayName(name, tokenId)}
            subtitle={formatCollectionDisplayName(contractName, collection, contractSymbol, contractAddress)}
            rightContent={
                <NFTInteractionCards
                    viewCount={displayStats.viewCount}
                    likeCount={displayStats.likeCount}
                    watchlistCount={displayStats.watchlistCount}
                    averageRating={displayStats.averageRating}
                    ratingCount={displayStats.ratingCount}
                    isFavorited={displayUserInteractions.isFavorited}
                    isWatchlisted={displayUserInteractions.isWatchlisted}
                    userRating={displayUserInteractions.userRating}
                    onToggleFavorite={toggleFavorite}
                    onToggleWatchlist={toggleWatchlist}
                    onSetRating={setRating}
                    onShare={onShare}
                    isConnected={isConnected}
                />
            }
        />
    );
}


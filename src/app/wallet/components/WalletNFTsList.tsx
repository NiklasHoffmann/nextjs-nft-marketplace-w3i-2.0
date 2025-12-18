import * as React from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

import { NFTGallery } from '@/components/shared';
import type { NFTScrollItem } from '@/types/marketplace';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';
import { useETHPrice } from '@/contexts/CurrencyContext';

export interface WalletNFTsListProps {
    /** NFTs to display (pre-filtered from server) */
    nfts: WalletNFT[];
    /** Loading state */
    loading?: boolean;
    /** Error state */
    error?: string | null;
    /** Custom title for the section */
    title?: string;
    /** Whether to show NFTs in separate listed/unlisted sections */
    separateSections?: boolean;
    /** Limit number of NFTs per section when using separateSections */
    limitPerSection?: number;
}

/**
 * WalletNFTsList Component
 * 
 * Displays NFTs owned by a wallet, separated into Listed and Unlisted sections.
 * NFTs are pre-filtered by server (no client-side filtering needed).
 * 
 * Usage Examples:
 * 
 * 1. Show current user's NFTs with separate sections:
 * <WalletNFTsList nfts={nfts} separateSections />
 * 
 * 2. Limit results per section:
 * <WalletNFTsList nfts={nfts} limitPerSection={6} separateSections />
 */
export function WalletNFTsList({
    nfts,
    loading = false,
    error = null,
    title,
    separateSections = true,
    limitPerSection
}: WalletNFTsListProps) {
    const { address: connectedWallet } = useAccount();

    // Convert NFTs to NFTCard format (server already filtered them)
    const nftItems: NFTScrollItem[] = React.useMemo(() => {
        return nfts.map((nft) => {
            const item = {
                contractAddress: nft.contractAddress,
                tokenId: nft.tokenId,
                price: nft.listingPrice,
                isListed: nft.isListed || false,
                listingId: nft.listingId,
                seller: nft.seller,
                buyer: undefined,
                desiredContractAddress: undefined,
                desiredTokenId: undefined,
                name: nft.name || `NFT #${nft.tokenId}`,
                symbol: nft.contractSymbol || undefined,
                category: nft.insights?.category || nft.category || null,
                categories: nft.insights?.category ? [nft.insights.category] : nft.category ? [nft.category] : [],
                description: nft.description || null,
                imageUrl: nft.image || null, // ExternalNFT uses 'image', not 'imageUrl'
                rarity: nft.insights?.rarity || nft.rarity || null,
                customTitle: nft.insights?.customTitle || null,
                cardDescriptions: nft.insights?.cardDescriptions || null,
                tags: [],
                // Stats - use from API response if available
                averageRating: nft.stats?.averageRating ?? undefined,
                ratingCount: nft.stats?.ratingCount ?? undefined,
                viewCount: nft.stats?.viewCount ?? undefined,
                favoriteCount: nft.stats?.likeCount ?? undefined, // API uses likeCount
                watchlistCount: nft.stats?.watchlistCount ?? undefined,
                // NFTCard expects metadata object with nested image
                metadata: {
                    name: nft.name || null,
                    description: nft.description || null,
                    image: nft.image || null,
                    animationUrl: nft.animationUrl || undefined,
                    externalUrl: undefined,
                    attributes: nft.attributes || undefined,
                },
                // Pass insights data for NFTCard
                insights: nft.insights ? {
                    customTitle: nft.insights.customTitle || undefined,
                    category: nft.insights.category || nft.category || undefined,
                    tags: [],
                    rarity: nft.insights.rarity || nft.rarity || undefined,
                    cardDescriptions: nft.insights.cardDescriptions || undefined,
                    projectDescriptions: undefined,
                    functionalitiesDescriptions: undefined,
                    projectWebsite: undefined,
                    projectTwitter: undefined,
                    projectDiscord: undefined,
                    partnerships: [],
                } : undefined,
                // Pass contract info - map from the nft object properly
                contract: {
                    name: nft.contractName || null,
                    symbol: nft.contractSymbol || null,
                    totalSupply: nft.totalSupply || null,
                    owner: nft.owner || connectedWallet || null,
                    tokenURI: nft.tokenURI || null,
                    approved: nft.approved || null,
                    ownerBalance: nft.ownerBalance || null,
                },
            };
            return item;
        });
    }, [nfts, connectedWallet]);

    // Split into listed and unlisted (server already filtered)
    const { listedNFTs, unlistedNFTs, totalListedValue } = React.useMemo(() => {
        const listed = nftItems.filter((nft) => nft.isListed);
        const unlisted = nftItems.filter((nft) => !nft.isListed);

        // Calculate total value of listed NFTs
        const totalValue = listed.reduce((sum, nft) => {
            if (nft.price) {
                try {
                    const price = typeof nft.price === 'string'
                        ? BigInt(nft.price)
                        : nft.price;
                    return sum + parseFloat(formatEther(price));
                } catch (e) {
                    return sum;
                }
            }
            return sum;
        }, 0);

        return {
            listedNFTs: limitPerSection ? listed.slice(0, limitPerSection) : listed,
            unlistedNFTs: limitPerSection ? unlisted.slice(0, limitPerSection) : unlisted,
            totalListedValue: totalValue
        };
    }, [nftItems, limitPerSection]);

    // Convert total value to USD
    const { convertedPrice: totalListedValueUSD, loading: ethPriceLoading } = useETHPrice(totalListedValue);

    // Determine title
    const displayTitle = title || 'Your NFTs';

    // Handle empty state
    if (!connectedWallet) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Connect your wallet to view NFTs</p>
            </div>
        );
    }

    // Loading state
    if (loading && nfts.length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{displayTitle}</h3>
                </div>
                <NFTGallery
                    items={[]}
                    loading={true}
                    loadingCount={8}
                />
                <div className="text-center mt-4">
                    <p className="text-gray-500">Loading NFTs...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && nfts.length === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <div className="text-red-600 mb-4">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // Empty state (only show when not loading)
    if (nfts.length === 0 && !loading) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{displayTitle}</h3>
                <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No NFTs found in this wallet</p>
                </div>
            </div>
        );
    }

    if (!separateSections) {
        // Original single section layout (fallback)
        return (
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {displayTitle}
                            <span className="ml-2 text-sm text-gray-500">({nfts.length})</span>
                        </h3>
                        <div className="flex items-center gap-3 text-xs mt-1">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-700">{listedNFTs.length} Listed</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-600">{unlistedNFTs.length} Not Listed</span>
                            </span>
                        </div>
                    </div>
                </div>

                <NFTGallery
                    items={nftItems}
                    badge={{ text: 'All NFTs', color: 'bg-blue-500' }}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No NFTs found in this wallet"
                />
            </div>
        );
    }

    // Separate sections layout
    return (
        <div>

            {/* Listed NFTs Section - only show if there are listed items */}
            {listedNFTs.length > 0 && (
                <div className="mb-8">
                    <NFTGallery
                        items={listedNFTs}
                        title="Listed Utilities"
                        subtitle={
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-700">{listedNFTs.length} NFTs</span>
                            </span>
                        }
                        enableInsights={true}
                        showStats={true}
                        priority={false}
                        enableViewAll={true}
                    />
                </div>
            )}

            {/* Unlisted NFTs Section - only show if there are unlisted items */}
            {unlistedNFTs.length > 0 && (
                <div>
                    <NFTGallery
                        items={unlistedNFTs}
                        title="Not Listed"
                        subtitle={
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-600">{unlistedNFTs.length} NFTs</span>
                            </span>
                        }
                        enableInsights={true}
                        showStats={true}
                        priority={false}
                        enableViewAll={true}
                    />
                </div>
            )}
        </div>
    );
}


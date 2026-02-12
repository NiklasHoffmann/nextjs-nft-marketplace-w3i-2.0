import * as React from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';

import { NFTGallery } from '@/components/shared';
import { EmptyState } from '@/components/core/Empty';
import type { NFTScrollItem } from '@/types/marketplace';
import type { WalletNFT } from '@/contexts/wallet-nfts/WalletNFTsService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress } from '@/config/tokens';
import { mapWalletNFTToScrollItem } from '@/utils/nft/scrollItem';
import { devLog } from '@/utils';

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

function renderEmptySection(message: string) {
    return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <p className="text-gray-500">{message}</p>
        </div>
    );
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
    const chainId = useChainId(); // Get current chain ID

    // Convert NFTs to NFTCard format (server already filtered them)
    const nftItems: NFTScrollItem[] = React.useMemo(() => {
        return nfts.map((nft) => mapWalletNFTToScrollItem(nft, connectedWallet));
    }, [nfts, connectedWallet]);

    // Split into listed and unlisted (server already filtered)
    const { listedNFTs, unlistedNFTs, listedPricesByToken } = React.useMemo(() => {
        const listed = nftItems.filter((nft) => nft.isListed);
        const unlisted = nftItems.filter((nft) => !nft.isListed)
            // Sort unlisted by newest first (recently purchased NFT at top)
            .sort((a, b) => {
                const dateA = a.syncedAt ? new Date(a.syncedAt).getTime() : 0;
                const dateB = b.syncedAt ? new Date(b.syncedAt).getTime() : 0;
                return dateB - dateA; // Newest first
            });

        // Group listed NFT prices by token for multi-currency support
        const pricesByToken = new Map<string, { total: number; symbol: string; address: string | null }>();

        listed.forEach((nft) => {
            if (nft.price) {
                try {
                    const price = typeof nft.price === 'string'
                        ? BigInt(nft.price)
                        : nft.price;
                    const tokenSymbol = getCurrencySymbolByAddress(chainId, nft.currency);
                    const tokenAddress = nft.currency || null;
                    const tokenDecimals = getTokenDecimalsByAddress(chainId, nft.currency);
                    const priceInToken = parseFloat(formatUnits(price, tokenDecimals));

                    const tokenKey = tokenAddress || tokenSymbol;
                    const existing = pricesByToken.get(tokenKey) || { total: 0, symbol: tokenSymbol, address: tokenAddress };
                    existing.total += priceInToken;
                    pricesByToken.set(tokenKey, existing);
                } catch (e) {
                    devLog.error('Error parsing price:', e);
                }
            }
        });

        return {
            listedNFTs: limitPerSection ? listed.slice(0, limitPerSection) : listed,
            unlistedNFTs: limitPerSection ? unlisted.slice(0, limitPerSection) : unlisted,
            listedPricesByToken: pricesByToken
        };
    }, [nftItems, limitPerSection, chainId]);

    // Convert all token prices to USD for total value calculation
    const { convertTokenToUSD } = useCurrency();
    const [totalListedValueUSD, setTotalListedValueUSD] = React.useState<number>(0);
    const [ethPriceLoading, setEthPriceLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        let isMounted = true;

        async function calculateTotalUSD() {
            if (listedPricesByToken.size === 0) {
                setTotalListedValueUSD(0);
                setEthPriceLoading(false);
                return;
            }

            setEthPriceLoading(true);
            let totalUSD = 0;

            for (const [, { total, symbol, address }] of listedPricesByToken.entries()) {
                try {
                    const usdValue = await convertTokenToUSD(total, symbol, address, chainId);
                    totalUSD += usdValue;
                } catch (error) {
                    devLog.error(`Error converting ${symbol} to USD:`, error);
                }
            }

            if (isMounted) {
                setTotalListedValueUSD(totalUSD);
                setEthPriceLoading(false);
            }
        }

        calculateTotalUSD();

        return () => {
            isMounted = false;
        };
    }, [listedPricesByToken, convertTokenToUSD]);

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
                <EmptyState
                    icon="🖼️"
                    title="No NFTs Found"
                    description="No NFTs found in this wallet"
                    size="sm"
                />
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

            {/* Listed NFTs Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-green-800 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Listed Utilities ({listedNFTs.length})
                        </h4>
                    </div>
                </div>

                <NFTGallery
                    items={listedNFTs}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No listed NFTs"
                    enableViewAll={true}
                    emptyComponent={
                        renderEmptySection('No listed Utilities')
                    }
                />
            </div>

            {/* Unlisted NFTs Section */}
            <div>
                <div className="flex items-center justify-between mb-4 px-4">
                    <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        Not Listed ({unlistedNFTs.length})
                    </h4>
                </div>

                <NFTGallery
                    items={unlistedNFTs}
                    enableInsights={true}
                    showStats={true}
                    priority={false}
                    emptyMessage="No unlisted NFTs"
                    enableViewAll={true}
                    emptyComponent={
                        renderEmptySection('No unlisted Utilities')
                    }
                />
            </div>
        </div>
    );
}


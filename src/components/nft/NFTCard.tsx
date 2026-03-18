/**
 * NFTCard - Optimized NFT Card Component with 3D Tilt Effect
 * 
 * REFACTORED VERSION - Dec 19, 2025
 * - Uses BaseCard for consistent styling
 * - Uses useCardTilt hook for 3D effects
 * - Modular sub-components for clarity
 * - Simplified props interface
 * - ~400 LOC reduction from original
 * 
 * Features:
 * - 3D tilt effect on hover (mouse + touch)
 * - Blurred background with sharp foreground image
 * - Rarity-based background colors
 * - Price display with ETH/USD conversion
 * - Social stats (likes, watchlist)
 * - Category tags with insights support
 */

"use client";

import React, { useMemo, memo, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { useNFTUserStats } from '@/contexts/nft-stats/NFTStatsContext';
import { devLog } from '@/utils';
import type { AggregatedNFT } from '@/types/core/core-nft-modern';

import { NFTCardHeader } from './NFTCard/NFTCardHeader';
import { NFTCardImage } from './NFTCard/NFTCardImage';
import { NFTCardFooter } from './NFTCard/NFTCardFooter';
import { NFTCardPrice } from './NFTCard/NFTCardPrice';

// ===== INTERFACES =====

interface NFTCardProps {
  /** Complete NFT data from AggregatedNFT system */
  nft: AggregatedNFT;
  /** Display options */
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

// Legacy interface for backward compatibility (simplified)
interface LegacyNFTCardProps {
  contractAddress: string;
  tokenId: string;
  listingId?: string;
  price?: string;
  seller?: string;
  buyer?: string | null;
  isListed?: boolean;
  desiredContractAddress?: string;
  desiredTokenId?: string;
  currency?: string; // Payment token address (ETH = 0x0, WETH/USDC/etc = token address)
  chainId?: number; // Optional: chain ID for currency symbol lookup
  listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP'; // v2 field
  tokenStandard?: 'ERC721' | 'ERC1155' | null;
  erc1155QuantityListed?: string | null;
  remainingQuantity?: string | null;
  unitPrice?: string | null;
  partialBuyEnabled?: boolean;
  metadata?: {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    animationUrl?: string | null;
    externalUrl?: string | null;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  };
  insights?: {
    customTitle?: string | null;
    category?: string | null;
    tags?: string[];
    rarity?: string | null;
    cardDescriptions?: string[];
    projectDescriptions?: any;
    functionalitiesDescriptions?: any;
    projectWebsite?: string | null;
    projectTwitter?: string | null;
    projectDiscord?: string | null;
    partnerships?: string[];
  };
  contract?: {
    name?: string | null;
    symbol?: string | null;
    contractName?: string | null;
    contractSymbol?: string | null;
    totalSupply?: number | bigint | null;
    owner?: string | null;
    tokenURI?: string | null;
    approved?: string | null;
    ownerBalance?: number | bigint | null;
  };
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

type NFTCardAllProps = NFTCardProps | LegacyNFTCardProps;

// ===== TYPE GUARDS =====

function isLegacyProps(props: NFTCardAllProps): props is LegacyNFTCardProps {
  return 'contractAddress' in props && 'tokenId' in props && !('nft' in props);
}

function isNewProps(props: NFTCardAllProps): props is NFTCardProps {
  return 'nft' in props;
}

function buildLegacyAggregatedNFT(props: LegacyNFTCardProps): AggregatedNFT {
  const contractAddress = props.contractAddress;
  const tokenId = props.tokenId;
  const isListed = Boolean(props.isListed);
  const listingId = props.listingId || undefined;
  const hasListing = isListed && !!listingId;

  return {
    key: `${contractAddress}-${tokenId}` as `${string}-${string}`,
    contractAddress: contractAddress as `0x${string}`,
    tokenId,
    listed: hasListing,
    listing: hasListing ? {
      listingId,
      contractAddress: contractAddress as `0x${string}`,
      tokenId,
      isListed: true,
      price: props.price || '0',
      seller: props.seller as `0x${string}`,
      buyer: props.buyer as `0x${string}` | null,
      desiredContractAddress: (props.desiredContractAddress as `0x${string}`) || null,
      desiredTokenId: props.desiredTokenId || null,
      currency: (props.currency as `0x${string}`) || null,
      listingType: props.listingType || null,
      tokenStandard: props.tokenStandard || null,
      erc1155QuantityListed: props.erc1155QuantityListed || null,
      remainingQuantity: props.remainingQuantity || null,
      unitPrice: props.unitPrice || null,
      partialBuyEnabled: props.partialBuyEnabled ?? false
    } : undefined,
    core: {
      contractAddress: contractAddress as `0x${string}`,
      tokenId,
      tokenURI: null,
      name: props.metadata?.name || null,
      owner: null,
      symbol: props.contract?.symbol || props.contract?.contractSymbol || null
    },
    meta: props.metadata ? {
      name: props.metadata.name || undefined,
      description: props.metadata.description || undefined,
      image: props.metadata.image || undefined,
      animationUrl: props.metadata.animationUrl || undefined,
      externalUrl: props.metadata.externalUrl || undefined,
      attributes: props.metadata.attributes || []
    } : undefined,
    insight: props.insights ? {
      contractAddress: contractAddress as `0x${string}`,
      customTitle: props.insights.customTitle || undefined,
      category: props.insights.category || undefined,
      tags: props.insights.tags || [],
      rarity: props.insights.rarity || undefined,
      cardDescription: props.insights.cardDescriptions || undefined,
      updatedAt: new Date().toISOString()
    } : undefined,
    social: undefined,
    sources: {
      blockchain: false,
      metadata: !!props.metadata,
      marketplace: isListed,
      social: false,
      insights: !!props.insights
    },
    lastUpdated: Date.now()
  };
}

// ===== SKELETON =====

export const NFTCardSkeleton = memo(({ className = '' }: { className?: string }) => (
    <div className={`group cursor-pointer transform-gpu ${className}`}>
        <div className="rounded-lg shadow-xl flex flex-col gap-2 w-full h-72 relative border border-black overflow-hidden">
            <div className="absolute inset-2 shadow-lg rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)] bg-gray-100">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                <div className="relative z-10 flex flex-col h-full p-1 gap-1">
                    {/* Header: symbol + name + rating badge */}
                    <div className="flex-shrink-0 bg-white/95 rounded-md p-2 border border-gray-200/60 shadow-xl ring-1 ring-gray-300/20">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                            </div>
                            <div className="ml-2 h-6 w-10 bg-gray-200 rounded-md flex-shrink-0" />
                        </div>
                    </div>
                    {/* Image area */}
                    <div className="flex-1 min-h-0 grid grid-cols-2 gap-1">
                        <div className="bg-white/85 rounded-md border border-gray-200/70 animate-pulse" />
                        <div className="bg-white/85 rounded-md border border-gray-200/70 animate-pulse" />
                    </div>
                    {/* Footer: category badge left + heart badge right */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                        <div className="h-6 bg-white/95 rounded-md border border-gray-200/60 ring-1 ring-gray-300/20 px-2 flex items-center w-16">
                            <div className="h-2.5 bg-gray-300 rounded w-full" />
                        </div>
                        <div className="flex-1" />
                        <div className="h-6 bg-white/95 rounded-md border border-gray-200/60 ring-1 ring-gray-300/20 px-2 flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-red-200 flex-shrink-0" />
                            <div className="h-2.5 bg-gray-300 rounded w-4" />
                        </div>
                    </div>
                    {/* Price area with listing/standard badges */}
                    <div className="flex-shrink-0 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <div className="h-5 bg-white/95 rounded-md border border-gray-200/60 ring-1 ring-gray-300/20 px-2 w-14" />
                        <div className="h-5 bg-white/95 rounded-md border border-gray-200/60 ring-1 ring-gray-300/20 px-2 w-16" />
                        <div className="h-5 bg-white/95 rounded-md border border-gray-200/60 ring-1 ring-gray-300/20 px-2 w-12 ml-auto" />
                      </div>
                      <div className="h-7 bg-gray-200 rounded w-28" />
                    </div>
                </div>
            </div>
        </div>
    </div>
));
NFTCardSkeleton.displayName = 'NFTCardSkeleton';

// ===== HELPER FUNCTIONS =====

/** Get rarity background color class */
function getRarityBackground(rarity?: string | null, enableInsights?: boolean): string {
  if (!enableInsights || !rarity) return 'bg-gray-200';

  switch (rarity.toLowerCase()) {
    case 'legendary': return 'bg-yellow-200';
    case 'epic': return 'bg-purple-200';
    case 'rare': return 'bg-blue-200';
    case 'uncommon': return 'bg-green-200';
    default: return 'bg-gray-200';
  }
}

function normalizeTokenStandard(value?: string | null): 'ERC721' | 'ERC1155' | null {
  if (!value) return null;
  const normalized = value.toUpperCase().replace(/[-_\s]/g, '');
  if (normalized === 'ERC1155') return 'ERC1155';
  if (normalized === 'ERC721') return 'ERC721';
  return null;
}

/**
 * Optimized NFT Card Component
 * Supports both new AggregatedNFT interface and legacy props
 */
export function NFTCard(props: NFTCardAllProps) {
  const router = useRouter();

  // ===== PROPS NORMALIZATION =====

  const {
    priority = false,
    enableInsights = true
  } = props;

  const isLegacy = isLegacyProps(props);

  // Extract or construct NFT data
  const nft: AggregatedNFT = isNewProps(props) ? props.nft : buildLegacyAggregatedNFT(props);
  const contractAddress = nft.core.contractAddress;
  const tokenId = nft.core.tokenId;

  // ===== HOOKS (must be called before any early returns) =====

  // Get stats (likes, watchlist, etc.)
  const { stats } = useNFTUserStats(contractAddress, tokenId);

  // Categories and descriptions
  const categories = useMemo(() => {
    const cats: string[] = [];
    if (nft.insight?.category) cats.push(nft.insight.category);
    if (nft.insight?.tags) cats.push(...nft.insight.tags);
    return cats;
  }, [nft.insight]);

  const descriptions = useMemo(() => {
    return Array.isArray(nft.insight?.cardDescription)
      ? nft.insight.cardDescription
          .map((desc) => (typeof desc === 'string' ? desc.trim() : ''))
          .filter((desc) => desc.length > 0)
      : [];
  }, [nft.insight?.cardDescription]);

  // Rarity background color - extract rarity first for hook dependency
  const rarity = nft.insight?.rarity || null;
  const rarityBg = useMemo(() =>
    getRarityBackground(rarity, enableInsights),
    [rarity, enableInsights]
  );

  // Event handler hook
  const handleClick = useCallback(() => {
    router.push(`/nft/${contractAddress}/${tokenId}`);
  }, [router, contractAddress, tokenId]);

  // ===== VALIDATION (after all hooks) =====

  // Early return if essential props are missing
  if (!contractAddress || !tokenId) {
    devLog.error('NFTCard: Missing contractAddress or tokenId', { contractAddress, tokenId });
    return null;
  }

  // ===== COMPUTED VALUES =====

  // Extract display data
  const imageUrl = nft.meta?.image || null;
  const customTitle = nft.insight?.customTitle || null;
  const nftName = nft.meta?.name || null;
  const contractSymbol = nft.core.symbol || null;
  const contractName = isLegacy ? (props.contract?.name || props.contract?.contractName) : null;

  // Listing data
  const isListed = isLegacy
    ? (props.isListed ?? nft.listed ?? false)
    : (nft.listed || false);
  const price = isLegacy
    ? (props.price ?? nft.listing?.price ?? null)
    : (nft.listing?.price || null);
  const desiredContractAddress = isLegacy
    ? (
      props.desiredContractAddress
      ?? nft.listing?.desiredContractAddress
      ?? (nft.listing as any)?.desiredTokenAddress
      ?? null
    )
    : (
      nft.listing?.desiredContractAddress
      || (nft.listing as any)?.desiredTokenAddress
      || null
    );
  const desiredTokenId = isLegacy
    ? (props.desiredTokenId ?? nft.listing?.desiredTokenId ?? null)
    : (nft.listing?.desiredTokenId || null);
  const currency = isLegacy
    ? (props.currency ?? nft.listing?.currency ?? null)
    : (nft.listing?.currency || null);
  const listingType = isLegacy
    ? (props.listingType ?? nft.listing?.listingType ?? null)
    : (nft.listing?.listingType || null);
  const chainId = isLegacy ? props.chainId : undefined;
  const rawTokenStandard = isLegacy
    ? (
      props.tokenStandard
      ?? nft.listing?.tokenStandard
      ?? nft.tokenStandard
      ?? (nft as any)?.tokenType
      ?? (nft as any)?.marketplace?.tokenStandard
      ?? (nft as any)?.contract?.tokenType
    )
    : (
      nft.listing?.tokenStandard
      || nft.tokenStandard
      || (nft as any)?.tokenType
      || (nft as any)?.marketplace?.tokenStandard
      || (nft as any)?.contract?.tokenType
    );
  const erc1155QuantityListed = isLegacy
    ? (props.erc1155QuantityListed ?? nft.listing?.erc1155QuantityListed ?? (nft as any)?.marketplace?.erc1155QuantityListed ?? null)
    : (nft.listing?.erc1155QuantityListed || (nft as any)?.marketplace?.erc1155QuantityListed || null);
  const remainingQuantity = isLegacy
    ? (props.remainingQuantity ?? nft.listing?.remainingQuantity ?? (nft as any)?.marketplace?.remainingQuantity ?? null)
    : (nft.listing?.remainingQuantity || (nft as any)?.marketplace?.remainingQuantity || null);
  const unitPrice = isLegacy
    ? (props.unitPrice ?? nft.listing?.unitPrice ?? (nft as any)?.marketplace?.unitPrice ?? null)
    : (nft.listing?.unitPrice || (nft as any)?.marketplace?.unitPrice || null);
  const partialBuyEnabled = isLegacy
    ? (props.partialBuyEnabled ?? nft.listing?.partialBuyEnabled ?? (nft as any)?.marketplace?.partialBuyEnabled ?? false)
    : (nft.listing?.partialBuyEnabled || (nft as any)?.marketplace?.partialBuyEnabled || false);
  const inferredERC1155 = Boolean(
    erc1155QuantityListed || remainingQuantity || unitPrice || partialBuyEnabled
  );
  const tokenStandard: 'ERC721' | 'ERC1155' | null =
    normalizeTokenStandard(rawTokenStandard) || (inferredERC1155 ? 'ERC1155' : null);

  // Social stats
  const likeCount = stats?.likeCount || 0;
  const averageRating = stats?.averageRating || null;

  // ===== EVENT HANDLERS =====

  // handleClick is defined above in hooks section

  // ===== LOADING STATE =====

  // Stats are secondary — render the card immediately and let stats fill in when ready.

  // ===== RENDER =====

  return (
    <div
      className="group cursor-pointer relative z-0 isolate"
      onClick={handleClick}
    >
      <div className={`hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out rounded-lg shadow-xl flex flex-col flex-end gap-2 w-full h-72 relative origin-center border border-black ${rarityBg}`}>
        {/* Content container */}
        <div className="absolute inset-2 shadow-lg rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)] bg-gray-100">

          {/* Background layer intentionally disabled to keep foreground NFT image fully crisp */}

          {/* Content overlay with fixed layout */}
          <div className="relative z-0 flex flex-col h-full p-1 gap-1">

            {/* Header */}
            <div className="flex-shrink-0">
              <NFTCardHeader
                contractAddress={contractAddress}
                tokenId={tokenId}
                contractSymbol={contractSymbol}
                contractName={contractName}
                customTitle={customTitle}
                nftName={nftName}
                averageRating={averageRating}
              />
            </div>

            {/* Image and Description */}
            <div className="flex-1 flex gap-1 min-h-0">
              <NFTCardImage
                imageUrl={imageUrl}
                tokenId={tokenId}
                descriptions={descriptions}
                priority={priority}
              />
            </div>

            {/* Categories and Social Stats */}
            <div className="flex-shrink-0">
              <NFTCardFooter
                categories={categories}
                likeCount={likeCount}
                enableInsights={enableInsights}
                nft={nft}
              />
            </div>

            {/* Price Display */}
            <div className="flex-shrink-0">
              <NFTCardPrice
                price={price}
                isListed={isListed}
                desiredContractAddress={desiredContractAddress}
                desiredTokenId={desiredTokenId}
                currency={currency}
                chainId={chainId}
                listingType={listingType}
                tokenStandard={tokenStandard}
                unitPrice={unitPrice}
                erc1155QuantityListed={erc1155QuantityListed}
                remainingQuantity={remainingQuantity}
                partialBuyEnabled={partialBuyEnabled}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(NFTCard);

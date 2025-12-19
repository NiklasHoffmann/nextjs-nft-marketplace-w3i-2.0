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
import { devLog } from '@/utils/devLog';
import type { AggregatedNFT } from '@/types/core/core-nft-modern';
import OptimizedNFTImage from './OptimizedNFTImage';
import { BaseCard } from '@/components/core/Card/BaseCard';
import { useCardTilt } from '@/hooks/useCardTilt';
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

/**
 * Optimized NFT Card Component
 * Supports both new AggregatedNFT interface and legacy props
 */
export function NFTCard(props: NFTCardAllProps) {
  const router = useRouter();

  // ===== PROPS NORMALIZATION =====

  const {
    showStats = true,
    className = "",
    priority = false,
    enableInsights = true
  } = props;

  // Extract or construct NFT data
  let nft: AggregatedNFT;
  let contractAddress: string;
  let tokenId: string;

  if (isNewProps(props)) {
    // New simplified interface
    nft = props.nft;
    contractAddress = nft.core.contractAddress;
    tokenId = nft.core.tokenId;
  } else {
    // Legacy interface - construct minimal AggregatedNFT
    contractAddress = props.contractAddress;
    tokenId = props.tokenId;
    
    nft = {
      key: `${contractAddress}-${tokenId}` as `${string}-${string}`,
      contractAddress: contractAddress as `0x${string}`,
      tokenId,
      listed: props.isListed || false,
      listing: (props.isListed && props.listingId) ? {
        listingId: props.listingId,
        contractAddress: contractAddress as `0x${string}`,
        tokenId,
        isListed: true,
        price: props.price || '0',
        seller: props.seller as `0x${string}`,
        buyer: props.buyer as `0x${string}` | null,
        desiredContractAddress: (props.desiredContractAddress as `0x${string}`) || (contractAddress as `0x${string}`),
        desiredTokenId: props.desiredTokenId || null
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
        marketplace: !!props.isListed,
        social: false,
        insights: !!props.insights
      },
      lastUpdated: Date.now()
    };
  }

  // Early return if essential props are missing
  if (!contractAddress || !tokenId) {
    devLog.error('NFTCard: Missing contractAddress or tokenId', { contractAddress, tokenId });
    return null;
  }

  // ===== HOOKS =====

  // Get stats (likes, watchlist, etc.)
  const { stats, loading: statsLoading } = useNFTUserStats(contractAddress, tokenId);

  // 3D Tilt effect
  const { cardRef, tiltStyle, handlers } = useCardTilt({
    maxTilt: 15,
    scale: 1.02,
    perspective: 1000
  });

  // ===== COMPUTED VALUES =====

  // Extract display data
  const imageUrl = nft.meta?.image || null;
  const customTitle = nft.insight?.customTitle || null;
  const nftName = nft.meta?.name || null;
  const contractSymbol = nft.core.symbol || null;
  const contractName = isLegacyProps(props) ? (props.contract?.name || props.contract?.contractName) : null;
  const rarity = nft.insight?.rarity || null;
  
  // Categories and descriptions
  const categories = useMemo(() => {
    const cats: string[] = [];
    if (nft.insight?.category) cats.push(nft.insight.category);
    if (nft.insight?.tags) cats.push(...nft.insight.tags);
    return cats;
  }, [nft.insight]);

  const descriptions = useMemo(() => {
    const descs: string[] = [];
    if (nft.insight?.cardDescription && Array.isArray(nft.insight.cardDescription)) {
      descs.push(...nft.insight.cardDescription);
    } else if (isLegacyProps(props) && props.insights?.cardDescriptions) {
      descs.push(...props.insights.cardDescriptions);
    }
    return descs;
  }, [nft.insight, props]);

  // Listing data
  const isListed = nft.listed || false;
  const price = nft.listing?.price || null;
  const desiredContractAddress = nft.listing?.desiredContractAddress || null;

  // Social stats
  const likeCount = stats?.likeCount || 0;
  const watchlistCount = stats?.watchlistCount || 0;
  const averageRating = stats?.averageRating || null;

  // Rarity background color
  const rarityBg = useMemo(() => 
    getRarityBackground(rarity, enableInsights),
    [rarity, enableInsights]
  );

  // ===== EVENT HANDLERS =====

  const handleClick = useCallback(() => {
    router.push(`/nft/${contractAddress}/${tokenId}`);
  }, [router, contractAddress, tokenId]);

  // ===== LOADING STATE =====

  if (statsLoading && !stats) {
    return <BaseCard loading={true} size="md" className={className} />;
  }

  // ===== RENDER =====

  return (
    <div
      ref={cardRef}
      className="group cursor-pointer transform-gpu"
      onClick={handleClick}
      {...handlers}
      style={tiltStyle}
    >
      <div className={`hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 ease-out rounded-lg shadow-xl flex flex-col flex-end gap-2 w-full h-72 relative will-change-transform origin-center border border-black ${rarityBg}`}>
        {/* Content container */}
        <div className={`absolute inset-2 shadow-lg rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)] ${imageUrl ? 'bg-secondary' : 'bg-gray-100'}`}>
          
          {/* Blurred Background Image */}
          {imageUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-md">
              <OptimizedNFTImage
                imageUrl={imageUrl}
                tokenId={`${tokenId}-bg`}
                className="object-cover will-change-transform rounded-md"
                fill={true}
                priority={priority}
                width={200}
                height={200}
              />
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 rounded-md"></div>
            </div>
          )}

          {/* Content overlay with fixed layout */}
          <div className="relative z-10 flex flex-col h-full p-1 gap-1">
            
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
                watchlistCount={watchlistCount}
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
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(NFTCard);

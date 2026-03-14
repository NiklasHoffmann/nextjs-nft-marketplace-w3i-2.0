"use client";

import { lazy, Suspense, memo } from 'react';
import { NFTCardSkeleton } from './NFTCard';

// Lazy load NFTCard component for better code splitting
const NFTCard = lazy(() => import('./NFTCard'));

interface LazyNFTCardProps {
  contractAddress: string;
  tokenId: string;
  // Marketplace props
  listingId?: string;
  price?: string;
  currency?: string;
  chainId?: number;
  listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP';
  tokenStandard?: 'ERC721' | 'ERC1155' | null;
  erc1155QuantityListed?: string | null;
  remainingQuantity?: string | null;
  unitPrice?: string | null;
  partialBuyEnabled?: boolean;
  seller?: string;
  buyer?: string | null;
  isListed?: boolean;
  desiredContractAddress?: string;
  desiredTokenId?: string;
  // MongoDB-optimierte Daten
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
    contractName?: string | null;
    contractSymbol?: string | null;
    totalSupply?: number | bigint | null;
    owner?: string | null;
    tokenURI?: string | null;
    approved?: string | null;
    ownerBalance?: number | bigint | null;
  };
  // Display options
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

/**
 * LazyNFTCard - Code-split NFTCard with accurate skeleton
 * 
 * Uses lazy loading to reduce initial bundle size.
 * Shows BaseCard loading state while loading that matches the final card layout.
 */
const LazyNFTCard = memo((props: LazyNFTCardProps) => {
  return (
    <Suspense fallback={<NFTCardSkeleton className={props.className} />}>
      <NFTCard {...props} />
    </Suspense>
  );
});

LazyNFTCard.displayName = 'LazyNFTCard';
export default LazyNFTCard;

"use client";

import { memo } from 'react';
import NFTCard from './NFTCard';

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
 * LazyNFTCard - Stable wrapper around NFTCard.
 *
 * Keeps the existing public API without showing Suspense skeletons
 * when marketplace items are already cached and rendered immediately.
 */
const LazyNFTCard = memo((props: LazyNFTCardProps) => {
  return <NFTCard {...props} />;
});

LazyNFTCard.displayName = 'LazyNFTCard';
export default LazyNFTCard;

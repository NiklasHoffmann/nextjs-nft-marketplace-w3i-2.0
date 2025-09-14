/**
 * NFT-specific utility functions
 */

import { RoyaltyInfo, NFTAttribute } from '@/types';

/**
 * Truncates an address for display
 */
export const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Formats the display name for an NFT
 */
export const formatNFTDisplayName = (
  name?: string | null,
  tokenId?: string,
  fallback: string = 'Unknown NFT'
): string => {
  if (name) return name;
  if (tokenId) return `NFT #${tokenId}`;
  return fallback;
};

/**
 * Formats collection display name
 */
export const formatCollectionDisplayName = (
  contractName?: string | null,
  collection?: string | null,
  contractSymbol?: string | null,
  nftAddress?: string
): string => {
  if (contractName) {
    return contractSymbol ? `${contractName} (${contractSymbol})` : contractName;
  }
  if (collection) return collection;
  if (nftAddress) return truncateAddress(nftAddress);
  return 'Unknown Collection';
};

/**
 * Gets the media type from URLs
 */
export const getMediaType = (
  imageUrl?: string | null,
  animationUrl?: string | null,
  videoUrl?: string | null,
  audioUrl?: string | null
): 'video' | 'audio' | 'image' | 'none' => {
  if (animationUrl || videoUrl) return 'video';
  if (audioUrl) return 'audio';
  if (imageUrl) return 'image';
  return 'none';
};

/**
 * Formats rarity information for display
 */
export const formatRarityInfo = (
  rarityRank?: number | null,
  rarityScore?: number | null
): { hasRarity: boolean; rankDisplay: string; scoreDisplay: string } => {
  const hasRarity = Boolean(rarityRank || rarityScore);
  const rankDisplay = rarityRank ? `#${rarityRank}` : 'N/A';
  const scoreDisplay = rarityScore ? String(rarityScore) : 'N/A';

  return { hasRarity, rankDisplay, scoreDisplay };
};

/**
 * Formats royalty information for display
 */
export const formatRoyaltyInfo = (royaltyInfo?: RoyaltyInfo | null): {
  hasRoyalty: boolean;
  percentageDisplay: string;
  receiverDisplay: string;
} => {
  const hasRoyalty = Boolean(royaltyInfo?.percentage || royaltyInfo?.receiver);
  const percentageDisplay = royaltyInfo?.percentage ? `${royaltyInfo.percentage.toFixed(2)}%` : '0%';
  const receiverDisplay = royaltyInfo?.receiver ? truncateAddress(royaltyInfo.receiver) : '';

  return { hasRoyalty, percentageDisplay, receiverDisplay };
};

/**
 * Groups attributes by trait type for better organization
 */
export const groupAttributesByType = (attributes?: NFTAttribute[] | null): Record<string, NFTAttribute[]> => {
  if (!attributes) return {};

  return attributes.reduce((groups, attr) => {
    const type = attr.trait_type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(attr);
    return groups;
  }, {} as Record<string, NFTAttribute[]>);
};

/**
 * Determines collection size category
 */
export const getCollectionSizeCategory = (totalSupply?: number | null): {
  category: 'tiny' | 'small' | 'medium' | 'large' | 'massive' | 'unknown';
  description: string;
} => {
  if (!totalSupply) return { category: 'unknown', description: 'Unknown collection size' };

  if (totalSupply <= 100) {
    return { category: 'tiny', description: `Exclusive collection of ${totalSupply.toLocaleString()} items` };
  } else if (totalSupply <= 1000) {
    return { category: 'small', description: `Limited collection of ${totalSupply.toLocaleString()} items` };
  } else if (totalSupply <= 10000) {
    return { category: 'medium', description: `Medium collection of ${totalSupply.toLocaleString()} items` };
  } else if (totalSupply <= 100000) {
    return { category: 'large', description: `Large collection of ${totalSupply.toLocaleString()} items` };
  } else {
    return { category: 'massive', description: `Massive collection of ${totalSupply.toLocaleString()} items` };
  }
};

/**
 * Validates NFT addresses
 */
export const isValidNFTAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validates token IDs for NFTs
 */
export const isValidNFTTokenId = (tokenId: string): boolean => {
  return /^\d+$/.test(tokenId) && parseInt(tokenId) >= 0;
};

/**
 * Creates a shareable URL for an NFT
 */
export const createShareableNFTUrl = (nftAddress: string, tokenId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/nft/${nftAddress}/${tokenId}`;
};

/**
 * Generates mock collection items for display
 */
export const generateMockCollectionItems = (
  baseTokenId: string,
  basePrice: string,
  count: number = 8
) => {
  const items = [];
  const baseId = parseInt(baseTokenId);

  for (let i = 0; i < count; i++) {
    const tokenId = (baseId + i + 1).toString();
    const priceModifier = i * 0.01;
    const status = i % 3 === 0 ? 'Listed' : i % 3 === 1 ? 'Auction' : 'Not Listed';
    const statusColor = i % 3 === 0 ? 'green' : i % 3 === 1 ? 'blue' : 'gray';

    items.push({
      tokenId,
      priceModifier,
      status,
      statusColor
    });
  }

  return items;
};
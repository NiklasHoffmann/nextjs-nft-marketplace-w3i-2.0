/**
 * Core NFT and marketplace types
 * @deprecated These types are deprecated. Use AggregatedNFT and related types from nft-types.ts instead.
 * This file will be removed in a future version.
 */

/**
 * @deprecated Use NftMeta from nft-types.ts instead
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  background_color?: string;
  youtube_url?: string;
}

/**
 * @deprecated Use attribute structure from NftMeta in nft-types.ts instead
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
}

/**
 * @deprecated Use NftCore from nft-types.ts instead
 */
export interface NFTContractInfo {
  name?: string;
  symbol?: string;
  totalSupply?: bigint;
  owner?: string;
  maxSupply?: bigint;
  mintPrice?: bigint;
  saleIsActive?: boolean;
  royaltyInfo?: {
    receiver: string;
    royaltyAmount: bigint;
  };
}

/**
 * @deprecated Use AggregatedNFT from nft-types.ts instead
 */
export interface NFTDetails {
  // Basic NFT info
  nftAddress: string;
  tokenId: string;
  tokenURI?: string;
  owner?: string;

  // Metadata
  metadata?: NFTMetadata;
  imageUrl?: string;
  animationUrl?: string;

  // Contract info
  contractInfo?: NFTContractInfo;

  // Marketplace specific
  isListed?: boolean;
  price?: string;
  seller?: string;
  listingId?: string;

  // Loading states
  isLoading?: boolean;
  error?: string;
}

/**
 * @deprecated Use ActiveItem from nft-types.ts instead
 */
export interface ActiveItem {
  listingId: string;
  nftAddress: string;
  tokenId: string;
  isListed: boolean;
  price: string;
  seller: string;
  buyer?: string;
  desiredNftAddress?: string;
  desiredTokenId?: string;
}

/**
 * @deprecated Use AggregatedNFTListResponse from nft-types.ts instead
 */
export interface ActiveItemsData {
  items: ActiveItem[];
}

// Utility types for better type inference
/**
 * @deprecated Use types from nft-types.ts instead
 */
export type NFTAddress = `0x${string}`;
/**
 * @deprecated Use types from nft-types.ts instead
 */
export type TokenId = string;
/**
 * @deprecated Use types from nft-types.ts instead
 */
export type WalletAddress = `0x${string}`;

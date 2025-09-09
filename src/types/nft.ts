/**
 * Core NFT and marketplace types
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

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
}

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

export interface ActiveItemsData {
  items: ActiveItem[];
}

// Utility types for better type inference
export type NFTAddress = `0x${string}`;
export type TokenId = string;
export type WalletAddress = `0x${string}`;

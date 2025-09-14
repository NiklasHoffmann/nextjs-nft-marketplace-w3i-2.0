// Clean API Types - Minimalistic Structure

// Admin Insights
export interface AdminNFTInsight {
  _id?: string;
  contractAddress: string;
  tokenId: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Project/Product Information
  projectName?: string;
  projectDescription?: string;
  projectWebsite?: string;
  projectTwitter?: string;
  projectDiscord?: string;
  // Partnerships
  partnerships?: string[];
  partnershipDetails?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Admin Collection Insights (same structure as NFT insights but for entire collection)
export interface AdminCollectionInsight {
  _id?: string;
  contractAddress: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Project/Product Information
  projectName?: string;
  projectDescription?: string;
  projectWebsite?: string;
  projectTwitter?: string;
  projectDiscord?: string;
  // Partnerships
  partnerships?: string[];
  partnershipDetails?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// User Interactions
export interface WatchlistItem {
  userId: string;
  contractAddress: string;
  tokenId: string;
  addedAt: string;
}

export interface FavoriteItem {
  userId: string;
  contractAddress: string;
  tokenId: string;
  addedAt: string;
}

export interface RatingItem {
  userId: string;
  contractAddress: string;
  tokenId: string;
  rating: number; // 1-5 stars
  ratedAt: string;
}

// Public Statistics
export interface NFTStats {
  contractAddress: string;
  tokenId: string;
  viewCount: number;
  favoriteCount: number;
  averageRating: number;
  ratingCount: number;
  watchlistCount: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}

// Hooks Data Structure
export interface NFTPageData {
  // User's interactions with this NFT
  isWatchlisted: boolean;
  isFavorited: boolean;
  userRating?: number;
  
  // Public stats
  stats: NFTStats;

  // Admin insights (publicly available but created by admins)
  adminInsights?: AdminNFTInsight;
  
  // Collection insights (fallback if no specific NFT insights exist)
  collectionInsights?: AdminCollectionInsight;
}
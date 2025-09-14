// Clean API Types - Minimalistic Structure

import type { NFTProjectDescriptions, NFTFunctionalitiesDescriptions } from '../05-features/03-nft-insights';

// Admin Insights
export interface AdminNFTInsight {
  _id?: string;
  contractAddress: string;
  tokenId: string;
  customTitle: string; // Renamed from title to customTitle for clarity
  title?: string; // Legacy support
  description?: string;
  descriptions?: string[];  // ✨ Legacy: Array für mehrere Descriptions  
  projectDescriptions?: NFTProjectDescriptions; // ✨ Enhanced: Project-spezifische Beschreibungen
  functionalitiesDescriptions?: NFTFunctionalitiesDescriptions; // ✨ Enhanced: Funktionalitäts-spezifische Beschreibungen
  specificDescriptions?: NFTProjectDescriptions; // ✨ Legacy support - maps to projectDescriptions
  cardDescriptions?: string[]; // ✨ NFT Card descriptions (max 3, with character limit)
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Social/Partnership Information (project info now in title-description pairs)
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
  customTitle: string; // Renamed from title to customTitle for clarity
  title?: string; // Legacy support
  description?: string;
  descriptions?: string[];  // ✨ Legacy: Array für mehrere Descriptions
  projectDescriptions?: NFTProjectDescriptions; // ✨ Enhanced: Project-spezifische Beschreibungen
  functionalitiesDescriptions?: NFTFunctionalitiesDescriptions; // ✨ Enhanced: Funktionalitäts-spezifische Beschreibungen
  specificDescriptions?: NFTProjectDescriptions; // ✨ Legacy support - maps to projectDescriptions
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Social/Partnership Information (project info now in title-description pairs)
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
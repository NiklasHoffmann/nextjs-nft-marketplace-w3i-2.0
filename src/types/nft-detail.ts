/**
 * NFT Detail Page specific types and interfaces
 */

import { NFTAttribute, NFTMetadata } from './nft';
import { NFTInsights } from './insights';

export type TabType = 'project' | 'functionalities' | 'tokenomics';

// Use NFTAttribute directly - extended if needed

export interface RoyaltyInfo {
    percentage?: number | null;
    receiver?: string;
    amount?: string;
}

export interface NFTDetailsPageData {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    buyer?: string;
    desiredNftAddress: string;
    desiredTokenId: string;
    metadata?: NFTMetadata;
}

export interface NFTMetadataExtended extends NFTMetadata {
    // Enhanced metadata from useNFTMetadata hook
    categories: string[];
    tags: string[];
    animationUrl?: string | null;
    audioUrl?: string | null;
    videoUrl?: string | null;
    externalUrl?: string | null;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
    creator?: string | null;
    collection?: string | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    contractAddress?: string;
    tokenStandard: string;
    blockchain: string;

    // Contract-specific data
    contractName?: string | null;
    contractSymbol?: string | null;
    currentOwner?: string | null;
    totalSupply?: number | null;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;

    // Extended properties
    properties?: Record<string, any>;
}

// Component Props Types
export interface NFTDetailHeaderProps {
    name?: string | null;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    nftAddress: string;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onShare: () => void;
}

export interface CategoryPillsProps {
    categories: string[];
    tags: string[];
    externalUrl?: string | null;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
    insights?: NFTInsights | null;
    insightsLoading?: boolean;
    contractAddress?: string; // Added for edit functionality
    tokenId?: string; // Added for edit functionality
}

export interface NFTMediaSectionProps {
    imageUrl?: string | null;
    animationUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
    name?: string | null;
    tokenId: string;
}

export interface NFTPriceCardProps {
    price: string;
    isListed: boolean;
    convertedPrice: string;
    priceLoading: boolean;
    selectedCurrencySymbol: string;
}

export interface NFTTabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export interface NFTInfoTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    nftAddress: string;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    tokenStandard: string;
    blockchain: string;
    totalSupply?: number | null;
    currentOwner?: string | null;
    creator?: string | null;
    nftDetails: NFTDetailsPageData;
    description?: string | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    attributes?: NFTAttribute[] | null;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
}

export interface PropertiesDisplayProps {
    properties: Record<string, any>;
}

export interface SwapTargetInfoProps {
    desiredNftAddress: string;
    desiredTokenId: string;
}

export interface CollectionItemsListProps {
    collection?: string | null;
    nftAddress: string;
    tokenId: string;
    name?: string | null;
    price: string;
}

export interface ErrorDisplayProps {
    error: string;
    onBack: () => void;
}

// Tab Component Props
export interface ProjectTabProps {
    nftAddress: string;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    tokenStandard: string;
    blockchain: string;
    totalSupply?: number | null;
    currentOwner?: string | null;
    creator?: string | null;
    seller: string;
    description?: string | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    attributes?: NFTAttribute[] | null;
}

export interface FunctionalitiesTabProps {
    attributes?: any[] | null;
    blockchain: string;
    tokenStandard: string;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
}

export interface TokenomicsTabProps {
    price: string;
    totalSupply?: number | null;
    rarityRank?: number | null;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
    tokenStandard: string;
    blockchain: string;
    currentOwner?: string | null;
}
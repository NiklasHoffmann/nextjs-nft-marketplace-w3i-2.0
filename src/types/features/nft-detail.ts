/**
 * NFT Detail Page specific types and interfaces
 */

// Modern imports from core types
import { NftMeta } from '../core/core-nft-modern';
import { NFTInsights } from '../insights/insights-main';
import { PublicNFTInsights } from '../insights/insights-public';
import { AdminNFTInsight, AdminCollectionInsight } from '../api/api-responses';

export type TabType = 'overview' | 'technical' | 'investment' | 'insights' | 'market-insights' | 'personal' | 'project' | 'functionalities' | 'tokenomics';

// Modern attribute type from NftMeta
export type NFTAttribute = {
    trait_type?: string;
    value?: any;
    display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date' | string;
};

export interface RoyaltyInfo {
    percentage?: number | null;
    receiver?: string;
    amount?: string;
}

export interface NFTDetailsPageData {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    buyer?: string;
    desiredContractAddress: string;
    desiredTokenId: string;
    metadata?: NftMeta;
}

export interface NFTMetadataExtended extends NftMeta {
    // Enhanced metadata from useNFTMetadata hook
    categories: string[];
    tags: string[];
    animationUrl?: string; // overriding to match parent type
    audioUrl?: string | null;
    videoUrl?: string | null;
    externalUrl?: string; // overriding to match parent type
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
    contractAddress: string;
    imageUrl?: string | null;
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
    insights?: NFTInsights | PublicNFTInsights | AdminNFTInsight | AdminCollectionInsight | null;
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
    // For Add to Cart functionality
    contractAddress?: string;
    tokenId?: string;
    seller?: string;
    listingId?: string;
    // For owner-only actions
    currentOwner?: string;
    connectedAddress?: string;
    nftName?: string;
    nftImage?: string;
    // For swap/trade functionality
    desiredContractAddress?: string;
    desiredTokenId?: string;
    // Payment currency
    currency?: string | null | undefined;
    // v2 Marketplace fields
    status?: 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED' | null;
    listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP' | null;
    tokenStandard?: 'ERC721' | 'ERC1155' | null;
}

export interface NFTTabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    isWalletConnected?: boolean; // Add wallet connection state to hide personal tab
}

export interface NFTInfoTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    contractAddress: string;
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
    attributes?: NFTAttribute[];
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
}

export interface PropertiesDisplayProps {
    properties: Record<string, any>;
}

export interface SwapTargetInfoProps {
    desiredContractAddress: string;
    desiredTokenId: string;
}

export interface CollectionItemsListProps {
    collection?: string | null;
    contractAddress: string;
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
    contractAddress: string;
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
    adminInsights?: AdminNFTInsight;
    collectionInsights?: AdminCollectionInsight;
    loading?: boolean;
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

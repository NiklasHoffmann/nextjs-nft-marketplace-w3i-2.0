/**
 * MARKETPLACE UI TYPES
 * 
 * UI-spezifische Type Definitionen für Marketplace-Komponenten:
 * • Filter & Sort Interfaces
 * • NFT Scroll List Items
 * • Component Props
 * • Filterable Items für useNFTFilters Hook
 * 
 * Diese Datei zentralisiert alle UI-Types die zuvor verstreut in
 * verschiedenen Komponenten definiert waren.
 */

import type { ReactNode } from 'react';

// ===== FILTER & SORT =====
// Ursprünglich in: NFTFilterBar.tsx

/**
 * NFT Filter Optionen für Marketplace & Collection Views
 */
export interface NFTFilters {
    /** Kategorie-Filter (Art, Gaming, Music, etc.) */
    categories: string[];

    /** Preis-Filter (Min/Max in ETH) */
    priceMin?: number;
    priceMax?: number;

    /** Rating-Filter */
    minRating?: number;

    /** Stats-Filter */
    minViews?: number;
    minLikes?: number;
    minWatchlistCount?: number;

    /** Suchbegriff */
    searchTerm?: string;

    /** Seltenheits-Filter */
    rarities: string[];

    /** Collection-spezifische Filter */
    minSupply?: number;
    minListedItems?: number;
    minFloorPrice?: number;
}

/**
 * Sortier-Optionen für NFT Listen
 */
export interface NFTSortOptions {
    /** Sortier-Feld */
    field: 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created' | 'tokenId' | 'rarity';
    /** Sortier-Richtung */
    direction: 'asc' | 'desc';
}

// ===== SCROLL LIST ITEMS =====
// Ursprünglich in: NFTScrollList.tsx

/**
 * Basis NFT Item für NFTScrollList Komponente
 * Enhanced: Unterstützt MongoDB-Daten für optimierte Performance
 */
export interface NFTScrollItem {
    /** NFT Contract Address */
    contractAddress: string;
    /** Token ID */
    tokenId: string;
    /** Preis (optional, wenn listed) - unterstützt string, bigint, oder null */
    price?: string | bigint | null;
    /** Ist NFT gelistet? */
    isListed?: boolean;
    /** Marketplace Listing ID */
    listingId?: string;
    /** Verkäufer Address */
    seller?: string;
    /** Käufer Address (bei Swap-Listings) - supports null */
    buyer?: string | null;
    /** Gewünschte NFT Address (bei Trade) */
    desiredContractAddress?: string;
    /** Gewünschte Token ID (bei Trade) */
    desiredTokenId?: string;

    // ===== MongoDB-Optimierte Daten (optional) =====
    /** Metadata aus MongoDB (verhindert API calls) */
    metadata?: {
        name?: string | null;
        description?: string | null;
        image?: string | null;
        animationUrl?: string | null;
        externalUrl?: string | null;
        attributes?: Array<{ trait_type: string; value: string | number }>;
    };
    /** Insights aus MongoDB (verhindert API calls) */
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
    /** Contract Info aus MongoDB */
    contract?: {
        name?: string | null;
        symbol?: string | null;
        totalSupply?: number | bigint | null;
        owner?: string | null;
        tokenURI?: string | null;
        approved?: string | null;
        ownerBalance?: number | bigint | null;
    };

    /** Zusätzliche Properties erlaubt */
    [key: string]: any;
}

/**
 * Props für NFTScrollList Komponente
 */
export interface NFTScrollListProps {
    /** Array von NFT Items zum Anzeigen */
    items: NFTScrollItem[];
    /** Optional: Titel für die Sektion */
    title?: string;
    /** Badge für jede Card (z.B. "Listed", "Not Listed") */
    badge?: {
        text: string;
        color: string; // Tailwind classes wie 'bg-green-500'
    };
    /** Zusätzliches Badge (top-left corner) */
    secondaryBadge?: (item: NFTScrollItem) => ReactNode;
    /** NFT Card Insights aktivieren */
    enableInsights?: boolean;
    /** Stats auf Cards anzeigen */
    showStats?: boolean;
    /** Priority Loading für Images */
    priority?: boolean;
    /** Empty State Message */
    emptyMessage?: string;
    /** Custom Empty State Component */
    emptyComponent?: ReactNode;
    /** Loading State */
    loading?: boolean;
    /** Anzahl Skeleton Cards beim Laden */
    loadingCount?: number;
    /** Zusätzliche className für Container */
    className?: string;
    /** Custom Card Width (default: w-60) */
    cardWidth?: string;
    /** Custom Gap (default: gap-6) */
    gap?: string;
    /** Custom Padding (default: p-4) */
    padding?: string;
    /** Card Links aktivieren (wrap in Link component) */
    enableLinks?: boolean;
    /** Custom Link Builder */
    linkBuilder?: (item: NFTScrollItem) => string;
    /** Callback wenn Card geklickt wird */
    onCardClick?: (item: NFTScrollItem) => void;
    /** "View All" Button aktivieren für Grid View Toggle */
    enableViewAll?: boolean;
    /** Grid Columns für "View All" Mode */
    gridColumns?: string;
}

// ===== FILTERABLE ITEMS =====
// Ursprünglich in: hooks/nfts/useNFTFilters.ts

/**
 * Erweiterte NFT Item Struktur mit allen Daten für Filtering & Sorting
 * Kombiniert Marketplace Data + NFT Context Data
 */
export interface FilterableNFTItem extends NFTScrollItem {
    /** Contract Address (alias für Filter-Kompatibilität) */
    contractAddress: string;
    /** Is NFT listed (required for filters) */
    isListed: boolean;

    // NFT Metadata
    /** NFT Name */
    name?: string | null;
    /** NFT Symbol */
    symbol?: string | null;
    /** Kategorie */
    category?: string | null;
    /** Seltenheit */
    rarity?: string | null;

    // NFT Stats
    /** Durchschnittliche Rating */
    averageRating?: number | null;
    /** Anzahl Ratings */
    ratingCount?: number | null;
    /** Anzahl Likes */
    likeCount?: number | null;
    /** Anzahl Watchlist Einträge */
    watchlistCount?: number | null;
    /** Anzahl Views */
    viewCount?: number | null;

    // Custom Admin Data
    /** Custom Titel (Admin Insights) */
    customTitle?: string | null;
    /** Card Descriptions */
    cardDescriptions?: string[] | null;
    /** Tags */
    tags?: string[] | null;

    // Display
    /** Image URL */
    imageUrl?: string | null;
}

// ===== WALLET NFTS LIST =====

/**
 * Props für WalletNFTsList Komponente
 * Now uses WalletNFTsContext for auto-loading wallet NFTs
 */
export interface WalletNFTsListProps {
    /** Optional: Titel */
    title?: string;
    /** Separate Sections für Listed/Not Listed */
    separateSections?: boolean;
    /** Limit pro Section */
    limitPerSection?: number;
    /** Filter */
    filters?: NFTFilters;
    /** Sort Options */
    sort?: NFTSortOptions;
}

// ===== LIST COMPONENTS PROPS =====

/**
 * Props für Marketplace Listen-Komponenten
 * Verwendet von: ListedNFTsList, WalletNFTsList
 */
export interface ActiveItemsListProps {
    /** Externe Filter (optional) */
    externalFilters?: NFTFilters;
    /** Externe Sort Options (optional) */
    externalSort?: NFTSortOptions;
}

// ===== CONSTANTS =====

/**
 * Verfügbare Kategorien
 */
export const AVAILABLE_CATEGORIES = [
    'Art',
    'DigitalTwin',
    'Collectible',
    'Gaming',
    'Music',
    'Sports',
    'Virtual Real Estate',
    'Utility'
] as const;

/**
 * Verfügbare Seltenheiten
 */
export const AVAILABLE_RARITIES = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
] as const;

/**
 * Type für Kategorien
 */
export type NFTCategory = typeof AVAILABLE_CATEGORIES[number];

/**
 * Type für Seltenheiten
 */
export type NFTRarity = typeof AVAILABLE_RARITIES[number];

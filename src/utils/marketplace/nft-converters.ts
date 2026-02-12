/**
 * NFT CONVERTER UTILITIES
 * 
 * Wiederverwendbare Conversion-Funktionen für NFT Daten
 * 
 * Wird verwendet von:
 * - ListedNFTsList (Marketplace)
 * - WalletNFTsList
 * - CollectionPageClient
 * 
 * Zentrale Conversion-Logik für NFT Datenstrukturen.
 */

import { devLog } from '@/utils';
import type { NFTScrollItem, FilterableNFTItem } from '@/types/marketplace';

/**
 * Conversion Options für erweiterte Kontrolle
 */
export interface ConversionOptions {
    /** Marketplace-Daten inkludieren (price, isListed, etc.) */
    includeMarketplaceData?: boolean;
    /** Custom Price Formatter */
    priceFormatter?: (price: any) => string | bigint;
    /** Preserve alle zusätzlichen Properties */
    preserveExtraProps?: boolean;
}

/**
 * Konvertiert verschiedene NFT-Formate zu NFTScrollItem
 * 
 * @param items - Array von NFT Objekten (beliebiges Format)
 * @param options - Optional: Conversion Options
 * @returns Array von NFTScrollItem
 * 
 * @example
 * ```typescript
 * const scrollItems = convertToScrollItems(rawNFTs);
 * 
 * // Mit Custom Price Formatting
 * const scrollItems = convertToScrollItems(rawNFTs, {
 *   priceFormatter: (price) => parseFloat(price).toFixed(4)
 * });
 * ```
 */
export function convertToScrollItems(
    items: any[],
    options: ConversionOptions = {}
): NFTScrollItem[] {
    const {
        includeMarketplaceData = true,
        priceFormatter,
        preserveExtraProps = true
    } = options;

    return items.map((item) => {
        // Basis NFT Daten
        const scrollItem: NFTScrollItem = {
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
        };

        // Marketplace Daten (optional)
        if (includeMarketplaceData) {
            scrollItem.price = priceFormatter
                ? priceFormatter(item.price)
                : item.price;
            scrollItem.isListed = item.isListed;
            scrollItem.listingId = item.listingId;
            scrollItem.seller = item.seller;
            scrollItem.buyer = item.buyer;
            scrollItem.desiredContractAddress = item.desiredContractAddress;
            scrollItem.desiredTokenId = item.desiredTokenId;
        }

        // Preserve alle anderen Properties (für Flexibilität)
        if (preserveExtraProps) {
            return {
                ...item,
                ...scrollItem
            };
        }

        return scrollItem;
    });
}

/**
 * Konvertiert zu FilterableNFTItem (mit allen Daten für Filtering/Sorting)
 * 
 * @param items - Array von NFT Objekten
 * @returns Array von FilterableNFTItem
 * 
 * @example
 * ```typescript
 * const filterableItems = convertToFilterableItems(marketplaceItems);
 * // Kann jetzt mit useNFTFilters Hook verwendet werden
 * const { filteredItems } = useNFTFilters(filterableItems, filters, sort);
 * ```
 */
export function convertToFilterableItems(
    items: any[]
): FilterableNFTItem[] {
    return items.map((item) => ({
        // Pflichtfelder
        contractAddress: item.contractAddress,
        tokenId: item.tokenId,

        // Marketplace Daten
        price: item.price,
        currency: item.currency,
        listingType: item.listingType,
        isListed: item.isListed,
        listingId: item.listingId,
        seller: item.seller,
        buyer: item.buyer,
        desiredContractAddress: item.desiredContractAddress,
        desiredTokenId: item.desiredTokenId,

        // NFT Metadata (flattened for filtering)
        name: item.name,
        symbol: item.symbol,
        category: item.category,
        rarity: item.rarity,

        // NFT Stats
        averageRating: item.averageRating,
        ratingCount: item.ratingCount,
        likeCount: item.likeCount || item.favoriteCount, // Support both fields during migration
        watchlistCount: item.watchlistCount,
        viewCount: item.viewCount,

        // Custom Admin Data
        customTitle: item.customTitle,
        cardDescriptions: item.cardDescriptions,
        tags: item.tags,

        // Display
        imageUrl: item.imageUrl,

        // Preserve nested objects for NFTCard compatibility
        metadata: item.metadata,
        contract: item.contract,
        insights: item.insights,
    }));
}

/**
 * Type Guard: Prüft ob ein Objekt ein valides NFTScrollItem ist
 * 
 * @param item - Zu prüfendes Objekt
 * @returns true wenn valides NFTScrollItem
 * 
 * @example
 * ```typescript
 * if (isNFTScrollItem(unknownItem)) {
 *   // TypeScript weiÃ jetzt: unknownItem ist NFTScrollItem
 *   devLog.info(unknownItem.contractAddress);
 * }
 * ```
 */
export function isNFTScrollItem(item: any): item is NFTScrollItem {
    return (
        item &&
        typeof item === 'object' &&
        typeof item.contractAddress === 'string' &&
        typeof item.tokenId === 'string'
    );
}

/**
 * Type Guard: Prüft ob ein Objekt ein valides FilterableNFTItem ist
 */
export function isFilterableNFTItem(item: any): item is FilterableNFTItem {
    return (
        isNFTScrollItem(item) &&
        typeof item.contractAddress === 'string'
    );
}

/**
 * Batch-Konvertierung mit Error Handling
 * Filtert invalide Items automatisch aus
 * 
 * @param items - Array von NFT Objekten
 * @param options - Conversion Options
 * @returns Tuple: [valid items, error count]
 */
export function safeConvertToScrollItems(
    items: any[],
    options?: ConversionOptions
): [NFTScrollItem[], number] {
    let errorCount = 0;

    const validItems = items
        .map((item) => {
            try {
                return convertToScrollItems([item], options)[0];
            } catch (error) {
                devLog.warn('nft-converters', 'Failed to convert NFT item:', item, error);
                errorCount++;
                return null;
            }
        })
        .filter((item): item is NFTScrollItem =>
            item !== null && isNFTScrollItem(item)
        );

    return [validItems, errorCount];
}

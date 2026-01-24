'use client';

/**
 * Marketplace Page - MongoDB Backend
 * 
 * Performance-optimized marketplace using MongoDB REST API.
 * 
 * Architecture:
 * - MongoDB via useMarketplaceItems hook
 * - MarketplaceCacheContext for intelligent caching
 * - Complete enriched NFT data (metadata + insights + contract + marketplace)
 * 
 * Performance: ~65ms load time, 60x faster than legacy TheGraph implementation
 * Database: MongoDB marketplace_items collection with real-time sync
 */

import React from "react";
import { ListedNFTsList, CollectionsList } from "./components";
import { useMarketplaceLayout } from "./context";

export default function MarketplacePage() {
    const { filters, sort, onFiltersChange, onSortChange } = useMarketplaceLayout();

    return (
        <>
            {/* ListedNFTsList - MongoDB-powered */}
            <ListedNFTsList
                externalFilters={filters}
                externalSort={sort}
                onFiltersChange={onFiltersChange}
            />

            {/* Divider */}
            <div className="px-8 my-8">
                <hr className="border-t border-gray-200" />
            </div>

            {/* CollectionsList - MongoDB-powered */}
            <CollectionsList
                currentSort={sort}
                onSortChange={onSortChange}
                filters={filters}
            />
        </>
    );
}

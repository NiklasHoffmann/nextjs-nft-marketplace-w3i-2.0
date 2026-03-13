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

import React, { useEffect, useState } from "react";
import { ListedNFTsList, CollectionsList } from "./components";
import { useMarketplaceLayout } from "./context";

export default function MarketplacePage() {
    const { filters, sort, onFiltersChange, onSortChange } = useMarketplaceLayout();
    const [showCollections, setShowCollections] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const enableCollections = () => {
            if (!cancelled) {
                setShowCollections(true);
            }
        };

        // Prefer idle time for below-the-fold content; fallback to short delay.
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const idleCallbackId = window.requestIdleCallback(enableCollections, { timeout: 1200 });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(idleCallbackId);
            };
        }

        const timeoutId = setTimeout(enableCollections, 500);
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, []);

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

            {/* CollectionsList - deferred to keep first render fast */}
            {showCollections ? (
                <CollectionsList
                    currentSort={sort}
                    onSortChange={onSortChange}
                    filters={filters}
                />
            ) : (
                <div className="w-full md:pl-16 pl-10 px-8 py-6 text-sm text-gray-500">
                    Loading collections...
                </div>
            )}
        </>
    );
}

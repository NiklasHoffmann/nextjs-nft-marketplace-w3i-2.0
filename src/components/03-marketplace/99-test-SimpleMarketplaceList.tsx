/**
 * Simple Marketplace List - Funktionale Marketplace-Komponente mit dem neuen Context
 * 
 * Diese Komponente zeigt, wie eine Marketplace-Liste mit dem AggregatedNFT Context 
 * funktionieren sollte, ohne abhängig vom GraphQL Subgraph zu sein.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNFTContext } from '@/contexts/NFTContext';
import { SimpleNFTCard } from '../02-nft/99-test-SimpleNFTCard';
import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

// Mock Marketplace Data - bis der Subgraph funktioniert
const MOCK_MARKETPLACE_ITEMS = [
  {
    nftAddress: '0x2c9d7f070d03d83588e22c23fe858aa71274ad2a' as `0x${string}`,
    tokenId: '1',
    listingId: 'mock-1',
    price: '0.05',
    seller: '0x8a200122f666af83aF2D4f425aC7A35fa5491ca7' as `0x${string}`,
    isListed: true
  }
  // Weitere Mock-Items können hier hinzugefügt werden
];

export function SimpleMarketplaceList() {
  const nftContext = useNFTContext();
  const [nfts, setNfts] = useState<(AggregatedNFT & { marketplaceData: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarketplaceNFTs = async () => {
      setLoading(true);

      try {
        const loadedNFTs = await Promise.all(
          MOCK_MARKETPLACE_ITEMS.map(async (item) => {
            // NFT Daten laden
            const nft = await nftContext.loadNFT(item.nftAddress, item.tokenId);

            // Marketplace-Daten hinzufügen
            const enrichedNFT = {
              ...nft,
              // Listing info hinzufügen
              listing: {
                listingId: item.listingId,
                nftAddress: item.nftAddress,
                tokenId: item.tokenId,
                isListed: item.isListed,
                price: item.price,
                seller: item.seller,
                buyer: null as `0x${string}` | null,
                desiredNftAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                desiredTokenId: null
              },
              listed: item.isListed,
              marketplaceData: item
            };

            return enrichedNFT;
          })
        );

        setNfts(loadedNFTs);
      } catch (error) {
        console.error('Error loading marketplace NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceNFTs();
  }, [nftContext]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading marketplace items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Simple Marketplace</h1>
        <p className="text-gray-600">
          Functioning marketplace using the new NFTContext (with mock data)
        </p>

        {/* Marketplace Stats */}
        <div className="mt-4 p-4 bg-blue-50 rounded text-sm">
          <h3 className="font-medium mb-2">Marketplace Status:</h3>
          <div>Total Items: {nfts.length}</div>
          <div>Listed Items: {nfts.filter(nft => nft.listed).length}</div>
          <div>With Images: {nfts.filter(nft => nft.meta?.image).length}</div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <div key={nft.key} className="relative">
            {/* Marketplace Badge */}
            {nft.listed && (
              <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded text-xs">
                Listed: {nft.listing?.price} ETH
              </div>
            )}

            <SimpleNFTCard nft={nft} />

            {/* Marketplace Info */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div>Seller: {nft.listing?.seller?.slice(0, 8)}...</div>
              <div>Listing ID: {nft.listing?.listingId}</div>
            </div>
          </div>
        ))}
      </div>

      {nfts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No marketplace items found
        </div>
      )}
    </div>
  );
}

export default SimpleMarketplaceList;
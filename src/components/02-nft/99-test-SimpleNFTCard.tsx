/**
 * SimpleNFTCard - Minimale NFT-Karte für Context-Testing
 * 
 * Diese Komponente ist bewusst einfach gehalten, um zu testen ob der neue
 * NFTContext grundsätzlich funktioniert, ohne komplexe Marketplace-Logik.
 */

'use client';

import React from 'react';
import { useNFTContext } from '@/contexts/NFTContext';
import type { AggregatedNFT } from '@/types/01-core/01-core-nft-modern';

interface SimpleNFTCardProps {
  nft: AggregatedNFT;
}

export function SimpleNFTCard({ nft }: SimpleNFTCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-lg">
          {nft.meta?.name || nft.core?.name || 'Unnamed NFT'}
        </h3>
        <p className="text-sm text-gray-600">
          {nft.core?.nftAddress?.slice(0, 8)}...#{nft.core?.tokenId}
        </p>
      </div>

      {/* Image */}
      <div className="mb-3">
        {nft.meta?.image ? (
          <img
            src={nft.meta.image}
            alt={nft.meta?.name || 'NFT'}
            className="w-full h-48 object-cover rounded"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="space-y-2">
        {nft.meta?.description && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {nft.meta.description}
          </p>
        )}

        {nft.listing?.price && (
          <div className="text-sm">
            <span className="font-medium text-green-600">
              {nft.listing.price} ETH
            </span>
          </div>
        )}

        {/* Context Status */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <div>Listed: {nft.listed ? '✅' : '❌'}</div>
          <div>Has Meta: {nft.meta ? '✅' : '❌'}</div>
          <div>Has Social: {nft.social ? '✅' : '❌'}</div>
          <div>Updated: {new Date(nft.lastUpdated).toLocaleTimeString()}</div>
          <div>Sources: {Object.entries(nft.sources).filter(([_, has]) => has).map(([src]) => src).join(', ')}</div>
        </div>
      </div>
    </div>
  );
}

export default SimpleNFTCard;
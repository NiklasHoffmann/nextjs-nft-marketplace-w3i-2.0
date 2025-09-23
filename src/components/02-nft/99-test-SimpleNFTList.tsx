/**
 * SimpleNFTList - Minimale NFT-Liste für Context-Testing
 * 
 * Diese Komponente testet den NFTContext mit ein paar bekannten NFT-Adressen
 * um zu sehen, ob das Grundsystem funktioniert.
 */

'use client';

import React, { useEffect } from 'react';
import { useNFTContext } from '@/contexts/NFTContext';
import { SimpleNFTCard } from './99-test-SimpleNFTCard';

// Test NFTs - hardcodierte Adressen die wir laden wollen
const TEST_NFTS = [
  {
    nftAddress: '0x2c9d7f070d03d83588e22c23fe858aa71274ad2a' as `0x${string}`,
    tokenId: '1'
  }
  // Weitere NFTs können hier hinzugefügt werden, wenn sie verfügbar sind
];

export function SimpleNFTList() {
  const nftContext = useNFTContext();

  // NFTs beim Mount laden
  useEffect(() => {
    TEST_NFTS.forEach(async ({ nftAddress, tokenId }) => {
      try {
        await nftContext.loadNFT(nftAddress, tokenId);
      } catch (error) {
        console.error(`❌ Failed to load NFT: ${nftAddress}#${tokenId}`, error);
      }
    });
  }, [nftContext]);

  // NFTs aus Context holen
  const nfts = TEST_NFTS.map(({ nftAddress, tokenId }) => {
    const nft = nftContext.getNFT(nftAddress, tokenId);
    return { nftAddress, tokenId, nft };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Simple NFT Context Test</h1>
        <p className="text-gray-600">
          Testing {TEST_NFTS.length} hardcoded NFTs with the new NFTContext
        </p>

        {/* Context Debug Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
          <h3 className="font-medium mb-2">Context Status:</h3>
          <div>Total NFTs: {nftContext.getCacheStats?.()?.total || 'Unknown'}</div>
          <div>Fresh: {nftContext.getCacheStats?.()?.fresh || 'Unknown'}</div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map(({ nftAddress, tokenId, nft }) => (
          <div key={`${nftAddress}-${tokenId}`} className="relative">
            {/* Loading Indicator */}
            {!nft && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm text-gray-600">Loading...</div>
                </div>
              </div>
            )}

            {/* NFT Card or Placeholder */}
            {nft ? (
              <SimpleNFTCard nft={nft} />
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50 h-64">
                <div className="text-center text-gray-500">
                  <div className="font-medium">{nftAddress.slice(0, 8)}...#{tokenId}</div>
                  <div className="text-sm mt-1">Waiting for data...</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Raw Debug Data */}
      <div className="mt-8 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-64">
        <h3 className="text-white font-medium mb-2">Raw NFT Data (for debugging):</h3>
        <pre>{JSON.stringify(nfts.map(({ nft, ...rest }) => ({ ...rest, hasNft: !!nft })), null, 2)}</pre>
      </div>
    </div>
  );
}

export default SimpleNFTList;
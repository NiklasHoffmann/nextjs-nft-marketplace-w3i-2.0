/**
 * NFTCardHeader - Header section for NFT cards
 * Shows collection symbol, NFT name, and rating
 */

import { memo } from 'react';

interface NFTCardHeaderProps {
  contractAddress: string;
  tokenId: string;
  contractSymbol?: string | null;
  contractName?: string | null;
  customTitle?: string | null;
  nftName?: string | null;
  averageRating?: number | null;
}

export const NFTCardHeader = memo<NFTCardHeaderProps>(({
  contractAddress,
  tokenId,
  contractSymbol,
  contractName,
  customTitle,
  nftName,
  averageRating
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Collection Symbol/Address */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {contractSymbol || `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}
          </h3>
          {/* NFT Name: customTitle > metadata name > contract name */}
          <p className="text-xs text-gray-600 truncate">
            {customTitle || nftName || contractName || `#${tokenId}`}
          </p>
        </div>

        {/* Average Rating Stars */}
        {averageRating && averageRating > 0 && (
          <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1 ml-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-2.5 h-2.5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

NFTCardHeader.displayName = 'NFTCardHeader';

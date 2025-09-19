"use client";

import { lazy, Suspense, memo } from 'react';

// Lazy load NFTCard component for better code splitting
const NFTCard = lazy(() => import('./02-nft/01-core-NFTCard'));

// Simple loading skeleton that matches NFTCard dimensions
const NFTCardSkeleton = memo(() => (
  <div className="w-80 h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse">
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <div className="h-8 bg-gray-300 rounded"></div>
    </div>
  </div>
));

NFTCardSkeleton.displayName = 'NFTCardSkeleton';

interface LazyNFTCardProps {
  contractAddress: string;
  tokenId: string;
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

const LazyNFTCard = memo((props: LazyNFTCardProps) => {
  return (
    <Suspense fallback={<NFTCardSkeleton />}>
      <NFTCard {...props} />
    </Suspense>
  );
});

LazyNFTCard.displayName = 'LazyNFTCard';
export default LazyNFTCard;
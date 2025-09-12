"use client";

import { lazy, Suspense, memo } from 'react';

// Lazy load the insights panel since it's only needed on detail pages
const NFTInsightsPanel = lazy(() => import('./nft-detail/NFTInsightsPanel'));

const InsightsPanelSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-300 rounded w-20"></div>
        <div className="h-8 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  </div>
));

InsightsPanelSkeleton.displayName = 'InsightsPanelSkeleton';

interface LazyInsightsPanelProps {
  contractAddress: string;
  tokenId: string;
  className?: string;
}

const LazyInsightsPanel = memo((props: LazyInsightsPanelProps) => {
  return (
    <Suspense fallback={<InsightsPanelSkeleton />}>
      <NFTInsightsPanel {...props} />
    </Suspense>
  );
});

LazyInsightsPanel.displayName = 'LazyInsightsPanel';
export default LazyInsightsPanel;
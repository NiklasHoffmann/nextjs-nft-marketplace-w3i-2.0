// app/components/NFTCard.tsx
"use client";

/**
 * Enhanced NFTCard Component with Insights Integration
 * 
 * Features:
 * - 🎯 Auto-loads category from MongoDB insights when enableInsights=true
 * - 🏷️ Displays tags from insights as additional categories
 * - ⭐ Shows rarity badge (common, uncommon, rare, epic, legendary)
 * - 🌟 Displays personal rating as stars
 * - ❤️ Shows status badges (favorite, watchlisted, for sale)
 * - 📝 Uses custom name and description from insights
 * - 🎨 Different visual styling for insights-powered vs standard cards
 * 
 * Usage Examples:
 * 
 * // Standard NFTCard (uses prop-based category)
 * <NFTCard enableInsights={false} category={["Art", "Digital"]} {...props} />
 * 
 * // Insights-powered NFTCard (auto-loads from MongoDB)
 * <NFTCard enableInsights={true} {...props} />
 * 
 * // With NFTCardWithMetadata wrapper
 * <NFTCardWithMetadata enableInsights={true} {...props} />
 */

import { formatEther } from "../utils/formatters";
import { useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import OptimizedNFTImage from "./OptimizedNFTImage";
import { useETHPrice } from "@/contexts/CurrencyContext";
import { useNFTInsights } from "@/hooks/useNFTInsights";

interface NFTCardProps {
  listingId: string;
  nftAddress: string;
  tokenId: string;
  isListed: boolean;
  price: string;
  seller: string;
  buyer?: string;
  desiredNftAddress: string;
  desiredTokenId: string;
  imageUrl?: string;
  likeCount?: number;
  category?: string | string[];
  description?: string | string[];
  priority?: boolean;
  enableInsights?: boolean; // New prop to enable insights integration
}

// Separate price component to prevent unnecessary re-renders
const PriceDisplay = memo(({ price, imageUrl }: { price: string; imageUrl?: string }) => {
  const ethPrice = useMemo(() => parseFloat(formatEther(price)), [price]);
  const { convertedPrice, loading } = useETHPrice(ethPrice);

  return (
    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <div className="text-orange font-semibold text-lg">{formatEther(price)} ETH</div>
          {loading ? (
            <div className="text-xs text-gray-500">Lädt...</div>
          ) : (
            <div className="text-xs text-gray-600">≈ {convertedPrice}</div>
          )}
        </div>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

const NFTCard = memo(({
  listingId,
  nftAddress,
  tokenId,
  isListed,
  price,
  seller,
  desiredNftAddress,
  desiredTokenId,
  imageUrl,
  likeCount = 0,
  category = ["Art", "DigitalTwin", "Collectible", "Sports", "Music", "VirtualRealEstate"],
  description = ["Access to multisignature wallet with 2/3 approvals required", "Includes 1 free on-chain transaction", "Premium security features"],
  priority = false,
  enableInsights = true, // Default to true for insights integration
}: Omit<NFTCardProps, 'buyer'>) => {
  const router = useRouter();

  // Fetch insights data when enabled
  const { insights, loading: insightsLoading } = useNFTInsights({
    contractAddress: enableInsights ? nftAddress : undefined,
    tokenId: enableInsights ? tokenId : undefined,
    autoFetch: enableInsights
  });

  // Determine final category - prioritize insights over props
  const finalCategory = useMemo(() => {
    if (enableInsights && insights && !insightsLoading) {
      // Use insights category if available, otherwise fall back to prop category
      if (insights.category) {
        return [insights.category];
      }
      // Also use tags as additional categories if available
      if (insights.tags && insights.tags.length > 0) {
        return insights.tags.slice(0, 3); // Limit to first 3 tags
      }
    }
    // Fall back to prop category
    return Array.isArray(category) ? category : [category];
  }, [enableInsights, insights, insightsLoading, category]);

  // Determine final description - prioritize insights over props
  const finalDescription = useMemo(() => {
    if (enableInsights && insights && !insightsLoading) {
      // Use insights description if available
      if (insights.description) {
        return [insights.description];
      }
      // Use investment goal as description if available
      if (insights.investmentGoal) {
        return [insights.investmentGoal];
      }
    }
    // Fall back to prop description
    return Array.isArray(description) ? description : [description];
  }, [enableInsights, insights, insightsLoading, description]);

  // Normalize category to always be an array
  const categories = Array.isArray(finalCategory) ? finalCategory : [finalCategory];

  // Normalize description to always be an array
  const descriptions = Array.isArray(finalDescription) ? finalDescription : [finalDescription];

  // Memoize the overlay className to prevent re-renders
  const overlayClassName = useMemo(() =>
    `relative z-10 flex flex-col justify-between h-full ${imageUrl ? 'p-2 rounded-xl' : 'p-0'}`,
    [imageUrl]
  );

  const handleCardClick = useCallback(() => {
    router.push(`/nft/${nftAddress}/${tokenId}`);
  }, [router, nftAddress, tokenId]);

  return (
    <div className="group cursor-pointer transform-gpu" onClick={handleCardClick}>
      <div className=" hover:scale-102 hover:-translate-y-1 hover:z-50 transition-all duration-200 ease-out rounded-xl shadow-lg flex flex-col flex-end gap-2 w-80 h-96  relative will-change-transform origin-center">
        {/* Background Image with optimized loading */}
        {imageUrl && (
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
            <OptimizedNFTImage
              imageUrl={imageUrl}
              tokenId={tokenId}
              className="object-cover"
              fill={true}
              priority={priority}
            />
          </div>
        )}
        {/* Content overlay */}
        <div className={overlayClassName}>
          {/* NFT Name Header at top */}
          <div className="mb-auto">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {(enableInsights && insights?.customName) || `NFT #${tokenId}`}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {nftAddress.slice(0, 6)}...{nftAddress.slice(-4)}
                  </p>
                </div>
                {/* Rarity and Rating Indicators */}
                {enableInsights && insights && (
                  <div className="flex flex-col items-end gap-1 ml-2">
                    {insights.rarity && (
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${insights.rarity === 'legendary' ? 'bg-purple-100 text-purple-700' :
                        insights.rarity === 'epic' ? 'bg-red-100 text-red-700' :
                          insights.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            insights.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {insights.rarity.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {insights.personalRating && (
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].slice(0, insights.personalRating).map(star => (
                          <svg key={star} className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>          {/* Price Display at bottom */}
          <div className="mt-auto">
            {/* Dynamic Sell/Swap Indicator - directly above price */}
            <div className="mb-2 flex justify-between items-center">
              <div className="flex gap-1">
                {/* Insights status badges */}
                {enableInsights && insights && (
                  <>
                    {insights.isFavorite && (
                      <div className="bg-red-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    )}
                    {insights.isWatchlisted && (
                      <div className="bg-blue-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    )}
                    {insights.isForSale && (
                      <div className="bg-green-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-white/20">
                {desiredNftAddress !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange rounded-full"></div>
                    <span className="text-xs font-medium text-orange">Swap</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-forestgreen rounded-full"></div>
                    <span className="text-xs font-medium text-forestgreen">Sell</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category and Like Count - directly above price */}
            <div className="flex justify-between items-start mb-2">
              {/* Categories */}
              <div className="flex flex-wrap gap-1 flex-1 mr-2">
                {insightsLoading && enableInsights ? (
                  // Loading state for insights
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center">
                    <div className="animate-pulse flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {categories.slice(0, 3).map((cat, index) => (
                      <div key={index} className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border h-6 flex items-center ${enableInsights && insights ?
                        'bg-purple-100/90 border-purple-200/40' :
                        'bg-white/90 border-white/20'
                        }`}>
                        <span className={`text-xs font-medium ${enableInsights && insights ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                          {cat}
                        </span>
                      </div>
                    ))}
                    {categories.length > 3 && (
                      <div className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border h-6 flex items-center ${enableInsights && insights ?
                        'bg-purple-100/90 border-purple-200/40' :
                        'bg-white/90 border-white/20'
                        }`}>
                        <span className={`text-xs font-medium ${enableInsights && insights ? 'text-purple-600' : 'text-gray-500'
                          }`}>
                          +{categories.length - 3}
                        </span>
                      </div>
                    )}
                    {/* Insights indicator badge */}
                    {enableInsights && insights && (
                      <div className="bg-purple-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-purple-400/40 h-6 flex items-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Like Count */}
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center gap-1 flex-shrink-0">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">{likeCount}</span>
              </div>
            </div>

            {/* Description - directly above price */}
            <div className="mb-2 flex flex-wrap gap-1">
              {descriptions.slice(0, 2).map((desc, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-600">
                  {desc}
                </div>
              ))}
              {descriptions.length > 2 && (
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-500">
                  +{descriptions.length - 2}
                </div>
              )}
            </div>

            <PriceDisplay price={price} imageUrl={imageUrl} />
          </div>

          {/* Swap Target Info - only show if exists */}

        </div>
      </div>
    </div>
  );
});

NFTCard.displayName = 'NFTCard';
export default NFTCard;

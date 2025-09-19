// Enhanced NFT Card with Optimized Marketplace Integration and 3D Tilt Effect
"use client";

import React, { useMemo, memo, useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useNFTInteractionPreload } from '@/hooks';
import { useNFTContext } from '@/contexts/NFTContext';
import { useETHPrice } from "@/contexts/OptimizedCurrencyContext";
import { formatEther } from "@/utils";
import OptimizedNFTImage from './02-utils-OptimizedNFTImage';

interface NFTCardProps {
  contractAddress: string;
  tokenId: string;
  // Marketplace props (passed from useActiveItems for efficiency)
  listingId?: string;
  price?: string;
  seller?: string;
  buyer?: string | null;
  isListed?: boolean;
  desiredNftAddress?: string;
  desiredTokenId?: string;
  // Display options
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

// Optimized price display component
const PriceDisplay = memo(({ price, desiredNftAddress }: {
  price: string | null;
  desiredNftAddress?: string | null;
}) => {
  const ethPrice = useMemo(() =>
    price ? parseFloat(formatEther(price)) : 0, [price]
  );
  const { convertedPrice, loading } = useETHPrice(ethPrice);

  if (!price) return null;

  const isSwap = desiredNftAddress && desiredNftAddress !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-200/60 ring-1 ring-gray-300/20">
      <div className="flex justify-between items-center">
        <div className="text-left">
          <div className="text-orange font-semibold text-lg">{formatEther(price)} ETH</div>
          {loading ? (
            <div className="text-xs text-gray-500">Lädt...</div>
          ) : (
            <div className="text-xs text-gray-600">≈ {convertedPrice}</div>
          )}
        </div>
        {/* Sell/Swap Indicator - enhanced styling */}
        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSwap ? 'bg-orange' : 'bg-forestgreen'}`}></div>
            <span className={`text-xs font-medium ${isSwap ? 'text-orange' : 'text-forestgreen'}`}>
              {isSwap ? 'Swap' : 'Sell'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

/**
 * Optimized NFT Card with hybrid data approach
 * 
 * Uses marketplace props when available (from useActiveItems) for immediate display,
 * falls back to NFTContext for additional metadata and insights.
 */
export function NFTCard({
  contractAddress,
  tokenId,
  // Marketplace props (prioritized for efficiency)
  listingId: propListingId,
  price: propPrice,
  seller: propSeller,
  buyer: propBuyer,
  isListed: propIsListed,
  desiredNftAddress: propDesiredNftAddress,
  desiredTokenId: propDesiredTokenId,
  // Display options
  showStats = true,
  className = "",
  priority = false,
  enableInsights = true
}: NFTCardProps) {
  const router = useRouter();

  // Direct context access - simpler and more efficient
  const nftContext = useNFTContext();
  const contextData = nftContext.getNFTCardData(contractAddress, tokenId);

  // Load data if not available
  useEffect(() => {
    if (!contextData && !nftContext.isDataFresh(contractAddress, tokenId)) {
      nftContext.loadNFTData(contractAddress, tokenId);
    }
  }, [nftContext, contractAddress, tokenId, contextData]);

  // Preloading for interactions
  const { onHover, onFocus } = useNFTInteractionPreload();

  // Hybrid data approach: props override context data
  const displayData = useMemo(() => ({
    // Core identification
    contractAddress,
    tokenId,

    // Marketplace data (props have priority)
    listingId: propListingId || contextData?.listingId || null,
    price: propPrice || contextData?.price || null,
    seller: propSeller || null,
    buyer: propBuyer || null,
    isListed: propIsListed ?? contextData?.isListed ?? false,
    desiredNftAddress: propDesiredNftAddress || null,
    desiredTokenId: propDesiredTokenId || null,

    // Metadata (from context)
    name: contextData?.name || `NFT #${tokenId}`,
    imageUrl: contextData?.imageUrl || null,

    // Contract info (from context)
    contractInfo: contextData?.contractInfo || null,

    // Insights data (from context)
    customTitle: contextData?.customTitle || null,
    category: contextData?.category || null,
    cardDescriptions: contextData?.cardDescriptions || null,
    rarity: contextData?.rarity || null,

    // Stats (from context)
    averageRating: contextData?.averageRating || null,
    likeCount: contextData?.likeCount || null,
    watchlistCount: contextData?.watchlistCount || null,

    // Loading state - simplified
    isLoading: !contextData,
  }), [
    contractAddress, tokenId, propListingId, propPrice, propSeller,
    propBuyer, propIsListed, propDesiredNftAddress, propDesiredTokenId,
    contextData
  ]);

  // 3D Tilt Effect State and Logic
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const isFirstHoverRef = useRef(true);
  const [currentRotation, setCurrentRotation] = useState({ rotateX: 0, rotateY: 0 });
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transformOrigin: 'center center',
    transition: 'transform 0.1s ease-out',
  });

  // Calculate tilt based on mouse position with RAF optimization
  const calculateTilt = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current || !isHoveringRef.current) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use RAF for smooth 60fps animations
    animationFrameRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card || !isHoveringRef.current) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate raw rotation values
      const maxTilt = 15;
      let rotateY = ((clientX - centerX) / (rect.width / 2)) * maxTilt;
      let rotateX = ((centerY - clientY) / (rect.height / 2)) * maxTilt;

      // Smooth clamping to prevent harsh jumps at edges
      const dampingFactor = 0.8; // Reduce intensity near edges
      const edgeThreshold = 0.85; // Start damping when 85% from center

      // Calculate distance from center (0 = center, 1 = edge)
      const distanceFromCenterX = Math.abs((clientX - centerX) / (rect.width / 2));
      const distanceFromCenterY = Math.abs((clientY - centerY) / (rect.height / 2));

      // Apply smooth damping near edges
      if (distanceFromCenterX > edgeThreshold) {
        const dampingX = 1 - ((distanceFromCenterX - edgeThreshold) / (1 - edgeThreshold)) * (1 - dampingFactor);
        rotateY *= dampingX;
      }

      if (distanceFromCenterY > edgeThreshold) {
        const dampingY = 1 - ((distanceFromCenterY - edgeThreshold) / (1 - edgeThreshold)) * (1 - dampingFactor);
        rotateX *= dampingY;
      }

      // Smooth clamp to prevent extreme values
      rotateY = Math.max(-maxTilt, Math.min(maxTilt, rotateY));
      rotateX = Math.max(-maxTilt, Math.min(maxTilt, rotateX));

      // Apply smooth tilt transformation with fixed transform-origin
      setCurrentRotation({ rotateX, rotateY });
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        transformOrigin: 'center center', // Fixed rotation point
        transition: isFirstHoverRef.current ? 'transform 0.4s ease-out' : 'none',
      });

      // After first hover, disable the smooth entry transition
      if (isFirstHoverRef.current) {
        setTimeout(() => {
          isFirstHoverRef.current = false;
        }, 400); // Match the transition duration
      }
    });
  }, []);

  // Reset tilt to neutral position with debouncing
  const resetTilt = useCallback(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setCurrentRotation({ rotateX: 0, rotateY: 0 });
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transformOrigin: 'center center',
      transition: 'transform 0.3s ease-out',
    });
  }, []);

  // Mouse event handlers for 3D tilt with debouncing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isHoveringRef.current) {
      calculateTilt(e.clientX, e.clientY);
    }
  }, [calculateTilt]);

  const handleMouseEnterCard = useCallback((e: React.MouseEvent) => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    isHoveringRef.current = true;
    onHover(contractAddress, tokenId);
    calculateTilt(e.clientX, e.clientY);
  }, [onHover, contractAddress, tokenId, calculateTilt]);

  const handleMouseLeave = useCallback(() => {
    // Set flag immediately but delay the actual reset
    isHoveringRef.current = false;

    // Clear any existing timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    // Add a small delay to prevent flickering at edges
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        // Reset first hover flag for next time
        isFirstHoverRef.current = true;
        resetTilt();
      }
    }, 100); // 100ms delay
  }, [resetTilt]);

  // Touch event handlers for mobile devices
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isHoveringRef.current = true;
    const touch = e.touches[0];
    if (touch) {
      calculateTilt(touch.clientX, touch.clientY);
    }
  }, [calculateTilt]);

  const handleTouchEnd = useCallback(() => {
    isHoveringRef.current = false;
    resetTilt();
  }, [resetTilt]);

  // Cleanup animation frames and timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // Navigation handler
  const handleClick = useCallback(() => {
    router.push(`/nft/${contractAddress}/${tokenId}`);
  }, [router, contractAddress, tokenId]);

  // Focus handler for accessibility
  const handleFocus = useCallback(() => {
    onFocus(contractAddress, tokenId);
  }, [onFocus, contractAddress, tokenId]);

  // Determine final category - use displayData
  const finalCategory = useMemo(() => {
    if (enableInsights && displayData?.category) {
      return [displayData.category];
    }
    if (!enableInsights) {
      return null;
    }

  }, [enableInsights, displayData?.category]);

  // Determine final description - use displayData descriptions
  const finalDescription = useMemo(() => {
    if (enableInsights && displayData?.cardDescriptions && displayData.cardDescriptions.length > 0) {
      return displayData.cardDescriptions;
    }
    if (!enableInsights) {
      return null;
    }
  }, [enableInsights, displayData?.cardDescriptions]);

  const categories = finalCategory && Array.isArray(finalCategory)
    ? finalCategory.filter(cat => cat && cat.trim().length > 0) // Filter out empty/whitespace-only categories
    : [];
  const descriptions = finalDescription && Array.isArray(finalDescription)
    ? finalDescription.filter(desc => desc && desc.trim().length > 0) // Filter out empty/whitespace-only descriptions
    : [];

  // Rarity-based background colors (simplified approach)
  const getRarityBackground = useMemo(() => {
    if (!enableInsights || !displayData?.rarity) {
      return 'bg-secondary'; // Default background
    }

    switch (displayData.rarity) {
      case 'legendary':
        return 'bg-yellow-200'; // Golden background
      case 'epic':
        return 'bg-purple-200'; // Purple background
      case 'rare':
        return 'bg-blue-200'; // Blue background
      case 'uncommon':
        return 'bg-green-200'; // Green background
      default:
        return 'bg-gray-200'; // Common background
    }
  }, [enableInsights, displayData?.rarity]);

  // Loading state
  if (displayData.isLoading) {
    return (
      <div className={`group cursor-pointer transform-gpu ${className}`}>
        <div className="hover:scale-102 hover:-translate-y-1 hover:z-50 transition-all duration-200 ease-out rounded-xl shadow-lg flex flex-col gap-2 w-80 h-96 relative will-change-transform origin-center animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - simplified since context handles errors internally
  if (!contextData && !displayData.isLoading) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <p className="text-red-600 text-sm">Failed to load NFT</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-red-700 hover:text-red-900 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="group cursor-pointer transform-gpu"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnterCard}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={tiltStyle}
    >
      <div className={`hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-all duration-300 ease-out rounded-lg shadow-xl flex flex-col flex-end gap-2 w-80 h-96 relative will-change-transform origin-center overflow-hidden border border-black ${getRarityBackground}`}>
        {/* Content container with bg-secondary and rounded corners */}
        <div className="absolute inset-2 shadow-lg bg-secondary rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)]">
          {/* Blurred Background Image */}
          {displayData.imageUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-md bg-secondary">
              <OptimizedNFTImage
                imageUrl={displayData.imageUrl}
                tokenId={`${tokenId}-bg`}
                className="object-cover will-change-transform rounded-md"
                fill={true}
                priority={false}
                width={200}
                height={200}
              />
              {/* CSS-based blur overlay for better performance */}
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 rounded-md"></div>
            </div>
          )}

          {/* Content overlay with fixed layout */}
          <div className="relative z-10 flex flex-col h-full p-2 min-h-0">
            {/* NFT Name Header at top - enhanced with better shadows and borders */}
            <div className="flex-shrink-0 mb-2">
              <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Collection Name from contractInfo if available */}
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {displayData.contractInfo?.symbol || `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {displayData.contractInfo?.name || displayData.customTitle || displayData.name}
                    </p>
                  </div>
                  {/* Contract Info and Rarity indicators */}
                  <div className="flex flex-col items-end gap-1 ml-2">


                    {/* Rarity Indicator */}
                    {enableInsights && contextData?.rarity && (
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${contextData.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                        contextData.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                          contextData.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            contextData.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {contextData.rarity.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Average Rating Stars - enhanced styling */}
                  {contextData?.averageRating && contextData.averageRating > 0 && (
                    <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1 ml-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={`w-2.5 h-2.5 ${contextData.averageRating && i < Math.round(contextData.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
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
            </div>

            {/* Sharp Image after header - takes flexible space in center */}
            {displayData.imageUrl && (
              <div className="flex-1 flex justify-center items-center px-2 mt-2 mb-2 min-h-0">
                <div className="rounded-xl shadow-2xl border-2 border-white/50 backdrop-blur-sm overflow-hidden max-w-full">
                  <OptimizedNFTImage
                    imageUrl={displayData.imageUrl}
                    tokenId={tokenId}
                    className="object-contain max-h-32 w-auto"
                    fill={false}
                    width={240}
                    height={240}
                    priority={priority}
                    tiltRotation={currentRotation}
                  />
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 pointer-events-none"></div>
                </div>
              </div>
            )}

            {/* Bottom content section - everything above price */}
            <div className="flex-shrink-0">
              {/* Categories and Social Stats */}
              <div className="flex items-center gap-2 mb-2">
                {/* Categories - left side */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {categories.slice(0, 1).map((cat, index) => (
                      <div key={index} className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && contextData?.category ?
                        'bg-purple-100/95 border-purple-200/60 ring-purple-300/20' :
                        'bg-white/95 border-gray-200/60 ring-gray-300/20'
                        }`}>
                        <span className={`text-xs font-medium truncate ${enableInsights && contextData?.category ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                          {cat}
                        </span>
                      </div>
                    ))}
                    {categories.length > 1 && (
                      <div className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && contextData?.category ?
                        'bg-purple-100/95 border-purple-200/60 ring-purple-300/20' :
                        'bg-white/95 border-gray-200/60 ring-gray-300/20'
                        }`}>
                        <span className={`text-xs font-medium ${enableInsights && contextData?.category ? 'text-purple-600' : 'text-gray-500'
                          }`}>
                          +{categories.length - 1}
                        </span>
                      </div>
                    )}
                    {/* Insights indicator badge */}
                    {enableInsights && (contextData?.customTitle || contextData?.category || contextData?.cardDescriptions || contextData?.rarity) && (
                      <div className="bg-purple-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-purple-400/40 h-6 flex items-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {/* Flexible spacer to push social stats to the right */}
                <div className="flex-1"></div>

                {/* Social Stats - always right side */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Like Count - enhanced styling */}
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                    <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      {contextData?.likeCount || 0}
                    </span>
                  </div>

                  {/* Watchlist Count - enhanced styling */}
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      {contextData?.watchlistCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description - directly above price */}
              {descriptions.length > 0 && (
                <div className="mb-2">
                  <div className="flex-flex-1 flex-wrap gap-1">
                    {descriptions.slice(0, 2).map((desc, index) => (
                      <div key={index} className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 text-xs text-gray-600">
                        {desc}
                      </div>
                    ))}
                    {descriptions.length > 2 && (
                      <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 text-xs text-gray-500">
                        +{descriptions.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Display - always at bottom */}
              <div className="flex-shrink-0">
                {displayData.isListed && displayData.price && (
                  <PriceDisplay
                    price={displayData.price}
                    desiredNftAddress={displayData.desiredNftAddress}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}

export default NFTCard;
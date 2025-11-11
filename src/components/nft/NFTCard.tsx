// Enhanced NFT Card with Optimized Marketplace Integration and 3D Tilt Effect
"use client";

import React, { useMemo, memo, useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useModernNFTContext, useModernNFT } from '@/contexts/NFTContext';
import { useNFTStatsContext } from '@/contexts/NFTStatsContext';
import { useETHPrice } from "@/contexts/CurrencyContext";
import { formatEther } from "@/utils";
import { devLog } from '@/utils/devLog';
import type { NFTStatsUpdateEvent } from '@/types/events';
import OptimizedNFTImage from './OptimizedNFTImage';
import NFTCardSkeleton from '@/components/ui/NFTCardSkeleton';
import type { AggregatedNFT } from '@/types/core/core-nft-modern';

// ===== INTERFACES =====

// New simplified interface with AggregatedNFT
interface NFTCardProps {
  /** Complete NFT data from AggregatedNFT system */
  nft: AggregatedNFT;
  /** Display options */
  showStats?: boolean;
  className?: string;
  priority?: boolean;
  enableInsights?: boolean;
}

// Legacy interface for backward compatibility
interface LegacyNFTCardProps {
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

// Union type for transition period
type NFTCardAllProps = NFTCardProps | LegacyNFTCardProps;

// ===== TYPE GUARDS =====

function isLegacyProps(props: NFTCardAllProps): props is LegacyNFTCardProps {
  return 'contractAddress' in props && 'tokenId' in props && !('nft' in props);
}

function isNewProps(props: NFTCardAllProps): props is NFTCardProps {
  return 'nft' in props;
}
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
            <div className="text-xs text-gray-600">˜ {convertedPrice}</div>
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
 * Optimized NFT Card with unified AggregatedNFT approach
 * 
 * Now supports both new AggregatedNFT interface and legacy props for smooth migration.
 * The new interface dramatically simplifies the component with a single nft prop.
 */
export function NFTCard(props: NFTCardAllProps) {
  const router = useRouter();

  // ===== PROPS NORMALIZATION =====

  // Extract common display options
  const {
    showStats = true,
    className = "",
    priority = false,
    enableInsights = true
  } = props;

  // Handle both new and legacy prop formats
  let nft: AggregatedNFT;
  let contractAddress: string;
  let tokenId: string;

  // Legacy props for backward compatibility
  let listingId: string | null = null;
  let price: string | null = null;
  let seller: string | null = null;
  let buyer: string | null = null;
  let isListed: boolean = false;
  let desiredNftAddress: `0x${string}` | undefined;
  let desiredTokenId: string | null = null;

  if (isNewProps(props)) {
    // New simplified interface - just use the AggregatedNFT
    nft = props.nft;
    contractAddress = nft.core.nftAddress;
    tokenId = nft.core.tokenId;
  } else {
    // Legacy interface - extract all props and construct AggregatedNFT
    contractAddress = props.contractAddress;
    tokenId = props.tokenId;
    listingId = props.listingId || null;
    price = props.price || null;
    seller = props.seller || null;
    buyer = props.buyer || null;
    isListed = props.isListed || false;
    desiredNftAddress = props.desiredNftAddress as `0x${string}` | undefined;
    desiredTokenId = props.desiredTokenId || null;

    // Create minimal AggregatedNFT from legacy props
    nft = {
      key: `${contractAddress}-${tokenId}` as `${string}-${string}`,
      nftAddress: contractAddress as `0x${string}`,
      tokenId,
      listed: isListed,
      listing: isListed && listingId ? {
        listingId,
        nftAddress: contractAddress as `0x${string}`,
        tokenId,
        isListed,
        price: price || '0',
        seller: seller as `0x${string}`,
        buyer: buyer as `0x${string}` | null,
        desiredNftAddress: desiredNftAddress || contractAddress as `0x${string}`,
        desiredTokenId: desiredTokenId
      } : undefined,
      core: {
        nftAddress: contractAddress as `0x${string}`,
        tokenId,
        tokenURI: null,
        name: null,
        owner: null,
        symbol: null
      },
      meta: undefined,
      social: undefined,
      insight: undefined,
      sources: {
        blockchain: false,
        metadata: false,
        marketplace: true,
        social: false,
        insights: false
      },
      lastUpdated: Date.now()
    };
  }

  // REACTIVE Context Access - automatically re-renders when NFT data changes!
  // This uses useSyncExternalStore internally for selective re-renders
  const { nft: contextNFT, isLoading: contextLoading, refresh } = useModernNFT(contractAddress, tokenId, true);
  const contextData = contextNFT;
  const nftContext = useModernNFTContext(); // Keep for refresh() call

  // Get stats context for real-time stats access
  const statsContext = useNFTStatsContext();

  // Track if we ever had data to prevent skeleton flickering on refresh
  const hadDataRef = useRef(false);
  const isLoadingRef = useRef(contextLoading);
  const loadAttemptedRef = useRef(!!contextData);

  // Use ref to keep statsContext stable in event handler
  const statsContextRef = useRef(statsContext);

  useEffect(() => {
    statsContextRef.current = statsContext;
  });

  // Store live stats in state for reactivity
  const [liveStats, setLiveStats] = useState(() => statsContext.getStats(contractAddress, tokenId));

  // Track if we already synced stats on this mount to prevent duplicate syncs
  const hasInitialSyncRef = useRef(false);

  useEffect(() => {
    if (contextData) {
      hadDataRef.current = true;
      isLoadingRef.current = false;
      loadAttemptedRef.current = true;
    } else {
      isLoadingRef.current = contextLoading;
    }
  }, [contextData, contextLoading]);

  // Sync stats from context ONCE on mount (e.g., when returning from detail page)
  // This ensures we show the latest stats if they were updated while component was unmounted
  useEffect(() => {
    const latestStats = statsContext.getStats(contractAddress, tokenId);
    if (latestStats) {
      const currentStats = liveStats;
      const hasChanged = !currentStats ||
        currentStats.favoriteCount !== latestStats.favoriteCount ||
        currentStats.watchlistCount !== latestStats.watchlistCount ||
        currentStats.viewCount !== latestStats.viewCount ||
        currentStats.averageRating !== latestStats.averageRating ||
        currentStats.ratingCount !== latestStats.ratingCount;

      if (hasChanged) {
        devLog.cache('NFTCard syncing stats from context:', {
          contractAddress,
          tokenId,
          old: currentStats,
          new: latestStats,
          trigger: hasInitialSyncRef.current ? 'update' : 'mount'
        });
        setLiveStats(latestStats);
      }
    }

    if (!hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
    }
  }, [contractAddress, tokenId, statsContext]); // Re-run when NFT changes

  // Reset sync flag when NFT changes (not just on unmount)
  useEffect(() => {
    // Reset flag for new NFT
    hasInitialSyncRef.current = false;

    return () => {
      // Also reset on unmount for next mount
      hasInitialSyncRef.current = false;
    };
  }, [contractAddress, tokenId]);

  // Update live stats when component mounts or when stats change
  useEffect(() => {
    // Listen for stats updates from detail page or other components
    const handleStatsUpdate = (event: WindowEventMap['nft-stats-updated']) => {
      const { nftAddress: updatedAddress, tokenId: updatedTokenId, stats, source } = event.detail;

      // Only update if this is the NFT that was updated
      if (updatedAddress.toLowerCase() === contractAddress.toLowerCase() &&
        updatedTokenId === tokenId) {
        // Use stats from event detail (guaranteed to be latest)
        // OR fall back to fetching from context if not provided
        const currentStats = stats || statsContextRef.current.getStats(contractAddress, tokenId);
        devLog.info('NFTCard stats updated from event:', {
          contractAddress,
          tokenId,
          stats: currentStats,
          source
        });
        setLiveStats(currentStats);
      }
    };

    window.addEventListener('nft-stats-updated', handleStatsUpdate);
    return () => window.removeEventListener('nft-stats-updated', handleStatsUpdate);
  }, [contractAddress, tokenId]);

  // useModernNFT already handles loading automatically with autoLoad=true
  // No need for manual load useEffect anymore!

  // Silent background refresh on hover - only if data is very stale (>60min)
  // This prevents visible reloading but keeps data fresh over time
  const handleHover = useCallback(() => {
    // Only refresh if:
    // 1. No data at all, OR
    // 2. Data is VERY stale (>60 min old) - not just "not fresh"
    const shouldRefresh = !contextData || (() => {
      const nftKey = `${contractAddress.toLowerCase()}-${tokenId}`;
      const entry = nftContext.getNFT(contractAddress, tokenId);
      if (!entry) return true;

      // Check if data is VERY stale (>60 minutes)
      const age = Date.now() - entry.lastUpdated;
      const VERY_STALE_MS = 60 * 60 * 1000; // 60 minutes
      return age > VERY_STALE_MS;
    })();

    if (shouldRefresh) {
      // Silent refresh in background - don't show loading state
      refresh();
    }
  }, [contractAddress, tokenId, contextData, refresh, nftContext]);

  // Hybrid data approach: props override context data
  const displayData = useMemo(() => {
    return {
      // Core identification
      contractAddress,
      tokenId,

      // Marketplace data (props have priority)
      listingId: listingId || contextData?.listing?.listingId || null,
      price: price || contextData?.listing?.price || null,
      seller: seller || contextData?.listing?.seller || null,
      buyer: buyer || contextData?.listing?.buyer || null,
      isListed: isListed ?? contextData?.listed ?? false,
      desiredNftAddress: desiredNftAddress || contextData?.listing?.desiredNftAddress || null,
      desiredTokenId: desiredTokenId || contextData?.listing?.desiredTokenId || null,

      // Metadata (from context - AggregatedNFT structure)
      name: contextData?.meta?.name || contextData?.core?.name || `NFT #${tokenId}`,
      imageUrl: contextData?.meta?.image || null,

      // Contract info (from context - core structure)
      contractInfo: contextData?.core ? {
        name: contextData.core.contractName || null,
        symbol: contextData.core.contractSymbol || null,
        totalSupply: contextData.core.totalSupply || null,
        owner: contextData.core.owner || null
      } : null,

      // Insights data (from context - insight structure)
      customTitle: contextData?.insight?.customTitle || null,
      category: contextData?.insight?.category || null,
      cardDescriptions: contextData?.insight?.cardDescription || null,
      rarity: contextData?.insight?.rarity || null,

      // Stats - use live stats from state (updated via event listener)
      // Fallback to contextData.social only if liveStats is not available
      likeCount: liveStats?.favoriteCount ?? contextData?.social?.likeCount ?? null,
      watchlistCount: liveStats?.watchlistCount ?? contextData?.social?.watchlistCount ?? null,
      averageRating: liveStats?.averageRating ?? contextData?.social?.averageRating ?? null,

      // Loading state - ONLY show skeleton when:
      // 1. We have NO data at all AND we're loading
      // 2. We never loaded before (first load)
      // Don't show skeleton during background refresh (when hadDataRef.current is true)
      isLoading: !contextData && (isLoadingRef.current || !loadAttemptedRef.current) && !hadDataRef.current,
    };
  }, [
    contractAddress, tokenId, listingId, price, seller,
    buyer, isListed, desiredNftAddress, desiredTokenId,
    contextData, liveStats // liveStats is in state, triggers re-render when updated
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
    handleHover();
    calculateTilt(e.clientX, e.clientY);
  }, [handleHover, calculateTilt]);

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
    handleHover();
  }, [handleHover]);

  // Determine final category - use displayData
  const finalCategory = useMemo(() => {
    if (enableInsights && displayData?.category) {
      return [displayData.category];
    }
    if (!enableInsights) {
      return null;
    }
    return null;
  }, [enableInsights, displayData?.category]);

  // Determine final description - use displayData descriptions
  const finalDescription = useMemo(() => {
    if (enableInsights && displayData?.cardDescriptions && displayData.cardDescriptions.length > 0) {
      return displayData.cardDescriptions;
    }
    if (!enableInsights) {
      return null;
    }
    return null;
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

  // Loading state - show clean skeleton instead of bg-primary flashing
  if (displayData.isLoading) {
    return <NFTCardSkeleton className={className} />;
  }

  // Error state - simplified since context handles errors internally
  // Only show error if we attempted to load but still don't have data and aren't loading
  if (!contextData && !displayData.isLoading && loadAttemptedRef.current) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <p className="text-red-600 text-sm">Failed to load NFT</p>
        <button
          onClick={() => {
            loadAttemptedRef.current = false;
            isLoadingRef.current = true;
            nftContext.refreshNFT(contractAddress, tokenId); // Force refresh
          }}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
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
      <div className={`hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 ease-out rounded-lg shadow-xl flex flex-col flex-end gap-2 w-full h-72 relative will-change-transform origin-center border border-black ${getRarityBackground}`}>
        {/* Content container - neutral background when no image, bg-secondary when image loaded */}
        <div className={`absolute inset-2 shadow-lg rounded-md overflow-hidden flex flex-col h-[calc(100%-16px)] ${displayData.imageUrl ? 'bg-secondary' : 'bg-gray-100'}`}>
          {/* Blurred Background Image */}
          {displayData.imageUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-md">
              <OptimizedNFTImage
                imageUrl={displayData.imageUrl}
                tokenId={`${tokenId}-bg`}
                className="object-cover will-change-transform rounded-md"
                fill={true}
                priority={priority} // Use the same priority as the main image
                width={200}
                height={200}
              />
              {/* CSS-based blur overlay for better performance */}
              <div className="absolute inset-0 backdrop-blur-sm bg-white/30 rounded-md"></div>
            </div>
          )}

          {/* Content overlay with fixed layout */}
          <div className="relative z-10 flex flex-col h-full p-1 gap-1">
            {/* NFT Name Header at top - enhanced with better shadows and borders */}
            <div className="flex-shrink-0">
              <div className="bg-white/95 backdrop-blur-md p-2 rounded-md shadow-xl border border-gray-200/60 ring-1 ring-gray-300/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Collection Name from contractInfo if available */}
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {displayData.contractInfo?.symbol || `${(contractAddress || '').slice(0, 6)}...${(contractAddress || '').slice(-4)}`}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {displayData.contractInfo?.name || displayData.customTitle || displayData.name}
                    </p>
                  </div>
                  {/* Contract Info and Rarity indicators 
                  <div className="flex flex-col items-end gap-1 ml-2">*/}
                  {/* Rarity Indicator 
                    {enableInsights && contextData?.insight?.rarity && (
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${contextData.insight.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                        contextData.insight.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                          contextData.insight.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            contextData.insight.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {contextData.insight.rarity.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>*/}
                  {/* Average Rating Stars - enhanced styling */}
                  {contextData?.social?.averageRating && contextData.social.averageRating > 0 && (
                    <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1 ml-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={`w-2.5 h-2.5 ${contextData.social?.averageRating && i < Math.round(contextData.social.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
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

            {/* Sharp Image and Description side by side - 50/50 split */}
            <div className="flex-1 flex gap-1 min-h-0">
              {/* Left: Image - 50% - full height, auto width, center-aligned */}
              {displayData.imageUrl && (
                <div className="w-1/2 flex justify-center items-stretch overflow-hidden">
                  <div className="rounded-md border-2 border-white/50 backdrop-blur-sm overflow-hidden relative h-full">
                    <OptimizedNFTImage
                      imageUrl={displayData.imageUrl}
                      tokenId={tokenId}
                      className="object-contain h-full w-auto"
                      fill={false}
                      width={240}
                      height={240}
                      priority={priority}
                    />
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 rounded-md ring-1 ring-white/20 pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Right: Description - 50% - fills available space */}
              {descriptions.length > 0 && (
                <div className="w-1/2">
                  <div
                    className="bg-white/95 backdrop-blur-sm pr-1 pt-1 rounded-md shadow-lg text-xs h-full overflow-hidden text-right break-words hyphens-auto"
                    lang="de"
                  >
                    {descriptions[0]}
                  </div>
                </div>
              )}
            </div>

            {/* Categories and Social Stats */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1">
                {/* Categories - left side */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {categories.slice(0, 1).map((cat, index) => (
                      <div key={index} className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && contextData?.insight?.category ?
                        'bg-purple-100/95 border-purple-200/60 ring-purple-300/20' :
                        'bg-white/95 border-gray-200/60 ring-gray-300/20'
                        }`}>
                        <span className={`text-xs font-medium truncate ${enableInsights && contextData?.insight?.category ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                          {cat}
                        </span>
                      </div>
                    ))}
                    {categories.length > 1 && (
                      <div className={`backdrop-blur-sm px-2 py-1 rounded-md shadow-md border h-6 flex items-center ring-1 ${enableInsights && contextData?.insight?.category ?
                        'bg-purple-100/95 border-purple-200/60 ring-purple-300/20' :
                        'bg-white/95 border-gray-200/60 ring-gray-300/20'
                        }`}>
                        <span className={`text-xs font-medium ${enableInsights && contextData?.insight?.category ? 'text-purple-600' : 'text-gray-500'
                          }`}>
                          +{categories.length - 1}
                        </span>
                      </div>
                    )}
                    {/* Insights indicator badge 
                    {enableInsights && (contextData?.insight?.customTitle || contextData?.insight?.category || contextData?.insight?.cardDescription || contextData?.insight?.rarity) && (
                      <div className="bg-purple-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-purple-400/40 h-6 flex items-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    )}*/}
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
                      {displayData.likeCount || 0}
                    </span>
                  </div>

                  {/* Watchlist Count - enhanced styling */}
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-gray-200/60 ring-1 ring-gray-300/20 h-6 flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      {displayData.watchlistCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Display - always at bottom */}
            <div className="flex-shrink-0">
              {displayData.isListed && displayData.price ? (
                <PriceDisplay
                  price={displayData.price}
                  desiredNftAddress={displayData.desiredNftAddress}
                />
              ) : (
                /* Not Listed Placeholder - 62px height, centered vertically and horizontally */
                <div className="bg-gray-100/95 backdrop-blur-sm p-2 rounded-md shadow-2xl border border-gray-300/60 ring-1 ring-gray-400/20 h-[62px]">
                  <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500 font-medium text-lg leading-tight">Not Listed</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(NFTCard);

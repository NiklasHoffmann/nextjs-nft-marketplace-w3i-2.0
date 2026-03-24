"use client";

import { useState, memo, useCallback, useRef, useEffect, useMemo } from "react";
import {
    getNFTVariantWidth,
    type NFTImageVariant,
    type NFTImageVariants,
    resolveNFTImageByVariant,
    resolveNftImageCandidates,
} from "@/utils";

// Simple loading skeleton component
const ImageSkeleton = memo(({ className, width, height, fill }: {
    className?: string;
    width?: number;
    height?: number;
    fill?: boolean;
}) => (
    <div
        className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded ${className || ''}`}
        style={fill ? {} : { width, height }}
    >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
));
ImageSkeleton.displayName = 'ImageSkeleton';

interface OptimizedNFTImageProps {
    imageUrl: string;
    imageVariants?: NFTImageVariants | null;
    tokenId: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    priority?: boolean;
    variant?: NFTImageVariant;
    blurDataURL?: string | null;
    disableVisualEffects?: boolean;
    // New prop for glitter effect synchronization
    tiltRotation?: { rotateX: number; rotateY: number };
}

const inferVariantFromSize = (width: number, height: number): NFTImageVariant => {
    const maxSize = Math.max(width || 0, height || 0);

    if (maxSize <= 160) return 'thumb';
    if (maxSize <= 260) return 'small';
    if (maxSize <= 760) return 'card';

    return 'detail';
};

// Cache with timestamp for expired retry logic
interface CacheEntry {
    success: boolean;
    timestamp: number;
}

// Storage key for localStorage persistence
const STORAGE_KEY = 'nft-image-cache-v1';
const SUCCESS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const FAILURE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ImageCache {
    private cache = new Map<string, CacheEntry>();
    private maxSize = 500; // Increased from 100 to 500 for better caching
    private failureRetryTime = FAILURE_CACHE_TTL;
    private saveDebounceTimer: NodeJS.Timeout | null = null;

    constructor() {
        // Load from localStorage on init
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as [string, CacheEntry][];
                    // Persist only successful entries to avoid long-lived false negatives.
                    const now = Date.now();
                    parsed.forEach(([key, entry]) => {
                        const age = now - entry.timestamp;
                        if (entry.success && age < SUCCESS_CACHE_TTL) {
                            this.cache.set(key, entry);
                        }
                    });
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        }
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;

        // Debounce saves to avoid too many writes
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        this.saveDebounceTimer = setTimeout(() => {
            try {
                // Save only successful entries. Failed attempts stay in-memory for short-term backoff.
                const now = Date.now();
                const entries = Array.from(this.cache.entries())
                    .filter(([_, entry]) => {
                        const age = now - entry.timestamp;
                        return entry.success && age < SUCCESS_CACHE_TTL;
                    })
                    .slice(-this.maxSize); // Keep latest entries
                localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
            } catch (e) {
                // Ignore storage errors (quota exceeded, etc.)
            }
        }, 1000);
    }

    set(key: string, value: boolean) {
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entries
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20%
            toRemove.forEach(([k]) => this.cache.delete(k));
        }
        this.cache.set(key, { success: value, timestamp: Date.now() });

        this.saveToStorage();
    }

    get(key: string): boolean | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // If failed image is older than retry time, allow retry
        if (!entry.success && (Date.now() - entry.timestamp) > this.failureRetryTime) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.success;
    }

    delete(key: string) {
        this.cache.delete(key);
    }

    // Check if we have many cached images (for preloading decision)
    get size(): number {
        return this.cache.size;
    }
}

const imageLoadCache = new ImageCache();

const selectInitialImageIndex = (urls: string[]): number => {
    if (urls.length === 0) return 0;

    for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        if (!url) continue;
        if (imageLoadCache.get(url) === true) {
            return index;
        }
    }

    for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        if (!url) continue;
        if (imageLoadCache.get(url) !== false) {
            return index;
        }
    }

    return 0;
};

const OptimizedNFTImage = memo(({
    imageUrl,
    imageVariants,
    tokenId,
    alt,
    className = "",
    fill = false,
    width = 256,
    height = 256,
    sizes,
    priority = false,
    variant,
    blurDataURL,
    disableVisualEffects = false,
    tiltRotation = { rotateX: 0, rotateY: 0 },
}: OptimizedNFTImageProps) => {
    void sizes;
    void blurDataURL;

    const normalizedImageUrl = imageUrl?.trim() || '';
    // `fill` images often receive default width/height props (256x256),
    // which can under-select a too-small variant and look pixelated after lazy load.
    const resolvedVariant = variant || (fill ? 'card' : inferVariantFromSize(width, height));
    const selectedVariantSource = useMemo(
        () => resolveNFTImageByVariant(normalizedImageUrl, resolvedVariant, imageVariants, tokenId),
        [normalizedImageUrl, resolvedVariant, imageVariants, tokenId],
    );
    const hasAnyImageSource = Boolean((selectedVariantSource || normalizedImageUrl).trim());
    const variantWidth = getNFTVariantWidth(resolvedVariant);

    // Get all possible URLs for this image (memoized to keep effect dependencies stable)
    const imageUrls = useMemo(() => {
        const urls = resolveNftImageCandidates(selectedVariantSource, { width: variantWidth, tokenId });
        if (urls.length > 0) {
            return urls;
        }

        return resolveNftImageCandidates(normalizedImageUrl, { width: variantWidth, tokenId });
    }, [selectedVariantSource, normalizedImageUrl, variantWidth, tokenId]);

    // Check if image is likely cached BEFORE setting initial loading state ⚡
    const isCachedInitially = useMemo(() => {
        if (typeof window === 'undefined' || imageUrls.length === 0) return false;
        const cacheKey = imageUrls[selectInitialImageIndex(imageUrls)];
        if (!cacheKey) return false;
        return imageLoadCache.get(cacheKey) === true;
    }, [imageUrls]);

    const initialFallbackIndex = useMemo(() => selectInitialImageIndex(imageUrls), [imageUrls]);

    const [isLoading, setIsLoading] = useState(!isCachedInitially); // Start as loaded if cached!
    const [hasError, setHasError] = useState(imageUrls.length === 0);
    const [currentImageUrl, setCurrentImageUrl] = useState(() => imageUrls[initialFallbackIndex] || '');
    const [fallbackIndex, setFallbackIndex] = useState(initialFallbackIndex);
    const [isIntersecting, setIsIntersecting] = useState(priority || isCachedInitially);
    const [hasBeenVisible, setHasBeenVisible] = useState(isCachedInitially);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const imgRef = useRef<HTMLDivElement>(null);
    const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

    // New state for smooth glitter fade-out
    const [displayGlitter, setDisplayGlitter] = useState(false);
    const [glitterOpacity, setGlitterOpacity] = useState(0);
    const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cache check without network probing.
    // Probing via window.Image here caused duplicate first-load requests.
    useEffect(() => {
        if (typeof window === 'undefined' || imageUrls.length === 0) return;

        const cacheKey = imageUrls[selectInitialImageIndex(imageUrls)];
        if (!cacheKey) return;

        const cachedResult = imageLoadCache.get(cacheKey);

        // If cached, set states immediately
        if (cachedResult) {
            setHasBeenVisible(true);
            setIsIntersecting(true);
            setIsLoading(false);
            return;
        }

        if (cachedResult === false) {
            setIsLoading(false);
            return;
        }
    }, [imageUrls, tokenId]);

    // Intersection Observer for lazy loading
    // ⚡ OPTIMIZED: Larger rootMargin for earlier preloading
    useEffect(() => {
        if (priority || hasBeenVisible || !imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry && entry.isIntersecting) {
                    setIsIntersecting(true);
                    setHasBeenVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '400px', // ⚡ OPTIMIZED: Increased from 200px to 400px for earlier loading
                threshold: 0.01      // ⚡ OPTIMIZED: Trigger as soon as 1% is visible
            }
        );

        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [priority, hasBeenVisible]);

    // Update current image URL when imageUrl prop changes - OPTIMIZED FOR CACHE
    useEffect(() => {
        const newUrls = resolveNftImageCandidates(selectedVariantSource, { width: variantWidth, tokenId });

        if (newUrls.length === 0) {
            setCurrentImageUrl('');
            setHasError(true);
            setIsLoading(false);
            return;
        }

        const nextIndex = selectInitialImageIndex(newUrls);
        const selectedUrl = newUrls[nextIndex];
        const isCached = selectedUrl && imageLoadCache.get(selectedUrl) === true;

        // Use the optimized URL (e.g., /api/nft/image/{hash}) instead of raw IPFS URL
        setCurrentImageUrl(selectedUrl || selectedVariantSource || normalizedImageUrl);
        setFallbackIndex(nextIndex);
        setHasError(false);
        // Keep loading state in sync with the selected URL to avoid stale overlays.
        setIsLoading(!isCached);
    }, [selectedVariantSource, normalizedImageUrl, variantWidth, tokenId]);

    const handleImageLoad = useCallback((_e: React.SyntheticEvent<HTMLImageElement>) => {
        // const _img = e.currentTarget; // No longer needed, aspect ratio state removed
        imageLoadCache.set(currentImageUrl, true);
        // setAspectRatio has been removed - aspect ratio state no longer exists
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
        setRetryAttempt(0);
        setIsLoading(false);
    }, [currentImageUrl]);

    const handleImageError = useCallback(() => {
        // Browsers can abort/deprioritize image requests while the tab is hidden.
        // Do not persist these as hard failures.
        if (typeof document !== 'undefined' && document.hidden) {
            setIsLoading(true);
            setHasError(false);
            return;
        }

        const isProxyImage = currentImageUrl.startsWith('/api/nft/image/');

        if (!isProxyImage) {
            imageLoadCache.set(currentImageUrl, false);
        }

        // Try next fallback URL if available and not already known as failed.
        for (let nextIndex = fallbackIndex + 1; nextIndex < imageUrls.length; nextIndex++) {
            const nextUrl = imageUrls[nextIndex];
            if (!nextUrl) continue;
            if (imageLoadCache.get(nextUrl) === false) continue;

            setFallbackIndex(nextIndex);
            setCurrentImageUrl(nextUrl);
            setIsLoading(true);
            return;
        }

        // All fallbacks failed. For proxy images, allow quick retries because
        // gateway issues are often transient and should not remain a sticky failure.
        if (isProxyImage && retryAttempt < 2) {
            const retryDelayMs = 1200 * (retryAttempt + 1);
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
            retryTimerRef.current = setTimeout(() => {
                imageLoadCache.delete(currentImageUrl);
                setHasError(false);
                setIsLoading(true);
                setRetryAttempt((prev) => prev + 1);
            }, retryDelayMs);
            return;
        }

        if (!isProxyImage) {
            imageLoadCache.set(imageUrls[0] || currentImageUrl, false);
        }
        setCurrentImageUrl('');
        setHasError(true);
        setIsLoading(false);
    }, [fallbackIndex, imageUrls, currentImageUrl, retryAttempt]);

    useEffect(() => {
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
    }, []);

    // Recover images after returning to a previously hidden tab.
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.hidden) return;
            if (!hasError && !isLoading) return;
            if (imageUrls.length === 0) return;

            // Clear short-lived failure marks so the first candidate can be retried now.
            imageUrls.forEach((url) => {
                if (url) imageLoadCache.delete(url);
            });

            const nextIndex = selectInitialImageIndex(imageUrls);
            const nextUrl = imageUrls[nextIndex] || '';
            if (!nextUrl) return;

            setFallbackIndex(nextIndex);
            setCurrentImageUrl(nextUrl);
            setHasError(false);
            setIsLoading(true);
            setHasBeenVisible(true);
            setIsIntersecting(true);
            setRetryAttempt((prev) => prev + 1);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [hasError, isLoading, imageUrls]);

    // Respect explicit object-fit from caller (e.g. NFTCard uses object-cover).
    // Fallback to object-contain only when no fit class is provided.
    const hasExplicitObjectFit = /(^|\s)object-(contain|cover|fill|none|scale-down)(\s|$)/.test(className);
    const objectFitClass = hasExplicitObjectFit ? '' : 'object-contain';
    const hasAutoHeight = /(^|\s)h-auto(\s|$)/.test(className);
    const hasAutoWidth = /(^|\s)w-auto(\s|$)/.test(className);

    // Check if this is a sharp image (not background) and should have glitter effect
    // CRITICAL: Convert tokenId to string (may be Number from marketplace_items)
    const normalizedTokenId = String(tokenId);
    const isSharpImage = !disableVisualEffects && !normalizedTokenId.includes('-bg');

    // Simplified glitter effect calculation for better performance
    const glitterIntensity = useMemo(() => {
        if (!isSharpImage) return 0;

        const rotationMagnitude = Math.sqrt(
            Math.pow(tiltRotation.rotateX, 2) + Math.pow(tiltRotation.rotateY, 2)
        );

        // Simple linear calculation instead of complex easing
        const intensity = Math.min(rotationMagnitude / 15, 0.6); // Reduced max intensity
        return rotationMagnitude > 0.5 ? intensity : 0;
    }, [isSharpImage, tiltRotation.rotateX, tiltRotation.rotateY]);

    // Handle smooth glitter fade-in/fade-out
    useEffect(() => {
        if (glitterIntensity > 0) {
            // Clear any pending fade-out
            if (fadeOutTimeoutRef.current) {
                clearTimeout(fadeOutTimeoutRef.current);
                fadeOutTimeoutRef.current = null;
            }
            setDisplayGlitter(true);
            setGlitterOpacity(glitterIntensity);
        } else {
            // Start fade-out process
            setGlitterOpacity(0);

            // Keep displaying glitter during fade-out
            fadeOutTimeoutRef.current = setTimeout(() => {
                setDisplayGlitter(false);
            }, 1500); // Match longest transition duration
        }

        return () => {
            if (fadeOutTimeoutRef.current) {
                clearTimeout(fadeOutTimeoutRef.current);
                fadeOutTimeoutRef.current = null;
            }
        };
    }, [glitterIntensity]);

    // Simplified glitter effect for better performance
    const glitterStyle = useMemo(() => {
        if (!isSharpImage || glitterOpacity === 0) return {};

        const glitterX = 50 + (tiltRotation.rotateY * 1.2);
        const glitterY = 50 + (tiltRotation.rotateX * -1.2);

        return {
            backgroundImage: `
                radial-gradient(ellipse 120% 120% at ${glitterX}% ${glitterY}%, 
                    rgba(255, 255, 255, ${0.2 * glitterOpacity}) 0%, 
                    rgba(255, 255, 255, ${0.1 * glitterOpacity}) 50%, 
                    transparent 80%),
                linear-gradient(${45 + tiltRotation.rotateY}deg, 
                    rgba(255, 255, 255, ${0.15 * glitterOpacity}) 40%, 
                    rgba(255, 255, 255, ${0.25 * glitterOpacity}) 50%, 
                    rgba(255, 255, 255, ${0.15 * glitterOpacity}) 60%, 
                    transparent 80%)
            `,
            opacity: Math.min(glitterOpacity, 0.7),
            transform: `scale(1.05)`,
            mixBlendMode: 'soft-light' as const,
        };
    }, [isSharpImage, glitterOpacity, tiltRotation.rotateX, tiltRotation.rotateY]);

    // Render skeleton if no valid image URL
    if (!hasAnyImageSource) {
        return (
            <ImageSkeleton
                className={className}
                width={width}
                height={height}
                fill={fill}
            />
        );
    }

    // Don't render image until it's in viewport (unless priority or previously cached)
    if (!isIntersecting && !hasBeenVisible) {
        return (
            <div
                ref={imgRef}
                className={`relative bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}
                style={fill ? {} : { width, height }}
            >
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-300/80 overflow-hidden">
                    <div className="h-full w-1/3 bg-gray-500/90 animate-[shimmer_1.2s_infinite]" />
                </div>
            </div>
        );
    }

    // Handle error fallback
    if (hasError) {
        return (
            <div
                ref={imgRef}
                className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 ${className}`}
                style={fill ? {} : { width, height }}
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    const imageClassName = `${objectFitClass} ${className}`;

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden bg-gray-100 ${fill ? 'w-full h-full' : ''} ${className}`}
        >
            <img
                key={`${currentImageUrl}::${retryAttempt}`}
                src={currentImageUrl}
                alt={alt || `NFT ${tokenId}`}
                className={imageClassName}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading={priority || isIntersecting ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding="auto"
                draggable={false}
                data-variant={resolvedVariant}
                style={fill ? {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    imageRendering: 'auto',
                } : {
                    width: hasAutoWidth ? 'auto' : width,
                    height: hasAutoHeight ? 'auto' : height,
                    imageRendering: 'auto',
                }}
            />

            {/* Blur placeholder overlay disabled to avoid soft/pixelated look while scrolling */}

            {/* Optimized single-layer glitter effect for sharp images */}
            {isSharpImage && displayGlitter && (
                <div
                    className="absolute pointer-events-none transition-all ease-in-out"
                    style={{
                        inset: '-5%',
                        borderRadius: 'inherit',
                        backgroundImage: `
                            ${glitterStyle.backgroundImage},
                            radial-gradient(circle at ${15 + tiltRotation.rotateY * 0.8}% ${25 + tiltRotation.rotateX * 0.8}%, 
                                rgba(255, 255, 255, ${0.25 * glitterOpacity}) 0%, transparent 3px),
                            radial-gradient(circle at ${85 - tiltRotation.rotateY * 0.8}% ${75 - tiltRotation.rotateX * 0.8}%, 
                                rgba(255, 255, 255, ${0.18 * glitterOpacity}) 0%, transparent 2px),
                            radial-gradient(circle at ${65 + tiltRotation.rotateY * 0.3}% ${15 + tiltRotation.rotateX * 0.3}%, 
                                rgba(255, 255, 255, ${0.22 * glitterOpacity}) 0%, transparent 2.5px),
                            radial-gradient(ellipse 120% 120% at center, 
                                transparent 70%, rgba(255, 255, 255, ${0.06 * glitterOpacity}) 85%, transparent 100%)
                        `,
                        backgroundSize: 'auto, 120px 120px, 80px 80px, 100px 100px, auto',
                        opacity: glitterStyle.opacity,
                        transform: glitterStyle.transform,
                        mixBlendMode: 'soft-light',
                        transitionDuration: '1200ms',
                    }}
                />
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-300/80 overflow-hidden">
                    <div className="h-full w-1/3 bg-gray-500/90 animate-[shimmer_1.2s_infinite]" />
                </div>
            )}
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && fallbackIndex > 0 && (
                <div className="absolute bottom-0 left-0 text-xs bg-orange-500/75 text-white px-1 rounded-tr">
                    Gateway {fallbackIndex + 1}
                </div>
            )}
        </div>
    );
});

OptimizedNFTImage.displayName = 'OptimizedNFTImage';
export default OptimizedNFTImage;

"use client";

import Image from "next/image";
import { useState, memo, useCallback, useRef, useEffect, useMemo } from "react";

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
    tokenId: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    priority?: boolean;
    // New prop for glitter effect synchronization
    tiltRotation?: { rotateX: number; rotateY: number };
}

// Cache with timestamp for expired retry logic
interface CacheEntry {
    success: boolean;
    timestamp: number;
}

// Storage key for localStorage persistence
const STORAGE_KEY = 'nft-image-cache-v1';
const SUCCESS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const FAILURE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
                    // Load successful entries and recent failed entries.
                    const now = Date.now();
                    parsed.forEach(([key, entry]) => {
                        const age = now - entry.timestamp;
                        if ((entry.success && age < SUCCESS_CACHE_TTL) || (!entry.success && age < this.failureRetryTime)) {
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
                // Save successful entries and recent failed entries
                const now = Date.now();
                const entries = Array.from(this.cache.entries())
                    .filter(([_, entry]) => {
                        const age = now - entry.timestamp;
                        return (entry.success && age < SUCCESS_CACHE_TTL) || (!entry.success && age < this.failureRetryTime);
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

    // Check if we have many cached images (for preloading decision)
    get size(): number {
        return this.cache.size;
    }
}

const imageLoadCache = new ImageCache();

// Matches bare IPFS CIDs: CIDv0 (Qm..., 46 chars) and CIDv1 (bafy..., bafk..., etc.)
const BARE_CID_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58,})(\/.*)?$/;

// Extract IPFS hash from various URL formats (including path after hash)
const extractIPFSInfo = (url: string): { hash: string; path: string } | null => {
    if (!url) return null;

    // ipfs:// protocol
    if (url.startsWith('ipfs://')) {
        const parts = url.replace('ipfs://', '').split('/');
        const hash = parts[0];
        const path = parts.slice(1).join('/');
        return hash ? { hash, path } : null;
    }

    // HTTP IPFS gateway URLs
    if (url.includes('/ipfs/')) {
        const afterIpfs = url.split('/ipfs/')[1];
        if (!afterIpfs) return null;
        const parts = afterIpfs.split('/');
        const hash = parts[0];
        const path = parts.slice(1).join('/');
        return hash ? { hash, path } : null;
    }

    // Bare CID (no protocol prefix) — e.g. "QmTKHm7x..." or "bafybei..."
    const bareMatch = BARE_CID_REGEX.exec(url);
    if (bareMatch) {
        const hash = bareMatch[1]!;
        const path = bareMatch[2] ? bareMatch[2].slice(1) : ''; // strip leading /
        return { hash, path };
    }

    return null;
};

// Convert IPFS URLs to use our server-side proxy/cache only.
// Public gateway fallbacks in the browser caused inconsistent quality/latency.
const optimizeImageUrl = (url: string): string[] => {
    if (!url) return [];

    // Extract IPFS hash and path
    const ipfsInfo = extractIPFSInfo(url);

    // If it's an IPFS URL, always use our server cache route.
    if (ipfsInfo) {
        const { hash, path: ipfsPath } = ipfsInfo;
        const fullHash = ipfsPath ? `${hash}/${ipfsPath}` : hash;

        return [
            `/api/nft/image/${encodeURIComponent(fullHash)}` // Server cache + server-side gateway fallback
        ];
    }

    // If it's already a non-IPFS HTTP URL, use it directly
    if (url.startsWith('http')) {
        return [url];
    }

    // Relative path or unknown format — not a valid standalone URL, return empty
    // (avoids browser treating bare filenames like "Image4.jpg" as hostnames)
    return [];
};

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

const hasLoadableImageUrl = (urls: string[]): boolean => {
    if (urls.length === 0) return false;
    return urls.some((url) => imageLoadCache.get(url) !== false);
};

const OptimizedNFTImage = memo(({
    imageUrl,
    tokenId,
    alt,
    className = "",
    fill = false,
    width = 256,
    height = 256,
    sizes,
    priority = false,
    tiltRotation = { rotateX: 0, rotateY: 0 },
}: OptimizedNFTImageProps) => {
    const normalizedImageUrl = imageUrl?.trim() || '';

    // Get all possible URLs for this image (memoized to keep effect dependencies stable)
    const imageUrls = useMemo(() => optimizeImageUrl(normalizedImageUrl), [normalizedImageUrl]);

    // Check if image is likely cached BEFORE setting initial loading state ⚡
    const isCachedInitially = useMemo(() => {
        if (typeof window === 'undefined' || imageUrls.length === 0) return false;
        const cacheKey = imageUrls[selectInitialImageIndex(imageUrls)];
        if (!cacheKey) return false;
        return imageLoadCache.get(cacheKey) === true;
    }, [imageUrls]);

    const hasAnyLoadableUrl = useMemo(() => hasLoadableImageUrl(imageUrls), [imageUrls]);

    const initialFallbackIndex = useMemo(() => selectInitialImageIndex(imageUrls), [imageUrls]);

    const [isLoading, setIsLoading] = useState(!isCachedInitially); // Start as loaded if cached!
    const [hasError, setHasError] = useState(imageUrls.length === 0 || !hasAnyLoadableUrl);
    const [currentImageUrl, setCurrentImageUrl] = useState(() => {
        if (!hasAnyLoadableUrl) return '';
        return imageUrls[initialFallbackIndex] || '';
    });
    const [fallbackIndex, setFallbackIndex] = useState(initialFallbackIndex);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(priority || isCachedInitially);
    const [hasBeenVisible, setHasBeenVisible] = useState(isCachedInitially);
    const imgRef = useRef<HTMLDivElement>(null);

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
            setHasError(true);
            setCurrentImageUrl('');
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
        const newUrls = optimizeImageUrl(normalizedImageUrl);

        if (newUrls.length === 0) {
            setCurrentImageUrl('');
            setHasError(true);
            setIsLoading(false);
            return;
        }

        if (!hasLoadableImageUrl(newUrls)) {
            setCurrentImageUrl('');
            setHasError(true);
            setIsLoading(false);
            return;
        }

        const nextIndex = selectInitialImageIndex(newUrls);
        const selectedUrl = newUrls[nextIndex];
        const isCached = selectedUrl && imageLoadCache.get(selectedUrl) === true;

        // Use the optimized URL (e.g., /api/nft/image/{hash}) instead of raw IPFS URL
        setCurrentImageUrl(selectedUrl || normalizedImageUrl);
        setFallbackIndex(nextIndex);
        setHasError(false);

        // Don't set loading state if image is already cached!
        if (!isCached) {
            setIsLoading(true);
        }
    }, [normalizedImageUrl]);

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        imageLoadCache.set(currentImageUrl, true);
        setAspectRatio(ratio);
        setIsLoading(false);
    }, [currentImageUrl]);

    const handleImageError = useCallback(() => {
        imageLoadCache.set(currentImageUrl, false);

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

        // All fallbacks failed - cache primary as failed and stop retries.
        imageLoadCache.set(imageUrls[0] || currentImageUrl, false);
        setCurrentImageUrl('');
        setHasError(true);
        setIsLoading(false);
    }, [fallbackIndex, imageUrls, currentImageUrl]);

    // Respect explicit object-fit from caller (e.g. NFTCard uses object-cover).
    // Fallback to object-contain only when no fit class is provided.
    const hasExplicitObjectFit = /(^|\s)object-(contain|cover|fill|none|scale-down)(\s|$)/.test(className);
    const objectFitClass = hasExplicitObjectFit ? '' : 'object-contain';

    // Use a neutral light placeholder to avoid dark flashes before image decode.
    const blurDataURL = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23f3f4f6'/%3E%3Cstop offset='1' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='16' height='16' fill='url(%23g)'/%3E%3C/svg%3E";

    // Check if this is a sharp image (not background) and should have glitter effect
    // CRITICAL: Convert tokenId to string (may be Number from marketplace_items)
    const normalizedTokenId = String(tokenId);
    const isSharpImage = !normalizedTokenId.includes('-bg');

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
    if (!normalizedImageUrl) {
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
                className={`bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse ${className}`}
                style={fill ? {} : { width, height }}
            />
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

    const imageProps = {
        src: currentImageUrl,
        className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
            } ${objectFitClass} ${className}`,
        onLoad: handleImageLoad,
        onError: handleImageError,
        placeholder: "blur" as const,
        blurDataURL,
        priority,
        // Use Next.js image optimization for caching (30 day TTL in next.config.ts)
        // Only use optimizer for local/proxied images.
        // External IPFS gateway fallbacks can return 400 in /_next/image (invalid upstream image response),
        // so load them directly.
        unoptimized:
            currentImageUrl.startsWith('data:') ||
            currentImageUrl.startsWith('blob:') ||
            currentImageUrl.startsWith('http://') ||
            currentImageUrl.startsWith('https://'),
        // Optimized sizes for NFT cards - use consistent sizes for better cache hits
        sizes: sizes ?? (fill ?
            (normalizedTokenId.includes('-bg')
                ? "(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 256px"
                : "(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 256px") :
            `${width}px`),
        quality: normalizedTokenId.includes('-bg') ? 45 : 86,
        ...(fill ? { fill: true } : { width, height }),
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden bg-gray-100 ${fill ? 'w-full h-full' : ''} ${className}`}
        >
            <Image key={currentImageUrl} alt={alt || `NFT ${tokenId}`} {...imageProps} />

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
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse`}
                    style={fill ? {} : { width, height }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-md bg-white/75 px-2 py-1 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:120ms]" />
                            <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:240ms]" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-200/80 overflow-hidden">
                        <div className="h-full w-1/3 bg-gray-400/80 animate-[shimmer_1.6s_infinite]" />
                    </div>
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

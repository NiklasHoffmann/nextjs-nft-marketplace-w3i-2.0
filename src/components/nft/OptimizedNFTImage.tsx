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

interface OptimizedNFTImageProps {
    imageUrl: string;
    tokenId: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    // New prop for glitter effect synchronization
    tiltRotation?: { rotateX: number; rotateY: number };
}

// IPFS Gateway fallbacks - reordered by speed and reliability
const IPFS_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/'
];

// Cache for tested gateways to avoid repeated testing
const gatewayPerformanceCache = new Map<string, number>();

// Cache with timestamp for expired retry logic
interface CacheEntry {
    success: boolean;
    timestamp: number;
}

// Storage key for localStorage persistence
const STORAGE_KEY = 'nft-image-cache-v1';

class ImageCache {
    private cache = new Map<string, CacheEntry>();
    private maxSize = 500; // Increased from 100 to 500 for better caching
    private failureRetryTime = 5 * 60 * 1000; // 5 minutes for failed images
    private saveDebounceTimer: NodeJS.Timeout | null = null;

    constructor() {
        // Load from localStorage on init
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as [string, CacheEntry][];
                    // Only load successful entries that are less than 24 hours old
                    const now = Date.now();
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    parsed.forEach(([key, entry]) => {
                        if (entry.success && (now - entry.timestamp) < maxAge) {
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
                // Only save successful entries
                const entries = Array.from(this.cache.entries())
                    .filter(([_, entry]) => entry.success)
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

        // Persist successful loads
        if (value) {
            this.saveToStorage();
        }
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

    return null;
};

// Legacy function for backward compatibility
const extractIPFSHash = (url: string): string | null => {
    const info = extractIPFSInfo(url);
    return info?.hash || null;
};

// Convert IPFS URLs to use our server-side cache first, then fallback to gateways
const optimizeImageUrl = (url: string): string[] => {
    if (!url) return [];

    // Extract IPFS hash and path
    const ipfsInfo = extractIPFSInfo(url);

    // If it's an IPFS URL, use our server cache first!
    if (ipfsInfo) {
        const { hash, path: ipfsPath } = ipfsInfo;
        const fullHash = ipfsPath ? `${hash}/${ipfsPath}` : hash;

        // Priority order:
        // 1. Our server-side cache (shared between all users!)
        // 2. Cloudflare IPFS (fastest public gateway)
        // 3. Other gateways as fallback
        return [
            `/api/nft/image/${encodeURIComponent(fullHash)}`, // Server cache - shared!
            `https://cloudflare-ipfs.com/ipfs/${fullHash}`,   // Fast CDN fallback
            `https://gateway.pinata.cloud/ipfs/${fullHash}`,  // Reliable fallback
            `https://dweb.link/ipfs/${fullHash}`              // Last resort
        ];
    }

    // If it's already a non-IPFS HTTP URL, use it directly
    if (url.startsWith('http')) {
        return [url];
    }

    // Fallback to original URL
    return [url];
};

const OptimizedNFTImage = memo(({
    imageUrl,
    tokenId,
    alt,
    className = "",
    fill = false,
    width = 256,
    height = 256,
    priority = false,
    tiltRotation = { rotateX: 0, rotateY: 0 },
}: OptimizedNFTImageProps) => {
    // Early return if no valid imageUrl
    if (!imageUrl || imageUrl.trim() === '') {
        return (
            <ImageSkeleton
                className={className}
                width={width}
                height={height}
                fill={fill}
            />
        );
    }

    // Get all possible URLs for this image
    const imageUrls = optimizeImageUrl(imageUrl);

    // Check if image is likely cached BEFORE setting initial loading state ⚡
    const isCachedInitially = useMemo(() => {
        if (typeof window === 'undefined' || imageUrls.length === 0) return false;
        const cacheKey = imageUrls[0];
        if (!cacheKey) return false;
        return imageLoadCache.get(cacheKey) === true;
    }, [imageUrls]);

    const [isLoading, setIsLoading] = useState(!isCachedInitially); // Start as loaded if cached!
    const [hasError, setHasError] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(() => imageUrls[0] || imageUrl);
    const [fallbackIndex, setFallbackIndex] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(priority || isCachedInitially);
    const [hasBeenVisible, setHasBeenVisible] = useState(isCachedInitially);
    const imgRef = useRef<HTMLDivElement>(null);

    // New state for smooth glitter fade-out
    const [displayGlitter, setDisplayGlitter] = useState(false);
    const [glitterOpacity, setGlitterOpacity] = useState(0);
    const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Combined cache check and preload logic - OPTIMIZED
    useEffect(() => {
        if (typeof window === 'undefined' || imageUrls.length === 0) return;

        const cacheKey = imageUrls[0];
        if (!cacheKey) return;

        const cachedResult = imageLoadCache.get(cacheKey);

        // If cached, set states immediately
        if (cachedResult) {
            setHasBeenVisible(true);
            setIsIntersecting(true);
            setIsLoading(false);
            return;
        }

        // Not cached - test image loading
        const testImg = new window.Image();
        const timeout = setTimeout(() => {
            testImg.onload = null;
            testImg.onerror = null;
        }, 5000); // Increased timeout

        testImg.onload = () => {
            clearTimeout(timeout);
            imageLoadCache.set(cacheKey, true);
            setHasBeenVisible(true);
            setIsIntersecting(true);
            setIsLoading(false);
        };

        testImg.onerror = () => {
            clearTimeout(timeout);
            imageLoadCache.set(cacheKey, false);
            // Don't set hasError immediately - try fallback
            setIsLoading(false);
        };

        testImg.src = cacheKey;
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

    // Browser-level preload when in viewport
    useEffect(() => {
        if (!(isIntersecting || priority) || imageUrls.length === 0 || typeof window === 'undefined') return;

        const imageUrl = imageUrls[0];
        if (!imageUrl) return;

        const existingPreload = document.querySelector(`link[href="${imageUrl}"]`);

        if (!existingPreload) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = imageUrl;
            document.head.appendChild(link);
        }
    }, [isIntersecting, imageUrls, priority]);

    // Update current image URL when imageUrl prop changes - OPTIMIZED FOR CACHE
    useEffect(() => {
        const newUrls = optimizeImageUrl(imageUrl);
        const firstUrl = newUrls[0];
        const isCached = firstUrl && imageLoadCache.get(firstUrl) === true;

        // Use the optimized URL (e.g., /api/nft/image/{hash}) instead of raw IPFS URL
        setCurrentImageUrl(firstUrl || imageUrl);
        setFallbackIndex(0);
        setHasError(false);

        // Don't set loading state if image is already cached! âš¡
        if (!isCached) {
            setIsLoading(true);
        }
    }, [imageUrl]);

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        setAspectRatio(ratio);
        setIsLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
        // Try next fallback URL if available
        if (fallbackIndex < imageUrls.length - 1) {
            const nextIndex = fallbackIndex + 1;
            const nextUrl = imageUrls[nextIndex];
            if (nextUrl) {
                // Small delay before retry to avoid flooding
                setTimeout(() => {
                    setFallbackIndex(nextIndex);
                    setCurrentImageUrl(nextUrl);
                    setIsLoading(true);
                }, 100);
            } else {
                // URL is undefined
                setHasError(true);
                setIsLoading(false);
            }
        } else {
            // All fallbacks failed - cache as failed
            imageLoadCache.set(imageUrls[0] || currentImageUrl, false);
            setHasError(true);
            setIsLoading(false);
        }
    }, [fallbackIndex, imageUrls, currentImageUrl]);

    // Determine object-fit based on aspect ratio - PRIORITIZE FULL IMAGE VISIBILITY
    const getObjectFit = () => {
        // Default to object-contain to ensure full image is always visible
        return 'object-contain';
    };

    // Generate optimized blur placeholder
    const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k=";

    // Check if this is a sharp image (not background) and should have glitter effect
    const isSharpImage = !tokenId.includes('-bg');

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
        alt: alt || `NFT ${tokenId}`,
        className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
            } ${getObjectFit()} ${className}`,
        onLoad: handleImageLoad,
        onError: handleImageError,
        placeholder: "blur" as const,
        blurDataURL,
        priority,
        // Use Next.js image optimization for caching (30 day TTL in next.config.ts)
        // Only use unoptimized for data: URLs or blob: URLs
        unoptimized: currentImageUrl.startsWith('data:') || currentImageUrl.startsWith('blob:'),
        // Optimized sizes for NFT cards - use consistent sizes for better cache hits
        sizes: fill ?
            (tokenId.includes('-bg') ? "200px" : "(max-width: 640px) 160px, (max-width: 1024px) 200px, 256px") :
            `${width}px`,
        quality: tokenId.includes('-bg') ? 40 : 75, // Lower quality for background images
        ...(fill ? { fill: true } : { width, height }),
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''} ${aspectRatio && Math.abs(aspectRatio - 1) < 0.1 ? 'bg-transparent' : ''} ${className}`}
        >
            <Image key={currentImageUrl} {...imageProps} />

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
                />
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

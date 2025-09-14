"use client";

import Image from "next/image";
import { useState, memo, useCallback, useRef, useEffect } from "react";

interface OptimizedNFTImageProps {
    imageUrl: string;
    tokenId: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    borderRadius?: string;
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

// Simple LRU cache for image load results
class ImageCache {
    private cache = new Map<string, boolean>();
    private maxSize = 100;

    set(key: string, value: boolean) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (typeof firstKey === 'string') {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    get(key: string): boolean | undefined {
        return this.cache.get(key);
    }
}

const imageLoadCache = new ImageCache();

// Convert IPFS URLs to use faster gateways
const optimizeImageUrl = (url: string): string[] => {
    if (!url) return [];

    // If it's already an HTTP URL, use it as is
    if (url.startsWith('http')) {
        // If it's an IPFS gateway URL, also provide fallbacks
        if (url.includes('/ipfs/')) {
            const hash = url.split('/ipfs/')[1]?.split('/')[0];
            if (hash) {
                return [url, ...IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)];
            }
        }
        return [url];
    }

    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
        const hash = url.replace('ipfs://', '');
        return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
    }

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
    borderRadius = "rounded-2xl",
}: OptimizedNFTImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
    const [fallbackIndex, setFallbackIndex] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(priority);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Get all possible URLs for this image
    const imageUrls = optimizeImageUrl(imageUrl);

    // Check if image might be cached from previous view
    useEffect(() => {
        if (typeof window !== 'undefined' && imageUrls.length > 0) {
            const cacheKey = imageUrls[0];
            const cachedResult = imageLoadCache.get(cacheKey);

            if (cachedResult) {
                setHasBeenVisible(true);
                setIsIntersecting(true);
                setIsLoading(false); // Important: Set loading to false for cached images
                return;
            }

            // Test image loading with timeout
            const testImg = new window.Image();
            const timeout = setTimeout(() => {
                testImg.onload = null;
                testImg.onerror = null;
            }, 1000);

            testImg.onload = () => {
                clearTimeout(timeout);
                imageLoadCache.set(cacheKey, true);
                setHasBeenVisible(true);
                setIsIntersecting(true);
                setIsLoading(false); // Set loading to false when preload completes
            };

            testImg.onerror = () => {
                clearTimeout(timeout);
                imageLoadCache.set(cacheKey, false);
            };

            testImg.src = cacheKey;
        }
    }, [imageUrls]);

    // Intersection Observer for lazy loading (unless priority or cached)
    useEffect(() => {
        if (priority || hasBeenVisible || !imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    setHasBeenVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [priority, hasBeenVisible]);

    // Preload image when in viewport range
    useEffect(() => {
        if (isIntersecting && imageUrls.length > 0 && typeof window !== 'undefined') {
            const img = new window.Image();
            img.src = imageUrls[0];
        }
    }, [isIntersecting, imageUrls]);

    // Update current image URL when imageUrl prop changes
    useEffect(() => {
        setCurrentImageUrl(imageUrl);
        setFallbackIndex(0);
        setHasError(false);
        setIsLoading(true);
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
            setFallbackIndex(nextIndex);
            setCurrentImageUrl(imageUrls[nextIndex]);
            setIsLoading(true);
        } else {
            // All fallbacks failed
            setHasError(true);
            setIsLoading(false);
        }
    }, [fallbackIndex, imageUrls]);

    // Determine object-fit based on aspect ratio - PRIORITIZE FULL IMAGE VISIBILITY
    const getObjectFit = () => {
        // Default to object-contain to ensure full image is always visible
        return 'object-contain';
    };

    // Generate optimized blur placeholder
    const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k=";

    // Don't render image until it's in viewport (unless priority or previously cached)
    if (!isIntersecting && !hasBeenVisible) {
        return (
            <div
                ref={imgRef}
                className={`bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse ${borderRadius} ${className}`}
                style={fill ? {} : { width, height }}
            />
        );
    }

    // Handle error fallback
    if (hasError) {
        return (
            <div
                ref={imgRef}
                className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 ${borderRadius} ${className}`}
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
        // Enhanced caching: use Next.js optimization for better caching
        unoptimized: false, // Let Next.js optimize all images for better caching
        // Responsive sizing for better caching
        sizes: fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : `${width}px`,
        quality: 75, // Optimized quality for better performance
        ...(fill ? { fill: true } : { width, height }),
    };

    return (
        <div
            ref={imgRef}
            className={`relative ${borderRadius} overflow-hidden ${fill ? 'w-full h-full' : ''} ${aspectRatio && Math.abs(aspectRatio - 1) < 0.1 ? 'bg-transparent' : ''}`}
        >
            <Image {...imageProps} />
            {/* Loading skeleton */}
            {isLoading && (
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse ${borderRadius}`}
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

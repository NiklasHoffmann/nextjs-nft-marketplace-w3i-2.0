"use client";

import Image from "next/image";
import { useState, memo, useCallback, useRef, useEffect, useMemo } from "react";

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
    tiltRotation = { rotateX: 0, rotateY: 0 },
}: OptimizedNFTImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
    const [fallbackIndex, setFallbackIndex] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(priority);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // New state for smooth glitter fade-out
    const [displayGlitter, setDisplayGlitter] = useState(false);
    const [glitterOpacity, setGlitterOpacity] = useState(0);
    const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

            // For background images, use lower resolution preload
            if (tokenId.includes('-bg')) {
                // Create a lower resolution version for background preload
                const bgUrl = imageUrls[0];
                img.src = bgUrl;
                // Set smaller dimensions for background preload
                img.width = 200;
                img.height = 200;
            } else {
                img.src = imageUrls[0];
            }
        }
    }, [isIntersecting, imageUrls, tokenId]);

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

    // Check if this is a sharp image (not background) and should have glitter effect
    const isSharpImage = !tokenId.includes('-bg');

    // Calculate glitter effect based on tilt rotation
    const glitterIntensity = useMemo(() => {
        if (!isSharpImage) return 0;

        // Calculate intensity based on rotation magnitude
        const rotationMagnitude = Math.sqrt(
            Math.pow(tiltRotation.rotateX, 2) + Math.pow(tiltRotation.rotateY, 2)
        );

        // Normalize to 0-1 range with enhanced threshold for better visibility
        const rawIntensity = Math.min(rotationMagnitude / 10, 1); // Reduced from 13 to 10 for stronger effect

        // Apply enhanced easing for more dramatic effect
        // Use cubic easing for stronger ramp-up
        const easedIntensity = rawIntensity * rawIntensity * rawIntensity;

        // Enhanced base and movement detection for better visibility on light images  
        const hasMovement = rotationMagnitude > 0.3; // Reduced threshold from 0.5 to 0.3
        const baseOpacity = hasMovement ? 0.06 : 0; // Slightly reduced from 0.08 to 0.06

        return Math.max(baseOpacity, easedIntensity * 1.0); // Reduced from 1.2 to 1.0
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

    // Generate glitter position based on rotation
    const glitterStyle = useMemo(() => {
        if (!isSharpImage) return {};

        // Calculate glitter beam direction based on rotation - wider coverage
        const glitterX = 50 + (tiltRotation.rotateY * 1.5); // More centered range
        const glitterY = 50 + (tiltRotation.rotateX * -1.5); // More centered range

        // Enhanced intensity modifiers - slightly toned down for better balance
        const enhancedIntensity = glitterOpacity * 1.0;     // Reduced from 1.2 to 1.0
        const strongIntensity = glitterOpacity * 0.7;       // Reduced from 0.8 to 0.7
        const subtleIntensity = glitterOpacity * 0.5;       // Reduced from 0.6 to 0.5

        return {
            backgroundImage: `
                radial-gradient(ellipse 180% 180% at ${glitterX}% ${glitterY}%, 
                    rgba(255, 255, 255, ${0.3 * enhancedIntensity}) 0%, 
                    rgba(255, 255, 255, ${0.2 * enhancedIntensity}) 25%, 
                    rgba(255, 255, 255, ${0.1 * enhancedIntensity}) 60%, 
                    transparent 100%),
                radial-gradient(ellipse 120% 120% at ${glitterX + 10}% ${glitterY - 10}%, 
                    rgba(200, 200, 255, ${0.12 * strongIntensity}) 0%, 
                    rgba(255, 200, 255, ${0.08 * strongIntensity}) 40%, 
                    transparent 80%),
                linear-gradient(${45 + tiltRotation.rotateY * 2}deg, 
                    rgba(255, 255, 255, ${0.04 * subtleIntensity}) 0%, 
                    rgba(255, 255, 255, ${0.12 * subtleIntensity}) 30%, 
                    rgba(255, 255, 255, ${0.28 * enhancedIntensity}) 45%, 
                    rgba(255, 255, 255, ${0.36 * enhancedIntensity}) 50%, 
                    rgba(255, 255, 255, ${0.28 * enhancedIntensity}) 55%, 
                    rgba(255, 255, 255, ${0.12 * subtleIntensity}) 70%, 
                    rgba(255, 255, 255, ${0.04 * subtleIntensity}) 100%),
                conic-gradient(from ${tiltRotation.rotateY * 4}deg at ${glitterX}% ${glitterY}%, 
                    rgba(255, 255, 255, ${0.05 * subtleIntensity}) 0deg, 
                    rgba(255, 255, 255, ${0.15 * enhancedIntensity}) 45deg, 
                    rgba(255, 255, 255, ${0.08 * strongIntensity}) 90deg, 
                    rgba(255, 255, 255, ${0.03 * subtleIntensity}) 135deg, 
                    rgba(255, 255, 255, ${0.1 * strongIntensity}) 180deg, 
                    rgba(255, 255, 255, ${0.18 * enhancedIntensity}) 225deg, 
                    rgba(255, 255, 255, ${0.07 * strongIntensity}) 270deg, 
                    rgba(255, 255, 255, ${0.12 * enhancedIntensity}) 315deg, 
                    rgba(255, 255, 255, ${0.05 * subtleIntensity}) 360deg)
            `,
            opacity: Math.min(enhancedIntensity, 0.85), // Reduced max opacity from 1.0 to 0.85
            transform: `rotate(${tiltRotation.rotateY * 0.3}deg) scale(1.12)`, // Slightly reduced scale from 1.15 to 1.12
            mixBlendMode: 'overlay' as const, // Changed from 'screen' to 'overlay' for better visibility on light images
            filter: 'contrast(1.15) brightness(1.05)', // Slightly reduced contrast and brightness
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
        // Enhanced caching: use Next.js optimization for better caching
        unoptimized: false, // Let Next.js optimize all images for better caching
        // Responsive sizing for better caching - lower quality for background images
        sizes: fill ?
            (tokenId.includes('-bg') ? "(max-width: 768px) 200px, 300px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw") :
            `${width}px`,
        quality: tokenId.includes('-bg') ? 40 : 75, // Lower quality for background images
        ...(fill ? { fill: true } : { width, height }),
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''} ${aspectRatio && Math.abs(aspectRatio - 1) < 0.1 ? 'bg-transparent' : ''} ${className}`}
        >
            <Image {...imageProps} />

            {/* Glitter effect overlay for sharp images - ultra smooth fade-out */}
            {isSharpImage && displayGlitter && (
                <>
                    {/* Main glitter layer with full coverage */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-in-out"
                        style={{
                            backgroundImage: glitterStyle.backgroundImage,
                            opacity: glitterStyle.opacity,
                            transform: glitterStyle.transform,
                            mixBlendMode: glitterStyle.mixBlendMode,
                            // Ensure full coverage by expanding beyond bounds
                            inset: '-5%',
                            borderRadius: 'inherit',
                            // Ultra smooth fade-out
                            transitionDuration: '1200ms',
                        }}
                    />
                    {/* Subtle sparkle particles with wider distribution */}
                    <div
                        className="absolute pointer-events-none transition-opacity duration-500 ease-in-out"
                        style={{
                            inset: '-10%', // Expand even further for sparkles
                            backgroundImage: `
                                radial-gradient(circle at ${15 + tiltRotation.rotateY * 0.8}% ${25 + tiltRotation.rotateX * 0.8}%, 
                                    rgba(255, 255, 255, ${0.25 * glitterOpacity}) 0%, 
                                    transparent 3px),
                                radial-gradient(circle at ${85 - tiltRotation.rotateY * 0.8}% ${75 - tiltRotation.rotateX * 0.8}%, 
                                    rgba(255, 255, 255, ${0.18 * glitterOpacity}) 0%, 
                                    transparent 2px),
                                radial-gradient(circle at ${65 + tiltRotation.rotateY * 0.3}% ${15 + tiltRotation.rotateX * 0.3}%, 
                                    rgba(255, 255, 255, ${0.22 * glitterOpacity}) 0%, 
                                    transparent 2.5px),
                                radial-gradient(circle at ${35 - tiltRotation.rotateY * 0.5}% ${85 - tiltRotation.rotateX * 0.5}%, 
                                    rgba(255, 255, 255, ${0.15 * glitterOpacity}) 0%, 
                                    transparent 1.8px),
                                radial-gradient(circle at ${50 + tiltRotation.rotateY * 0.2}% ${50 + tiltRotation.rotateX * 0.2}%, 
                                    rgba(255, 255, 255, ${0.12 * glitterOpacity}) 0%, 
                                    transparent 1.5px)
                            `,
                            opacity: Math.pow(glitterOpacity, 0.9) * 0.7, // Balanced sparkles
                            mixBlendMode: 'screen',
                            backgroundSize: '120px 120px, 80px 80px, 100px 100px, 60px 60px, 90px 90px',
                            transform: `rotate(${tiltRotation.rotateY * 0.2}deg) scale(1.05)`,
                            // Extended fade-out for sparkles
                            transitionDuration: '1500ms',
                        }}
                    />
                    {/* Soft edge glow to hide any sharp cutoffs */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-400 ease-in-out"
                        style={{
                            backgroundImage: `radial-gradient(ellipse 120% 120% at center, 
                                transparent 70%, 
                                rgba(255, 255, 255, ${0.06 * glitterOpacity}) 85%, 
                                rgba(255, 255, 255, ${0.03 * glitterOpacity}) 95%, 
                                transparent 100%)`,
                            opacity: glitterOpacity * 0.6,
                            mixBlendMode: 'screen',
                            // Longest fade-out for soft glow
                            transitionDuration: '1800ms',
                        }}
                    />
                </>
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

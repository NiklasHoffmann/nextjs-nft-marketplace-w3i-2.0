"use client";

import Image from "next/image";
import { useState, memo } from "react";

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
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const ratio = img.naturalWidth / img.naturalHeight;
        setAspectRatio(ratio);
        setIsLoading(false);
    };

    // Determine object-fit based on aspect ratio - PRIORITIZE FULL IMAGE VISIBILITY
    const getObjectFit = () => {
        // Default to object-contain to ensure full image is always visible
        return 'object-contain';
    };

    // Generate optimized blur placeholder
    const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k=";

    // Handle error fallback
    if (hasError) {
        return (
            <div
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    const imageProps = {
        src: imageUrl,
        alt: alt || `NFT ${tokenId}`,
        className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
            } ${getObjectFit()} ${className}`,
        onLoad: handleImageLoad,
        onError: () => setHasError(true),
        placeholder: "blur" as const,
        blurDataURL,
        priority,
        // Enhanced caching: always use optimized images when possible
        unoptimized: imageUrl.includes('ipfs') || imageUrl.startsWith('data:'),
        // Add cache control for better performance
        sizes: fill ? "100vw" : `${width}px`,
        quality: 90,
        ...(fill ? { fill: true } : { width, height }),
    };

    return (
        <div className={`relative ${borderRadius} overflow-hidden ${fill ? 'w-full h-full' : ''} ${aspectRatio && Math.abs(aspectRatio - 1) < 0.1 ? 'bg-transparent' : ''}`}>
            <Image {...imageProps} />
            {/* Loading skeleton */}
            {isLoading && (
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse ${borderRadius}`}
                    style={fill ? {} : { width, height }}
                />
            )}
        </div>
    );
});

OptimizedNFTImage.displayName = 'OptimizedNFTImage';
export default OptimizedNFTImage;

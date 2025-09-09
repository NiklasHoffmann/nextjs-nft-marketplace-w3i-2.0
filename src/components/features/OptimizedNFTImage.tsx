/**
 * Optimized NFT Image Component with fallbacks and loading states
 */
"use client";

import Image from "next/image";
import { useState, memo } from "react";
import { convertIpfsToHttp, isVideo } from "@/utils";
import { UI_CONFIG } from "@/lib/config";
import { Loading, ErrorDisplay } from "@/components/ui";
import { cn } from "@/lib/utils";

interface OptimizedNFTImageProps {
    imageUrl: string;
    tokenId: string;
    alt?: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    showLoadingState?: boolean;
    fallbackSrc?: string;
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
    showLoadingState = true,
    fallbackSrc,
}: OptimizedNFTImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string>("");

    // Convert IPFS URLs to HTTP
    const processedUrl = convertIpfsToHttp(imageUrl);

    // Initialize current source
    if (!currentSrc && processedUrl) {
        setCurrentSrc(processedUrl);
    }

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);

        // Try fallback source if available and not already tried
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            return;
        }

        setHasError(true);
    };

    const generateAltText = (): string => {
        if (alt) return alt;
        return `NFT #${tokenId}`;
    };

    // Don't render if no valid image URL
    if (!processedUrl && !fallbackSrc) {
        return (
            <div className={cn(
                "flex items-center justify-center bg-gray-100 rounded-xl",
                !fill && `w-[${width}px] h-[${height}px]`,
                className
            )}>
                <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No image available</p>
                </div>
            </div>
        );
    }

    // Check if it's a video file
    if (isVideo(currentSrc)) {
        return (
            <div className={cn(
                "relative rounded-xl overflow-hidden bg-gray-100",
                !fill && `w-[${width}px] h-[${height}px]`,
                fill && "w-full h-full",
                className
            )}>
                <video
                    className="w-full h-full object-cover"
                    controls
                    poster={fallbackSrc}
                    onLoadStart={() => setIsLoading(false)}
                    onError={handleImageError}
                >
                    <source src={currentSrc} type="video/mp4" />
                    <source src={currentSrc} type="video/webm" />
                    Your browser does not support the video tag.
                </video>
                {isLoading && showLoadingState && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Loading size="md">Loading video...</Loading>
                    </div>
                )}
            </div>
        );
    }

    // Error state
    if (hasError) {
        return (
            <div className={cn(
                "flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200",
                !fill && `w-[${width}px] h-[${height}px]`,
                className
            )}>
                <div className="text-center text-gray-500 p-4">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs">Failed to load image</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "relative rounded-xl overflow-hidden bg-gray-100",
            !fill && `w-[${width}px] h-[${height}px]`,
            fill && "w-full h-full",
            className
        )}>
            <Image
                src={currentSrc}
                alt={generateAltText()}
                fill={fill}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                className={cn(
                    "object-cover transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100"
                )}
                sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
                priority={priority}
                quality={UI_CONFIG.image.quality}
                placeholder="blur"
                blurDataURL={UI_CONFIG.image.defaultBlurDataUrl}
                onLoad={handleImageLoad}
                onError={handleImageError}
            />

            {isLoading && showLoadingState && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loading size="md" />
                </div>
            )}
        </div>
    );
});

OptimizedNFTImage.displayName = 'OptimizedNFTImage';

export default OptimizedNFTImage;

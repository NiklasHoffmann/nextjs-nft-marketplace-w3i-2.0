"use client";

import { useEffect, memo } from 'react';

interface ImagePreloaderProps {
    imageUrls: string[];
    priority?: boolean;
}

// Component to preload critical images
const ImagePreloader = memo(({ imageUrls, priority = false }: ImagePreloaderProps) => {
    useEffect(() => {
        if (!priority) return;
        
        const preloadImages = () => {
            imageUrls.forEach((url, index) => {
                if (index < 3) { // Only preload first 3 images
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = url;
                    document.head.appendChild(link);
                }
            });
        };

        // Use requestIdleCallback if available, otherwise setTimeout
        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(preloadImages);
            } else {
                setTimeout(preloadImages, 100);
            }
        }
    }, [imageUrls, priority]);

    return null; // This component doesn't render anything
});

ImagePreloader.displayName = 'ImagePreloader';
export default ImagePreloader;
"use client";

import { useEffect, memo, useRef } from 'react';
import { resolveNftImageCandidates } from '@/utils';

interface ImagePreloaderProps {
    imageUrls: string[];
    priority?: boolean;
    maxPreload?: number; // Maximum number of images to preload
}

// Component to preload critical images
const ImagePreloader = memo(({ imageUrls, priority = false, maxPreload = 8 }: ImagePreloaderProps) => {
    const preloadedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!priority || !Array.isArray(imageUrls) || imageUrls.length === 0) return;

        const preloadImages = () => {
            // Get unique URLs we haven't preloaded yet
            const urlsToPreload = imageUrls
                .slice(0, maxPreload)
                .map((url) => resolveNftImageCandidates(url)[0] || '')
                .filter(url => url && !preloadedRef.current.has(url));

            urlsToPreload.forEach((url) => {
                // Mark as preloaded to avoid duplicates
                preloadedRef.current.add(url);

                // Create preload link
                const existingLink = document.querySelector(`link[href="${url}"]`);
                if (!existingLink) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = url;
                    link.crossOrigin = 'anonymous';
                    document.head.appendChild(link);
                }

                // Also create Image object for browser caching
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = url;
            });
        };

        // Use requestIdleCallback if available, otherwise setTimeout
        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(preloadImages, { timeout: 2000 });
            } else {
                setTimeout(preloadImages, 50); // Faster timeout
            }
        }
    }, [imageUrls, priority, maxPreload]);

    return null; // This component doesn't render anything
});

ImagePreloader.displayName = 'ImagePreloader';
export default ImagePreloader;

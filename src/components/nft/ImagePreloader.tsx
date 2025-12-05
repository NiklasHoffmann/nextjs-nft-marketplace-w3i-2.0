"use client";

import { useEffect, memo, useRef } from 'react';

interface ImagePreloaderProps {
    imageUrls: string[];
    priority?: boolean;
    maxPreload?: number; // Maximum number of images to preload
}

// Extract IPFS hash and path from URL
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

// Convert to our server-side cache URL
const optimizeUrl = (url: string): string => {
    if (!url) return url;

    const ipfsInfo = extractIPFSInfo(url);
    if (ipfsInfo) {
        const { hash, path } = ipfsInfo;
        const fullHash = path ? `${hash}/${path}` : hash;
        // Use our server-side cache!
        return `/api/nft/image/${encodeURIComponent(fullHash)}`;
    }

    return url;
};

// Component to preload critical images
const ImagePreloader = memo(({ imageUrls, priority = false, maxPreload = 8 }: ImagePreloaderProps) => {
    const preloadedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!priority || !Array.isArray(imageUrls) || imageUrls.length === 0) return;

        const preloadImages = () => {
            // Get unique URLs we haven't preloaded yet
            const urlsToPreload = imageUrls
                .slice(0, maxPreload)
                .map(optimizeUrl)
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

"use client";

import { useEffect, useState } from 'react';

// Global image cache to persist across component unmounts
const imageCache = new Map<string, {
    loaded: boolean;
    error: boolean;
    timestamp: number;
}>();

// Cache cleanup: remove entries older than 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of imageCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            imageCache.delete(key);
        }
    }
};

// Cleanup every minute
setInterval(cleanupCache, 60 * 1000);

export const useImageCache = (imageUrl: string) => {
    const [isLoaded, setIsLoaded] = useState(() => {
        const cached = imageCache.get(imageUrl);
        return cached?.loaded || false;
    });

    const [hasError, setHasError] = useState(() => {
        const cached = imageCache.get(imageUrl);
        return cached?.error || false;
    });

    useEffect(() => {
        const cached = imageCache.get(imageUrl);

        if (cached) {
            setIsLoaded(cached.loaded);
            setHasError(cached.error);
            return;
        }

        // If not in cache, start loading
        setIsLoaded(false);
        setHasError(false);

        const img = new Image();

        img.onload = () => {
            imageCache.set(imageUrl, {
                loaded: true,
                error: false,
                timestamp: Date.now()
            });
            setIsLoaded(true);
            setHasError(false);
        };

        img.onerror = () => {
            imageCache.set(imageUrl, {
                loaded: false,
                error: true,
                timestamp: Date.now()
            });
            setIsLoaded(false);
            setHasError(true);
        };

        img.src = imageUrl;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [imageUrl]);

    return { isLoaded, hasError };
};

export const preloadImage = (imageUrl: string) => {
    if (imageCache.has(imageUrl)) return;

    const img = new Image();
    img.onload = () => {
        imageCache.set(imageUrl, {
            loaded: true,
            error: false,
            timestamp: Date.now()
        });
    };
    img.onerror = () => {
        imageCache.set(imageUrl, {
            loaded: false,
            error: true,
            timestamp: Date.now()
        });
    };
    img.src = imageUrl;
};

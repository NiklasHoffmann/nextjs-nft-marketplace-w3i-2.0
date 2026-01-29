/**
 * useScrollPosition Hook
 * 
 * Detects scroll position and returns whether user has scrolled past threshold
 * 
 * @param threshold - Scroll threshold in pixels (default: 100)
 * @returns isScrolled - Boolean indicating if scrolled past threshold
 */

'use client';

import { useState, useEffect } from 'react';

export function useScrollPosition(threshold: number = 100): boolean {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setIsScrolled(scrollTop > threshold);
        };

        // Initial check
        handleScroll();

        // Add scroll listener with throttling for performance
        let ticking = false;
        const scrollListener = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', scrollListener, { passive: true });
        return () => window.removeEventListener('scroll', scrollListener);
    }, [threshold]);

    return isScrolled;
}

"use client";

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseHorizontalScrollOptions {
    scrollAmount?: number;
    threshold?: number;
}

interface UseHorizontalScrollReturn {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    scroll: (direction: 'left' | 'right') => void;
    checkScrollPosition: () => void;
}

/**
 * Hook for horizontal scroll functionality
 * Provides scroll state and scroll functions
 * Used in CollectionsList for horizontal card scrolling
 */
export function useHorizontalScroll(
    options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn {
    const { scrollAmount = 400, threshold = 10 } = options;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollPosition = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);
    }, [threshold]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;

        const newScrollLeft = direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount;

        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }, [scrollAmount]);

    // Set up scroll and resize listeners
    useEffect(() => {
        checkScrollPosition();
        const container = scrollContainerRef.current;

        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            window.addEventListener('resize', checkScrollPosition);

            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
                window.removeEventListener('resize', checkScrollPosition);
            };
        }
        return undefined;
    }, [checkScrollPosition]);

    return {
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        scroll,
        checkScrollPosition,
    };
}

export default useHorizontalScroll;

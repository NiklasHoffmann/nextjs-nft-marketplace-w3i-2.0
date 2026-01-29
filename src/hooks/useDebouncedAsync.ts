/**
 * useDebouncedAsync - Reusable hook for debouncing async operations
 * 
 * Features:
 * - Debounces async function calls
 * - Tracks pending state
 * - Prevents race conditions
 * - Cleanup on unmount
 * 
 * @example
 * const [refresh, isRefreshing] = useDebouncedAsync(
 *   async () => await fetchData(),
 *   500
 * );
 */

import { useCallback, useRef, useState } from 'react';

export function useDebouncedAsync<T = void>(
    fn: () => Promise<T>,
    delay: number
): [() => void, boolean] {
    const [isPending, setIsPending] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingPromiseRef = useRef<Promise<T> | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useRef(() => {
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    });

    const debouncedFn = useCallback(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // If there's already a pending promise, skip
        if (pendingPromiseRef.current) {
            return;
        }

        // Schedule new execution
        timeoutRef.current = setTimeout(async () => {
            if (!isMountedRef.current) return;

            setIsPending(true);
            pendingPromiseRef.current = fn();

            try {
                await pendingPromiseRef.current;
            } finally {
                if (isMountedRef.current) {
                    setIsPending(false);
                }
                pendingPromiseRef.current = null;
            }
        }, delay);
    }, [fn, delay]);

    return [debouncedFn, isPending];
}

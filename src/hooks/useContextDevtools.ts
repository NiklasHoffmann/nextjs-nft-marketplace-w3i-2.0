/**
 * useContextDevtools - Debug helper for inspecting context state
 * 
 * Features:
 * - Exposes context state to window object
 * - Render count tracking
 * - Performance metrics
 * - Only active in development mode
 * 
 * @example
 * // In your context:
 * useContextDevtools('WalletNFTs', {
 *   nfts: state.nfts,
 *   loading: state.loading
 * });
 * 
 * // In browser console:
 * window.__CONTEXTS__.WalletNFTs
 * // { state: {...}, renders: 15, avgRenderTime: 2.3 }
 */

import { useEffect, useRef } from 'react';
import { devLog } from '@/utils';

interface ContextDevtools {
    [contextName: string]: {
        state: any;
        renders: number;
        lastRender: number;
        avgRenderTime: number;
        maxRenderTime: number;
    };
}

declare global {
    interface Window {
        __CONTEXTS__?: ContextDevtools;
        __logContext?: (name?: string) => void;
        __clearContexts?: () => void;
    }
}

export function useContextDevtools(contextName: string, state: any): void {
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef<number[]>([]);
    const renderStartRef = useRef(0);

    // Mark render start for this commit cycle (development diagnostics only)
    if (process.env.NODE_ENV === 'development') {
        renderStartRef.current = performance.now();
    }

    useEffect(() => {
        // Only in development mode
        if (process.env.NODE_ENV !== 'development') return;

        // Initialize global contexts object
        if (typeof window !== 'undefined') {
            if (!window.__CONTEXTS__) {
                window.__CONTEXTS__ = {};

                // Helper function to log context state
                window.__logContext = (name?: string) => {
                    if (name) {
                        devLog.log(`[${name}]`, window.__CONTEXTS__![name]);
                    } else {
                        devLog.log('All Contexts:', window.__CONTEXTS__);
                    }
                };

                // Helper function to clear contexts
                window.__clearContexts = () => {
                    window.__CONTEXTS__ = {};
                    devLog.log('✅ Contexts cleared');
                };

                devLog.log('🔧 Context DevTools enabled');
                devLog.log('📊 Use window.__logContext("ContextName") to inspect state');
                devLog.log('🗑️ Use window.__clearContexts() to clear');
            }

            // Track actual render+commit duration for this cycle
            const renderTime = performance.now() - renderStartRef.current;
            renderTimesRef.current.push(renderTime);
            // Keep only last 100 renders
            if (renderTimesRef.current.length > 100) {
                renderTimesRef.current.shift();
            }
            renderCountRef.current++;

            // Calculate metrics
            const avgRenderTime = renderTimesRef.current.length > 0
                ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
                : 0;

            const maxRenderTime = renderTimesRef.current.length > 0
                ? Math.max(...renderTimesRef.current)
                : 0;

            // Update global state
            window.__CONTEXTS__![contextName] = {
                state,
                renders: renderCountRef.current,
                lastRender: Date.now(),
                avgRenderTime: Math.round(avgRenderTime * 100) / 100,
                maxRenderTime: Math.round(maxRenderTime * 100) / 100
            };

            // Log slow commits (> 50ms) without dumping huge state objects into console
            if (renderTime > 50 && renderCountRef.current > 1) {
                devLog.warn(
                    `⚠️ Slow render in ${contextName}: ${renderTime.toFixed(2)}ms`,
                    {
                        renders: renderCountRef.current,
                        avgRenderTime: Math.round(avgRenderTime * 100) / 100,
                        maxRenderTime: Math.round(maxRenderTime * 100) / 100,
                    }
                );
            }
        }
    });
}

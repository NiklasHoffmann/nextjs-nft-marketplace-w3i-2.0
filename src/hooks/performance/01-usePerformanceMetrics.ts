"use client";

/**
 * Performance monitoring React hooks
 */

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils';

// React hook for measuring component render times
export const useRenderMetrics = (componentName: string) => {
    const renderStart = useRef<number>();

    // Mark render start
    renderStart.current = performance.now();

    useEffect(() => {
        if (renderStart.current) {
            performanceMonitor.recordMetric(
                `component.render.${componentName}`,
                performance.now() - renderStart.current
            );
        }
    });
};

// Web Vitals monitoring hook
export const useWebVitals = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Core Web Vitals
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    const nav = entry as PerformanceNavigationTiming;
                    performanceMonitor.recordMetric('page.load', nav.loadEventEnd - nav.fetchStart);
                    performanceMonitor.recordMetric('page.domContentLoaded', nav.domContentLoadedEventEnd - nav.fetchStart);
                }

                if (entry.entryType === 'paint') {
                    performanceMonitor.recordMetric(`paint.${entry.name}`, entry.startTime);
                }
            }
        });

        observer.observe({ entryTypes: ['navigation', 'paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            performanceMonitor.recordMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'first-input') {
                    const firstInputEntry = entry as any; // PerformanceEventTiming
                    const fid = firstInputEntry.processingStart - firstInputEntry.startTime;
                    performanceMonitor.recordMetric('fid', fid);
                }
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cleanup observers
        return () => {
            observer.disconnect();
            lcpObserver.disconnect();
            fidObserver.disconnect();
        };
    }, []);
};
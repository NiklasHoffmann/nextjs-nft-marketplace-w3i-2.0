/**
 * Performance monitoring utilities for the NFT marketplace
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  // Record performance metrics
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...metadata
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance issues
    this.checkForIssues(metric);
  }

  // Check for performance issues and warn
  private checkForIssues(metric: PerformanceMetric) {
    const thresholds = {
      'image.load': 3000, // 3 seconds
      'component.render': 100, // 100ms
      'api.response': 2000, // 2 seconds
      'page.load': 5000, // 5 seconds
      'nft.insights.fetch': 1000, // 1 second
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`Performance issue detected: ${metric.name} took ${metric.value}ms (threshold: ${threshold}ms)`);
    }
  }

  // Get metrics for analysis
  getMetrics(name?: string): PerformanceMetric[] {
    return name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;
  }

  // Get performance summary
  getSummary() {
    const summary: Record<string, { count: number; avg: number; max: number; min: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avg: 0, max: 0, min: Infinity };
      }
      
      const s = summary[metric.name];
      s.count += 1;
      s.max = Math.max(s.max, metric.value);
      s.min = Math.min(s.min, metric.value);
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
    });

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements
export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    performanceMonitor.recordMetric(name, performance.now() - start);
    return result;
  } catch (error) {
    performanceMonitor.recordMetric(`${name}.error`, performance.now() - start);
    throw error;
  }
};

export const measureSync = <T>(
  name: string,
  operation: () => T
): T => {
  const start = performance.now();
  try {
    const result = operation();
    performanceMonitor.recordMetric(name, performance.now() - start);
    return result;
  } catch (error) {
    performanceMonitor.recordMetric(`${name}.error`, performance.now() - start);
    throw error;
  }
};

// React hook for measuring component render times
import { useEffect, useRef } from 'react';

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

// Web Vitals monitoring
export const initWebVitals = () => {
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
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    performanceMonitor.recordMetric('lcp', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'first-input') {
        const firstInputEntry = entry as any; // PerformanceEventTiming
        const fid = firstInputEntry.processingStart - firstInputEntry.startTime;
        performanceMonitor.recordMetric('fid', fid);
      }
    }
  }).observe({ entryTypes: ['first-input'] });
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
};

// Log performance summary to console (development only)
export const logPerformanceSummary = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const summary = performanceMonitor.getSummary();
  console.group('🏃‍♂️ Performance Summary');
  
  Object.entries(summary).forEach(([name, stats]) => {
    console.log(`${name}:`, {
      count: stats.count,
      avg: `${Math.round(stats.avg)}ms`,
      min: `${Math.round(stats.min)}ms`,
      max: `${Math.round(stats.max)}ms`,
    });
  });
  
  const memory = getMemoryUsage();
  if (memory) {
    console.log('Memory Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      percentage: `${Math.round(memory.usedPercent)}%`
    });
  }
  
  console.groupEnd();
};
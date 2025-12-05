/**
 * UTILS - Zentrale Utility-Funktionen Export
 * 
 * Organisierte Utility-Kategorien:
 * • core: Grundlegende Datenverarbeitung (BigInt, Media)
 * • formatters: Display-Formatierung (Currency, Dates, Text)
 * • validation: Input-Validierung & Sanitization
 * • performance: Monitoring & Cache-Management
 * • features: Feature-Logic & Access Control
 * • api: Data-Fetching & Service Integration
 * 
 * NOTE: Blockchain utilities moved to @/services/blockchain
 */

// Core: Fundamental utilities for data types and media handling
export * from './core';

// Formatters: Data formatting and display utilities
export * from './formatters';

// Validation: Input validation and sanitization
export * from './validation';

// Performance: Performance monitoring and cache management
export {
    // Performance monitoring
    performanceMonitor,
    measureAsync,
    measureSync,
    getMemoryUsage,
    logPerformanceSummary,
    // Cache invalidation
    createCacheInvalidationManager
} from './performance';

// Features: Feature-specific utilities and access control
export * from './features';

// API: API layer utilities (includes updated createNFTKey and isDataFresh)
export * from './api';

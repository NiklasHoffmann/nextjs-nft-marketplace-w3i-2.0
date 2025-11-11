/**
 * UTILS - Zentrale Utility-Funktionen Export
 * 
 * Organisierte Utility-Kategorien:
 * â€¢ core: Grundlegende Datenverarbeitung (BigInt, Media)
 * â€¢ formatters: Display-Formatierung (Currency, Dates, Text)
 * â€¢ validation: Input-Validierung & Sanitization
 * â€¢ blockchain: Smart Contract & NFT Interaktion
 * â€¢ performance: Monitoring & Cache-Management
 * â€¢ features: Feature-Logic & Access Control
 * â€¢ api: Data-Fetching & Service Integration
 */

// Core: Fundamental utilities for data types and media handling
export * from './core';

// Formatters: Data formatting and display utilities
export * from './formatters';

// Validation: Input validation and sanitization
export * from './validation';

// Blockchain: Smart contract and NFT-specific utilities
export * from './blockchain';

// Performance: Performance monitoring and cache management (exclude conflicting exports)
export {
    calculateCacheStats,
    filterCacheByAge,
    createBatches,
    delay,
    isValidNFTIdentifier,
    createNFTErrorMessage,
    createEmptyNFTData,
    createEmptyErrorState,
    createEmptyLoadingState,
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

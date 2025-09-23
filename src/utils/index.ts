/**
 * UTILS - Zentrale Utility-Funktionen Export
 * 
 * Organisierte Utility-Kategorien:
 * • 01-core: Grundlegende Datenverarbeitung (BigInt, Media)
 * • 02-formatters: Display-Formatierung (Currency, Dates, Text)
 * • 03-validation: Input-Validierung & Sanitization
 * • 04-blockchain: Smart Contract & NFT Interaktion
 * • 05-performance: Monitoring & Cache-Management
 * • 06-features: Feature-Logic & Access Control
 * • 07-api: Data-Fetching & Service Integration
 */

// 01-core: Fundamental utilities for data types and media handling
export * from './01-core';

// 02-formatters: Data formatting and display utilities
export * from './02-formatters';

// 03-validation: Input validation and sanitization
export * from './03-validation';

// 04-blockchain: Smart contract and NFT-specific utilities
export * from './04-blockchain';

// 05-performance: Performance monitoring and cache management (exclude conflicting exports)
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
} from './05-performance';

// 06-features: Feature-specific utilities and access control
export * from './06-features';

// 07-api: API layer utilities (includes updated createNFTKey and isDataFresh)
export * from './07-api';

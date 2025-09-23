// utils/04-blockchain/06-blockchain-smart-cache.ts
import { LRUCache } from 'lru-cache';

// Multi-Layer Caching für verschiedene Daten-Typen mit unterschiedlichen TTLs

/**
 * Contract-Eigenschaften die sich praktisch nie ändern
 * TTL: 24 Stunden (sehr konservativ, könnte sogar länger sein)
 */
export const contractPropertiesCache = new LRUCache<string, ContractProperties>({
    max: 500, // Weniger Contracts, aber länger gecacht
    ttl: 1000 * 60 * 60 * 24, // 24 Stunden
    maxSize: 5 * 1024 * 1024, // 5MB
    sizeCalculation: (value) => JSON.stringify(value).length,
});

/**
 * Owner-bezogene Eigenschaften die sich bei Trades ändern
 * TTL: 5 Minuten (Balance-Updates bei Trades)
 */
export const ownershipCache = new LRUCache<string, OwnershipData>({
    max: 2000, // Mehr Entries für aktive NFTs
    ttl: 1000 * 60 * 5, // 5 Minuten
    maxSize: 10 * 1024 * 1024, // 10MB
    sizeCalculation: (value) => JSON.stringify(value).length,
});

/**
 * TokenURI und Metadaten - ändern sich praktisch nie
 * TTL: 12 Stunden (sehr konservativ)
 */
export const tokenMetadataCache = new LRUCache<string, TokenMetadata>({
    max: 5000, // Viele NFTs
    ttl: 1000 * 60 * 60 * 12, // 12 Stunden
    maxSize: 50 * 1024 * 1024, // 50MB
    sizeCalculation: (value) => JSON.stringify(value).length,
});

/**
 * Approval-Status - ändert sich bei Approvals
 * TTL: 2 Minuten (schnelle Updates nötig)
 */
export const approvalCache = new LRUCache<string, string>({
    max: 1000,
    ttl: 1000 * 60 * 2, // 2 Minuten
    maxSize: 1 * 1024 * 1024, // 1MB
    sizeCalculation: (value) => value.length,
});

// Type definitions
export interface ContractProperties {
    contractAddress: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    cached: boolean;
    cachedAt: number;
}

export interface OwnershipData {
    nftAddress: string;
    tokenId: string;
    owner?: string;
    ownerBalance?: string;
    cached: boolean;
    cachedAt: number;
}

export interface TokenMetadata {
    nftAddress: string;
    tokenId: string;
    tokenURI?: string;
    metadata?: any;
    imageUrl?: string;
    cached: boolean;
    cachedAt: number;
}

// Cache Key Generators
export const getCacheKeys = {
    contractProperties: (contractAddress: string) => `contract:${contractAddress}`,
    ownership: (contractAddress: string, tokenId: string) => `owner:${contractAddress}:${tokenId}`,
    tokenMetadata: (contractAddress: string, tokenId: string) => `meta:${contractAddress}:${tokenId}`,
    approval: (contractAddress: string, tokenId: string) => `approve:${contractAddress}:${tokenId}`,
};

// Smart Cache Invalidation für Development
export function invalidateAllCaches() {
    if (process.env.NODE_ENV === 'development') {
        contractPropertiesCache.clear();
        ownershipCache.clear();
        tokenMetadataCache.clear();
        approvalCache.clear();
        console.log('🧹 All caches cleared (development mode)');
    }
}

// Selective Cache Invalidation
export function invalidateNFTCaches(contractAddress: string, tokenId?: string) {
    if (tokenId) {
        // Invalidate specific token
        ownershipCache.delete(getCacheKeys.ownership(contractAddress, tokenId));
        tokenMetadataCache.delete(getCacheKeys.tokenMetadata(contractAddress, tokenId));
        approvalCache.delete(getCacheKeys.approval(contractAddress, tokenId));
        console.log(`🧹 Invalidated caches for ${contractAddress}:${tokenId}`);
    } else {
        // Invalidate entire contract (rare case)
        contractPropertiesCache.delete(getCacheKeys.contractProperties(contractAddress));
        console.log(`🧹 Invalidated contract cache for ${contractAddress}`);
    }
}

// Cache Statistics
export function getCacheStats() {
    return {
        contractProperties: {
            size: contractPropertiesCache.size,
            calculatedSize: contractPropertiesCache.calculatedSize,
            maxSize: contractPropertiesCache.maxSize,
        },
        ownership: {
            size: ownershipCache.size,
            calculatedSize: ownershipCache.calculatedSize,
            maxSize: ownershipCache.maxSize,
        },
        tokenMetadata: {
            size: tokenMetadataCache.size,
            calculatedSize: tokenMetadataCache.calculatedSize,
            maxSize: tokenMetadataCache.maxSize,
        },
        approval: {
            size: approvalCache.size,
            calculatedSize: approvalCache.calculatedSize,
            maxSize: approvalCache.maxSize,
        }
    };
}
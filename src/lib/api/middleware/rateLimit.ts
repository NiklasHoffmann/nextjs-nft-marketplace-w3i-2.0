/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiting für API Routes
 */

import { NextRequest } from 'next/server';
import { RateLimitError } from '../errors';

// ===== RATE LIMIT STORE =====

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup alte Einträge alle 5 Minuten
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ===== RATE LIMIT CONFIG =====

export interface RateLimitConfig {
    /** Max requests pro Window */
    maxRequests: number;
    /** Window in Sekunden */
    windowSeconds: number;
    /** Optional: Custom key generator */
    keyGenerator?: (request: NextRequest) => string;
}

export const RATE_LIMITS = {
    /** Standard: 60 requests/minute */
    STANDARD: { maxRequests: 60, windowSeconds: 60 },
    /** Strict: 10 requests/minute (für Admin/Write Operations) */
    STRICT: { maxRequests: 10, windowSeconds: 60 },
    /** Lenient: 120 requests/minute (für Read-Only) */
    LENIENT: { maxRequests: 120, windowSeconds: 60 },
    /** Very Strict: 5 requests/minute (für kostspielige Operations) */
    VERY_STRICT: { maxRequests: 5, windowSeconds: 60 },
} as const;

// ===== RATE LIMIT IMPLEMENTATION =====

/**
 * Generiert einen eindeutigen Key für Rate Limiting
 * Basiert auf IP oder Wallet Address
 */
function generateKey(request: NextRequest, customKey?: string): string {
    if (customKey) {
        return customKey;
    }

    // Versuche IP zu extrahieren
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Versuche Wallet Address zu extrahieren
    const wallet = request.headers.get('x-wallet-address') || '';

    return wallet ? `wallet:${wallet.toLowerCase()}` : `ip:${ip}`;
}

/**
 * Rate Limit Middleware
 * 
 * Wirft RateLimitError wenn Limit überschritten
 */
export async function rateLimit(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): Promise<void> {
    const key = config.keyGenerator
        ? config.keyGenerator(request)
        : generateKey(request);

    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    // Hole oder erstelle Entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // Neues Window starten
        entry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, entry);
        return;
    }

    // Increment count
    entry.count++;

    // Check limit
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        throw new RateLimitError(
            `Rate limit exceeded. Try again in ${retryAfter} seconds`,
            retryAfter
        );
    }
}

/**
 * Prüft ob ein Key rate-limited ist (ohne zu incrementieren)
 */
export function isRateLimited(key: string, config: RateLimitConfig): boolean {
    const entry = rateLimitStore.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (entry.resetTime < now) {
        rateLimitStore.delete(key);
        return false;
    }

    return entry.count >= config.maxRequests;
}

/**
 * Reset rate limit für einen Key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

/**
 * Get remaining requests für einen Key
 */
export function getRemainingRequests(key: string, config: RateLimitConfig): number {
    const entry = rateLimitStore.get(key);
    if (!entry) return config.maxRequests;

    const now = Date.now();
    if (entry.resetTime < now) {
        rateLimitStore.delete(key);
        return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
}

// ===== RATE LIMIT HEADERS =====

export function getRateLimitHeaders(
    key: string,
    config: RateLimitConfig
): Record<string, string> {
    const entry = rateLimitStore.get(key);
    const remaining = getRemainingRequests(key, config);
    const resetTime = entry?.resetTime || Date.now() + config.windowSeconds * 1000;

    return {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    };
}

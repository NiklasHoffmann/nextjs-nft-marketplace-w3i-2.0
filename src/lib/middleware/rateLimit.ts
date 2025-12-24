/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiting für API Routes
 */

import { NextRequest } from 'next/server';
import { RateLimitError } from '../api/errors';

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

// ===== RATE LIMIT FUNCTIONS =====

/**
 * Standard key generator: IP + User-Agent
 */
function getDefaultKey(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}-${userAgent}`;
}

/**
 * Rate Limiting Middleware
 * 
 * @param request Next.js Request
 * @param config Rate limit configuration
 * @throws RateLimitError wenn Limit überschritten
 */
export async function rateLimit(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): Promise<void> {
    const key = config.keyGenerator?.(request) || getDefaultKey(request);
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    // Hole oder erstelle Entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        // Neues Window
        entry = {
            count: 1,
            resetTime: now + windowMs
        };
        rateLimitStore.set(key, entry);
        return;
    }

    // Increment counter
    entry.count++;

    // Check limit
    if (entry.count > config.maxRequests) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        throw new RateLimitError(
            `Rate limit exceeded. Try again in ${resetIn} seconds.`
        );
    }
}

/**
 * Check if IP is rate limited (ohne Error zu werfen)
 */
export function isRateLimited(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): boolean {
    const key = config.keyGenerator?.(request) || getDefaultKey(request);
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        return false;
    }

    return entry.count >= config.maxRequests;
}

/**
 * Get remaining requests für IP
 */
export function getRemainingRequests(
    request: NextRequest,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): number {
    const key = config.keyGenerator?.(request) || getDefaultKey(request);
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
        return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
}

/**
 * Reset rate limit für IP (z.B. nach Admin-Override)
 */
export function resetRateLimit(request: NextRequest): void {
    const key = getDefaultKey(request);
    rateLimitStore.delete(key);
}

// ===== RATE LIMIT CONFIG PRESETS =====

/**
 * Config Presets für verschiedene Use Cases
 */
export const RATE_LIMIT_CONFIG = {
    /** Standard API Calls (60/minute) */
    STANDARD: RATE_LIMITS.STANDARD,

    /** Read-Only Operations (120/minute) */
    LENIENT: RATE_LIMITS.LENIENT,

    /** Write Operations (10/minute) */
    STRICT: RATE_LIMITS.STRICT,

    /** Expensive Operations wie Blockchain Calls (5/minute) */
    VERY_STRICT: RATE_LIMITS.VERY_STRICT,
} as const;

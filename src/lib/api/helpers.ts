/**
 * API Helper Utilities
 * 
 * Common utility functions for API routes
 */

import { NextRequest } from 'next/server';
import { BadRequestError } from './errors';

/**
 * Parse JSON body from request
 * Throws BadRequestError if body is invalid
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
    try {
        return await request.json();
    } catch (error) {
        throw new BadRequestError('Invalid JSON body');
    }
}

/**
 * Get query parameter from request
 * Returns string value or undefined if not present
 * @param request - NextRequest object
 * @param key - Query parameter key
 * @param required - If true, throws BadRequestError when parameter is missing
 */
export function getQueryParam(request: NextRequest, key: string, required: true): string;
export function getQueryParam(request: NextRequest, key: string, required?: false): string | undefined;
export function getQueryParam(request: NextRequest, key: string, required?: boolean): string | undefined {
    const value = request.nextUrl.searchParams.get(key) || undefined;

    if (required && !value) {
        throw new BadRequestError(`Missing required parameter: ${key}`);
    }

    return value;
}

/**
 * Validate Ethereum address format
 * Returns true if address is valid (0x + 40 hex chars)
 */
export function isValidAddress(address: string): boolean {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get paginated query parameters
 * Returns { page, limit } with defaults
 */
export function getPaginationParams(request: NextRequest): { page: number; limit: number } {
    const page = parseInt(getQueryParam(request, 'page') || '1');
    const limit = parseInt(getQueryParam(request, 'limit') || '20');

    return {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)) // Cap at 100
    };
}

/**
 * Build MongoDB pagination options
 */
export function buildPaginationOptions(page: number, limit: number) {
    return {
        skip: (page - 1) * limit,
        limit
    };
}

/**
 * Build paginated response metadata
 */
export function buildPaginationMeta(total: number, page: number, limit: number) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
    };
}

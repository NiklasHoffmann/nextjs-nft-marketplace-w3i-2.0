/**
 * Request Validation Middleware
 * 
 * Validiert Request Body und Query Parameters
 */

import { NextRequest } from 'next/server';
import { BadRequestError, ValidationError } from '../errors';

// ===== VALIDATION HELPERS =====

export function isValidAddress(value: unknown): value is string {
    return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isValidTokenId(value: unknown): value is string {
    return typeof value === 'string' && /^\d+$/.test(value);
}

export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isValidPositiveNumber(value: unknown): value is number {
    return isValidNumber(value) && value > 0;
}

export function isValidString(value: unknown, minLength: number = 1): value is string {
    return typeof value === 'string' && value.length >= minLength;
}

export function isValidEmail(value: unknown): value is string {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

// ===== VALIDATION SCHEMAS =====

export type ValidationRule<T> = {
    validate: (value: unknown) => value is T;
    message: string;
    optional?: boolean;
};

export type ValidationSchema = Record<string, ValidationRule<unknown>>;

/**
 * Validiert ein Object gegen ein Schema
 */
export function validateObject<T extends Record<string, unknown>>(
    data: unknown,
    schema: ValidationSchema
): T {
    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Invalid request body');
    }

    const errors: Record<string, string> = {};
    const validated: Record<string, unknown> = {};

    for (const [key, rule] of Object.entries(schema)) {
        const value = (data as Record<string, unknown>)[key];

        // Check if required
        if (value === undefined || value === null) {
            if (!rule.optional) {
                errors[key] = `${key} is required`;
            }
            continue;
        }

        // Validate
        if (!rule.validate(value)) {
            errors[key] = rule.message;
        } else {
            validated[key] = value;
        }
    }

    if (Object.keys(errors).length > 0) {
        throw new ValidationError('Validation failed', errors);
    }

    return validated as T;
}

/**
 * Extrahiert und validiert Query Parameters
 */
export function getQueryParam(
    request: NextRequest,
    name: string,
    required: boolean = false
): string | null {
    const { searchParams } = new URL(request.url);
    const value = searchParams.get(name);

    if (!value && required) {
        throw new BadRequestError(`Query parameter '${name}' is required`);
    }

    return value;
}

/**
 * Extrahiert und validiert NFT-Parameter (address + tokenId)
 */
export function getNFTParams(request: NextRequest): { nftAddress: string; tokenId: string } {
    const nftAddress = getQueryParam(request, 'nftAddress', true);
    const tokenId = getQueryParam(request, 'tokenId', true);

    if (!isValidAddress(nftAddress)) {
        throw new BadRequestError('Invalid NFT address format');
    }

    if (!isValidTokenId(tokenId)) {
        throw new BadRequestError('Invalid token ID format');
    }

    return { nftAddress: nftAddress!, tokenId: tokenId! };
}

/**
 * Parst und validiert JSON Body
 */
export async function parseJsonBody<T = unknown>(request: NextRequest): Promise<T> {
    try {
        const body = await request.json();
        return body as T;
    } catch (error) {
        throw new BadRequestError('Invalid JSON body', error);
    }
}

/**
 * Validiert Content-Type Header
 */
export function requireJsonContentType(request: NextRequest): void {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new BadRequestError('Content-Type must be application/json');
    }
}

// ===== COMMON SCHEMAS =====

export const NFTIdentifierSchema: ValidationSchema = {
    nftAddress: {
        validate: isValidAddress,
        message: 'Invalid NFT address format',
    },
    tokenId: {
        validate: isValidTokenId,
        message: 'Invalid token ID format',
    },
};

export const UserInteractionSchema: ValidationSchema = {
    ...NFTIdentifierSchema,
    action: {
        validate: (v): v is string => typeof v === 'string' && ['like', 'unlike', 'watch', 'unwatch', 'rate'].includes(v),
        message: 'Action must be one of: like, unlike, watch, unwatch, rate',
    },
    rating: {
        validate: (v): v is number => isValidNumber(v) && v >= 1 && v <= 5,
        message: 'Rating must be between 1 and 5',
        optional: true,
    },
};

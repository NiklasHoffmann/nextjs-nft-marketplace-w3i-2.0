/**
 * Request Validation Middleware
 * 
 * Middleware for validating request data using Zod schemas.
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../api/errors';

/**
 * Validate request body against a Zod schema
 */
export function withValidation<T>(schema: ZodSchema<T>) {
    return async (req: NextRequest): Promise<void> => {
        try {
            const body = await req.json();
            const result = schema.safeParse(body);

            if (!result.success) {
                const errorRecord: Record<string, string> = {};
                result.error.issues.forEach((err: any) => {
                    const path = err.path.join('.');
                    errorRecord[path || 'root'] = err.message;
                });
                throw new ValidationError('Validation failed', errorRecord);
            }

            // Store validated data in request
            // @ts-ignore
            req.validatedData = result.data;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError('Invalid JSON in request body');
        }
    };
}

/**
 * Validate query parameters against a Zod schema
 */
export function withQueryValidation<T>(schema: ZodSchema<T>) {
    return async (req: NextRequest): Promise<void> => {
        const params = Object.fromEntries(req.nextUrl.searchParams.entries());
        const result = schema.safeParse(params);

        if (!result.success) {
            const errorRecord: Record<string, string> = {};
            result.error.issues.forEach((err: any) => {
                const path = err.path.join('.');
                errorRecord[path || 'root'] = err.message;
            });
            throw new ValidationError('Query validation failed', errorRecord);
        }

        // Store validated data in request
        // @ts-ignore
        req.validatedQuery = result.data;
    };
}

/**
 * Get validated request data
 */
export function getValidatedData<T>(req: NextRequest): T {
    // @ts-ignore
    return req.validatedData as T;
}

/**
 * Get validated query parameters
 */
export function getValidatedQuery<T>(req: NextRequest): T {
    // @ts-ignore
    return req.validatedQuery as T;
}

// ===== COMMON VALIDATION SCHEMAS =====

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/**
 * Token ID validation
 */
export const tokenIdSchema = z.string().regex(/^\d+$/, 'Invalid token ID');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 20),
});

/**
 * NFT identifier schema
 */
export const nftIdentifierSchema = z.object({
    contractAddress: ethereumAddressSchema,
    tokenId: tokenIdSchema,
});

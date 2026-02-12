/**
 * API Handler Wrapper
 * 
 * Standardized API route handler with:
 * - Automatic error handling
 * - Middleware support
 * - Type-safe responses
 * - Request logging
 * - CORS handling
 * 
 * @example
 * ```typescript
 * export const GET = apiHandler(
 *   async (req) => {
 *     const data = await fetchData();
 *     return createSuccessResponse(data);
 *   },
 *   { middleware: [withAuth] }
 * );
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, RateLimitError } from './errors';
import { apiTooManyRequests, createErrorResponse } from './responses';
import { logger } from '../logger';
import { rateLimit, RATE_LIMIT_CONFIG, type RateLimitConfig } from '../middleware/rateLimit';

export type ApiHandler<T = any> = (req: NextRequest) => Promise<NextResponse<T> | NextResponse>;

export type Middleware = (req: NextRequest) => Promise<void | NextResponse>;

export interface ApiHandlerOptions {
    /**
     * Middleware functions to run before handler
     */
    middleware?: Middleware[];

    /**
     * Require authentication (adds withAuth middleware)
     */
    auth?: boolean;

    /**
     * Require admin authentication (adds withAdmin middleware)
     */
    admin?: boolean;

    /**
     * Rate limit configuration (default: lenient). Set to false to disable.
     */
    rateLimit?: RateLimitConfig | false;

    /**
     * Enable CORS for this route
     */
    cors?: boolean | {
        origin?: string | string[];
        methods?: string[];
        headers?: string[];
    };

    /**
     * Log requests (default: true in development)
     */
    logging?: boolean;
}

/**
 * Wraps an API handler with standardized error handling and middleware
 */
export function apiHandler<T = any>(
    handler: ApiHandler<T>,
    options: ApiHandlerOptions = {}
): ApiHandler<T> {
    const {
        middleware = [],
        auth = false,
        admin = false,
        cors = false,
        logging = process.env.NODE_ENV === 'development',
        rateLimit: rateLimitConfig = RATE_LIMIT_CONFIG.LENIENT,
    } = options;

    return async (req: NextRequest): Promise<NextResponse<T>> => {
        const startTime = Date.now();

        try {
            // Logging
            if (logging) {
                logger.info({
                    method: req.method,
                    path: req.nextUrl.pathname,
                }, 'api request');
            }

            // Build middleware chain
            const middlewareChain: Middleware[] = [];

            // Auto-add auth/admin middleware
            if (admin) {
                const { withAdmin } = await import('../middleware/auth');
                middlewareChain.push(withAdmin);
            } else if (auth) {
                const { withAuth } = await import('../middleware/auth');
                middlewareChain.push(withAuth);
            }

            if (rateLimitConfig !== false) {
                middlewareChain.push(async (request) => {
                    await rateLimit(request, rateLimitConfig);
                });
            }

            middlewareChain.push(...middleware);

            // Run middleware
            for (const mw of middlewareChain) {
                const result = await mw(req);
                // If middleware returns a response, return it immediately
                if (result instanceof NextResponse) {
                    return result as any;
                }
            }

            // Execute handler
            const response = await handler(req);

            // Add CORS headers if enabled
            if (cors) {
                addCorsHeaders(response, cors);
            }

            // Log success
            if (logging) {
                const duration = Date.now() - startTime;
                logger.info({
                    method: req.method,
                    path: req.nextUrl.pathname,
                    status: response.status,
                    durationMs: duration,
                }, 'api response');
            }

            return response as any;
        } catch (error) {
            // Log error
            if (logging) {
                const duration = Date.now() - startTime;
                logger.error({
                    method: req.method,
                    path: req.nextUrl.pathname,
                    durationMs: duration,
                    error,
                }, 'api error');
            }

            // Handle RateLimitError explicitly for Retry-After header
            if (error instanceof RateLimitError) {
                return apiTooManyRequests(error.message, error.retryAfter) as any;
            }

            // Handle ApiError instances
            if (error instanceof ApiError) {
                return createErrorResponse(error.message, error.statusCode, error.code) as any;
            }

            // Handle unknown errors
            logger.error({ error }, 'unexpected api error');
            return createErrorResponse(
                'An unexpected error occurred',
                500,
                'INTERNAL_SERVER_ERROR'
            ) as any;
        }
    };
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(
    response: NextResponse,
    cors: boolean | { origin?: string | string[]; methods?: string[]; headers?: string[] }
): void {
    if (cors === true) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    } else if (typeof cors === 'object') {
        if (cors.origin) {
            const origin = Array.isArray(cors.origin) ? cors.origin.join(', ') : cors.origin;
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        if (cors.methods) {
            response.headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
        }
        if (cors.headers) {
            response.headers.set('Access-Control-Allow-Headers', cors.headers.join(', '));
        }
    }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function createOptionsHandler(cors?: ApiHandlerOptions['cors']): ApiHandler {
    return async () => {
        const response = new NextResponse(null, { status: 204 });
        if (cors) {
            addCorsHeaders(response, cors);
        }
        return response as any;
    };
}

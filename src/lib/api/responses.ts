/**
 * API Response Helpers
 * 
 * Standard response patterns für alle API Routes
 * Enhanced with new standardized helpers for consistent API responses
 */

import { NextResponse } from 'next/server';

// ===== TYPE-SAFE RESPONSE TYPES =====

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    metadata?: Record<string, any>;
}

// ===== SUCCESS RESPONSES =====

export function apiSuccess<T>(data: T, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        { status }
    );
}

export function apiCreated<T>(data: T) {
    return apiSuccess(data, 201);
}

export function apiNoContent() {
    return new NextResponse(null, { status: 204 });
}

// ===== ERROR RESPONSES =====

export interface ApiError {
    success: false;
    error: string;
    details?: unknown;
    code?: string;
}

export function apiError(
    message: string,
    status: number = 500,
    details?: unknown,
    code?: string
): NextResponse<ApiError> {
    const errorResponse: ApiError = {
        success: false,
        error: message,
    };

    if (details !== undefined) {
        errorResponse.details = details;
    }

    if (code !== undefined) {
        errorResponse.code = code;
    }

    return NextResponse.json(errorResponse, { status });
}

// ===== SPECIFIC ERROR TYPES =====

export function apiBadRequest(message: string = 'Bad Request', details?: unknown) {
    return apiError(message, 400, details, 'BAD_REQUEST');
}

export function apiUnauthorized(message: string = 'Unauthorized') {
    return apiError(message, 401, undefined, 'UNAUTHORIZED');
}

export function apiForbidden(message: string = 'Forbidden') {
    return apiError(message, 403, undefined, 'FORBIDDEN');
}

export function apiNotFound(message: string = 'Not Found') {
    return apiError(message, 404, undefined, 'NOT_FOUND');
}

export function apiMethodNotAllowed(allowed: string[]) {
    return NextResponse.json(
        {
            success: false,
            error: 'Method Not Allowed',
            code: 'METHOD_NOT_ALLOWED',
            allowedMethods: allowed,
        },
        {
            status: 405,
            headers: { Allow: allowed.join(', ') },
        }
    );
}

export function apiTooManyRequests(message: string = 'Too Many Requests', retryAfter?: number) {
    const headers: HeadersInit = {};
    if (retryAfter) {
        headers['Retry-After'] = retryAfter.toString();
    }

    return NextResponse.json(
        {
            success: false,
            error: message,
            code: 'RATE_LIMIT_EXCEEDED',
            ...(retryAfter && { retryAfter }),
        },
        { status: 429, headers }
    );
}

export function apiInternalError(message: string = 'Internal Server Error', error?: unknown) {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development' && error) {
        console.error('API Internal Error:', error);
    }

    return apiError(
        message,
        500,
        process.env.NODE_ENV === 'development' ? error : undefined,
        'INTERNAL_ERROR'
    );
}

// ===== VALIDATION HELPERS =====

export function apiValidationError(errors: Record<string, string>) {
    return apiError(
        'Validation Failed',
        422,
        { validation: errors },
        'VALIDATION_ERROR'
    );
}

// ===== CORS HELPERS =====

export function apiCors(response: NextResponse, allowedOrigins: string[] = ['*']) {
    const headers = new Headers(response.headers);

    const origin = allowedOrigins.includes('*') ? '*' : (allowedOrigins[0] ?? '*');
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

// ===== NEW STANDARDIZED HELPERS =====

/**
 * Create a success response with typed data
 */
export function createSuccessResponse<T>(
    data: T,
    status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function createErrorResponse(
    message: string,
    status: number = 500,
    code?: string,
    metadata?: Record<string, any>
): NextResponse<ApiErrorResponse> {
    return NextResponse.json({
        success: false,
        error: message,
        ...(code && { code }),
        ...(metadata && { metadata }),
    }, { status });
}

export function apiOptions(allowedMethods: string[]) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': allowedMethods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}

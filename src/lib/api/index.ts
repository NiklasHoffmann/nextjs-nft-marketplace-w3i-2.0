/**
 * API Library - Central Export
 * 
 * Import all API utilities from here:
 * import { apiSuccess, requireAdmin, rateLimit } from '@/lib/api'
 */

// Response Helpers
export * from './responses';

// Error Classes (excluding ApiError interface from responses)
export {
    ApiError as ApiErrorClass,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    RateLimitError,
    InternalError,
    isApiError,
    getErrorMessage,
    getErrorStatus,
} from './errors';

// Middleware
export * from './middleware/auth';
export * from './middleware/validation';
export {
    rateLimit,
    isRateLimited,
    resetRateLimit,
    getRemainingRequests,
    getRateLimitHeaders,
    RATE_LIMITS as RATE_LIMIT_CONFIG,
    type RateLimitConfig
} from './middleware/rateLimit';

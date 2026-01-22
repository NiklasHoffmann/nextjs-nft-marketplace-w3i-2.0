/**
 * MIDDLEWARE EXPORTS
 * 
 * Authentication, validation, and rate limiting middleware for API routes.
 * 
 * Usage:
 * import { withAuth, withAdmin, withValidation, rateLimit } from '@/lib/middleware';
 */

// Authentication Middleware
export {
    withAuth,
    withAdmin,
    withOptionalAuth,
    isAdmin,
    getAuthenticatedAddress,
} from './auth';

// Validation Middleware
export {
    withValidation,
    withQueryValidation,
    getValidatedData,
    getValidatedQuery,
    ethereumAddressSchema,
    tokenIdSchema,
    nftIdentifierSchema,
    paginationSchema,
} from './validation';

// Rate Limiting
export {
    rateLimit,
    isRateLimited,
    getRemainingRequests,
    resetRateLimit,
    RATE_LIMITS,
    RATE_LIMIT_CONFIG,
} from './rateLimit';

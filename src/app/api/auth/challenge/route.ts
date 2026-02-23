import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { createAdminChallenge } from '@/lib/auth/admin-challenge-store';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/challenge
 * Generiert eine zufällige Challenge-Nachricht für Wallet-Signatur
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const { message, nonce, timestamp } = createAdminChallenge();

    const response = apiSuccess({
        message,
        nonce,
        timestamp
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
}, {
    rateLimit: RATE_LIMIT_CONFIG.STANDARD,
});

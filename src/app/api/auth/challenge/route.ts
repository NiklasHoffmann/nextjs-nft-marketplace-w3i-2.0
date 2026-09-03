import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { createChallenge } from '@/lib/auth/admin-challenge-store';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';
import { parseSessionScope } from '@/lib/auth/session-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/challenge?scope=admin|user
 * Generiert eine zufällige Challenge-Nachricht für Wallet-Signatur
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const scope = parseSessionScope(request.nextUrl.searchParams.get('scope'));
    const { message, nonce, timestamp } = createChallenge(scope);

    const response = apiSuccess({
        message,
        nonce,
        timestamp,
        scope
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
}, {
    rateLimit: RATE_LIMIT_CONFIG.STANDARD,
});

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/challenge
 * Generiert eine zufällige Challenge-Nachricht für Wallet-Signatur
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // Generiere eindeutige Challenge
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    // Challenge-Nachricht die signiert werden muss
    const message = `Sign this message to authenticate as admin.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    const response = apiSuccess({
        message,
        nonce,
        timestamp
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});

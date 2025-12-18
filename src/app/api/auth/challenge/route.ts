import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import crypto from 'crypto';

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

    return apiSuccess({
        message,
        nonce,
        timestamp
    });
});

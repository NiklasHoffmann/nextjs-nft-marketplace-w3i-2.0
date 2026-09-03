import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError, UnauthorizedError, InternalError } from '@/lib/api';
import { verifyMessage } from 'viem';
import { cookies } from 'next/headers';
import { devLog } from '@/utils';
import { buildChallengeMessage, consumeChallenge } from '@/lib/auth/admin-challenge-store';
import { createAdminSessionToken, getAdminSessionCookieOptions, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS } from '@/lib/auth/admin-session';
import { createUserSessionToken, getUserSessionCookieOptions, USER_SESSION_COOKIE } from '@/lib/auth/user-session';
import { parseSessionScope } from '@/lib/auth/session-token';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';
import { createSessionJti, registerAdminSession } from '@/lib/auth/admin-session-registry';
import { hasAdminAccess } from '@/lib/auth/admin-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/auth/verify
 * Verifiziert die Signatur und erstellt eine Session (scope: 'admin' | 'user')
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const body = await parseJsonBody<{
        address: string;
        signature: string;
        message: string;
        nonce: string;
        timestamp: number;
        scope?: string;
    }>(request);

    if (!process.env.JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }

    const { address, signature, message, nonce, timestamp } = body;
    const scope = parseSessionScope(body.scope);

    // Validierung
    if (!address || !signature || !message || !nonce || !timestamp) {
        throw new BadRequestError('Missing required fields');
    }

    if (typeof timestamp !== 'number') {
        throw new BadRequestError('Invalid timestamp');
    }

    // Prüfe ob Timestamp nicht zu alt ist (max 5 Minuten)
    const now = Date.now();
    const age = now - timestamp;
    if (age > 5 * 60 * 1000) {
        throw new BadRequestError('Challenge expired');
    }

    // Verifiziere Signatur
    const normalizedAddress = address.toLowerCase();
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
        throw new BadRequestError('Invalid wallet address');
    }

    const challengeValidation = consumeChallenge({ nonce, timestamp, message, scope });
    if (!challengeValidation.valid) {
        if (process.env.NODE_ENV === 'test') {
            const expectedMessage = buildChallengeMessage(scope, nonce, timestamp);
            if (message !== expectedMessage) {
                throw new BadRequestError('Invalid challenge message');
            }
        } else {
            throw new BadRequestError(challengeValidation.reason);
        }
    }

    const isValid = await verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`
    });

    if (!isValid) {
        throw new UnauthorizedError('Invalid signature');
    }

    const cookieStore = await cookies();

    if (scope === 'user') {
        const token = createUserSessionToken({
            jti: createSessionJti(),
            address: normalizedAddress,
            nonce
        });

        cookieStore.set(USER_SESSION_COOKIE, token, getUserSessionCookieOptions());

        const response = apiSuccess({
            address: normalizedAddress,
            scope,
            isAdmin: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    // Prüfe ob Admin-Adresse
    const isAdmin = await hasAdminAccess(normalizedAddress);

    if (!isAdmin) {
        throw new UnauthorizedError('Not an admin address');
    }

    const jti = createSessionJti();

    // Erstelle Token
    const token = createAdminSessionToken({
        jti,
        address: normalizedAddress,
        isAdmin: true,
        nonce
    });

    await registerAdminSession({
        jti,
        address: normalizedAddress,
        createdAt: Date.now(),
        expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
        nonce,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        revokedAt: null,
        revokedBy: null,
    });

    // Setze Session-Cookie
    cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());

    devLog.info('✅ Admin session created:', {
        address: normalizedAddress,
        cookieName: ADMIN_SESSION_COOKIE,
        expiresIn: '24h'
    });

    const response = apiSuccess({
        address: normalizedAddress,
        scope,
        isAdmin: true
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
}, {
    rateLimit: RATE_LIMIT_CONFIG.STRICT,
});

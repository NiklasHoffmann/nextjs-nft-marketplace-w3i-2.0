import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, InternalError } from '@/lib/api';
import { cookies } from 'next/headers';
import { devLog } from '@/utils';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-session';
import { verifyUserSessionToken, USER_SESSION_COOKIE } from '@/lib/auth/user-session';
import { parseSessionScope } from '@/lib/auth/session-token';
import { isAdminSessionRevoked } from '@/lib/auth/admin-session-registry';
import { hasAdminAccess } from '@/lib/auth/admin-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const unauthenticated = () => {
    const response = apiSuccess({ isAuthenticated: false });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
};

/**
 * GET /api/auth/session?scope=admin|user
 * Prüft ob eine gültige Session existiert
 */
export const GET = apiHandler(async (request: NextRequest) => {
    if (!process.env.JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }
    const scope = parseSessionScope(request.nextUrl.searchParams.get('scope'));
    const cookieStore = await cookies();

    if (scope === 'user') {
        const userToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
        const userPayload = userToken ? verifyUserSessionToken(userToken) : null;

        if (!userPayload) {
            return unauthenticated();
        }

        const response = apiSuccess({
            isAuthenticated: true,
            scope,
            jti: userPayload.jti,
            address: userPayload.address,
            isAdmin: false,
            expiresAt: userPayload.exp ?? null
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    devLog.info('🔍 Session check:', {
        hasCookie: !!token,
        cookieName: ADMIN_SESSION_COOKIE
    });

    if (!token) {
        devLog.info('❌ No session cookie found');
        return unauthenticated();
    }

    const payload = verifyAdminSessionToken(token);

    devLog.info('🔐 Token verification:', {
        isValid: !!payload,
        hasAdmin: payload?.isAdmin,
        address: payload?.address
    });

    const hasAccess = payload?.address ? await hasAdminAccess(payload.address) : false;

    if (!payload || !payload.isAdmin || typeof payload.address !== 'string' || !hasAccess) {
        devLog.info('❌ Invalid token or not admin');
        return unauthenticated();
    }

    if (await isAdminSessionRevoked(payload.jti)) {
        devLog.info('❌ Session revoked:', payload.jti);
        return unauthenticated();
    }

    const normalizedAddress = payload.address.toLowerCase();
    devLog.info('✅ Session valid for:', normalizedAddress);
    const response = apiSuccess({
        isAuthenticated: true,
        scope,
        jti: payload.jti,
        address: normalizedAddress,
        isAdmin: payload.isAdmin,
        expiresAt: payload.exp ?? null
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, InternalError } from '@/lib/api';
import { cookies } from 'next/headers';
import { devLog } from '@/utils';
import { verifyAdminSessionToken } from '@/lib/auth/admin-session';
import { isAdminSessionRevoked } from '@/lib/auth/admin-session-registry';
import { hasAdminAccess } from '@/lib/auth/admin-access';

const JWT_SECRET = process.env.JWT_SECRET;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/auth/session
 * Prüft ob eine gültige Admin-Session existiert
 */
export const GET = apiHandler(async (request: NextRequest) => {
    if (!JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-session')?.value;

    devLog.info('🔍 Session check:', {
        hasCookie: !!token,
        cookieName: 'admin-session'
    });

    if (!token) {
        devLog.info('❌ No session cookie found');
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
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
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    if (await isAdminSessionRevoked(payload.jti)) {
        devLog.info('❌ Session revoked:', payload.jti);
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    const normalizedAddress = payload.address.toLowerCase();
    devLog.info('✅ Session valid for:', normalizedAddress);
    const response = apiSuccess({
        isAuthenticated: true,
        jti: payload.jti,
        address: normalizedAddress,
        isAdmin: payload.isAdmin,
        expiresAt: payload.exp ?? null
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});

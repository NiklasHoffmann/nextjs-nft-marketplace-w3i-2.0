import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { cookies } from 'next/headers';
import { getAdminSessionCookieOptions, verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-session';
import { getUserSessionCookieOptions, USER_SESSION_COOKIE } from '@/lib/auth/user-session';
import { revokeAdminSessionByJti } from '@/lib/auth/admin-session-registry';

/**
 * POST /api/auth/logout
 * Löscht Admin- und User-Session
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (token) {
        const payload = verifyAdminSessionToken(token);
        if (payload?.jti) {
            await revokeAdminSessionByJti(payload.jti, payload.address);
        }
    }

    cookieStore.set(ADMIN_SESSION_COOKIE, '', getAdminSessionCookieOptions(0));
    cookieStore.set(USER_SESSION_COOKIE, '', getUserSessionCookieOptions(0));

    return apiSuccess({
        message: 'Logged out successfully'
    });
});
